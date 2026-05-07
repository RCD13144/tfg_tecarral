import { StyleSheet } from 'react-native';

import { AppColors } from '@/constants/theme';

export const albaranesStyles = StyleSheet.create({
  container: {
    paddingTop: 24,
    paddingBottom: 20,
  },
  header: {
    marginBottom: 18,
  },
  headerTitle: {
    color: AppColors.primary,
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  headerText: {
    color: AppColors.text,
    fontSize: 15,
    lineHeight: 22,
  },
  sectionCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: AppColors.primary20,
    backgroundColor: '#F7FBFD',
    marginBottom: 14,
    overflow: 'hidden',
  },
  sectionHeader: {
    minHeight: 56,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionHeaderTextBlock: {
    flex: 1,
    paddingRight: 12,
  },
  sectionTitle: {
    color: AppColors.primary,
    fontSize: 18,
    fontWeight: '700',
  },
  sectionCount: {
    color: AppColors.primary50,
    fontSize: 13,
    marginTop: 4,
  },
  sectionBody: {
    paddingHorizontal: 14,
    paddingBottom: 12,
  },
  emptyBox: {
    paddingVertical: 20,
  },
  emptyText: {
    color: AppColors.primary50,
    textAlign: 'center',
    fontSize: 14,
  },
  albaranCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.primary20,
    backgroundColor: AppColors.background,
    padding: 14,
    marginTop: 10,
  },
  albaranCardTitle: {
    color: AppColors.primary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  albaranCardSubtitle: {
    color: AppColors.primary50,
    fontSize: 13,
    marginBottom: 8,
  },
  albaranCardLine: {
    color: '#111111',
    fontSize: 14,
    lineHeight: 20,
  },
  detailContainer: {
    paddingTop: 14,
    paddingBottom: 24,
  },
  signatureScreenContainer: {
    paddingTop: 14,
    paddingBottom: 120,
  },
  signatureScreenHeader: {
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: AppColors.primary20,
    backgroundColor: AppColors.background,
    padding: 16,
    marginBottom: 16,
  },
  backButton: {
    alignSelf: 'flex-start',
    minHeight: 46,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: AppColors.primary,
    backgroundColor: AppColors.background,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  backButtonText: {
    color: AppColors.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  detailCard: {
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: AppColors.primary20,
    backgroundColor: AppColors.background,
    padding: 16,
  },
  detailTitle: {
    color: AppColors.primary,
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  detailSubtitle: {
    color: AppColors.primary50,
    fontSize: 14,
    marginBottom: 14,
  },
  detailLine: {
    color: '#111111',
    fontSize: 15,
    lineHeight: 23,
  },
  detailLabel: {
    fontWeight: '600',
    color: '#111111',
  },
  detailValue: {
    color: AppColors.primary,
  },
  stepBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: AppColors.primary20,
    marginBottom: 12,
  },
  stepBadgeText: {
    color: AppColors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  signatureBox: {
    height: 250,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: AppColors.primary20,
    overflow: 'hidden',
    backgroundColor: AppColors.background,
    marginTop: 14,
  },
  signatureHint: {
    color: AppColors.text,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 10,
  },
  signatureActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  actionButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: AppColors.primary,
    backgroundColor: AppColors.primary20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    marginTop: 20,
  },
  secondaryButton: {
    backgroundColor: AppColors.background,
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  actionButtonText: {
    color: AppColors.primary,
    fontSize: 15,
    fontWeight: '700',
  },
  feedbackText: {
    color: AppColors.error,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 12,
  },
  successText: {
    color: AppColors.success,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 12,
  },
  loadingText: {
    color: AppColors.text,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 24,
  },
});
