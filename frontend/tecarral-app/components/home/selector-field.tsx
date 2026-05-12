import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import type { StyleProp, TextStyle } from 'react-native';

import { AppColors } from '@/constants/theme';
import { homeStyles } from '@/styles/home.styles';

export function SelectorField({
  label,
  valueLabel,
  options,
  isOpen,
  onToggleOpen,
  onSelect,
  disabled = false,
  labelStyle,
}: {
  label: string;
  valueLabel: string;
  options: { label: string; value: string }[];
  isOpen: boolean;
  onToggleOpen: () => void;
  onSelect: (value: string) => void;
  disabled?: boolean;
  labelStyle?: StyleProp<TextStyle>;
}) {
  return (
    <View style={homeStyles.selectorBlock}>
      <Text style={homeStyles.detailLine}>
        <Text style={[homeStyles.detailLabel, labelStyle]}>{label}: </Text>
      </Text>
      <Pressable
        disabled={disabled}
        onPress={onToggleOpen}
        style={[homeStyles.selectorButton, disabled && homeStyles.selectorButtonDisabled]}>
        <Text style={homeStyles.selectorButtonText}>{valueLabel}</Text>
        <Ionicons
          color={AppColors.primary}
          name={isOpen ? 'chevron-up' : 'chevron-down'}
          size={18}
        />
      </Pressable>

      {isOpen ? (
        <View style={homeStyles.selectorList}>
          {options.map((option) => (
            <Pressable
              key={`${label}:${option.value}`}
              onPress={() => onSelect(option.value)}
              style={homeStyles.selectorListItem}>
              <Text style={homeStyles.selectorListItemText}>{option.label}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}
