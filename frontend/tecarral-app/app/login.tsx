import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AuthForm } from '@/components/auth/auth-form';
import { useAuth } from '@/contexts/auth-context';
import { AppColors } from '@/constants/theme';
import * as authApi from '@/services/auth-api';
import { ApiError } from '@/services/api';

const HOME_ROUTE = '/home' as never;
const CHANGE_PASSWORD_ROUTE = '/change-password' as never;

export default function LoginScreen() {
  const { completeSignIn, isHydrating, session, startFirstAccess } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!isHydrating && session) {
      router.replace(HOME_ROUTE);
    }
  }, [isHydrating, session]);

  async function handleLogin() {
    const normalizedEmail = email.trim();

    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      setFeedback('Introduce un email válido.');
      return;
    }

    if (!password) {
      setFeedback('Introduce tu contraseña.');
      return;
    }

    try {
      setIsSubmitting(true);
      setFeedback(null);

      const response = await authApi.login(normalizedEmail, password);

      if (response.must_change_password) {
        startFirstAccess({
          token: response.first_access_token,
          user: response.user,
        });
        router.replace(CHANGE_PASSWORD_ROUTE);
        return;
      }

      await completeSignIn({
        token: response.token,
        user: response.user,
      });
      router.replace(HOME_ROUTE);
    } catch (error) {
      if (error instanceof ApiError) {
        setFeedback(error.message);
      } else if (error instanceof Error && error.message.trim().length > 0) {
        setFeedback(`No se pudo conectar con el servidor. ${error.message}`);
      } else {
        setFeedback('No se pudo conectar con el servidor.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isHydrating) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={AppColors.primary} size="large" />
      </View>
    );
  }

  return (
    <AuthForm
      title="Inicio de sesión"
      fields={[
        {
          label: 'Email',
          value: email,
          onChangeText: setEmail,
          keyboardType: 'email-address',
          textContentType: 'emailAddress',
        },
        {
          label: 'Contraseña',
          value: password,
          onChangeText: setPassword,
          secureTextEntry: true,
          textContentType: 'password',
        },
      ]}
      buttonLabel={isSubmitting ? 'Validando...' : 'Iniciar sesión'}
      disabled={isSubmitting}
      feedback={feedback}
      onSubmit={handleLogin}
    />
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.background,
  },
});
