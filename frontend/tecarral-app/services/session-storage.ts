import AsyncStorage from '@react-native-async-storage/async-storage';

const memoryStorage = new Map<string, string>();

async function safeCall<T>(action: () => Promise<T>, fallback: () => T): Promise<T> {
  try {
    return await action();
  } catch {
    return fallback();
  }
}

export async function getStoredItem(key: string) {
  return safeCall(
    () => AsyncStorage.getItem(key),
    () => memoryStorage.get(key) ?? null
  );
}

export async function setStoredItem(key: string, value: string) {
  return safeCall(
    async () => {
      await AsyncStorage.setItem(key, value);
    },
    () => {
      memoryStorage.set(key, value);
    }
  );
}

export async function removeStoredItem(key: string) {
  return safeCall(
    async () => {
      await AsyncStorage.removeItem(key);
    },
    () => {
      memoryStorage.delete(key);
    }
  );
}
