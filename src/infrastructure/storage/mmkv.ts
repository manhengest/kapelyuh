import { MMKV } from 'react-native-mmkv';

export const mmkv = new MMKV({ id: 'kapelyukh' });

export function setJson<T>(key: string, value: T): void {
  mmkv.set(key, JSON.stringify(value));
}

export function getJson<T>(key: string): T | null {
  const raw = mmkv.getString(key);
  if (!raw) {
    return null;
  }

  return JSON.parse(raw) as T;
}

export function clearJson(key: string): void {
  mmkv.delete(key);
}
