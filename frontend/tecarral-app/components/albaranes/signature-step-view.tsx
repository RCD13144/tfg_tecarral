import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { SignaturePad } from '@/components/albaranes/signature-pad';
import { AppColors } from '@/constants/theme';
import { albaranesStyles } from '@/styles/albaranes.styles';
import type { AlbaranDetail, SignatureStep } from '@/types/albaran';
import { getAlbaranTitle } from '@/utils/albaranes-format';

export function SignatureStepView({
  albaran,
  step,
  hasSignature,
  feedback,
  submitting,
  onBack,
  onSaveSignature,
  onAdvance,
  onSubmit,
}: {
  albaran: AlbaranDetail;
  step: SignatureStep;
  hasSignature: boolean;
  feedback: string | null;
  submitting: boolean;
  onBack: () => void;
  onSaveSignature: (signature: string) => void;
  onAdvance: (signature: string) => void;
  onSubmit?: () => void;
}) {
  const isTecnicoStep = step === 'tecnico';

  return (
    <View style={albaranesStyles.signatureScreenContainer}>
      <Pressable onPress={onBack} style={albaranesStyles.backButton}>
        <Ionicons color={AppColors.primary} name="arrow-back" size={18} />
        <Text style={albaranesStyles.backButtonText}>
          {isTecnicoStep ? 'Volver al detalle' : 'Volver a firma Tecarral'}
        </Text>
      </Pressable>

      <View style={albaranesStyles.signatureScreenHeader}>
        <View style={albaranesStyles.stepBadge}>
          <Text style={albaranesStyles.stepBadgeText}>
            {isTecnicoStep ? 'Paso 1 · Firma Tecarral' : 'Paso 2 · Firma cliente'}
          </Text>
        </View>
        <Text style={albaranesStyles.detailTitle}>{getAlbaranTitle(albaran)}</Text>
      </View>

      <SignaturePad
        key={step}
        continueLabel={isTecnicoStep ? 'Pasar a firma cliente' : 'Guardar firma cliente'}
        hint=""
        onContinue={(signature) => onAdvance(signature)}
        onSave={onSaveSignature}
        title={isTecnicoStep ? 'Firma del empleado' : 'Firma del cliente'}
      />

      {feedback ? <Text style={albaranesStyles.feedbackText}>{feedback}</Text> : null}

      {!isTecnicoStep ? (
        <Pressable
          disabled={!hasSignature || submitting}
          onPress={onSubmit}
          style={[
            albaranesStyles.actionButton,
            (!hasSignature || submitting) && albaranesStyles.actionButtonDisabled,
          ]}>
          <Text style={albaranesStyles.actionButtonText}>
            {submitting ? 'Firmando...' : 'Firmar albarán'}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
