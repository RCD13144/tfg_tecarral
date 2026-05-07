import { Ionicons } from '@expo/vector-icons';
import { Animated, Pressable, View } from 'react-native';

import { TAB_ICON_SIZE, TAB_KEYS } from '@/constants/home';
import { AppColors } from '@/constants/theme';
import { homeStyles } from '@/styles/home.styles';
import type { HomeTabKey } from '@/types/maquina';

export function HomeBottomTabBar({
  activeTab,
  tabBarWidth,
  tabSlotWidth,
  indicatorWidth,
  indicatorTranslateX,
  onSelectTab,
}: {
  activeTab: HomeTabKey;
  tabBarWidth: number;
  tabSlotWidth: number;
  indicatorWidth: number;
  indicatorTranslateX: Animated.Value;
  onSelectTab: (tab: HomeTabKey) => void;
}) {
  return (
    <View style={[homeStyles.tabBar, { width: tabBarWidth }]}>
      <Animated.View
        style={[
          homeStyles.tabIndicator,
          {
            width: indicatorWidth,
            transform: [{ translateX: indicatorTranslateX }],
          },
        ]}
      />

      {TAB_KEYS.map((tab) => {
        const iconName =
          tab === 'home'
            ? 'home-outline'
            : tab === 'albaran'
              ? 'document-text-outline'
              : tab === 'reparacion'
                ? 'settings-outline'
                : 'person-outline';
        const active = activeTab === tab;

        return (
          <Pressable
            key={tab}
            onPress={() => onSelectTab(tab)}
            style={[homeStyles.tabButton, { width: tabSlotWidth }]}>
            <Ionicons
              color={active ? AppColors.primary : '#111111'}
              name={iconName}
              size={TAB_ICON_SIZE}
            />
          </Pressable>
        );
      })}
    </View>
  );
}
