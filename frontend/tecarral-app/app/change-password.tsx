import { router } from 'expo-router';
import { useEffect, useState } from 'react';

import { AuthForm } from '@/components/auth/auth-form';
import { useAuth } from '@/contexts/auth-context';
import * as authApi from '@/services/auth-api';
import { ApiError } from '@/services/api';

const LOGIN_ROUTE = '/login' as never;
const HOME_ROUTE = '/home' as never;

export default function ChangePasswordScreen() {
  const { clearFirstAccess, completeSignIn, firstAccess } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!firstAccess) {
      router.replace(LOGIN_ROUTE);
    }
  }, [firstAccess]);

  async function handleSubmit() {
    if (!firstAccess) {
      router.replace(LOGIN_ROUTE);
      return;
    }

    if (!newPassword) {
      setFeedback('Introduce la nueva contraseña.');
      return;
    }

    if (newPassword.length < 6) {
      setFeedback('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (newPassword !== repeatPassword) {
      setFeedback('Las contraseñas no coinciden.');
      return;
    }

    try {
      setIsSubmitting(true);
      setFeedback(null);

      const response = await authApi.changeTemporaryPassword(
        firstAccess.token,
        newPassword
      );

      await completeSignIn({
        token: response.token,
        user: response.user,
      });
      router.replace(HOME_ROUTE);
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 401) {
          clearFirstAccess();
          router.replace(LOGIN_ROUTE);
        }

        setFeedback(error.message);
      } else {
        setFeedback('No se pudo conectar con el servidor.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthForm
      title="Cambiar contraseña"
      fields={[
        {
          label: 'Nueva contraseña',
          value: newPassword,
          onChangeText: setNewPassword,
          secureTextEntry: true,
          textContentType: 'newPassword',
        },
        {
          label: 'Repetir contraseña',
          value: repeatPassword,
          onChangeText: setRepeatPassword,
          secureTextEntry: true,
          textContentType: 'newPassword',
        },
      ]}
      buttonLabel={isSubmitting ? 'Guardando...' : 'Iniciar sesión'}
      disabled={isSubmitting}
      feedback={feedback}
      onSubmit={handleSubmit}
    />
  );
}
