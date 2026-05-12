import { StyleSheet } from 'react-native';

import { AppColors } from '@/constants/theme';

export const reparacionesStyles = StyleSheet.create({
  container: {
    paddingTop: 24,
    paddingBottom: 40,
  },
  listBlock: {
    marginTop: 18,
    gap: 12,
  },
  title: {
    color: AppColors.primary,
    fontSize: 25,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    color: AppColors.text,
    fontSize: 14,
    lineHeight: 21,
  },
  feedback: {
    color: AppColors.error,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
  },
  success: {
    color: AppColors.success,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
    fontWeight: '600',
  },
  loadingText: {
    color: AppColors.primary,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
  },
  emptyCard: {
    marginTop: 18,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: AppColors.primary20,
    backgroundColor: '#F7FBFD',
    padding: 16,
  },
  emptyText: {
    color: AppColors.primary,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: AppColors.primary20,
    backgroundColor: '#F7FBFD',
    padding: 14,
  },
  cardHeader: {
    marginBottom: 8,
  },
  cardTitle: {
    color: AppColors.primary,
    fontSize: 18,
    fontWeight: '700',
  },
  cardBadge: {
    alignSelf: 'flex-start',
    marginTop: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: AppColors.primary,
    backgroundColor: AppColors.primary20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  cardBadgeText: {
    color: AppColors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  line: {
    color: '#111111',
    fontSize: 14,
    lineHeight: 22,
  },
  label: {
    fontWeight: '700',
    color: '#111111',
  },
  value: {
    color: AppColors.primary,
  },
  assignmentBlock: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: AppColors.primary20,
    paddingTop: 12,
  },
  finishBlock: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: AppColors.primary20,
    paddingTop: 12,
  },
  assignButton: {
    minHeight: 42,
    borderRadius: 10,
    backgroundColor: AppColors.primary20,
    borderWidth: 1.5,
    borderColor: AppColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginTop: 6,
  },
  assignButtonDisabled: {
    opacity: 0.6,
  },
  assignButtonText: {
    color: AppColors.primary,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  hint: {
    color: AppColors.text,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
  },
  warningText: {
    color: AppColors.error,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
  },
  solutionInput: {
    minHeight: 84,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: AppColors.primary50,
    backgroundColor: AppColors.background,
    color: AppColors.primary,
    paddingHorizontal: 12,
    paddingVertical: 10,
    textAlignVertical: 'top',
    marginTop: 8,
  },
});
