import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { AlbaranCard } from '@/components/albaranes/albaran-card';
import { AppColors } from '@/constants/theme';
import { albaranesStyles } from '@/styles/albaranes.styles';
import type { AlbaranListItem } from '@/types/albaran';

export function AlbaranSection({
  title,
  countLabel,
  expanded,
  items,
  emptyText,
  onToggle,
  onOpenItem,
}: {
  title: string;
  countLabel: string;
  expanded: boolean;
  items: AlbaranListItem[];
  emptyText: string;
  onToggle: () => void;
  onOpenItem: (item: AlbaranListItem) => void;
}) {
  return (
    <View style={albaranesStyles.sectionCard}>
      <Pressable onPress={onToggle} style={albaranesStyles.sectionHeader}>
        <View style={albaranesStyles.sectionHeaderTextBlock}>
          <Text style={albaranesStyles.sectionTitle}>{title}</Text>
          <Text style={albaranesStyles.sectionCount}>{countLabel}</Text>
        </View>

        <Ionicons
          color={AppColors.primary}
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={22}
        />
      </Pressable>

      {expanded ? (
        <View style={albaranesStyles.sectionBody}>
          {items.length === 0 ? (
            <View style={albaranesStyles.emptyBox}>
              <Text style={albaranesStyles.emptyText}>{emptyText}</Text>
            </View>
          ) : (
            items.map((item) => (
              <AlbaranCard
                key={item.id_albaran}
                albaran={item}
                onPress={() => onOpenItem(item)}
              />
            ))
          )}
        </View>
      ) : null}
    </View>
  );
}
