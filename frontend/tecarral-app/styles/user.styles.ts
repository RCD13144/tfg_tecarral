import { StyleSheet } from 'react-native';

import { AppColors } from '@/constants/theme';

export const userStyles = StyleSheet.create({
  container: {
    paddingTop: 24,
    paddingBottom: 40,
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
    marginBottom: 18,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: AppColors.primary20,
    backgroundColor: '#F7FBFD',
    padding: 14,
    marginBottom: 14,
  },
  cardTitle: {
    color: AppColors.primary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
  },
  line: {
    color: '#111111',
    fontSize: 15,
    lineHeight: 23,
    marginBottom: 4,
  },
  label: {
    color: '#111111',
    fontWeight: '700',
  },
  value: {
    color: AppColors.primary,
  },
  readonlyHint: {
    color: AppColors.text,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 10,
  },
  inputLabel: {
    color: AppColors.primary,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: AppColors.primary50,
    backgroundColor: AppColors.background,
    color: AppColors.inputText,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  feedback: {
    color: AppColors.error,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 10,
  },
  success: {
    color: AppColors.success,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: '600',
  },
  temporaryPasswordBox: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.primary,
    backgroundColor: AppColors.background,
    padding: 12,
    marginTop: 10,
  },
  temporaryPasswordText: {
    color: AppColors.primary,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 6,
  },
  sectionTitle: {
    color: AppColors.primary,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 10,
  },
  actionButton: {
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 6,
  },
  registerButton: {
    backgroundColor: AppColors.primary20,
    borderColor: AppColors.primary,
  },
  logoutButton: {
    backgroundColor: AppColors.background,
    borderColor: AppColors.primary,
  },
  deactivateButton: {
    backgroundColor: 'rgba(180, 35, 24, 0.12)',
    borderColor: AppColors.error,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  registerButtonText: {
    color: AppColors.primary,
  },
  logoutButtonText: {
    color: AppColors.primary,
  },
  deactivateButtonText: {
    color: AppColors.error,
  },
  listHint: {
    color: AppColors.text,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
  },
});
