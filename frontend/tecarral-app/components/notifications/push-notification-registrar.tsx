import { useEffect } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';

import { useAuth } from '@/contexts/auth-context';
import { getStoredItem, setStoredItem } from '@/services/session-storage';
import { getNotifications, registerPushToken } from '@/services/notifications-api';
import type { NotificationItem } from '@/types/user';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const LOCAL_SURFACED_KEY_PREFIX = '@tecarral/local-maintenance-notifications';

function getProjectId() {
  return (
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId ??
    null
  );
}

function isMaintenanceNotification(item: NotificationItem) {
  return String(item.tipo ?? '').startsWith('MANTENIMIENTO_');
}

async function surfaceUnreadMaintenanceNotifications(token: string, userId: number) {
  const storageKey = `${LOCAL_SURFACED_KEY_PREFIX}/${userId}`;
  const rawSeen = await getStoredItem(storageKey);
  const seenIds = new Set<number>(
    rawSeen ? (JSON.parse(rawSeen) as number[]).filter((id) => Number.isInteger(id)) : []
  );

  const notifications = await getNotifications(token);
  const pending = notifications
    .filter((item) => !item.is_read && isMaintenanceNotification(item) && !seenIds.has(item.id))
    .slice(0, 10);

  for (const item of pending) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: item.title,
        body: item.message,
        sound: 'default',
        autoDismiss: false,
        sticky: false,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        data: {
          notification_id: item.id,
          tipo: item.tipo,
          entity_type: item.entity_type,
          entity_id: item.entity_id,
        },
      },
      trigger: null,
    });
    seenIds.add(item.id);
  }

  if (pending.length > 0) {
    await setStoredItem(storageKey, JSON.stringify(Array.from(seenIds).slice(-300)));
  }
}

async function getExpoPushToken() {
  const permission = await Notifications.getPermissionsAsync();
  let finalStatus = (permission as { status?: string }).status;

  if (finalStatus !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync();
    finalStatus = (requested as { status?: string }).status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('maintenance-reminders', {
      name: 'Mantenimientos',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#0b5c9d',
      sound: 'default',
    });
  }

  const projectId = getProjectId();
  const result = projectId
    ? await Notifications.getExpoPushTokenAsync({ projectId })
    : await Notifications.getExpoPushTokenAsync();

  return result.data;
}

export function PushNotificationRegistrar() {
  const { session } = useAuth();

  useEffect(() => {
    let cancelled = false;

    async function register() {
      if (!session?.token) {
        return;
      }

      try {
        await surfaceUnreadMaintenanceNotifications(session.token, session.user.id_user);
      } catch {
        // El espejo local es solo una ayuda para pruebas/Expo Go.
      }

      try {
        const expoPushToken = await getExpoPushToken();
        if (!expoPushToken || cancelled) {
          return;
        }

        await registerPushToken(
          {
            expo_push_token: expoPushToken,
            platform: Platform.OS,
            device_id: Constants.sessionId ?? null,
          },
          session.token
        );
      } catch {
        // El push remoto es un canal adicional; la app debe seguir funcionando sin él.
      }
    }

    void register();

    return () => {
      cancelled = true;
    };
  }, [session?.token, session?.user.id_user]);

  return null;
}


