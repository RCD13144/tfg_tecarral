import { Pressable, Text, View } from 'react-native';

import { albaranesStyles } from '@/styles/albaranes.styles';
import type { AlbaranListItem } from '@/types/albaran';
import {
  formatAlbaranDate,
  getAlbaranSubtitle,
  getAlbaranTitle,
} from '@/utils/albaranes-format';

export function AlbaranCard({
  albaran,
  onPress,
}: {
  albaran: AlbaranListItem;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={albaranesStyles.albaranCard}>
      <Text style={albaranesStyles.albaranCardTitle}>{getAlbaranTitle(albaran)}</Text>
      <Text style={albaranesStyles.albaranCardSubtitle}>{getAlbaranSubtitle(albaran)}</Text>
      <View>
        <Text style={albaranesStyles.albaranCardLine}>Máquina #{albaran.id_maquina}</Text>
        <Text style={albaranesStyles.albaranCardLine}>Estado: {albaran.estado}</Text>
        <Text style={albaranesStyles.albaranCardLine}>
          Fecha firma: {formatAlbaranDate(albaran.firmado_at)}
        </Text>
      </View>
    </Pressable>
  );
}
