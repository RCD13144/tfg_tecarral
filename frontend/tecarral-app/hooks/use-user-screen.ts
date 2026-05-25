import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useAuth } from '@/contexts/auth-context';
import { ApiError } from '@/services/api';
import {
  changeMyPassword,
  deactivateUserByAdmin,
  getUsersForAdmin,
  registerUserByAdmin,
  updateMeProfile,
} from '@/services/users-api';
import type { AuthSession } from '@/types/auth';
import type { ChangePasswordForm, CreateUserForm, UserListItem, UserProfileForm } from '@/types/user';
import { isSimpleEmailValid, isSimplePhoneValid, normalizeInputText } from '@/utils/validation';

const EMPTY_CREATE_USER_FORM: CreateUserForm = {
  email: '',
  nombre: '',
  telefono: '',
  role: 'tecnico',
};

const EMPTY_PASSWORD_FORM: ChangePasswordForm = {
  currentPassword: '',
  newPassword: '',
  repeatPassword: '',
};

export function useUserScreen(session: AuthSession | null, visible: boolean) {
  const { signOut, updateSessionUser } = useAuth();
  const clearSuccessTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [profileForm, setProfileForm] = useState<UserProfileForm>({
    telefono: session?.user.telefono ?? '',
  });
  const [profileSubmitting, setProfileSubmitting] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);

  const [passwordForm, setPasswordForm] = useState<ChangePasswordForm>(EMPTY_PASSWORD_FORM);
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  const [createUserForm, setCreateUserForm] = useState<CreateUserForm>(EMPTY_CREATE_USER_FORM);
  const [createUserSubmitting, setCreateUserSubmitting] = useState(false);
  const [createUserFeedback, setCreateUserFeedback] = useState<string | null>(null);
  const [createUserSuccess, setCreateUserSuccess] = useState<string | null>(null);
  const [registeredUserSummary, setRegisteredUserSummary] = useState<{
    nombre: string;
    email: string;
    role: string;
    temporaryPassword: string;
  } | null>(null);

  const [users, setUsers] = useState<UserListItem[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [selectedDeactivateUserId, setSelectedDeactivateUserId] = useState('');
  const [deactivateSubmitting, setDeactivateSubmitting] = useState(false);
  const [deactivateFeedback, setDeactivateFeedback] = useState<string | null>(null);
  const [deactivateSuccess, setDeactivateSuccess] = useState<string | null>(null);
  const [logoutSubmitting, setLogoutSubmitting] = useState(false);

  const isAdmin = String(session?.user.role ?? '').trim().toLowerCase() === 'admin';

  const clearTimedSuccess = useCallback(() => {
    if (clearSuccessTimeoutRef.current) {
      clearTimeout(clearSuccessTimeoutRef.current);
      clearSuccessTimeoutRef.current = null;
    }
  }, []);

  const showTimedSuccess = useCallback(
    (setter: (value: string | null) => void, message: string) => {
      clearTimedSuccess();
      setter(message);
      clearSuccessTimeoutRef.current = setTimeout(() => {
        setter(null);
        clearSuccessTimeoutRef.current = null;
      }, 3500);
    },
    [clearTimedSuccess]
  );

  const handleApiError = useCallback(
    async (
      error: unknown,
      setMessage: (message: string | null) => void,
      fallbackMessage: string
    ) => {
      if (error instanceof ApiError) {
        if (error.status === 401) {
          await signOut();
          router.replace('/');
          return;
        }

        setMessage(error.message);
        return;
      }

      setMessage(fallbackMessage);
    },
    [signOut]
  );

  const loadUsers = useCallback(async () => {
    if (!session?.token || !isAdmin) {
      return;
    }

    try {
      setUsersLoading(true);
      const result = await getUsersForAdmin(session.token);
      setUsers(result);
    } catch (error) {
      await handleApiError(error, setDeactivateFeedback, 'No se pudieron cargar los usuarios.');
    } finally {
      setUsersLoading(false);
    }
  }, [handleApiError, isAdmin, session?.token]);

  useEffect(() => {
    setProfileForm({
      telefono: session?.user.telefono ?? '',
    });
  }, [session?.user.telefono]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    if (isAdmin) {
      void loadUsers();
    }
  }, [isAdmin, loadUsers, visible]);

  useEffect(() => {
    return () => {
      clearTimedSuccess();
    };
  }, [clearTimedSuccess]);

  const activeUsersForDeactivate = users.filter(
    (user) => user.is_active && user.id_user !== session?.user.id_user
  );

  function updateProfileField<K extends keyof UserProfileForm>(key: K, value: UserProfileForm[K]) {
    setProfileForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function updatePasswordField<K extends keyof ChangePasswordForm>(
    key: K,
    value: ChangePasswordForm[K]
  ) {
    setPasswordForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function updateCreateUserField<K extends keyof CreateUserForm>(key: K, value: CreateUserForm[K]) {
    setCreateUserForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function submitProfile() {
    if (!session?.token || !session?.user) {
      return;
    }

    if (!normalizeInputText(profileForm.telefono)) {
      setProfileFeedback('Introduce el teléfono.');
      return;
    }

    if (!isSimplePhoneValid(profileForm.telefono)) {
      setProfileFeedback('El teléfono debe tener 9 caracteres.');
      return;
    }

    if (!profileForm.telefono.trim()) {
      setProfileFeedback('Introduce el telefono.');
      return;
    }

    if (profileForm.telefono.trim().length !== 9) {
      setProfileFeedback('El telefono debe tener 9 caracteres.');
      return;
    }

    try {
      setProfileSubmitting(true);
      setProfileFeedback(null);

      const updatedUser = await updateMeProfile(
        {
          telefono: normalizeInputText(profileForm.telefono),
        },
        session.token
      );

      await updateSessionUser({
        ...session.user,
        ...updatedUser,
      });

      showTimedSuccess(setProfileSuccess, 'Perfil actualizado correctamente.');
    } catch (error) {
      await handleApiError(error, setProfileFeedback, 'No se pudo actualizar el perfil.');
    } finally {
      setProfileSubmitting(false);
    }
  }

  async function submitPasswordChange() {
    if (!session?.token) {
      return;
    }

    if (!passwordForm.currentPassword.trim()) {
      setPasswordFeedback('Introduce la contraseña actual.');
      return;
    }

    if (!passwordForm.newPassword.trim()) {
      setPasswordFeedback('Introduce la nueva contraseña.');
      return;
    }

    if (passwordForm.newPassword.trim().length < 6) {
      setPasswordFeedback('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.repeatPassword) {
      setPasswordFeedback('La repetición de la contraseña no coincide.');
      return;
    }

    try {
      setPasswordSubmitting(true);
      setPasswordFeedback(null);

      await changeMyPassword(
        {
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        },
        session.token
      );

      setPasswordForm(EMPTY_PASSWORD_FORM);
      showTimedSuccess(setPasswordSuccess, 'Contraseña actualizada correctamente.');
    } catch (error) {
      await handleApiError(error, setPasswordFeedback, 'No se pudo cambiar la contraseña.');
    } finally {
      setPasswordSubmitting(false);
    }
  }

  async function submitCreateUser() {
    if (!session?.token || !isAdmin) {
      return;
    }

    if (!normalizeInputText(createUserForm.email)) {
      setCreateUserFeedback('Introduce el email.');
      return;
    }

    if (!isSimpleEmailValid(createUserForm.email)) {
      setCreateUserFeedback('Introduce un email válido.');
      return;
    }

    if (!normalizeInputText(createUserForm.nombre)) {
      setCreateUserFeedback('Introduce el nombre.');
      return;
    }

    if (!normalizeInputText(createUserForm.telefono)) {
      setCreateUserFeedback('Introduce el teléfono.');
      return;
    }

    if (!isSimplePhoneValid(createUserForm.telefono)) {
      setCreateUserFeedback('El teléfono debe tener 9 caracteres.');
      return;
    }

    if (!createUserForm.email.trim()) {
      setCreateUserFeedback('Introduce el email.');
      return;
    }

    if (!createUserForm.email.includes('@')) {
      setCreateUserFeedback('Introduce un email valido.');
      return;
    }

    if (!createUserForm.nombre.trim()) {
      setCreateUserFeedback('Introduce el nombre.');
      return;
    }

    if (!createUserForm.telefono.trim() || createUserForm.telefono.trim().length !== 9) {
      setCreateUserFeedback('El telefono debe tener 9 caracteres.');
      return;
    }

    try {
      setCreateUserSubmitting(true);
      setCreateUserFeedback(null);

      const result = await registerUserByAdmin(
        {
          email: normalizeInputText(createUserForm.email),
          nombre: normalizeInputText(createUserForm.nombre),
          telefono: normalizeInputText(createUserForm.telefono),
          role: createUserForm.role,
        },
        session.token
      );

      setUsers((current) => [result.user, ...current]);
      setCreateUserForm(EMPTY_CREATE_USER_FORM);
      setRegisteredUserSummary({
        nombre: result.user.nombre,
        email: result.user.email,
        role: result.user.role,
        temporaryPassword: result.temporaryPassword,
      });
      showTimedSuccess(setCreateUserSuccess, 'Usuario registrado correctamente.');
    } catch (error) {
      await handleApiError(error, setCreateUserFeedback, 'No se pudo registrar el usuario.');
    } finally {
      setCreateUserSubmitting(false);
    }
  }

  async function submitDeactivateUser() {
    if (!session?.token || !isAdmin) {
      return;
    }

    const idUser = Number(selectedDeactivateUserId);
    if (!Number.isInteger(idUser) || idUser <= 0) {
      setDeactivateFeedback('Selecciona un usuario valido para dar de baja.');
      return;
    }

    try {
      setDeactivateSubmitting(true);
      setDeactivateFeedback(null);

      await deactivateUserByAdmin(idUser, session.token);

      setUsers((current) => current.filter((user) => user.id_user !== idUser));
      setSelectedDeactivateUserId('');
      showTimedSuccess(setDeactivateSuccess, 'Usuario eliminado correctamente.');
    } catch (error) {
      await handleApiError(error, setDeactivateFeedback, 'No se pudo dar de baja al usuario.');
    } finally {
      setDeactivateSubmitting(false);
    }
  }

  async function submitSignOut() {
    try {
      setLogoutSubmitting(true);
      await signOut();
      router.replace('/');
    } finally {
      setLogoutSubmitting(false);
    }
  }

  return {
    isAdmin,
    profileForm,
    profileSubmitting,
    profileFeedback,
    profileSuccess,
    updateProfileField,
    submitProfile,
    passwordForm,
    passwordSubmitting,
    passwordFeedback,
    passwordSuccess,
    updatePasswordField,
    submitPasswordChange,
    createUserForm,
    createUserSubmitting,
    createUserFeedback,
    createUserSuccess,
    registeredUserSummary,
    updateCreateUserField,
    submitCreateUser,
    usersLoading,
    activeUsersForDeactivate,
    selectedDeactivateUserId,
    setSelectedDeactivateUserId,
    deactivateSubmitting,
    deactivateFeedback,
    deactivateSuccess,
    submitDeactivateUser,
    logoutSubmitting,
    submitSignOut,
  };
}
