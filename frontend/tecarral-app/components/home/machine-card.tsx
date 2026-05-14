import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { Pressable, Text, View } from 'react-native';

import { AppColors } from '@/constants/theme';
import { homeStyles } from '@/styles/home.styles';
import type { Maquina } from '@/types/maquina';
import { formatMachineName, getMachineImageSource } from '@/utils/home-format';

export function MachineCard({
  item,
  width,
  onPress,
}: {
  item: Maquina;
  width: number;
  onPress: () => void;
}) {
  const imageSource = getMachineImageSource(item);
  const hasBackgroundImage = item.image_has_background === true;

  return (
    <Pressable onPress={onPress} style={[homeStyles.machineCard, { width }]}>
      <View style={homeStyles.machineMedia}>
        {imageSource ? (
          hasBackgroundImage ? (
            <View style={homeStyles.machineImageFrame}>
              <ExpoImage contentFit="contain" source={imageSource} style={homeStyles.machineImage} />
            </View>
          ) : (
            <ExpoImage contentFit="contain" source={imageSource} style={homeStyles.machineImage} />
          )
        ) : (
          <Ionicons color={AppColors.primary50} name="image-outline" size={34} />
        )}
      </View>
      <View style={homeStyles.machineInfo}>
        <Text numberOfLines={2} style={homeStyles.machineLine}>
          <Text style={homeStyles.machineLabel}>Nombre: </Text>
          {formatMachineName(item)}
        </Text>
        <Text numberOfLines={1} style={homeStyles.machineLine}>
          <Text style={homeStyles.machineLabel}>Marca: </Text>
          {String(item.marca ?? '-')}
        </Text>
        <Text numberOfLines={1} style={homeStyles.machineLine}>
          <Text style={homeStyles.machineLabel}>Ubicacion: </Text>
          {String(item.ubicacion_tipo ?? '-')}
        </Text>
        <Text numberOfLines={1} style={homeStyles.machineLine}>
          <Text style={homeStyles.machineLabel}>Modelo: </Text>
          {String(item.modelo ?? '-')}
        </Text>
      </View>
    </Pressable>
  );
}
