import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { AlbaranFieldRow } from '@/components/albaranes/albaran-field-row';
import { AppColors } from '@/constants/theme';
import { albaranesStyles } from '@/styles/albaranes.styles';
import type { AlbaranDetail } from '@/types/albaran';
import {
  formatAlbaranDate,
  getAlbaranSubtitle,
  getAlbaranTitle,
} from '@/utils/albaranes-format';

export function SignedAlbaranDetailView({
  albaran,
  feedback,
  successMessage,
  onBack,
}: {
  albaran: AlbaranDetail;
  feedback: string | null;
  successMessage: string | null;
  onBack: () => void;
}) {
  return (
    <View style={albaranesStyles.detailContainer}>
      <Pressable onPress={onBack} style={albaranesStyles.backButton}>
        <Ionicons color={AppColors.primary} name="arrow-back" size={18} />
        <Text style={albaranesStyles.backButtonText}>Volver a albaranes</Text>
      </Pressable>

      <View style={albaranesStyles.detailCard}>
        <Text style={albaranesStyles.detailTitle}>{getAlbaranTitle(albaran)}</Text>
        <Text style={albaranesStyles.detailSubtitle}>{getAlbaranSubtitle(albaran)}</Text>

        <AlbaranFieldRow label="Estado" value={albaran.estado} />
        <AlbaranFieldRow label="Fecha firma" value={formatAlbaranDate(albaran.firmado_at)} />
        <AlbaranFieldRow label="Máquina" value={`#${albaran.id_maquina}`} />
        <AlbaranFieldRow label="Marca" value={albaran.marca} />
        <AlbaranFieldRow label="Modelo" value={albaran.modelo} />
        <AlbaranFieldRow label="Nº de serie" value={albaran.ns} />
        <AlbaranFieldRow label="Cliente" value={albaran.cliente} />
        <AlbaranFieldRow label="Email cliente" value={albaran.email_cliente} />
        <AlbaranFieldRow label="Teléfono" value={albaran.telefono} />
        <AlbaranFieldRow label="Dirección" value={albaran.direccion} />
        <AlbaranFieldRow label="Población" value={albaran.poblacion} />
        <AlbaranFieldRow label="CP" value={albaran.cp} />
        <AlbaranFieldRow label="Propuesta alquiler" value={albaran.propuesta_alquiler_id} />
        <AlbaranFieldRow label="Observaciones" value={albaran.observaciones} />

        {feedback ? <Text style={albaranesStyles.feedbackText}>{feedback}</Text> : null}
        {successMessage ? <Text style={albaranesStyles.successText}>{successMessage}</Text> : null}
      </View>
    </View>
  );
}
