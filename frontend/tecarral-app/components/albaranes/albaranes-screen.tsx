import { useEffect } from 'react';
import { Text } from 'react-native';

import { AlbaranListView } from '@/components/albaranes/albaran-list-view';
import { SignatureStepView } from '@/components/albaranes/signature-step-view';
import { SignedAlbaranDetailView } from '@/components/albaranes/signed-albaran-detail-view';
import { UnsignedAlbaranDetailView } from '@/components/albaranes/unsigned-albaran-detail-view';
import { useAlbaranesScreen } from '@/hooks/use-albaranes-screen';
import { albaranesStyles } from '@/styles/albaranes.styles';
import type { AuthSession } from '@/types/auth';

export function AlbaranesScreen({
  session,
  visible,
  onChangeParentScrollEnabled,
}: {
  session: AuthSession | null;
  visible: boolean;
  onChangeParentScrollEnabled: (enabled: boolean) => void;
}) {
  const albaranes = useAlbaranesScreen(session, visible);

  useEffect(() => {
    const isSignatureView =
      albaranes.view === 'signatureTecnico' || albaranes.view === 'signatureCliente';

    onChangeParentScrollEnabled(!isSignatureView);

    return () => {
      onChangeParentScrollEnabled(true);
    };
  }, [albaranes.view, onChangeParentScrollEnabled]);

  if (albaranes.loadingDetail && albaranes.view !== 'list') {
    return <Text style={albaranesStyles.loadingText}>Cargando detalle del albarán...</Text>;
  }

  if (albaranes.view === 'unsignedDetail' && albaranes.selectedAlbaran) {
    return (
      <UnsignedAlbaranDetailView
        albaran={albaranes.selectedAlbaran}
        feedback={albaranes.detailFeedback}
        onBack={albaranes.goBackToList}
        onStartSignature={albaranes.openTecnicoSignatureStep}
      />
    );
  }

  if (albaranes.view === 'signatureTecnico' && albaranes.selectedAlbaran) {
    return (
      <SignatureStepView
        albaran={albaranes.selectedAlbaran}
        feedback={albaranes.detailFeedback}
        hasSignature={albaranes.hasTecnicoSignature}
        onBack={albaranes.goToUnsignedDetail}
        onAdvance={albaranes.goToClienteStep}
        onSaveSignature={albaranes.saveTecnicoSignature}
        step="tecnico"
        submitting={false}
      />
    );
  }

  if (albaranes.view === 'signatureCliente' && albaranes.selectedAlbaran) {
    return (
      <SignatureStepView
        albaran={albaranes.selectedAlbaran}
        feedback={albaranes.detailFeedback}
        hasSignature={albaranes.hasClienteSignature}
        onBack={albaranes.goToTecnicoStep}
        onAdvance={() => undefined}
        onSaveSignature={albaranes.saveClienteSignature}
        onSubmit={() => void albaranes.submitSignatures()}
        step="cliente"
        submitting={albaranes.submittingSignature}
      />
    );
  }

  if (albaranes.view === 'signedDetail' && albaranes.selectedAlbaran) {
    return (
      <SignedAlbaranDetailView
        albaran={albaranes.selectedAlbaran}
        feedback={albaranes.detailFeedback}
        onBack={albaranes.goBackToList}
        successMessage={albaranes.successMessage}
      />
    );
  }

  return (
    <AlbaranListView
      feedback={albaranes.listFeedback}
      loading={albaranes.loadingList}
      onOpenItem={(item) => void albaranes.openAlbaran(item.id_albaran, item.estado)}
      onToggleSigned={() => albaranes.setSignedExpanded(!albaranes.signedExpanded)}
      onToggleUnsigned={() => albaranes.setUnsignedExpanded(!albaranes.unsignedExpanded)}
      signed={albaranes.groupedAlbaranes.signed}
      signedExpanded={albaranes.signedExpanded}
      unsigned={albaranes.groupedAlbaranes.unsigned}
      unsignedExpanded={albaranes.unsignedExpanded}
    />
  );
}
