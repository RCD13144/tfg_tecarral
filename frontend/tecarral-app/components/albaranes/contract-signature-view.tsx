import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { SignaturePad } from '@/components/albaranes/signature-pad';
import { AppColors } from '@/constants/theme';
import { albaranesStyles } from '@/styles/albaranes.styles';
import type { ServiceContractItem } from '@/types/user';

function getContractTypeLabel(value: ServiceContractItem['contract_type']) {
  return value === 'TODO_INCLUIDO' ? 'Todo incluido' : 'Preventivo';
}

export function ContractSignatureView({
  contract,
  feedback,
  submitting,
  onBack,
  onSubmit,
}: {
  contract: ServiceContractItem;
  feedback: string | null;
  submitting: boolean;
  onBack: () => void;
  onSubmit: (signature: string) => void;
}) {
  return (
    <View style={albaranesStyles.signatureScreenContainer}>
      <Pressable onPress={onBack} style={albaranesStyles.backButton}>
        <Ionicons color={AppColors.primary} name="arrow-back" size={18} />
        <Text style={albaranesStyles.backButtonText}>Volver al contrato</Text>
      </Pressable>

      <View style={albaranesStyles.signatureScreenHeader}>
        <View style={albaranesStyles.stepBadge}>
          <Text style={albaranesStyles.stepBadgeText}>Paso 2 · Firma Tecarral</Text>
        </View>
        <Text style={albaranesStyles.detailTitle}>Contrato #{contract.id}</Text>
        <Text style={albaranesStyles.detailSubtitle}>{contract.cliente_nombre}</Text>
        <Text style={albaranesStyles.compactSummaryText}>
          {getContractTypeLabel(contract.contract_type)} · Máquina #{contract.id_maquina}
        </Text>
      </View>

      <SignaturePad
        continueLabel={submitting ? 'Guardando...' : 'Continuar'}
        disabled={submitting}
        hint="Firma aquí y pulsa continuar para completar la firma de Tecarral."
        onContinue={onSubmit}
        onSave={() => undefined}
        title="Espacio de firma"
      />

      {feedback ? <Text style={albaranesStyles.feedbackText}>{feedback}</Text> : null}
    </View>
  );
}
