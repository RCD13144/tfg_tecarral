import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { FILTER_DEFINITIONS } from '@/constants/home';
import { AppColors } from '@/constants/theme';
import { homeStyles } from '@/styles/home.styles';
import type { FilterCategoryKey, MachineFilters } from '@/types/maquina';

export function FilterPanel({
  filters,
  onClose,
  onToggle,
}: {
  filters: MachineFilters;
  onClose: () => void;
  onToggle: (category: FilterCategoryKey, value: string) => void;
}) {
  return (
    <View style={homeStyles.filterPanelWrapper}>
      <View style={homeStyles.filterPanel}>
        <Pressable style={homeStyles.filterCloseButton} onPress={onClose}>
          <Ionicons color={AppColors.primary} name="close-circle-outline" size={24} />
        </Pressable>

        {FILTER_DEFINITIONS.map((section) => (
          <View key={section.key} style={homeStyles.filterSection}>
            <Text style={homeStyles.filterSectionTitle}>{section.label}</Text>
            <View style={homeStyles.filterChipRow}>
              {section.options.map((option) => {
                const active = filters[section.key].includes(option.value);

                return (
                  <Pressable
                    key={`${section.key}:${option.value}`}
                    onPress={() => onToggle(section.key, option.value)}
                    style={[homeStyles.filterChip, active && homeStyles.filterChipActive]}>
                    <Text
                      style={[
                        homeStyles.filterChipText,
                        active && homeStyles.filterChipTextActive,
                      ]}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
