import { StyleSheet } from 'react-native';

import { AppColors } from '@/constants/theme';

export const helpSidePanelStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.18)',
  },
  backdrop: {
    flex: 1,
  },
  panel: {
    width: '78%',
    maxWidth: 360,
    backgroundColor: '#F7FBFD',
    borderLeftWidth: 1.5,
    borderLeftColor: AppColors.primary20,
    paddingTop: 54,
    paddingHorizontal: 18,
    paddingBottom: 28,
    shadowColor: '#000000',
    shadowOpacity: 0.14,
    shadowRadius: 16,
    shadowOffset: { width: -4, height: 0 },
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 18,
    gap: 10,
  },
  headerTextBlock: {
    flex: 1,
  },
  title: {
    color: AppColors.primary,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 6,
  },
  subtitle: {
    color: AppColors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: AppColors.primary20,
    backgroundColor: AppColors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingBottom: 16,
    gap: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  bullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: AppColors.secondary,
    marginTop: 7,
  },
  itemText: {
    flex: 1,
    color: AppColors.text,
    fontSize: 14,
    lineHeight: 21,
  },
});
