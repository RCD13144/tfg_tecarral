import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, View } from 'react-native';

import { AppColors } from '@/constants/theme';
import { screenHeaderStyles } from '@/styles/screen-header.styles';

export function ScreenHeader({ onHelpPress }: { onHelpPress?: () => void }) {
  return (
    <View style={screenHeaderStyles.row}>
      <View style={screenHeaderStyles.sideSlot} />

      <Image
        resizeMode="contain"
        source={require('@/assets/images/tecarral-logo.jpg')}
        style={screenHeaderStyles.logo}
      />

      <View style={screenHeaderStyles.sideSlot}>
        <Pressable onPress={onHelpPress} style={screenHeaderStyles.infoButton}>
          <Ionicons color={AppColors.primary} name="help" size={14} />
        </Pressable>
      </View>
    </View>
  );
}
