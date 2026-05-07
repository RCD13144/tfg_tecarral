import { router } from 'expo-router';
import { useEffect } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { useAuth } from '@/contexts/auth-context';
import { AppColors } from '@/constants/theme';

const HOME_ROUTE = '/home' as never;
const CHANGE_PASSWORD_ROUTE = '/change-password' as never;
const LOGIN_ROUTE = '/login' as never;

export default function SplashScreen() {
  const { firstAccess, isHydrating, session } = useAuth();

  useEffect(() => {
    if (isHydrating) {
      return;
    }

    const timeoutId = setTimeout(() => {
      if (session) {
        router.replace(HOME_ROUTE);
        return;
      }

      if (firstAccess) {
        router.replace(CHANGE_PASSWORD_ROUTE);
        return;
      }

      router.replace(LOGIN_ROUTE);
    }, 1200);

    return () => clearTimeout(timeoutId);
  }, [firstAccess, isHydrating, session]);

  return (
    <View style={styles.container}>
      <Image
        source={require('@/assets/images/tecarral-logo.jpg')}
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.background,
  },
  logo: {
    width: 270,
    height: 90,
  },
});
