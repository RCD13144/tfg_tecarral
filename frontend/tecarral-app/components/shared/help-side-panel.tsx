import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

import { AppColors } from '@/constants/theme';
import { helpSidePanelStyles } from '@/styles/help-side-panel.styles';

export function HelpSidePanel({
  visible,
  title,
  subtitle,
  items,
  onClose,
}: {
  visible: boolean;
  title: string;
  subtitle: string;
  items: string[];
  onClose: () => void;
}) {
  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <View style={helpSidePanelStyles.overlay}>
        <Pressable onPress={onClose} style={helpSidePanelStyles.backdrop} />

        <View style={helpSidePanelStyles.panel}>
          <View style={helpSidePanelStyles.header}>
            <View style={helpSidePanelStyles.headerTextBlock}>
              <Text style={helpSidePanelStyles.title}>{title}</Text>
              <Text style={helpSidePanelStyles.subtitle}>{subtitle}</Text>
            </View>

            <Pressable onPress={onClose} style={helpSidePanelStyles.closeButton}>
              <Ionicons color={AppColors.primary} name="close" size={18} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={helpSidePanelStyles.content}
            showsVerticalScrollIndicator={false}>
            {items.map((item) => (
              <View key={item} style={helpSidePanelStyles.itemRow}>
                <View style={helpSidePanelStyles.bullet} />
                <Text style={helpSidePanelStyles.itemText}>{item}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
