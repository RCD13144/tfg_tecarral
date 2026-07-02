import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { CLIENT_FILTER_DEFINITIONS, TECARRAL_FILTER_DEFINITIONS } from '@/constants/home';
import { AppColors } from '@/constants/theme';
import { homeStyles } from '@/styles/home.styles';
import type { FilterCategoryKey, InventoryOwnershipType, MachineFilters } from '@/types/maquina';

export function FilterPanel({
  filters,
  onClose,
  onToggle,
  inventoryOwnershipType,
}: {
  filters: MachineFilters;
  onClose: () => void;
  onToggle: (category: FilterCategoryKey, value: string) => void;
  inventoryOwnershipType: InventoryOwnershipType;
}) {
  const definitions = inventoryOwnershipType === 'CLIENTE'
    ? CLIENT_FILTER_DEFINITIONS
    : TECARRAL_FILTER_DEFINITIONS;
  return (
    <View style={homeStyles.filterPanelWrapper}>
      <View style={homeStyles.filterPanel}>
        <Pressable style={homeStyles.filterCloseButton} onPress={onClose}>
          <Ionicons color={AppColors.primary} name="close-circle-outline" size={24} />
        </Pressable>

        {definitions.map((section) => (
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
