import { StyleSheet } from 'react-native';

import { AppColors } from '@/constants/theme';

export const screenHeaderStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  sideSlot: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 190,
    height: 54,
  },
  infoButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.25,
    borderColor: AppColors.primary50,
    backgroundColor: AppColors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
