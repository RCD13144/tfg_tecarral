import { Text } from 'react-native';

import { albaranesStyles } from '@/styles/albaranes.styles';
import { formatDisplayValue } from '@/utils/albaranes-format';

export function AlbaranFieldRow({
  label,
  value,
}: {
  label: string;
  value: unknown;
}) {
  return (
    <Text style={albaranesStyles.detailLine}>
      <Text style={albaranesStyles.detailLabel}>{label}: </Text>
      <Text style={albaranesStyles.detailValue}>{formatDisplayValue(value)}</Text>
    </Text>
  );
}
