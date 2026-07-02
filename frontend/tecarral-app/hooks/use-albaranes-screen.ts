import { useCallback, useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/contexts/auth-context';
import { ApiError } from '@/services/api';
import { firmarAlbaran, getAlbaranDetail, getAlbaranes } from '@/services/albaranes-api';
import { getAllRepairBudgets, signRepairBudgetByTecarral } from '@/services/presupuestos-reparacion-api';
import { getAllContracts, signContractByTecarral } from '@/services/service-contracts-api';
import type { AuthSession } from '@/types/auth';
import type { AlbaranDetail, AlbaranListItem, AlbaranScreenView } from '@/types/albaran';
import type { RepairBudgetItem, ServiceContractItem } from '@/types/user';
import { groupAlbaranes } from '@/utils/albaranes-format';

type DocumentCategory = 'albaranes' | 'contratos' | 'presupuestos';

function isContractSigned(contract: ServiceContractItem) {
  return contract.tecarral_signed === true;
}

function isContractUnsigned(contract: ServiceContractItem) {
  return contract.tecarral_signed !== true;
}

function isRepairBudgetSigned(budget: RepairBudgetItem) {
  return Boolean(budget.firmado_tecnico_at) || String(budget.estado ?? '').trim().toUpperCase() !== 'PENDING';
}

function isRepairBudgetUnsigned(budget: RepairBudgetItem) {
  return !budget.firmado_tecnico_at && String(budget.estado ?? '').trim().toUpperCase() === 'PENDING';
}

export function useAlbaranesScreen(session: AuthSession | null, visible: boolean) {
  const { signOut } = useAuth();
  const [view, setView] = useState<AlbaranScreenView>('list');
  const [documentCategory, setDocumentCategory] = useState<DocumentCategory>('albaranes');
  const [albaranes, setAlbaranes] = useState<AlbaranListItem[]>([]);
  const [contracts, setContracts] = useState<ServiceContractItem[]>([]);
  const [repairBudgets, setRepairBudgets] = useState<RepairBudgetItem[]>([]);
  const [selectedAlbaran, setSelectedAlbaran] = useState<AlbaranDetail | null>(null);
  const [selectedContract, setSelectedContract] = useState<ServiceContractItem | null>(null);
  const [selectedRepairBudget, setSelectedRepairBudget] = useState<RepairBudgetItem | null>(null);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [submittingSignature, setSubmittingSignature] = useState(false);
  const [contractSigningSubmitting, setContractSigningSubmitting] = useState(false);
  const [budgetSigningSubmitting, setBudgetSigningSubmitting] = useState(false);
  const [listFeedback, setListFeedback] = useState<string | null>(null);
  const [detailFeedback, setDetailFeedback] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [unsignedExpanded, setUnsignedExpanded] = useState(true);
  const [signedExpanded, setSignedExpanded] = useState(false);
  const [contractUnsignedExpanded, setContractUnsignedExpanded] = useState(true);
  const [contractSignedExpanded, setContractSignedExpanded] = useState(false);
  const [budgetUnsignedExpanded, setBudgetUnsignedExpanded] = useState(true);
  const [budgetSignedExpanded, setBudgetSignedExpanded] = useState(false);
  const [firmaTecnicoBase64, setFirmaTecnicoBase64] = useState('');
  const [firmaClienteBase64, setFirmaClienteBase64] = useState('');

  const groupedAlbaranes = useMemo(() => groupAlbaranes(albaranes), [albaranes]);
  const unsignedContracts = useMemo(() => contracts.filter(isContractUnsigned), [contracts]);
  const signedContracts = useMemo(() => contracts.filter(isContractSigned), [contracts]);
  const unsignedRepairBudgets = useMemo(
    () => repairBudgets.filter(isRepairBudgetUnsigned),
    [repairBudgets]
  );
  const signedRepairBudgets = useMemo(
    () => repairBudgets.filter(isRepairBudgetSigned),
    [repairBudgets]
  );

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

  const refreshDocuments = useCallback(async () => {
    if (!session?.token) {
      return;
    }

    try {
      setLoadingList(true);
      setListFeedback(null);

      const [albaranesResult, contractsResult, budgetsResult] = await Promise.all([
        getAlbaranes(session.token),
        getAllContracts(session.token),
        getAllRepairBudgets(session.token),
      ]);

      setAlbaranes(albaranesResult);
      setContracts(contractsResult);
      setRepairBudgets(budgetsResult);
    } catch (error) {
      await handleApiError(error, setListFeedback, 'No se pudieron cargar los documentos.');
    } finally {
      setLoadingList(false);
    }
  }, [handleApiError, session?.token]);

  useEffect(() => {
    if (!visible || !session?.token) {
      return;
    }

    void refreshDocuments();
  }, [refreshDocuments, session?.token, visible]);

  function resetSignatureFlow() {
    setFirmaTecnicoBase64('');
    setFirmaClienteBase64('');
  }

  function clearSelections() {
    setSelectedAlbaran(null);
    setSelectedContract(null);
    setSelectedRepairBudget(null);
  }

  function selectDocumentCategory(category: DocumentCategory) {
    setDocumentCategory(category);
    setListFeedback(null);
    setSuccessMessage(null);
  }

  async function openAlbaran(idAlbaran: number, estado: AlbaranListItem['estado']) {
    if (!session?.token) {
      return;
    }

    try {
      setLoadingDetail(true);
      setDetailFeedback(null);
      setSuccessMessage(null);
      clearSelections();
      resetSignatureFlow();
      setDocumentCategory('albaranes');

      const detail = await getAlbaranDetail(idAlbaran, session.token);

      setSelectedAlbaran(detail);
      setView(estado === 'FIRMADO' ? 'signedDetail' : 'unsignedDetail');
    } catch (error) {
      await handleApiError(error, setListFeedback, 'No se pudo abrir el albarán.');
    } finally {
      setLoadingDetail(false);
    }
  }

  function openContractDetail(contract: ServiceContractItem) {
    clearSelections();
    setSelectedContract(contract);
    setDetailFeedback(null);
    setSuccessMessage(null);
    resetSignatureFlow();
    setDocumentCategory('contratos');
    setView('contractDetail');
  }

  function startContractSignature() {
    setDetailFeedback(null);
    setView('contractSignature');
  }

  function openRepairBudgetDetail(budget: RepairBudgetItem) {
    clearSelections();
    setSelectedRepairBudget(budget);
    setDetailFeedback(null);
    setSuccessMessage(null);
    setDocumentCategory('presupuestos');
    setView('repairBudgetDetail');
  }

  function startRepairBudgetSignature() {
    setDetailFeedback(null);
    setView('repairBudgetSignature');
  }

  function goBackToRepairBudgetDetail() {
    setView('repairBudgetDetail');
    setDetailFeedback(null);
  }

  function goBackToList() {
    setView('list');
    clearSelections();
    setDetailFeedback(null);
    resetSignatureFlow();
  }

  function goBackToContractDetail() {
    setView('contractDetail');
    setDetailFeedback(null);
  }

  function goToUnsignedDetail() {
    setView('unsignedDetail');
    setDetailFeedback(null);
  }

  function saveTecnicoSignature(signature: string) {
    setFirmaTecnicoBase64(signature);
    setDetailFeedback(null);
  }

  function saveClienteSignature(signature: string) {
    setFirmaClienteBase64(signature);
    setDetailFeedback(null);
  }

  function goToClienteStep(signature = '') {
    const nextSignature = signature || firmaTecnicoBase64;

    if (!nextSignature) {
      setDetailFeedback('Primero firma el empleado de Tecarral.');
      return;
    }

    if (signature) {
      setFirmaTecnicoBase64(signature);
    }

    setView('signatureCliente');
    setDetailFeedback(null);
  }

  function goToTecnicoStep() {
    setView('signatureTecnico');
    setDetailFeedback(null);
  }

  function openTecnicoSignatureStep() {
    setView('signatureTecnico');
    setDetailFeedback(null);
  }

  async function submitSignatures() {
    if (!session?.token || !selectedAlbaran) {
      return;
    }

    if (!firmaTecnicoBase64) {
      setDetailFeedback('Falta la firma del empleado de Tecarral.');
      return;
    }

    if (!firmaClienteBase64) {
      setDetailFeedback('Falta la firma del cliente.');
      return;
    }

    try {
      setSubmittingSignature(true);
      setDetailFeedback(null);
      setSuccessMessage(null);

      const response = await firmarAlbaran(
        selectedAlbaran.id_albaran,
        {
          firma_tecnico_base64: firmaTecnicoBase64,
          firma_cliente_base64: firmaClienteBase64,
          observaciones: selectedAlbaran.observaciones ?? '',
        },
        session.token
      );

      const updatedDetail = await getAlbaranDetail(selectedAlbaran.id_albaran, session.token);

      setSelectedAlbaran(updatedDetail);
      setView('signedDetail');
      setSuccessMessage(
        response.email_sent === false
          ? 'Albarán firmado, pero el email no se pudo enviar.'
          : 'Albarán firmado correctamente.'
      );

      await refreshDocuments();
    } catch (error) {
      await handleApiError(error, setDetailFeedback, 'No se pudo firmar el albarán.');
    } finally {
      setSubmittingSignature(false);
    }
  }

  async function submitContractSignature(signatureBase64: string) {
    if (!session?.token || !selectedContract || !session?.user) {
      return;
    }

    if (!signatureBase64.trim()) {
      setDetailFeedback('Falta la firma de Tecarral.');
      return;
    }

    try {
      setContractSigningSubmitting(true);
      setDetailFeedback(null);
      setSuccessMessage(null);

      await signContractByTecarral(
        selectedContract.id,
        {
          signer_name: session.user.nombre,
          signer_email: session.user.email,
          signature_base64: signatureBase64,
        },
        session.token
      );

      await refreshDocuments();
      setSuccessMessage('Contrato firmado correctamente por Tecarral.');
      setView('list');
      setSelectedContract(null);
    } catch (error) {
      await handleApiError(error, setDetailFeedback, 'No se pudo firmar el contrato.');
    } finally {
      setContractSigningSubmitting(false);
    }
  }

  async function submitRepairBudgetSignature(signatureBase64: string) {
    if (!session?.token || !selectedRepairBudget || !session?.user) {
      return;
    }

    if (!signatureBase64.trim()) {
      setDetailFeedback('Falta la firma de Tecarral.');
      return;
    }

    try {
      setBudgetSigningSubmitting(true);
      setDetailFeedback(null);
      setSuccessMessage(null);

      await signRepairBudgetByTecarral(
        selectedRepairBudget.id,
        {
          signer_name: session.user.nombre,
          signature_base64: signatureBase64,
        },
        session.token
      );

      await refreshDocuments();
      setSuccessMessage('Presupuesto emitido y firmado por Tecarral.');
      setView('list');
      setSelectedRepairBudget(null);
    } catch (error) {
      await handleApiError(error, setDetailFeedback, 'No se pudo firmar el presupuesto.');
    } finally {
      setBudgetSigningSubmitting(false);
    }
  }

  return {
    view,
    documentCategory,
    groupedAlbaranes,
    contracts,
    repairBudgets,
    unsignedContracts,
    signedContracts,
    unsignedRepairBudgets,
    signedRepairBudgets,
    selectedAlbaran,
    selectedContract,
    selectedRepairBudget,
    loadingList,
    loadingDetail,
    submittingSignature,
    contractSigningSubmitting,
    budgetSigningSubmitting,
    listFeedback,
    detailFeedback,
    successMessage,
    unsignedExpanded,
    signedExpanded,
    contractUnsignedExpanded,
    contractSignedExpanded,
    budgetUnsignedExpanded,
    budgetSignedExpanded,
    hasTecnicoSignature: Boolean(firmaTecnicoBase64),
    hasClienteSignature: Boolean(firmaClienteBase64),
    setUnsignedExpanded,
    setSignedExpanded,
    setContractUnsignedExpanded,
    setContractSignedExpanded,
    setBudgetUnsignedExpanded,
    setBudgetSignedExpanded,
    selectDocumentCategory,
    openAlbaran,
    openContractDetail,
    startContractSignature,
    startRepairBudgetSignature,
    openRepairBudgetDetail,
    goBackToList,
    goBackToContractDetail,
    goBackToRepairBudgetDetail,
    goToUnsignedDetail,
    openTecnicoSignatureStep,
    saveTecnicoSignature,
    saveClienteSignature,
    goToClienteStep,
    goToTecnicoStep,
    submitSignatures,
    submitContractSignature,
    submitRepairBudgetSignature,
  };
}

