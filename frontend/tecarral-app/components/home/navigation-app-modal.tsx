import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, Text, View } from 'react-native';

import { AppColors } from '@/constants/theme';
import { homeStyles } from '@/styles/home.styles';
import type { NavigationAppOption } from '@/types/home';

export function NavigationAppModal({
  visible,
  apps,
  onClose,
  onOpen,
}: {
  visible: boolean;
  apps: NavigationAppOption[];
  onClose: () => void;
  onOpen: (url: string) => void;
}) {
  return (
    <Modal animationType="fade" transparent visible={visible}>
      <View style={homeStyles.modalOverlay}>
        <View style={homeStyles.navigationModalCard}>
          <View style={homeStyles.datePickerHeader}>
            <Text style={homeStyles.datePickerTitle}>Abrir navegación</Text>
            <Pressable onPress={onClose}>
              <Ionicons color={AppColors.primary} name="close-circle-outline" size={24} />
            </Pressable>
          </View>

          {apps.map((app) => (
            <Pressable
              key={app.key}
              onPress={() => onOpen(app.url)}
              style={homeStyles.navigationOptionButton}>
              <Ionicons color={AppColors.primary} name="navigate-outline" size={18} />
              <Text style={homeStyles.navigationOptionText}>{app.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </Modal>
  );
}
