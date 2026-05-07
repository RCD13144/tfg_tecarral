import { Text, View } from 'react-native';

import { ScreenHeader } from '@/components/shared/screen-header';
import { homeStyles } from '@/styles/home.styles';

export function PlaceholderTab({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <View style={homeStyles.placeholderContainer}>
      <ScreenHeader />
      <Text style={homeStyles.placeholderTitle}>{title}</Text>
      <Text style={homeStyles.placeholderText}>{subtitle}</Text>
    </View>
  );
}
