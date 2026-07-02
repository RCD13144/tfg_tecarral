import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { SignaturePad } from '@/components/albaranes/signature-pad';
import { AppColors } from '@/constants/theme';
import { albaranesStyles } from '@/styles/albaranes.styles';
import type { RepairBudgetItem } from '@/types/user';

export function RepairBudgetSignatureView({
  budget,
  feedback,
  submitting,
  onBack,
  onSubmit,
}: {
  budget: RepairBudgetItem;
  feedback: string | null;
  submitting: boolean;
  onBack: () => void;
  onSubmit: (signature: string) => void;
}) {
  return (
    <View style={albaranesStyles.signatureScreenContainer}>
      <Pressable onPress={onBack} style={albaranesStyles.backButton}>
        <Ionicons color={AppColors.primary} name="arrow-back" size={18} />
        <Text style={albaranesStyles.backButtonText}>Volver al presupuesto</Text>
      </Pressable>

      <View style={albaranesStyles.signatureScreenHeader}>
        <View style={albaranesStyles.stepBadge}>
          <Text style={albaranesStyles.stepBadgeText}>Firma Tecarral</Text>
        </View>
        <Text style={albaranesStyles.detailTitle}>
          Presupuesto {budget.document_number ?? `#${budget.id}`}
        </Text>
        <Text style={albaranesStyles.detailSubtitle}>{budget.cliente ?? 'Cliente'}</Text>
        <Text style={albaranesStyles.compactSummaryText}>
          Al continuar se emitirá el PDF oficial y se enviará al cliente para aceptar o rechazar.
        </Text>
      </View>

      <SignaturePad
        continueLabel={submitting ? 'Guardando...' : 'Emitir presupuesto'}
        disabled={submitting}
        hint="Firma aquí y pulsa continuar para emitir el presupuesto formal."
        onContinue={onSubmit}
        onSave={() => undefined}
        title="Espacio de firma"
      />

      {feedback ? <Text style={albaranesStyles.feedbackText}>{feedback}</Text> : null}
    </View>
  );
}
