import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
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
  initialVisibleCount,
}: {
  title: string;
  countLabel: string;
  expanded: boolean;
  items: AlbaranListItem[];
  emptyText: string;
  onToggle: () => void;
  onOpenItem: (item: AlbaranListItem) => void;
  initialVisibleCount?: number;
}) {
  const pageSize = initialVisibleCount ?? 4;
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const visibleItems = useMemo(
    () => items.slice(0, visibleCount),
    [items, visibleCount]
  );
  const hiddenCount = Math.max(0, items.length - visibleItems.length);
  const canShowLess = visibleCount > pageSize;

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
            <>
              {visibleItems.map((item) => (
                <AlbaranCard
                  key={item.id_albaran}
                  albaran={item}
                  onPress={() => onOpenItem(item)}
                />
              ))}
              {hiddenCount > 0 ? (
                <Pressable
                  onPress={() => setVisibleCount((current) => Math.min(items.length, current + pageSize))}
                  style={albaranesStyles.showMoreButton}>
                  <Text style={albaranesStyles.showMoreButtonText}>Ver más ({Math.min(pageSize, hiddenCount)})</Text>
                </Pressable>
              ) : null}
              {canShowLess ? (
                <Pressable onPress={() => setVisibleCount(pageSize)} style={albaranesStyles.showMoreButton}>
                  <Text style={albaranesStyles.showMoreButtonText}>Ver menos</Text>
                </Pressable>
              ) : null}
            </>
          )}
        </View>
      ) : null}
    </View>
  );
}
