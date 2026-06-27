export interface SqliteDatabase {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, ...params: unknown[]): Promise<unknown>;
  getFirstAsync<T>(sql: string, ...params: unknown[]): Promise<T | null>;
  getAllAsync<T>(sql: string, ...params: unknown[]): Promise<T[]>;
}

let databaseInstance: SqliteDatabase | null = null;

export function setDatabase(db: SqliteDatabase): void {
  databaseInstance = db;
}

export function getDatabase(): SqliteDatabase {
  if (!databaseInstance) {
    throw new Error('SQLite database is not initialized yet');
  }
  return databaseInstance;
}
