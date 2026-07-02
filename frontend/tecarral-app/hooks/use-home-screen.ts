import { Linking } from 'react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { cacheDirectory, copyAsync, makeDirectoryAsync } from 'expo-file-system/legacy';

import {
  EMPTY_FILTERS,
  FILTER_DEFINITIONS,
  EMPTY_MACHINE_CREATE_FORM,
  EMPTY_MACHINE_EDIT_FORM,
  EMPTY_PROPOSAL_FORM,
  EMPTY_REPAIR_BUDGET_FORM,
  EMPTY_SERVICE_CONTRACT_FORM,
} from '@/constants/home';
import { useAuth } from '@/contexts/auth-context';
import { ApiError } from '@/services/api';
import {
  uploadMachineImage,
} from '@/services/machine-images';
import {
  createMachine,
  getMachineDetail,
  getMachineSuggestions,
  getMaquinas,
  markMachineArrivedAtBase,
  markMachineDelivered,
  moveMachineBetweenBases,
  escalateMachineIncidence,
  openMachineIncidence,
  updateMachineDetail,
  updateMachineMaintenanceStatus,
} from '@/services/maquinas-api';
import { createRepairBudget } from '@/services/presupuestos-reparacion-api';
import {
  createMachineProposal,
  getMachineProposals,
  updateMachineProposal,
} from '@/services/propuestas-api';
import { createServiceContract } from '@/services/service-contracts-api';
import type { AuthSession } from '@/types/auth';
import type { NavigationAppOption } from '@/types/home';
import type {
  FilterCategoryKey,
  HomeSubview,
  HomeTabKey,
  MachineCreateFormData,
  MachineDetail,
  MachineEditFormData,
  MachineFilters,
  MachineProposalSummary,
  InventoryOwnershipType,
  Maquina,
  ProposalFormData,
  ServiceContractCreateFormData,
  SearchSuggestion,
} from '@/types/maquina';
import type { RepairBudgetFormData } from '@/types/reparacion';
import {
  getAcceptedProposal,
  getAllowedMaintenanceOptions,
  getLocationOptions,
  getMachineImageSource,
  machineMatchesFilters,
} from '@/utils/home-format';
import { isSimpleEmailValid, isSimplePhoneValid, normalizeInputText } from '@/utils/validation';

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
  const [inventoryOwnershipType, setInventoryOwnershipType] =
    useState<InventoryOwnershipType>('TECARRAL');
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
  const [selectedProposal, setSelectedProposal] = useState<MachineProposalSummary | null>(null);
  const [proposalSubmitting, setProposalSubmitting] = useState(false);
  const [proposalFeedback, setProposalFeedback] = useState<string | null>(null);
  const [repairBudgetForm, setRepairBudgetForm] =
    useState<RepairBudgetFormData>(EMPTY_REPAIR_BUDGET_FORM);
  const [repairBudgetSubmitting, setRepairBudgetSubmitting] = useState(false);
  const [repairBudgetFeedback, setRepairBudgetFeedback] = useState<string | null>(null);
  const [serviceContractForm, setServiceContractForm] =
    useState<ServiceContractCreateFormData>(EMPTY_SERVICE_CONTRACT_FORM);
  const [serviceContractFeedback, setServiceContractFeedback] = useState<string | null>(null);
  const [serviceContractSubmitting, setServiceContractSubmitting] = useState(false);
  const [incidenceServiceCaseType, setIncidenceServiceCaseType] =
    useState<'CLIENTE_HABITUAL' | 'CLIENTE_NUEVO' | ''>('');
  const [incidenceFaultCause, setIncidenceFaultCause] =
    useState<'DESGASTE_USO' | 'GOLPE_ACCIDENTE' | ''>('');
  const [machineEditForm, setMachineEditForm] =
    useState<MachineEditFormData>(EMPTY_MACHINE_EDIT_FORM);
  const [machineEditFeedback, setMachineEditFeedback] = useState<string | null>(null);
  const [machineEditSubmitting, setMachineEditSubmitting] = useState(false);
  const [machineEditMode, setMachineEditMode] = useState(false);
  const [machineEditTipoOpen, setMachineEditTipoOpen] = useState(false);
  const [machineEditMotorOpen, setMachineEditMotorOpen] = useState(false);
  const [machineEditSeguroOpen, setMachineEditSeguroOpen] = useState(false);
  const [machineEditElevationLibreOpen, setMachineEditElevationLibreOpen] = useState(false);
  const [machineEditAntihuellaOpen, setMachineEditAntihuellaOpen] = useState(false);
  const [machineCreateForm, setMachineCreateForm] =
    useState<MachineCreateFormData>(EMPTY_MACHINE_CREATE_FORM);
  const [machineCreateFeedback, setMachineCreateFeedback] = useState<string | null>(null);
  const [machineCreateSubmitting, setMachineCreateSubmitting] = useState(false);
  const [machineCreateSubtipoOpen, setMachineCreateSubtipoOpen] = useState(false);
  const [machineCreateTipoOpen, setMachineCreateTipoOpen] = useState(false);
  const [machineCreateMotorOpen, setMachineCreateMotorOpen] = useState(false);
  const [machineCreateSeguroOpen, setMachineCreateSeguroOpen] = useState(false);
  const [machineCreateElevationLibreOpen, setMachineCreateElevationLibreOpen] = useState(false);
  const [navigationModalOpen, setNavigationModalOpen] = useState(false);
  const [availableNavigationApps, setAvailableNavigationApps] = useState<NavigationAppOption[]>([]);
  const [homeScrollResetKey, setHomeScrollResetKey] = useState(0);

  const visibleMachines = useMemo(
    () => machines.filter((machine) => machineMatchesFilters(machine, filters)),
    [filters, machines]
  );

  const activeFilterCount = useMemo(
    () =>
      (inventoryOwnershipType === 'CLIENTE' ? filters.service_contract.length : filters.availability.length) +
      filters.tipo.length +
      filters.subtipo.length +
      filters.motor.length +
      filters.ubicacion_type.length,
    [filters, inventoryOwnershipType]
  );

  const acceptedProposal = useMemo(
    () => getAcceptedProposal(selectedMachineProposals),
    [selectedMachineProposals]
  );

  const machineImageSource = useMemo(
    () => {
      if (machineEditMode && machineEditForm.image_uri.trim()) {
        return { uri: machineEditForm.image_uri.trim() };
      }

      return selectedMachineDetail ? getMachineImageSource(selectedMachineDetail) : null;
    },
    [machineEditForm.image_uri, machineEditMode, selectedMachineDetail]
  );

  const machineImageHasBackground = useMemo(
    () => selectedMachineDetail?.image_has_background === true,
    [selectedMachineDetail?.image_has_background]
  );

  const locationOptions = useMemo(
    () => getLocationOptions(selectedMachineDetail, selectedMachineProposals),
    [selectedMachineDetail, selectedMachineProposals]
  );

  const maintenanceOptions = useMemo(() => {
    const options = getAllowedMaintenanceOptions(selectedMachineDetail?.maintenance_status);
    const isCustomer =
      String(selectedMachineDetail?.ownership_type ?? 'TECARRAL').trim().toUpperCase() === 'CLIENTE';

    if (!isCustomer) return options;

    const current = String(selectedMachineDetail?.maintenance_status ?? '').trim().toUpperCase();
    if (current === 'OK') {
      return options.filter((option) => option.value !== 'AVERIADA_GRAVE');
    }

    return options;
  }, [selectedMachineDetail?.maintenance_status, selectedMachineDetail?.ownership_type]);

  const isCustomerOwnedMachine =
    String(selectedMachineDetail?.ownership_type ?? 'TECARRAL').trim().toUpperCase() === 'CLIENTE';
  const canCreateProposal = session?.user.role === 'admin' && !isCustomerOwnedMachine;
  const canCreateMachine = session?.user.role === 'admin';
  const canCreateServiceContract = session?.user.role === 'admin' && isCustomerOwnedMachine;
  const proposalButtonDisabledReason = acceptedProposal
    ? `La máquina ya tiene una propuesta aceptada (#${acceptedProposal.id}).`
    : null;
  const canOpenProposalForm = canCreateProposal && !acceptedProposal;
  const activeRepair = selectedMachineDetail?.active_repair ?? null;
  const machineMaintenanceStatus = String(selectedMachineDetail?.maintenance_status ?? '').trim().toUpperCase();
  const machineAvailabilityStatus = String(selectedMachineDetail?.availability_status ?? '').trim().toUpperCase();
  const showRepairBudgetButton =
    session?.user.role === 'admin' &&
    machineMaintenanceStatus === 'AVERIADA_GRAVE' &&
    ((isCustomerOwnedMachine && activeRepair !== null) ||
      (!isCustomerOwnedMachine && machineAvailabilityStatus === 'ALQUILADA'));
  const repairBudgetDisabledReason = !showRepairBudgetButton
    ? null
    : !activeRepair
      ? 'No hay una reparación activa grave asociada a esta máquina.'
      : activeRepair.albaran_estado !== 'FIRMADO'
        ? 'Antes hay que firmar el albarán correspondiente a la avería grave.'
        : activeRepair.presupuesto_reparacion_id
          ? `Ya existe un presupuesto de reparación (#${activeRepair.presupuesto_reparacion_id}).`
          : !isCustomerOwnedMachine && activeRepair.propuesta_alquiler_id === null
            ? 'La reparación no tiene propuesta de alquiler asociada.'
            : selectedMachineDetail?.can_create_repair_budget === false
              ? String(selectedMachineDetail.repair_budget_block_reason ?? 'No procede crear presupuesto para esta reparación.')
              : null;
  const canCreateRepairBudget = showRepairBudgetButton && !repairBudgetDisabledReason;
  const canUseLocationFlow = true;
  const selectedLocationValue = String(selectedMachineDetail?.ubicacion_tipo ?? '').trim().toUpperCase();
  const targetLocationValue = String(selectedTargetLocation || selectedLocationValue).trim().toUpperCase();
  const canMarkDelivered =
    canUseLocationFlow &&
    selectedMachineDetail !== null &&
    targetLocationValue.length > 0 &&
    targetLocationValue !== selectedLocationValue &&
    locationOptions.some((option) => option.value === targetLocationValue);
  const incidenceEscalationMode =
    machineMaintenanceStatus === 'AVERIADA' && selectedMaintenanceStatus === 'AVERIADA_GRAVE';
  const canSubmitIncidence = isCustomerOwnedMachine
    ? incidenceEscalationMode ||
      (selectedMaintenanceStatus === 'AVERIADA' && Boolean(incidenceServiceCaseType) && Boolean(incidenceFaultCause))
    : incidenceEscalationMode
      ? true
      : acceptedProposal !== null;
  const machineTipoOptions = [
    { label: 'Elevación', value: 'elevacion' },
    { label: 'Limpieza', value: 'limpieza' },
  ] as const;
  const machineSubtipoOptions =
    FILTER_DEFINITIONS.find((definition) => definition.key === 'subtipo')?.options ?? [];
  const machineMotorOptions = [
    { label: 'Diésel', value: 'diesel' },
    { label: 'Eléctrica', value: 'electrica' },
    { label: 'Semieléctrica', value: 'semi electrica' },
    { label: 'Manual', value: 'manual' },
  ] as const;
  const machineSeguroOptions = [
    { label: 'Sí', value: 'true' },
    { label: 'No', value: 'false' },
  ] as const;
  const machineBooleanOptions = machineSeguroOptions;

  function toBooleanSelectorValue(value: unknown): 'true' | 'false' | '' {
    if (value === true) return 'true';
    if (value === false) return 'false';

    const normalized = String(value ?? '').trim().toLowerCase();
    if (normalized === 'true') return 'true';
    if (normalized === 'false') return 'false';

    return '';
  }


  async function persistPickedMachineImage(uri: string) {
    const cleanUri = String(uri ?? '').trim();
    if (!cleanUri || !cacheDirectory) return cleanUri;

    try {
      const directory = `${cacheDirectory}tecarral-machine-images/`;
      await makeDirectoryAsync(directory, { intermediates: true });
      const extension = cleanUri.split('?')[0]?.split('.').pop()?.toLowerCase() || 'jpg';
      const safeExtension = ['jpg', 'jpeg', 'png', 'webp'].includes(extension) ? extension : 'jpg';
      const destination = `${directory}machine_${Date.now()}.${safeExtension}`;
      await copyAsync({ from: cleanUri, to: destination });
      return destination;
    } catch {
      return cleanUri;
    }
  }

  async function pickMachineImage(source: 'camera' | 'library', target: 'create' | 'edit' = 'create') {
    const requestPermission =
      source === 'camera'
        ? ImagePicker.requestCameraPermissionsAsync
        : ImagePicker.requestMediaLibraryPermissionsAsync;
    const permission = await requestPermission();

    if (!permission.granted) {
      const feedbackMessage =
        source === 'camera'
          ? 'Necesitas permisos de cámara para hacer una foto.'
          : 'Necesitas permisos de galería para adjuntar una foto.';

      if (target === 'edit') {
        setMachineEditFeedback(feedbackMessage);
      } else {
        setMachineCreateFeedback(feedbackMessage);
      }
      return;
    }

    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            mediaTypes: ['images'],
            quality: 0.8,
          })
        : await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            mediaTypes: ['images'],
            quality: 0.8,
          });

    if (result.canceled || !result.assets?.[0]?.uri) {
      return;
    }

    const persistedUri = await persistPickedMachineImage(result.assets[0].uri);

    if (target === 'edit') {
      setMachineEditFeedback(null);
      updateMachineEditForm('image_uri', persistedUri);
      return;
    }

    setMachineCreateFeedback(null);
    updateMachineCreateForm('image_uri', persistedUri);
  }

  function buildMachineEditForm(detail: MachineDetail): MachineEditFormData {
    const normalizedTipo = String(detail.tipo_maquina ?? '').trim().toLowerCase();
    const normalizedMotor = String(detail.motor ?? '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    return {
      marca: String(detail.marca ?? ''),
      modelo: String(detail.modelo ?? ''),
      ubicacion: String(detail.ubicacion ?? ''),
      image_uri: '',
      tipo: normalizedTipo === 'limpieza' ? 'limpieza' : 'elevacion',
      motor:
        normalizedMotor === 'diesel' ||
        normalizedMotor === 'electrica' ||
        normalizedMotor === 'semi electrica' ||
        normalizedMotor === 'manual'
          ? (normalizedMotor as MachineEditFormData['motor'])
          : 'electrica',
      ns: String(detail.ns ?? ''),
      num_poliza: String(detail.num_poliza ?? ''),
      observaciones: String(detail.observaciones ?? ''),
      seguro: detail.seguro === true ? 'true' : 'false',
      elev_ruedas: String(detail.elev_ruedas ?? ''),
      elev_cap_carga: String(detail.elev_cap_carga ?? ''),
      elev_replegado_mm: String(detail.elev_replegado_mm ?? ''),
      elev_elevacion_libre: toBooleanSelectorValue(detail.elev_elevacion_libre),
      elev_elevacion: String(detail.elev_elevacion ?? ''),
      elev_desplazamiento: String(detail.elev_desplazamiento ?? ''),
      elev_posicion: String(detail.elev_posicion ?? ''),
      elev_antihuella: toBooleanSelectorValue(detail.elev_antihuella),
      elev_matricula: String(detail.elev_matricula ?? ''),
      elev_largo: String(detail.elev_largo ?? ''),
      elev_alto: String(detail.elev_alto ?? ''),
      elev_ancho: String(detail.elev_ancho ?? ''),
      elev_peso_kg: String(detail.elev_peso_kg ?? ''),
      elev_horquillas: String(detail.elev_horquillas ?? ''),
    };
  }

  function patchMachineCaches(idMaquina: number, patch: Partial<MachineDetail>) {
    setSelectedMachineDetail((current) =>
      current && current.id_maquina === idMaquina ? { ...current, ...patch } : current
    );
    setMachines((current) =>
      current.map((machine) =>
        machine.id_maquina === idMaquina ? { ...machine, ...patch } : machine
      )
    );
  }

  function patchActiveRepair(
    idMaquina: number,
    updater: (
      current: NonNullable<MachineDetail['active_repair']>
    ) => NonNullable<MachineDetail['active_repair']>
  ) {
    setSelectedMachineDetail((current) => {
      if (!current || current.id_maquina !== idMaquina || !current.active_repair) {
        return current;
      }

      return {
        ...current,
        active_repair: updater(current.active_repair),
      };
    });
  }

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
          ownership_type: inventoryOwnershipType,
          filters: inventoryOwnershipType === 'TECARRAL' ? filters : undefined,
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
  }, [activeTab, appliedQuery, filters, homeSubview, inventoryOwnershipType, session]);

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

  async function loadMachineContext(idMaquina: number, options?: { silent?: boolean }) {
    if (!session?.token) {
      return;
    }

    try {
      if (!options?.silent) {
        setDetailLoading(true);
      }
      setDetailFeedback(null);
      setRepairBudgetFeedback(null);
      setLocationPickerOpen(false);
      setStatusPickerOpen(false);

      const [detail, proposals] = await Promise.all([
        getMachineDetail(idMaquina, session.token),
        getMachineProposals(idMaquina, session.token),
      ]);

      setSelectedMachineDetail(detail);
      setSelectedMachineProposals(proposals);
      setMachineEditForm(buildMachineEditForm(detail));
      setMachineEditFeedback(null);
      setMachineEditMode(false);
      setMachineEditTipoOpen(false);
      setMachineEditMotorOpen(false);
      setMachineEditSeguroOpen(false);
      setMachineEditElevationLibreOpen(false);
      setMachineEditAntihuellaOpen(false);
      setSelectedTargetLocation(String(detail.ubicacion_tipo ?? '').trim().toUpperCase());
      resetPendingIncidenceSelection(
        String(detail.maintenance_status ?? '').trim().toUpperCase()
      );
      setProposalsExpanded(false);
    } catch (error) {
      await handleApiError(error, setDetailFeedback, 'No se pudo cargar el detalle de la máquina.');
    } finally {
      if (!options?.silent) {
        setDetailLoading(false);
      }
    }
  }

  async function openMachineDetail(idMaquina: number) {
    setHomeSubview('detail');
    await loadMachineContext(idMaquina);
  }

  function resetToListView() {
    setHomeSubview('list');
    setSelectedProposal(null);
    setProposalForm(EMPTY_PROPOSAL_FORM);
    setDetailFeedback(null);
    setProposalFeedback(null);
    setRepairBudgetFeedback(null);
    setMachineEditFeedback(null);
    setMachineEditMode(false);
    setMachineEditTipoOpen(false);
    setMachineEditMotorOpen(false);
    setMachineEditSeguroOpen(false);
    setMachineEditElevationLibreOpen(false);
    setMachineEditAntihuellaOpen(false);
    setMachineCreateFeedback(null);
    setMachineCreateTipoOpen(false);
    setMachineCreateMotorOpen(false);
    setMachineCreateSeguroOpen(false);
    setMachineCreateElevationLibreOpen(false);
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
    if (!canOpenProposalForm) {
      return;
    }
    setSelectedProposal(null);
    setProposalForm(EMPTY_PROPOSAL_FORM);
    setProposalFeedback(null);
    setRepairBudgetFeedback(null);
    setHomeSubview('proposalForm');
  }

  function buildProposalFormFromSummary(proposal: MachineProposalSummary): ProposalFormData {
    return {
      cliente: String(proposal.cliente ?? ''),
      email_cliente: String(proposal.email_cliente ?? ''),
      telefono: String(proposal.telefono ?? ''),
      direccion: String(proposal.direccion ?? ''),
      cp: String(proposal.cp ?? ''),
      poblacion: String(proposal.poblacion ?? ''),
      precio: String(proposal.precio ?? ''),
      fecha_inicio: String(proposal.fecha_inicio ?? ''),
      fecha_fin: String(proposal.fecha_fin ?? ''),
    };
  }

  function openProposalDetail(proposal: MachineProposalSummary) {
    if (String(proposal.estado ?? '').trim().toUpperCase() !== 'PENDING') {
      return;
    }

    setSelectedProposal(proposal);
    setProposalForm(buildProposalFormFromSummary(proposal));
    setProposalFeedback(null);
    setRepairBudgetFeedback(null);
    setHomeSubview('proposalForm');
  }

  function openRepairBudgetForm() {
    setRepairBudgetForm(EMPTY_REPAIR_BUDGET_FORM);
    setRepairBudgetFeedback(null);
    setProposalFeedback(null);
    setHomeSubview('repairBudgetForm');
  }

  function openCreateMachineForm() {
    if (!canCreateMachine) {
      return;
    }

    setMachineCreateForm(EMPTY_MACHINE_CREATE_FORM);
    setMachineCreateFeedback(null);
    setMachineCreateTipoOpen(false);
    setMachineCreateMotorOpen(false);
    setMachineCreateSeguroOpen(false);
    setMachineCreateElevationLibreOpen(false);
    setHomeSubview('createMachineForm');
  }

  function updateProposalForm<K extends keyof ProposalFormData>(key: K, value: ProposalFormData[K]) {
    setProposalForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function updateRepairBudgetForm<K extends keyof RepairBudgetFormData>(
    key: K,
    value: RepairBudgetFormData[K]
  ) {
    setRepairBudgetForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function updateMachineEditForm<K extends keyof MachineEditFormData>(
    key: K,
    value: MachineEditFormData[K]
  ) {
    setMachineEditForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function updateMachineCreateForm<K extends keyof MachineCreateFormData>(
    key: K,
    value: MachineCreateFormData[K]
  ) {
    setMachineCreateForm((current) => {
      if (key === 'tipo') {
      return {
          ...EMPTY_MACHINE_CREATE_FORM,
          subtipo: '',
          marca: current.marca,
          modelo: current.modelo,
          ns: current.ns,
          image_uri: current.image_uri,
          ubicacion: current.ubicacion,
          ubicacion_operativa_direccion: current.ubicacion_operativa_direccion,
          ubicacion_operativa_poblacion: current.ubicacion_operativa_poblacion,
          ubicacion_operativa_cp: current.ubicacion_operativa_cp,
          owner_cliente_nombre: current.owner_cliente_nombre,
          owner_cliente_email: current.owner_cliente_email,
          owner_cliente_telefono: current.owner_cliente_telefono,
          owner_cliente_direccion: current.owner_cliente_direccion,
          owner_cliente_poblacion: current.owner_cliente_poblacion,
          owner_cliente_cp: current.owner_cliente_cp,
          tipo: value as MachineCreateFormData['tipo'],
          motor: current.motor,
          seguro: current.seguro,
          num_poliza: current.num_poliza,
          observaciones: current.observaciones,
        };
      }

      return {
        ...current,
        [key]: value,
      };
    });
  }

  function handleOpenMachineEdit() {
    if (!selectedMachineDetail) {
      return;
    }

    setMachineEditForm(buildMachineEditForm(selectedMachineDetail));
    setMachineEditFeedback(null);
    setMachineEditMode(true);
    setMachineEditElevationLibreOpen(false);
    setMachineEditAntihuellaOpen(false);
  }

  function handleCancelMachineEdit() {
    if (selectedMachineDetail) {
      setMachineEditForm(buildMachineEditForm(selectedMachineDetail));
    }

    setMachineEditFeedback(null);
    setMachineEditMode(false);
    setMachineEditTipoOpen(false);
    setMachineEditMotorOpen(false);
    setMachineEditSeguroOpen(false);
    setMachineEditElevationLibreOpen(false);
    setMachineEditAntihuellaOpen(false);
  }

  function validateProposalForm() {
    if (!normalizeInputText(proposalForm.cliente)) return 'Introduce el cliente.';
    if (!normalizeInputText(proposalForm.email_cliente)) return 'Introduce el email del cliente.';
    if (!isSimpleEmailValid(proposalForm.email_cliente)) return 'Introduce un email válido.';
    if (!normalizeInputText(proposalForm.telefono)) return 'Introduce el teléfono del cliente.';
    if (!isSimplePhoneValid(proposalForm.telefono)) return 'El teléfono debe tener 9 caracteres.';
    if (!proposalForm.cliente.trim()) return 'Introduce el cliente.';
    if (!proposalForm.email_cliente.trim()) return 'Introduce el email del cliente.';
    if (!proposalForm.telefono.trim()) return 'Introduce el telefono del cliente.';
    if (!proposalForm.direccion.trim()) return 'Introduce la dirección.';
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


  function parseDecimalInput(value: string) {
    const normalized = String(value ?? '').trim().replace(',', '.');
    if (!normalized) return NaN;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : NaN;
  }

  function validateRepairBudgetForm() {
    if (!activeRepair?.id_reparacion) {
      return 'No hay una reparación activa para crear el presupuesto.';
    }

    if (!isCustomerOwnedMachine && !activeRepair.propuesta_alquiler_id) {
      return 'La reparación no tiene propuesta de alquiler asociada.';
    }

    const validItems = repairBudgetForm.items.filter(
      (item) => item.descripcion.trim() || item.referencia.trim() || item.precio_unitario.trim()
    );

    if (validItems.length === 0) {
      return 'Añade al menos una línea al presupuesto.';
    }

    for (const [index, item] of validItems.entries()) {
      const lineNumber = index + 1;
      if (!item.descripcion.trim()) return `La línea ${lineNumber} necesita descripción.`;
      if (!item.unidades.trim() || parseDecimalInput(item.unidades) <= 0) {
        return `La línea ${lineNumber} necesita unidades mayores que 0.`;
      }
      if (!item.precio_unitario.trim() || parseDecimalInput(item.precio_unitario) < 0) {
        return `La línea ${lineNumber} necesita un precio unitario válido.`;
      }
    }

if (!repairBudgetForm.expira_at.trim() || !repairBudgetForm.expira_at.includes('T')) {
      return 'expira_at debe ir en formato ISO, por ejemplo 2026-05-20T10:00:00.';
    }

    const expiresAtDate = new Date(repairBudgetForm.expira_at);

    if (Number.isNaN(expiresAtDate.getTime())) {
      return 'La fecha de expedición seleccionada no es válida.';
    }

    if (expiresAtDate.getTime() <= Date.now()) {
      return 'La fecha de expedición debe ser futura.';
    }

    return null;
  }

  function validateMachineEditForm() {
    if (!machineEditForm.marca.trim()) return 'Introduce la marca.';
    if (!machineEditForm.modelo.trim()) return 'Introduce el modelo.';
    if (!machineEditForm.ubicacion.trim()) return 'Introduce la dirección.';
    if (!machineEditForm.ns.trim()) return 'Introduce el número de serie.';

    return null;
  }

  function validateMachineCreateForm() {
    if (!machineCreateForm.subtipo.trim()) return 'Selecciona el nombre o tipo de máquina.';
    if (!machineCreateForm.marca.trim()) return 'Introduce la marca.';
    if (!machineCreateForm.modelo.trim()) return 'Introduce el modelo.';
    if (!machineCreateForm.ns.trim()) return 'Introduce el número de serie.';

    if (inventoryOwnershipType === 'CLIENTE') {
      if (!machineCreateForm.owner_cliente_nombre.trim()) return 'Introduce el nombre del cliente propietario.';
      if (!machineCreateForm.owner_cliente_email.trim()) return 'Introduce el email del cliente propietario.';
      if (!isSimpleEmailValid(machineCreateForm.owner_cliente_email)) return 'Introduce un email de cliente válido.';
      if (!machineCreateForm.owner_cliente_telefono.trim()) return 'Introduce el teléfono del cliente propietario.';
      if (!isSimplePhoneValid(machineCreateForm.owner_cliente_telefono)) return 'Introduce un teléfono de cliente válido.';
      if (!machineCreateForm.owner_cliente_direccion.trim()) return 'Introduce la dirección del cliente propietario.';
      if (!machineCreateForm.owner_cliente_cp.trim()) return 'Introduce el código postal del cliente propietario.';
      if (!machineCreateForm.owner_cliente_poblacion.trim()) return 'Introduce la población del cliente propietario.';
      if (!machineCreateForm.ubicacion_operativa_direccion.trim()) return 'Introduce la dirección operativa de la máquina.';
      if (!machineCreateForm.ubicacion_operativa_cp.trim()) return 'Introduce el código postal operativo de la máquina.';
      if (!machineCreateForm.ubicacion_operativa_poblacion.trim()) return 'Introduce la población operativa de la máquina.';
    }

    return null;
  }


  function openServiceContractForm() {
    if (!selectedMachineDetail || !isCustomerOwnedMachine) return;

    setServiceContractForm({
      ...EMPTY_SERVICE_CONTRACT_FORM,
      cliente_nombre: String(selectedMachineDetail.owner_cliente_nombre ?? ''),
      cliente_email: String(selectedMachineDetail.owner_cliente_email ?? ''),
      cliente_telefono: String(selectedMachineDetail.owner_cliente_telefono ?? ''),
      cliente_direccion: String(selectedMachineDetail.owner_cliente_direccion ?? ''),
      cliente_poblacion: String(selectedMachineDetail.owner_cliente_poblacion ?? ''),
      cliente_cp: String(selectedMachineDetail.owner_cliente_cp ?? ''),
    });
    setServiceContractFeedback(null);
    setHomeSubview('serviceContractForm');
  }

  function updateServiceContractForm<K extends keyof ServiceContractCreateFormData>(
    key: K,
    value: ServiceContractCreateFormData[K]
  ) {
    setServiceContractForm((current) => ({ ...current, [key]: value }));
    setServiceContractFeedback(null);
  }

  function validateServiceContractForm() {
    if (!serviceContractForm.tarifa_fija.trim() || Number(serviceContractForm.tarifa_fija) <= 0) {
      return 'Introduce una tarifa fija v?lida.';
    }
    if (!serviceContractForm.start_date.trim()) return 'Selecciona la fecha de inicio.';
    if (serviceContractForm.recurrencia_unidad === 'WEEK' && !serviceContractForm.maintenance_weekday) {
      return 'Selecciona el día de visita semanal.';
    }
    if (serviceContractForm.recurrencia_unidad === 'MONTH') {
      const day = Number(serviceContractForm.maintenance_day_of_month);
      if (!Number.isInteger(day) || day < 1 || day > 31) return 'Introduce un día del mes válido.';
    }
    if (!serviceContractForm.cliente_nombre.trim()) return 'Introduce el nombre del cliente.';
    if (!isSimpleEmailValid(serviceContractForm.cliente_email)) return 'Introduce un email válido.';
    return null;
  }

  async function handleCreateServiceContract() {
    if (!session?.token || !selectedMachineDetail || !isCustomerOwnedMachine) return;

    const validationError = validateServiceContractForm();
    if (validationError) {
      setServiceContractFeedback(validationError);
      return;
    }

    try {
      setServiceContractSubmitting(true);
      setServiceContractFeedback(null);
      await createServiceContract(
        { ...serviceContractForm, id_maquina: selectedMachineDetail.id_maquina },
        session.token
      );
      setHomeSubview('detail');
      showTemporaryDetailSuccess('Contrato de mantenimiento creado correctamente.');
      void loadMachineContext(selectedMachineDetail.id_maquina, { silent: true });
    } catch (error) {
      await handleApiError(error, setServiceContractFeedback, 'No se pudo crear el contrato.');
    } finally {
      setServiceContractSubmitting(false);
    }
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

      const response = selectedProposal
        ? await updateMachineProposal(selectedProposal.id, proposalForm, session.token)
        : await createMachineProposal(
            selectedMachineDetail.id_maquina,
            proposalForm,
            session.token
          );

      setSelectedMachineProposals((current) =>
        selectedProposal
          ? current.map((proposal) =>
              proposal.id === response.id ? { ...proposal, ...response } : proposal
            )
          : [response, ...current]
      );
      setSelectedProposal(null);
      setHomeSubview('detail');
      if (!selectedProposal && response.email_sent === false) {
        setDetailFeedback(
          response.email_error?.trim()
            ? `Propuesta creada, pero no se pudo enviar el email: ${response.email_error}`
            : 'Propuesta creada, pero no se pudo enviar el email.'
        );
      } else {
        setDetailFeedback(null);
        showTemporaryDetailSuccess(
          selectedProposal ? 'Propuesta actualizada correctamente.' : 'Propuesta creada correctamente.'
        );
      }
      void loadMachineContext(selectedMachineDetail.id_maquina, { silent: true });
    } catch (error) {
      await handleApiError(error, setProposalFeedback, 'No se pudo crear la propuesta.');
    } finally {
      setProposalSubmitting(false);
    }
  }

  async function handleCreateRepairBudget() {
    if (!session?.token || !selectedMachineDetail || !activeRepair) {
      return;
    }

    const validationError = validateRepairBudgetForm();
    if (validationError) {
      setRepairBudgetFeedback(validationError);
      return;
    }

    try {
      setRepairBudgetSubmitting(true);
      setRepairBudgetFeedback(null);
      const items = repairBudgetForm.items
        .filter((item) => item.descripcion.trim() || item.referencia.trim() || item.precio_unitario.trim())
        .map((item) => ({
          referencia: item.referencia.trim() || null,
          descripcion: item.descripcion.trim(),
          unidades: parseDecimalInput(item.unidades),
          precio_unitario: parseDecimalInput(item.precio_unitario),
        }));

      const response = await createRepairBudget(
        {
          reparacion_id: activeRepair.id_reparacion,
          propuesta_alquiler_id: activeRepair.propuesta_alquiler_id
            ? Number(activeRepair.propuesta_alquiler_id)
            : undefined,
          items,
          iva_rate: 21,
          condiciones: repairBudgetForm.condiciones.trim() || null,
          expira_at: repairBudgetForm.expira_at,
        },
        session.token
      );

      patchActiveRepair(selectedMachineDetail.id_maquina, (current) => ({
        ...current,
        presupuesto_reparacion_id: response.id,
        presupuesto_estado: response.estado,
        presupuesto_payer_type: response.payer_type,
        presupuesto_charge_reason: response.charge_reason,
      }));
      setHomeSubview('detail');

      const repairBudgetSuccessMessage =
        response.payer_type === 'EMPRESA'
          ? `Presupuesto interno creado y enviado a ${response.email_recipient ?? 'la dirección interna configurada'}.`
          : `Presupuesto de reparación enviado a ${response.email_recipient ?? 'la dirección del cliente'}.`;

      if (response.email_sent === false) {
        setDetailFeedback('Presupuesto creado, pero no se pudo enviar el email.');
      } else {
        setDetailFeedback(null);
        showTemporaryDetailSuccess('Presupuesto de reparación creado correctamente.');
        showTemporaryDetailSuccess(repairBudgetSuccessMessage);
      }
      void loadMachineContext(selectedMachineDetail.id_maquina, { silent: true });
    } catch (error) {
      await handleApiError(
        error,
        setRepairBudgetFeedback,
        'No se pudo crear el presupuesto de reparación.'
      );
    } finally {
      setRepairBudgetSubmitting(false);
    }
  }

  async function handleSaveMachineEdit() {
    if (!session?.token || !selectedMachineDetail) {
      return;
    }

    const validationError = validateMachineEditForm();
    if (validationError) {
      setMachineEditFeedback(validationError);
      return;
    }

    try {
      setMachineEditSubmitting(true);
      setMachineEditFeedback(null);

      const updatedMachineResponse = await updateMachineDetail(
        selectedMachineDetail.id_maquina,
        machineEditForm,
        session.token
      );
      const uploadedMachine =
        machineEditForm.image_uri.trim().length > 0
          ? await uploadMachineImage(
              selectedMachineDetail.id_maquina,
              machineEditForm.image_uri,
              session.token
            )
          : null;
      const updatedMachine = uploadedMachine ?? updatedMachineResponse;

      patchMachineCaches(selectedMachineDetail.id_maquina, updatedMachine);
      setMachineEditForm(buildMachineEditForm(updatedMachine));
      setMachineEditMode(false);
      setMachineEditTipoOpen(false);
      setMachineEditMotorOpen(false);
      setMachineEditSeguroOpen(false);
      setMachineEditElevationLibreOpen(false);
      setMachineEditAntihuellaOpen(false);
      showTemporaryDetailSuccess(
        uploadedMachine || !machineEditForm.image_uri.trim()
          ? 'Maquinaria actualizada correctamente.'
          : 'Maquinaria actualizada, pero no se pudo subir la imagen.'
      );
      void loadMachineContext(selectedMachineDetail.id_maquina, { silent: true });
    } catch (error) {
      await handleApiError(
        error,
        setMachineEditFeedback,
        'No se pudo guardar la información de la maquinaria.'
      );
    } finally {
      setMachineEditSubmitting(false);
    }
  }

  async function handleCreateMachine() {
    if (!session?.token || !canCreateMachine) {
      return;
    }

    const validationError = validateMachineCreateForm();
    if (validationError) {
      setMachineCreateFeedback(validationError);
      return;
    }

    try {
      setMachineCreateSubmitting(true);
      setMachineCreateFeedback(null);

      const createdMachine = await createMachine(
        machineCreateForm,
        session.token,
        inventoryOwnershipType
      );
      const uploadedMachine = machineCreateForm.image_uri.trim()
        ? await uploadMachineImage(
            createdMachine.id_maquina,
            machineCreateForm.image_uri,
            session.token
          ).catch(() => null)
        : null;
      const createdMachineWithImage = uploadedMachine ?? createdMachine;

      setMachines((current) =>
        [...current, createdMachineWithImage].sort((a, b) => a.id_maquina - b.id_maquina)
      );
      setHomeSubview('list');
      showTemporaryDetailSuccess(
        uploadedMachine || !machineCreateForm.image_uri.trim()
          ? 'Máquina creada correctamente.'
          : 'Máquina creada, pero no se pudo subir la imagen.'
      );
    } catch (error) {
      await handleApiError(error, setMachineCreateFeedback, 'No se pudo crear la máquina.');
    } finally {
      setMachineCreateSubmitting(false);
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
        const deliveredResult = await markMachineDelivered(selectedMachineDetail.id_maquina, session.token);
        const deliveredMachine = deliveredResult.data ?? null;
        patchMachineCaches(selectedMachineDetail.id_maquina, deliveredMachine ?? {
          ubicacion_tipo: 'CLIENTE',
          logistics_status: isCustomerOwnedMachine ? null : 'ENTREGADA',
          transit_reason: null,
          ubicacion:
            acceptedProposal?.direccion && acceptedProposal?.poblacion
              ? `${acceptedProposal.direccion}, ${acceptedProposal.poblacion}`
              : selectedMachineDetail.ubicacion,
        });
      } else if (currentLocation === 'TRANSITO') {
        const updatedMachine = await markMachineArrivedAtBase(
          selectedMachineDetail.id_maquina,
          nextLocation === 'ALMACEN' ? 'almacen' : 'taller',
          session.token
        );
        patchMachineCaches(selectedMachineDetail.id_maquina, {
          ...updatedMachine,
        });
      } else {
        const updatedMachine = await moveMachineBetweenBases(
          selectedMachineDetail.id_maquina,
          nextLocation === 'ALMACEN' ? 'almacen' : 'taller',
          session.token
        );
        patchMachineCaches(selectedMachineDetail.id_maquina, {
          ...updatedMachine,
        });
      }

      setSelectedTargetLocation(nextLocation);
      void loadMachineContext(selectedMachineDetail.id_maquina, { silent: true });
    } catch (error) {
      await handleApiError(error, setDetailFeedback, 'No se pudo actualizar la ubicación.');
      setSelectedTargetLocation(currentLocation);
      await loadMachineContext(selectedMachineDetail.id_maquina, { silent: true });
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
      patchMachineCaches(selectedMachineDetail.id_maquina, {
        maintenance_status: nextStatus,
      });
      void loadMachineContext(selectedMachineDetail.id_maquina, { silent: true });
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

    if (currentStatus === 'OK' && !acceptedProposal && !isCustomerOwnedMachine) {
      setDetailFeedback('La máquina necesita una propuesta aceptada para abrir incidencia.');
      return;
    }

    if (isCustomerOwnedMachine && currentStatus === 'OK') {
      if (nextStatus !== 'AVERIADA') {
        setDetailFeedback('Las máquinas de cliente deben abrirse primero como avería simple.');
        return;
      }
      if (!incidenceServiceCaseType || !incidenceFaultCause) {
        setDetailFeedback('Indica si es cliente habitual o nuevo y la causa de la avería.');
        return;
      }
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
        if (!acceptedProposal && !isCustomerOwnedMachine) {
          setDetailFeedback('La máquina necesita una propuesta aceptada para abrir incidencia.');
          return;
        }

        const serviceContractId = Number(selectedMachineDetail.service_contract_id ?? 0);
        await openMachineIncidence(
          selectedMachineDetail.id_maquina,
          isCustomerOwnedMachine
            ? {
                maintenance_status: 'AVERIADA',
                service_context_type: serviceContractId > 0
                  ? 'CONTRATO_MANTENIMIENTO'
                  : 'REPARACION_PUNTUAL_CLIENTE',
                service_context_id: serviceContractId > 0 ? serviceContractId : selectedMachineDetail.id_maquina,
                service_case_type: incidenceServiceCaseType || null,
                fault_cause: incidenceFaultCause || null,
                comentario: incidenceComment.trim(),
              }
            : {
                maintenance_status: nextStatus,
                propuesta_alquiler_id: acceptedProposal?.id ?? null,
                comentario: incidenceComment.trim(),
              },
          session.token
        );
      }

      resetPendingIncidenceSelection(nextStatus);
      setIncidenceServiceCaseType('');
      setIncidenceFaultCause('');
      patchMachineCaches(selectedMachineDetail.id_maquina, {
        maintenance_status: nextStatus,
        ubicacion_tipo:
          nextStatus === 'AVERIADA_GRAVE'
            ? 'TRANSITO'
            : selectedMachineDetail.ubicacion_tipo,
        logistics_status: nextStatus === 'AVERIADA_GRAVE' ? 'EN_CAMINO' : null,
      });
      void loadMachineContext(selectedMachineDetail.id_maquina, { silent: true });
    } catch (error) {
      await handleApiError(error, setDetailFeedback, 'No se pudo abrir la incidencia.');
    } finally {
      setStatusActionLoading(false);
    }
  }

  function handleCancelIncidenceDraft() {
    resetPendingIncidenceSelection();
    setIncidenceServiceCaseType('');
    setIncidenceFaultCause('');
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
      setDetailFeedback('No hay una app de navegación disponible para abrir esta dirección.');
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
      setDetailFeedback('No se pudo abrir la aplicación de navegación.');
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

  function handleInventoryOwnershipChange(nextOwnershipType: InventoryOwnershipType) {
    setInventoryOwnershipType(nextOwnershipType);
    setFilterPanelOpen(false);
    setFilters(EMPTY_FILTERS);
    setMachines([]);
    setFeedback(null);
    setHomeSubview('list');
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
    inventoryOwnershipType,
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
    selectedProposal,
    proposalSubmitting,
    proposalFeedback,
    repairBudgetForm,
    repairBudgetSubmitting,
    repairBudgetFeedback,
    serviceContractForm,
    serviceContractFeedback,
    serviceContractSubmitting,
    incidenceServiceCaseType,
    incidenceFaultCause,
    machineCreateForm,
    machineCreateFeedback,
    machineCreateSubmitting,
    machineCreateSubtipoOpen,
    machineCreateTipoOpen,
    machineCreateMotorOpen,
    machineCreateSeguroOpen,
    machineCreateElevationLibreOpen,
    machineEditForm,
    machineEditFeedback,
    machineEditSubmitting,
    machineEditMode,
    machineEditTipoOpen,
    machineEditMotorOpen,
    machineEditSeguroOpen,
    machineEditElevationLibreOpen,
    machineEditAntihuellaOpen,
    machineSubtipoOptions,
    machineTipoOptions,
    machineMotorOptions,
    machineSeguroOptions,
    machineBooleanOptions,
    navigationModalOpen,
    availableNavigationApps,
    acceptedProposal,
    machineImageSource,
    machineImageHasBackground,
    locationOptions,
    maintenanceOptions,
    canCreateProposal,
    canCreateMachine,
    canOpenProposalForm,
    canCreateServiceContract,
    isCustomerOwnedMachine,
    proposalButtonDisabledReason,
    showRepairBudgetButton,
    canCreateRepairBudget,
    repairBudgetDisabledReason,
    canMarkDelivered,
    canUseLocationFlow,
    canSubmitIncidence,
    incidenceEscalationMode,
    toggleFilter,
    openMachineDetail,
    resetToListView,
    openProposalForm,
    openProposalDetail,
    openCreateMachineForm,
    openRepairBudgetForm,
    openServiceContractForm,
    updateProposalForm,
    updateRepairBudgetForm,
    updateServiceContractForm,
    updateMachineCreateForm,
    pickMachineImage,
    updateMachineEditForm,
    handleCreateProposal,
    handleCreateMachine,
    handleCreateRepairBudget,
    handleCreateServiceContract,
    handleOpenMachineEdit,
    handleCancelMachineEdit,
    handleSaveMachineEdit,
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
    handleInventoryOwnershipChange,
    setHomeSubview,
    setProposalsExpanded,
    setNavigationModalOpen,
    setIncidenceComment,
    setIncidenceServiceCaseType,
    setIncidenceFaultCause,
    setMachineEditTipoOpen,
    setMachineEditMotorOpen,
    setMachineEditSeguroOpen,
    setMachineEditElevationLibreOpen,
    setMachineEditAntihuellaOpen,
    setMachineCreateSubtipoOpen,
    setMachineCreateTipoOpen,
    setMachineCreateMotorOpen,
    setMachineCreateSeguroOpen,
    setMachineCreateElevationLibreOpen,
  };
}
