import { Linking } from 'react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { EMPTY_FILTERS, EMPTY_PROPOSAL_FORM } from '@/constants/home';
import { useAuth } from '@/contexts/auth-context';
import { ApiError } from '@/services/api';
import {
  getMachineDetail,
  getMachineSuggestions,
  getMaquinas,
  markMachineArrivedAtBase,
  markMachineDelivered,
  moveMachineBetweenBases,
  escalateMachineIncidence,
  openMachineIncidence,
  updateMachineMaintenanceStatus,
} from '@/services/maquinas-api';
import { createMachineProposal, getMachineProposals } from '@/services/propuestas-api';
import type { AuthSession } from '@/types/auth';
import type { NavigationAppOption } from '@/types/home';
import type {
  FilterCategoryKey,
  HomeSubview,
  HomeTabKey,
  MachineDetail,
  MachineFilters,
  MachineProposalSummary,
  Maquina,
  ProposalFormData,
  SearchSuggestion,
} from '@/types/maquina';
import {
  getAcceptedProposal,
  getAllowedMaintenanceOptions,
  getLocationOptions,
  getMachineImageSource,
  machineMatchesFilters,
} from '@/utils/home-format';

export function useHomeScreen(session: AuthSession | null) {
  const { signOut } = useAuth();
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const detailSuccessTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [activeTab, setActiveTab] = useState<HomeTabKey>('home');
  const [homeSubview, setHomeSubview] = useState<HomeSubview>('list');
  const [query, setQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [filters, setFilters] = useState<MachineFilters>(EMPTY_FILTERS);
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [machines, setMachines] = useState<Maquina[]>([]);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [loadingMachines, setLoadingMachines] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [selectedMachineDetail, setSelectedMachineDetail] = useState<MachineDetail | null>(null);
  const [selectedMachineProposals, setSelectedMachineProposals] = useState<MachineProposalSummary[]>(
    []
  );
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailFeedback, setDetailFeedback] = useState<string | null>(null);
  const [detailSuccessFeedback, setDetailSuccessFeedback] = useState<string | null>(null);
  const [selectedTargetLocation, setSelectedTargetLocation] = useState('');
  const [locationPickerOpen, setLocationPickerOpen] = useState(false);
  const [statusPickerOpen, setStatusPickerOpen] = useState(false);
  const [selectedMaintenanceStatus, setSelectedMaintenanceStatus] = useState('');
  const [incidenceComment, setIncidenceComment] = useState('');
  const [incidencePanelVisible, setIncidencePanelVisible] = useState(false);
  const [proposalsExpanded, setProposalsExpanded] = useState(false);
  const [locationActionLoading, setLocationActionLoading] = useState(false);
  const [statusActionLoading, setStatusActionLoading] = useState(false);
  const [proposalForm, setProposalForm] = useState<ProposalFormData>(EMPTY_PROPOSAL_FORM);
  const [proposalSubmitting, setProposalSubmitting] = useState(false);
  const [proposalFeedback, setProposalFeedback] = useState<string | null>(null);
  const [navigationModalOpen, setNavigationModalOpen] = useState(false);
  const [availableNavigationApps, setAvailableNavigationApps] = useState<NavigationAppOption[]>([]);
  const [homeScrollResetKey, setHomeScrollResetKey] = useState(0);

  const visibleMachines = useMemo(
    () => machines.filter((machine) => machineMatchesFilters(machine, filters)),
    [filters, machines]
  );

  const activeFilterCount = useMemo(
    () =>
      filters.availability.length +
      filters.tipo.length +
      filters.subtipo.length +
      filters.motor.length +
      filters.ubicacion_type.length,
    [filters]
  );

  const acceptedProposal = useMemo(
    () => getAcceptedProposal(selectedMachineProposals),
    [selectedMachineProposals]
  );

  const machineImageSource = useMemo(
    () => (selectedMachineDetail ? getMachineImageSource(selectedMachineDetail) : null),
    [selectedMachineDetail]
  );

  const locationOptions = useMemo(
    () => getLocationOptions(selectedMachineDetail),
    [selectedMachineDetail]
  );

  const maintenanceOptions = useMemo(
    () => getAllowedMaintenanceOptions(selectedMachineDetail?.maintenance_status),
    [selectedMachineDetail?.maintenance_status]
  );

  const canCreateProposal = session?.user.role === 'admin';
  const canMarkDelivered = ['TALLER', 'ALMACEN', 'CLIENTE', 'TRANSITO'].includes(
    String(selectedMachineDetail?.ubicacion_tipo ?? '').trim().toUpperCase()
  );
  const incidenceEscalationMode =
    String(selectedMachineDetail?.maintenance_status ?? '').trim().toUpperCase() === 'AVERIADA' &&
    selectedMaintenanceStatus === 'AVERIADA_GRAVE';
  const canSubmitIncidence = incidenceEscalationMode ? true : acceptedProposal !== null;

  function clearDetailSuccessTimeout() {
    if (detailSuccessTimeoutRef.current) {
      clearTimeout(detailSuccessTimeoutRef.current);
      detailSuccessTimeoutRef.current = null;
    }
  }

  function showTemporaryDetailSuccess(message: string) {
    clearDetailSuccessTimeout();
    setDetailSuccessFeedback(message);
    detailSuccessTimeoutRef.current = setTimeout(() => {
      setDetailSuccessFeedback(null);
      detailSuccessTimeoutRef.current = null;
    }, 3500);
  }

  useEffect(() => {
    return () => {
      clearDetailSuccessTimeout();
    };
  }, []);

  const handleApiError = useCallback(
    async (
      error: unknown,
      setMessage: (message: string | null) => void,
      fallbackMessage: string
    ) => {
      if (error instanceof ApiError) {
        if (error.status === 401) {
          await signOut();
          return;
        }

        setMessage(error.message);
        return;
      }

      setMessage(fallbackMessage);
    },
    [signOut]
  );

  function resetPendingIncidenceSelection(statusOverride?: string) {
    const fallbackStatus =
      statusOverride ??
      String(selectedMachineDetail?.maintenance_status ?? '')
        .trim()
        .toUpperCase();

    setSelectedMaintenanceStatus(fallbackStatus);
    setIncidencePanelVisible(false);
    setIncidenceComment('');
  }

  useEffect(() => {
    if (!session?.token || activeTab !== 'home' || homeSubview !== 'list') {
      return;
    }

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    if (query.trim().length < 2) {
      setSuggestions([]);
      setLoadingSuggestions(false);
      return;
    }

    debounceTimeoutRef.current = setTimeout(async () => {
      try {
        setLoadingSuggestions(true);
        const result = await getMachineSuggestions(query, session.token);
        setSuggestions(result);
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          await signOut();
          return;
        }

        setSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 250);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [activeTab, homeSubview, query, session?.token]);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setAppliedQuery(query.trim());
    }, 250);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query]);

  useEffect(() => {
    let ignore = false;

    async function loadMachines() {
      try {
        setLoadingMachines(true);
        setFeedback(null);

        const result = await getMaquinas({
          q: appliedQuery.length > 0 ? appliedQuery : undefined,
          filters,
        });

        if (!ignore) {
          setMachines(result);
        }
      } catch (error) {
        if (!ignore) {
          await handleApiError(error, setFeedback, 'No se pudo cargar la maquinaria.');
        }
      } finally {
        if (!ignore) {
          setLoadingMachines(false);
        }
      }
    }

    if (session && activeTab === 'home' && homeSubview === 'list') {
      void loadMachines();
    }

    return () => {
      ignore = true;
    };
  }, [activeTab, appliedQuery, filters, homeSubview, session]);

  function toggleFilter(category: FilterCategoryKey, value: string) {
    setFilters((current) => {
      const selectedValues = current[category];
      const alreadySelected = selectedValues.includes(value);

      return {
        ...current,
        [category]: alreadySelected
          ? selectedValues.filter((item) => item !== value)
          : [...selectedValues, value],
      };
    });
  }

  async function loadMachineContext(idMaquina: number) {
    if (!session?.token) {
      return;
    }

    try {
      setDetailLoading(true);
      setDetailFeedback(null);
      setLocationPickerOpen(false);
      setStatusPickerOpen(false);

      const [detail, proposals] = await Promise.all([
        getMachineDetail(idMaquina, session.token),
        getMachineProposals(idMaquina, session.token),
      ]);

      setSelectedMachineDetail(detail);
      setSelectedMachineProposals(proposals);
      setSelectedTargetLocation(String(detail.ubicacion_tipo ?? '').trim().toUpperCase());
      resetPendingIncidenceSelection(String(detail.maintenance_status ?? '').trim().toUpperCase());
      setProposalsExpanded(false);
    } catch (error) {
      await handleApiError(error, setDetailFeedback, 'No se pudo cargar el detalle de la maquina.');
    } finally {
      setDetailLoading(false);
    }
  }

  async function openMachineDetail(idMaquina: number) {
    setHomeSubview('detail');
    await loadMachineContext(idMaquina);
  }

  function resetToListView() {
    setHomeSubview('list');
    setDetailFeedback(null);
    setProposalFeedback(null);
    setLocationPickerOpen(false);
    setStatusPickerOpen(false);
    setFilterPanelOpen(false);
    setIncidenceComment('');
    setIncidencePanelVisible(false);
    setSelectedMaintenanceStatus('');
    setHomeScrollResetKey((current) => current + 1);
  }

  function handleSelectTab(nextTab: HomeTabKey) {
    if (nextTab === 'home' && activeTab === 'home') {
      resetToListView();
      return;
    }

    setActiveTab(nextTab);
  }

  function openProposalForm() {
    setProposalForm(EMPTY_PROPOSAL_FORM);
    setProposalFeedback(null);
    setHomeSubview('proposalForm');
  }

  function updateProposalForm<K extends keyof ProposalFormData>(key: K, value: ProposalFormData[K]) {
    setProposalForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function validateProposalForm() {
    if (!proposalForm.cliente.trim()) return 'Introduce el cliente.';
    if (!proposalForm.email_cliente.trim()) return 'Introduce el email del cliente.';
    if (!proposalForm.telefono.trim()) return 'Introduce el telefono del cliente.';
    if (!proposalForm.direccion.trim()) return 'Introduce la direccion.';
    if (!proposalForm.cp.trim()) return 'Introduce el codigo postal.';
    if (!proposalForm.poblacion.trim()) return 'Introduce la poblacion.';
    if (!proposalForm.precio.trim() || Number(proposalForm.precio) <= 0) {
      return 'Introduce un precio valido.';
    }
    if (!proposalForm.fecha_inicio.trim() || !proposalForm.fecha_inicio.includes('T')) {
      return 'fecha_inicio debe ir en formato ISO, por ejemplo 2026-04-30T09:00:00.';
    }
    if (!proposalForm.fecha_fin.trim() || !proposalForm.fecha_fin.includes('T')) {
      return 'fecha_fin debe ir en formato ISO, por ejemplo 2026-05-02T18:00:00.';
    }

    const startDate = new Date(proposalForm.fecha_inicio);
    const endDate = new Date(proposalForm.fecha_fin);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return 'Las fechas seleccionadas no son validas.';
    }

    if (startDate.getTime() >= endDate.getTime()) {
      return 'fecha_inicio debe ser anterior a fecha_fin.';
    }

    return null;
  }

  async function handleCreateProposal() {
    if (!session?.token || !selectedMachineDetail) {
      return;
    }

    const validationError = validateProposalForm();
    if (validationError) {
      setProposalFeedback(validationError);
      return;
    }

    try {
      setProposalSubmitting(true);
      setProposalFeedback(null);

      const response = await createMachineProposal(
        selectedMachineDetail.id_maquina,
        proposalForm,
        session.token
      );

      await loadMachineContext(selectedMachineDetail.id_maquina);
      setHomeSubview('detail');
      if (response.email_sent === false) {
        setDetailFeedback('Propuesta creada, pero no se pudo enviar el email.');
      } else {
        setDetailFeedback(null);
        showTemporaryDetailSuccess('Propuesta creada correctamente.');
      }
    } catch (error) {
      await handleApiError(error, setProposalFeedback, 'No se pudo crear la propuesta.');
    } finally {
      setProposalSubmitting(false);
    }
  }

  function handleLocationChange(nextLocation: string) {
    setSelectedTargetLocation(nextLocation);
    setLocationPickerOpen(false);
  }

  async function handleConfirmLocation() {
    if (!session?.token || !selectedMachineDetail) {
      return;
    }

    const currentLocation = String(selectedMachineDetail.ubicacion_tipo ?? '').trim().toUpperCase();
    const nextLocation = selectedTargetLocation || currentLocation;

    if (nextLocation === currentLocation) {
      return;
    }

    try {
      setLocationActionLoading(true);
      setDetailFeedback(null);

      if (nextLocation === 'CLIENTE') {
        await markMachineDelivered(selectedMachineDetail.id_maquina, session.token);
      } else if (currentLocation === 'TRANSITO') {
        await markMachineArrivedAtBase(
          selectedMachineDetail.id_maquina,
          nextLocation === 'ALMACEN' ? 'almacen' : 'taller',
          session.token
        );
      } else {
        await moveMachineBetweenBases(
          selectedMachineDetail.id_maquina,
          nextLocation === 'ALMACEN' ? 'almacen' : 'taller',
          session.token
        );
      }

      await loadMachineContext(selectedMachineDetail.id_maquina);
    } catch (error) {
      await handleApiError(error, setDetailFeedback, 'No se pudo actualizar la ubicacion.');
    } finally {
      setLocationActionLoading(false);
    }
  }

  async function handleMaintenanceChange(nextStatus: string) {
    if (!session?.token || !selectedMachineDetail) {
      return;
    }

    const currentStatus = String(selectedMachineDetail.maintenance_status ?? '')
      .trim()
      .toUpperCase();

    if (incidencePanelVisible && nextStatus === selectedMaintenanceStatus) {
      setStatusPickerOpen(false);
      resetPendingIncidenceSelection(currentStatus);
      return;
    }

    if (nextStatus === currentStatus) {
      setStatusPickerOpen(false);
      resetPendingIncidenceSelection(currentStatus);
      return;
    }

    setSelectedMaintenanceStatus(nextStatus);
    setStatusPickerOpen(false);

    const needsIncidencePanel =
      (currentStatus === 'OK' &&
        (nextStatus === 'AVERIADA' || nextStatus === 'AVERIADA_GRAVE')) ||
      (currentStatus === 'AVERIADA' && nextStatus === 'AVERIADA_GRAVE');

    if (needsIncidencePanel) {
      setIncidencePanelVisible(true);
      return;
    }

    try {
      setStatusActionLoading(true);
      setDetailFeedback(null);

      await updateMachineMaintenanceStatus(
        selectedMachineDetail.id_maquina,
        nextStatus,
        session.token
      );

      setStatusPickerOpen(false);
      resetPendingIncidenceSelection(nextStatus);
      await loadMachineContext(selectedMachineDetail.id_maquina);
    } catch (error) {
      await handleApiError(error, setDetailFeedback, 'No se pudo actualizar el estado.');

      await loadMachineContext(selectedMachineDetail.id_maquina);
    } finally {
      setStatusActionLoading(false);
    }
  }

  async function handleOpenIncidence() {
    if (!session?.token || !selectedMachineDetail) {
      return;
    }

    const nextStatus = selectedMaintenanceStatus;
    const currentStatus = String(selectedMachineDetail.maintenance_status ?? '')
      .trim()
      .toUpperCase();

    if (nextStatus !== 'AVERIADA' && nextStatus !== 'AVERIADA_GRAVE') {
      setDetailFeedback('Selecciona Averiada o Averiada grave para abrir la incidencia.');
      return;
    }

    const acceptedProposal = getAcceptedProposal(selectedMachineProposals);

    if (currentStatus === 'OK' && !acceptedProposal) {
      setDetailFeedback('La máquina necesita una propuesta aceptada para abrir incidencia.');
      return;
    }

    try {
      setStatusActionLoading(true);
      setDetailFeedback(null);

      if (currentStatus === 'AVERIADA' && nextStatus === 'AVERIADA_GRAVE') {
        await escalateMachineIncidence(
          selectedMachineDetail.id_maquina,
          {
            comentario: incidenceComment.trim(),
          },
          session.token
        );
      } else {
        if (!acceptedProposal) {
          setDetailFeedback('La máquina necesita una propuesta aceptada para abrir incidencia.');
          return;
        }

        await openMachineIncidence(
          selectedMachineDetail.id_maquina,
          {
            maintenance_status: nextStatus,
            propuesta_alquiler_id: acceptedProposal.id,
            comentario: incidenceComment.trim(),
          },
          session.token
        );
      }

      resetPendingIncidenceSelection(nextStatus);
      await loadMachineContext(selectedMachineDetail.id_maquina);
    } catch (error) {
      await handleApiError(error, setDetailFeedback, 'No se pudo abrir la incidencia.');
    } finally {
      setStatusActionLoading(false);
    }
  }

  function handleCancelIncidenceDraft() {
    resetPendingIncidenceSelection();
    setDetailFeedback(null);
  }

  async function openNavigationOptions() {
    if (!selectedMachineDetail?.maps?.query) {
      return;
    }

    const queryValue = encodeURIComponent(selectedMachineDetail.maps.query);
    const candidates: (NavigationAppOption & { scheme: string; fallback: string })[] = [
      {
        key: 'waze',
        label: 'Waze',
        scheme: `waze://?q=${queryValue}&navigate=yes`,
        fallback: selectedMachineDetail.maps.waze,
        url: '',
      },
      {
        key: 'google',
        label: 'Maps',
        scheme: `comgooglemaps://?q=${queryValue}&directionsmode=driving`,
        fallback: selectedMachineDetail.maps.google,
        url: '',
      },
      {
        key: 'apple',
        label: 'Apple Mapas',
        scheme: `maps://?q=${queryValue}`,
        fallback: selectedMachineDetail.maps.apple,
        url: '',
      },
    ];

    const available: NavigationAppOption[] = [];

    for (const candidate of candidates) {
      const canUseScheme = await Linking.canOpenURL(candidate.scheme).catch(() => false);

      if (canUseScheme) {
        available.push({
          key: candidate.key,
          label: candidate.label,
          url: candidate.scheme,
        });
        continue;
      }

      const canUseFallback = await Linking.canOpenURL(candidate.fallback).catch(() => false);

      if (canUseFallback) {
        available.push({
          key: candidate.key,
          label: candidate.label,
          url: candidate.fallback,
        });
      }
    }

    if (available.length === 0) {
      setDetailFeedback('No hay una app de navegacion disponible para abrir esta direccion.');
      return;
    }

    setAvailableNavigationApps(available);
    setNavigationModalOpen(true);
  }

  async function handleOpenNavigation(url: string) {
    try {
      await Linking.openURL(url);
      setNavigationModalOpen(false);
    } catch {
      setDetailFeedback('No se pudo abrir la aplicacion de navegacion.');
    }
  }

  function handleToggleLocationPicker() {
    setStatusPickerOpen(false);
    setLocationPickerOpen((current) => !current);
  }

  function handleToggleStatusPicker() {
    setLocationPickerOpen(false);
    setStatusPickerOpen((current) => !current);
  }

  function handleSelectSuggestion(label: string) {
    setQuery(label);
    setSuggestions([]);
  }

  function handleToggleFilterPanel() {
    setFilterPanelOpen((open) => !open);
  }

  return {
    activeTab,
    setActiveTab,
    handleSelectTab,
    homeScrollResetKey,
    homeSubview,
    query,
    setQuery,
    filters,
    filterPanelOpen,
    suggestions,
    loadingMachines,
    loadingSuggestions,
    feedback,
    visibleMachines,
    activeFilterCount,
    selectedMachineDetail,
    selectedMachineProposals,
    detailLoading,
    detailFeedback,
    detailSuccessFeedback,
    selectedTargetLocation,
    locationPickerOpen,
    statusPickerOpen,
    proposalsExpanded,
    locationActionLoading,
    statusActionLoading,
    selectedMaintenanceStatus,
    incidenceComment,
    incidencePanelVisible,
    proposalForm,
    proposalSubmitting,
    proposalFeedback,
    navigationModalOpen,
    availableNavigationApps,
    acceptedProposal,
    machineImageSource,
    locationOptions,
    maintenanceOptions,
    canCreateProposal,
    canMarkDelivered,
    canSubmitIncidence,
    incidenceEscalationMode,
    toggleFilter,
    openMachineDetail,
    resetToListView,
    openProposalForm,
    updateProposalForm,
    handleCreateProposal,
    handleLocationChange,
    handleConfirmLocation,
    handleMaintenanceChange,
    handleOpenIncidence,
    handleCancelIncidenceDraft,
    openNavigationOptions,
    handleOpenNavigation,
    handleToggleLocationPicker,
    handleToggleStatusPicker,
    handleSelectSuggestion,
    handleToggleFilterPanel,
    setHomeSubview,
    setProposalsExpanded,
    setNavigationModalOpen,
    setIncidenceComment,
  };
}
