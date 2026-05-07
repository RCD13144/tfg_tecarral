import { Text } from 'react-native';

import { homeStyles } from '@/styles/home.styles';
import { formatDisplayValue } from '@/utils/home-format';

export function FieldRow({
  label,
  value,
}: {
  label: string;
  value: unknown;
}) {
  return (
    <Text style={homeStyles.detailLine}>
      <Text style={homeStyles.detailLabel}>{label}: </Text>
      <Text style={homeStyles.detailValue}>{formatDisplayValue(value)}</Text>
    </Text>
  );
}
