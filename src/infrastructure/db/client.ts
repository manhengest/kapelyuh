import { useSQLiteContext } from 'expo-sqlite';

import type { SqliteDatabase } from './databaseRef';

export type { SqliteDatabase } from './databaseRef';
export { getDatabase, setDatabase } from './databaseRef';

export function useDatabase(): SqliteDatabase {
  return useSQLiteContext() as SqliteDatabase;
}
