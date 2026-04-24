import { Platform } from 'react-native';

export const AppColors = {
  primary: '#004B96',
  secondary: '#57A9BF',
  primary50: 'rgba(0, 75, 150, 0.5)',
  secondary65: 'rgba(87, 169, 191, 0.65)',
  primary20: 'rgba(0, 75, 150, 0.2)',
  background: '#FFFFFF',
  text: '#004B96',
  inputText: '#00386F',
  error: '#B42318',
  success: '#0F8A5F',
} as const;

export const Colors = {
  light: {
    text: AppColors.text,
    background: AppColors.background,
    tint: AppColors.primary,
    icon: AppColors.primary50,
    tabIconDefault: AppColors.primary50,
    tabIconSelected: AppColors.primary,
  },
  dark: {
    text: AppColors.text,
    background: AppColors.background,
    tint: AppColors.primary,
    icon: AppColors.primary50,
    tabIconDefault: AppColors.primary50,
    tabIconSelected: AppColors.primary,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
