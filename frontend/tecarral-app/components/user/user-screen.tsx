import { Pressable, Text, TextInput, View } from 'react-native';
import { useState } from 'react';

import { SelectorField } from '@/components/home/selector-field';
import { ScreenHeader } from '@/components/shared/screen-header';
import { useUserScreen } from '@/hooks/use-user-screen';
import { userStyles } from '@/styles/user.styles';
import type { AuthSession } from '@/types/auth';

const ROLE_OPTIONS = [
  { label: 'Técnico', value: 'tecnico' },
  { label: 'Admin', value: 'admin' },
];

export function UserScreen({
  session,
  visible,
  onOpenHelp,
  onRequestScrollToFocusedInput,
}: {
  session: AuthSession | null;
  visible: boolean;
  onOpenHelp: () => void;
  onRequestScrollToFocusedInput?: () => void;
}) {
  const user = useUserScreen(session, visible);
  const [rolePickerOpen, setRolePickerOpen] = useState(false);
  const [deactivatePickerOpen, setDeactivatePickerOpen] = useState(false);

  const selectedRoleLabel =
    ROLE_OPTIONS.find((option) => option.value === user.createUserForm.role)?.label ?? 'Técnico';
  const selectedDeactivateLabel =
    user.activeUsersForDeactivate.find(
      (option) => String(option.id_user) === user.selectedDeactivateUserId
    )?.nombre ?? 'Selecciona usuario';

  return (
    <View style={userStyles.container}>
      <ScreenHeader onHelpPress={onOpenHelp} />

      <Text style={userStyles.title}>Usuario</Text>
      <Text style={userStyles.subtitle}>
        Aquí puedes consultar tu información y actualizar los datos que tienen sentido
        modificar desde la app.
      </Text>

      <View style={userStyles.card}>
        <Text style={userStyles.cardTitle}>Mi perfil</Text>
        {user.profileFeedback ? <Text style={userStyles.feedback}>{user.profileFeedback}</Text> : null}
        {user.profileSuccess ? <Text style={userStyles.success}>{user.profileSuccess}</Text> : null}

        <Text style={userStyles.line}>
          <Text style={userStyles.label}>Nombre: </Text>
          <Text style={userStyles.value}>{session?.user.nombre ?? '-'}</Text>
        </Text>
        <Text style={userStyles.line}>
          <Text style={userStyles.label}>Email: </Text>
          <Text style={userStyles.value}>{session?.user.email ?? '-'}</Text>
        </Text>
        <Text style={userStyles.line}>
          <Text style={userStyles.label}>Rol: </Text>
          <Text style={userStyles.value}>{session?.user.role ?? '-'}</Text>
        </Text>

        <Text style={userStyles.readonlyHint}>
          Por seguridad, email, nombre y rol se muestran en solo lectura. El teléfono sí
          puede actualizarse desde aquí.
        </Text>

        <Text style={userStyles.inputLabel}>Teléfono</Text>
        <TextInput
          keyboardType="phone-pad"
          onChangeText={(value) => user.updateProfileField('telefono', value)}
          onFocus={onRequestScrollToFocusedInput}
          placeholder="Teléfono"
          style={userStyles.input}
          value={user.profileForm.telefono}
        />

        <Pressable
          disabled={user.profileSubmitting}
          onPress={() => void user.submitProfile()}
          style={[
            userStyles.actionButton,
            userStyles.registerButton,
            user.profileSubmitting && userStyles.buttonDisabled,
          ]}>
          <Text style={[userStyles.actionButtonText, userStyles.registerButtonText]}>
            {user.profileSubmitting ? 'Guardando...' : 'Guardar cambios'}
          </Text>
        </Pressable>

        <Text style={[userStyles.cardTitle, { marginTop: 18 }]}>Cambiar contraseña</Text>
        {user.passwordFeedback ? <Text style={userStyles.feedback}>{user.passwordFeedback}</Text> : null}
        {user.passwordSuccess ? <Text style={userStyles.success}>{user.passwordSuccess}</Text> : null}

        <Text style={userStyles.inputLabel}>Contraseña actual</Text>
        <TextInput
          onChangeText={(value) => user.updatePasswordField('currentPassword', value)}
          placeholder="Contraseña actual"
          secureTextEntry
          style={userStyles.input}
          value={user.passwordForm.currentPassword}
        />

        <Text style={userStyles.inputLabel}>Nueva contraseña</Text>
        <TextInput
          onChangeText={(value) => user.updatePasswordField('newPassword', value)}
          placeholder="Nueva contraseña"
          secureTextEntry
          style={userStyles.input}
          value={user.passwordForm.newPassword}
        />

        <Text style={userStyles.inputLabel}>Repetir contraseña</Text>
        <TextInput
          onChangeText={(value) => user.updatePasswordField('repeatPassword', value)}
          placeholder="Repetir contraseña"
          secureTextEntry
          style={userStyles.input}
          value={user.passwordForm.repeatPassword}
        />

        <Pressable
          disabled={user.passwordSubmitting}
          onPress={() => void user.submitPasswordChange()}
          style={[
            userStyles.actionButton,
            userStyles.registerButton,
            user.passwordSubmitting && userStyles.buttonDisabled,
          ]}>
          <Text style={[userStyles.actionButtonText, userStyles.registerButtonText]}>
            {user.passwordSubmitting ? 'Cambiando...' : 'Cambiar contraseña'}
          </Text>
        </Pressable>

        <Pressable
          disabled={user.logoutSubmitting}
          onPress={() => void user.submitSignOut()}
          style={[
            userStyles.actionButton,
            userStyles.logoutButton,
            user.logoutSubmitting && userStyles.buttonDisabled,
          ]}>
          <Text style={[userStyles.actionButtonText, userStyles.logoutButtonText]}>
            {user.logoutSubmitting ? 'Cerrando sesión...' : 'Cerrar sesión'}
          </Text>
        </Pressable>
      </View>

      {user.isAdmin ? (
        <>
          <View style={userStyles.card}>
            <Text style={userStyles.cardTitle}>Registrar usuario</Text>
            {user.createUserFeedback ? (
              <Text style={userStyles.feedback}>{user.createUserFeedback}</Text>
            ) : null}
            {user.createUserSuccess ? (
              <Text style={userStyles.success}>{user.createUserSuccess}</Text>
            ) : null}

            <Text style={userStyles.inputLabel}>Nombre</Text>
            <TextInput
              onChangeText={(value) => user.updateCreateUserField('nombre', value)}
              placeholder="Nombre"
              style={userStyles.input}
              value={user.createUserForm.nombre}
            />

            <Text style={userStyles.inputLabel}>Email</Text>
            <TextInput
              autoCapitalize="none"
              keyboardType="email-address"
              onChangeText={(value) => user.updateCreateUserField('email', value)}
              placeholder="Email"
              style={userStyles.input}
              value={user.createUserForm.email}
            />

            <Text style={userStyles.inputLabel}>Teléfono</Text>
            <TextInput
              keyboardType="phone-pad"
              onChangeText={(value) => user.updateCreateUserField('telefono', value)}
              onFocus={onRequestScrollToFocusedInput}
              placeholder="Teléfono"
              style={userStyles.input}
              value={user.createUserForm.telefono}
            />

            <SelectorField
              isOpen={rolePickerOpen}
              label="Rol"
              onSelect={(value) => {
                user.updateCreateUserField('role', value as 'admin' | 'tecnico');
                setRolePickerOpen(false);
              }}
              onToggleOpen={() => setRolePickerOpen((current) => !current)}
              options={ROLE_OPTIONS}
              valueLabel={selectedRoleLabel}
            />

            <Pressable
              disabled={user.createUserSubmitting}
              onPress={() => void user.submitCreateUser()}
              style={[
                userStyles.actionButton,
                userStyles.registerButton,
                user.createUserSubmitting && userStyles.buttonDisabled,
              ]}>
              <Text style={[userStyles.actionButtonText, userStyles.registerButtonText]}>
                {user.createUserSubmitting ? 'Registrando...' : 'Registrar usuario'}
              </Text>
            </Pressable>

            {user.registeredUserSummary ? (
              <View style={userStyles.temporaryPasswordBox}>
                <Text style={userStyles.line}>
                  <Text style={userStyles.label}>Usuario: </Text>
                  <Text style={userStyles.value}>{user.registeredUserSummary.nombre}</Text>
                </Text>
                <Text style={userStyles.line}>
                  <Text style={userStyles.label}>Email: </Text>
                  <Text style={userStyles.value}>{user.registeredUserSummary.email}</Text>
                </Text>
                <Text style={userStyles.line}>
                  <Text style={userStyles.label}>Rol: </Text>
                  <Text style={userStyles.value}>{user.registeredUserSummary.role}</Text>
                </Text>
                <Text style={userStyles.sectionTitle}>Contraseña temporal</Text>
                <Text style={userStyles.temporaryPasswordText}>
                  {user.registeredUserSummary.temporaryPassword}
                </Text>
                <Text style={userStyles.listHint}>
                  El flujo de primer acceso sigue activo: el admin entrega esta contraseña y el
                  nuevo usuario la cambia al iniciar sesión.
                </Text>
              </View>
            ) : null}
          </View>

          <View style={userStyles.card}>
            <Text style={userStyles.cardTitle}>Notificaciones</Text>
            {user.notificationsFeedback ? (
              <Text style={userStyles.feedback}>{user.notificationsFeedback}</Text>
            ) : null}
            <Pressable
              onPress={() => void user.markEveryNotificationRead()}
              style={[userStyles.actionButton, userStyles.secondaryButtonCompact]}>
              <Text style={userStyles.actionButtonText}>Marcar todas como leídas</Text>
            </Pressable>
            {user.notificationsLoading ? (
              <Text style={userStyles.listHint}>Cargando notificaciones...</Text>
            ) : user.notifications.length === 0 ? (
              <Text style={userStyles.listHint}>No hay notificaciones.</Text>
            ) : (
              user.notifications.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => void user.markOneNotificationRead(item.id)}
                  style={userStyles.temporaryPasswordBox}>
                  <Text style={userStyles.sectionTitle}>{item.title}</Text>
                  <Text style={userStyles.line}>{item.message}</Text>
                  <Text style={userStyles.listHint}>
                    {item.is_read ? 'Leída' : 'Pendiente'} · {item.created_at}
                  </Text>
                </Pressable>
              ))
            )}
          </View>

          <View style={userStyles.card}>
            <Text style={userStyles.cardTitle}>Dar de baja usuario</Text>
            {user.deactivateFeedback ? (
              <Text style={userStyles.feedback}>{user.deactivateFeedback}</Text>
            ) : null}
            {user.deactivateSuccess ? (
              <Text style={userStyles.success}>{user.deactivateSuccess}</Text>
            ) : null}

            <SelectorField
              disabled={user.usersLoading || user.activeUsersForDeactivate.length === 0}
              isOpen={deactivatePickerOpen}
              label="Usuario"
              onSelect={(value) => {
                user.setSelectedDeactivateUserId(value);
                setDeactivatePickerOpen(false);
              }}
              onToggleOpen={() => setDeactivatePickerOpen((current) => !current)}
              options={user.activeUsersForDeactivate.map((item) => ({
                label: `${item.nombre} (#${item.id_user})`,
                value: String(item.id_user),
              }))}
              valueLabel={selectedDeactivateLabel}
            />

            <Pressable
              disabled={!user.selectedDeactivateUserId || user.deactivateSubmitting}
              onPress={() => void user.submitDeactivateUser()}
              style={[
                userStyles.actionButton,
                userStyles.deactivateButton,
                (!user.selectedDeactivateUserId || user.deactivateSubmitting) &&
                  userStyles.buttonDisabled,
              ]}>
              <Text style={[userStyles.actionButtonText, userStyles.deactivateButtonText]}>
                {user.deactivateSubmitting ? 'Dando de baja...' : 'Dar de baja'}
              </Text>
            </Pressable>

            <Text style={userStyles.listHint}>
              Aquí solo aparecen usuarios activos distintos de tu propia cuenta.
            </Text>
          </View>
        </>
      ) : null}
    </View>
  );
}
