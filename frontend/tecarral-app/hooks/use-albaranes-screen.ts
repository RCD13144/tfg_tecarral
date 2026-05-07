import { useCallback, useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/contexts/auth-context';
import { ApiError } from '@/services/api';
import { firmarAlbaran, getAlbaranDetail, getAlbaranes } from '@/services/albaranes-api';
import type { AuthSession } from '@/types/auth';
import type { AlbaranDetail, AlbaranListItem, AlbaranScreenView } from '@/types/albaran';
import { groupAlbaranes } from '@/utils/albaranes-format';

export function useAlbaranesScreen(session: AuthSession | null, visible: boolean) {
  const { signOut } = useAuth();
  const [view, setView] = useState<AlbaranScreenView>('list');
  const [albaranes, setAlbaranes] = useState<AlbaranListItem[]>([]);
  const [selectedAlbaran, setSelectedAlbaran] = useState<AlbaranDetail | null>(null);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [submittingSignature, setSubmittingSignature] = useState(false);
  const [listFeedback, setListFeedback] = useState<string | null>(null);
  const [detailFeedback, setDetailFeedback] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [unsignedExpanded, setUnsignedExpanded] = useState(true);
  const [signedExpanded, setSignedExpanded] = useState(false);
  const [firmaTecnicoBase64, setFirmaTecnicoBase64] = useState('');
  const [firmaClienteBase64, setFirmaClienteBase64] = useState('');

  const groupedAlbaranes = useMemo(() => groupAlbaranes(albaranes), [albaranes]);

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

  const refreshAlbaranes = useCallback(async () => {
    if (!session?.token) {
      return;
    }

    try {
      setLoadingList(true);
      setListFeedback(null);
      const result = await getAlbaranes(session.token);
      setAlbaranes(result);
    } catch (error) {
      await handleApiError(error, setListFeedback, 'No se pudieron cargar los albaranes.');
    } finally {
      setLoadingList(false);
    }
  }, [handleApiError, session?.token]);

  useEffect(() => {
    if (!visible || !session?.token) {
      return;
    }

    void refreshAlbaranes();
  }, [refreshAlbaranes, session?.token, visible]);

  function resetSignatureFlow() {
    setFirmaTecnicoBase64('');
    setFirmaClienteBase64('');
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
      resetSignatureFlow();

      const detail = await getAlbaranDetail(idAlbaran, session.token);

      setSelectedAlbaran(detail);
      setView(estado === 'FIRMADO' ? 'signedDetail' : 'unsignedDetail');
    } catch (error) {
      await handleApiError(error, setListFeedback, 'No se pudo abrir el albarán.');
    } finally {
      setLoadingDetail(false);
    }
  }

  function goBackToList() {
    setView('list');
    setSelectedAlbaran(null);
    setDetailFeedback(null);
    resetSignatureFlow();
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

      await refreshAlbaranes();
    } catch (error) {
      await handleApiError(error, setDetailFeedback, 'No se pudo firmar el albarán.');
    } finally {
      setSubmittingSignature(false);
    }
  }

  return {
    view,
    albaranes,
    groupedAlbaranes,
    selectedAlbaran,
    loadingList,
    loadingDetail,
    submittingSignature,
    listFeedback,
    detailFeedback,
    successMessage,
    unsignedExpanded,
    signedExpanded,
    hasTecnicoSignature: Boolean(firmaTecnicoBase64),
    hasClienteSignature: Boolean(firmaClienteBase64),
    setUnsignedExpanded,
    setSignedExpanded,
    openAlbaran,
    goBackToList,
    goToUnsignedDetail,
    openTecnicoSignatureStep,
    saveTecnicoSignature,
    saveClienteSignature,
    goToClienteStep,
    goToTecnicoStep,
    submitSignatures,
  };
}
