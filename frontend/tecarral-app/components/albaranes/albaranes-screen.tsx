import { useEffect } from 'react';
import { Text } from 'react-native';

import { AlbaranListView } from '@/components/albaranes/albaran-list-view';
import { ContractDetailView } from '@/components/albaranes/contract-detail-view';
import { ContractSignatureView } from '@/components/albaranes/contract-signature-view';
import { RepairBudgetDetailView } from '@/components/albaranes/repair-budget-detail-view';
import { RepairBudgetSignatureView } from '@/components/albaranes/repair-budget-signature-view';
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
  onOpenHelp,
}: {
  session: AuthSession | null;
  visible: boolean;
  onChangeParentScrollEnabled: (enabled: boolean) => void;
  onOpenHelp: () => void;
}) {
  const albaranes = useAlbaranesScreen(session, visible);

  useEffect(() => {
    const isSignatureView =
      albaranes.view === 'signatureTecnico' ||
      albaranes.view === 'signatureCliente' ||
      albaranes.view === 'contractSignature' ||
      albaranes.view === 'repairBudgetSignature';

    onChangeParentScrollEnabled(!isSignatureView);

    return () => {
      onChangeParentScrollEnabled(true);
    };
  }, [albaranes.view, onChangeParentScrollEnabled]);

  if (albaranes.loadingDetail && albaranes.view !== 'list') {
    return <Text style={albaranesStyles.loadingText}>Cargando detalle del documento...</Text>;
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

  if (albaranes.view === 'contractDetail' && albaranes.selectedContract) {
    return (
      <ContractDetailView
        contract={albaranes.selectedContract}
        feedback={albaranes.detailFeedback}
        onBack={albaranes.goBackToList}
        onStartSignature={albaranes.startContractSignature}
      />
    );
  }

  if (albaranes.view === 'contractSignature' && albaranes.selectedContract) {
    return (
      <ContractSignatureView
        contract={albaranes.selectedContract}
        feedback={albaranes.detailFeedback}
        onBack={albaranes.goBackToContractDetail}
        onSubmit={(signature) => void albaranes.submitContractSignature(signature)}
        submitting={albaranes.contractSigningSubmitting}
      />
    );
  }

  if (albaranes.view === 'repairBudgetDetail' && albaranes.selectedRepairBudget) {
    return (
      <RepairBudgetDetailView
        budget={albaranes.selectedRepairBudget}
        onBack={albaranes.goBackToList}
        onStartSignature={albaranes.startRepairBudgetSignature}
      />
    );
  }

  if (albaranes.view === 'repairBudgetSignature' && albaranes.selectedRepairBudget) {
    return (
      <RepairBudgetSignatureView
        budget={albaranes.selectedRepairBudget}
        feedback={albaranes.detailFeedback}
        onBack={albaranes.goBackToRepairBudgetDetail}
        onSubmit={(signature) => void albaranes.submitRepairBudgetSignature(signature)}
        submitting={albaranes.budgetSigningSubmitting}
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
      budgetSignedExpanded={albaranes.budgetSignedExpanded}
      budgetUnsignedExpanded={albaranes.budgetUnsignedExpanded}
      contractSignedExpanded={albaranes.contractSignedExpanded}
      contractUnsignedExpanded={albaranes.contractUnsignedExpanded}
      feedback={albaranes.listFeedback}
      loading={albaranes.loadingList}
      onOpenContract={albaranes.openContractDetail}
      onOpenHelp={onOpenHelp}
      onOpenItem={(item) => void albaranes.openAlbaran(item.id_albaran, item.estado)}
      onOpenRepairBudget={albaranes.openRepairBudgetDetail}
      onSelectCategory={albaranes.selectDocumentCategory}
      onToggleBudgetSigned={() =>
        albaranes.setBudgetSignedExpanded(!albaranes.budgetSignedExpanded)
      }
      onToggleBudgetUnsigned={() =>
        albaranes.setBudgetUnsignedExpanded(!albaranes.budgetUnsignedExpanded)
      }
      onToggleContractSigned={() =>
        albaranes.setContractSignedExpanded(!albaranes.contractSignedExpanded)
      }
      onToggleContractUnsigned={() =>
        albaranes.setContractUnsignedExpanded(!albaranes.contractUnsignedExpanded)
      }
      onToggleSigned={() => albaranes.setSignedExpanded(!albaranes.signedExpanded)}
      onToggleUnsigned={() => albaranes.setUnsignedExpanded(!albaranes.unsignedExpanded)}
      selectedCategory={albaranes.documentCategory}
      signed={albaranes.groupedAlbaranes.signed}
      signedContracts={albaranes.signedContracts}
      signedExpanded={albaranes.signedExpanded}
      signedRepairBudgets={albaranes.signedRepairBudgets}
      successMessage={albaranes.successMessage}
      unsigned={albaranes.groupedAlbaranes.unsigned}
      unsignedContracts={albaranes.unsignedContracts}
      unsignedExpanded={albaranes.unsignedExpanded}
      unsignedRepairBudgets={albaranes.unsignedRepairBudgets}
    />
  );
}
