import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { AlbaranFieldRow } from '@/components/albaranes/albaran-field-row';
import { AppColors } from '@/constants/theme';
import { albaranesStyles } from '@/styles/albaranes.styles';
import type { AlbaranDetail } from '@/types/albaran';
import { getAlbaranSubtitle, getAlbaranTitle } from '@/utils/albaranes-format';

export function UnsignedAlbaranDetailView({
  albaran,
  feedback,
  onBack,
  onStartSignature,
}: {
  albaran: AlbaranDetail;
  feedback: string | null;
  onBack: () => void;
  onStartSignature: () => void;
}) {
  return (
    <View style={albaranesStyles.detailContainer}>
      <Pressable onPress={onBack} style={albaranesStyles.backButton}>
        <Ionicons color={AppColors.primary} name="arrow-back" size={18} />
        <Text style={albaranesStyles.backButtonText}>Volver a albaranes</Text>
      </Pressable>

      <View style={albaranesStyles.detailCard}>
        <View style={albaranesStyles.stepBadge}>
          <Text style={albaranesStyles.stepBadgeText}>Resumen previo a la firma</Text>
        </View>

        <Text style={albaranesStyles.detailTitle}>{getAlbaranTitle(albaran)}</Text>
        <Text style={albaranesStyles.detailSubtitle}>{getAlbaranSubtitle(albaran)}</Text>

        <AlbaranFieldRow label="Estado" value={albaran.estado} />
        <AlbaranFieldRow label="Máquina" value={`#${albaran.id_maquina}`} />
        <AlbaranFieldRow label="Marca" value={albaran.marca} />
        <AlbaranFieldRow label="Modelo" value={albaran.modelo} />
        <AlbaranFieldRow label="Nº de serie" value={albaran.ns} />
        <AlbaranFieldRow label="Cliente" value={albaran.cliente} />
        <AlbaranFieldRow label="Dirección" value={albaran.direccion} />
        <AlbaranFieldRow label="Población" value={albaran.poblacion} />
        <AlbaranFieldRow label="Teléfono" value={albaran.telefono} />
        <AlbaranFieldRow label="Email cliente" value={albaran.email_cliente} />
        <AlbaranFieldRow label="Observaciones" value={albaran.observaciones} />

        <Text style={albaranesStyles.signatureHint}>
          Cuando pulses el botón pasarás a una pantalla dedicada para la firma del empleado de
          Tecarral.
        </Text>

        <Pressable onPress={onStartSignature} style={albaranesStyles.actionButton}>
          <Text style={albaranesStyles.actionButtonText}>Empezar firma</Text>
        </Pressable>

        {feedback ? <Text style={albaranesStyles.feedbackText}>{feedback}</Text> : null}
      </View>
    </View>
  );
}
