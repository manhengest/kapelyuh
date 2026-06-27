import type { GameState, SessionHistoryEntry } from '@domain/game/types';
import { createId } from '@shared/lib/id';

import { getDatabase } from './databaseRef';
import { MAX_SESSION_HISTORY } from './schema';

type SessionRow = {
  word_ids_json: string;
};

export function buildSessionEntry(state: GameState): SessionHistoryEntry & { wordIds: string[] } {
  const wordIds = state.rounds[0]?.sessionWordIds ?? [];
  return {
    id: createId('session'),
    finishedAt: state.updatedAt,
    durationMs: state.updatedAt - state.createdAt,
    teams: state.teams.map((team) => ({ name: team.name, scores: team.scores })),
    settings: state.settings,
    wordIds,
  };
}

export async function saveFinishedSession(state: GameState): Promise<void> {
  const entry = buildSessionEntry(state);
  const db = getDatabase();

  await db.runAsync(
    `INSERT INTO sessions (id, finished_at, duration_ms, payload_json, word_ids_json)
     VALUES (?, ?, ?, ?, ?)`,
    entry.id,
    entry.finishedAt,
    entry.durationMs,
    JSON.stringify({
      id: entry.id,
      finishedAt: entry.finishedAt,
      durationMs: entry.durationMs,
      teams: entry.teams,
      settings: entry.settings,
    }),
    JSON.stringify(entry.wordIds),
  );

  await pruneOldSessions(MAX_SESSION_HISTORY);
}

export async function getRecentSessionWordIds(limitSessions: number): Promise<string[]> {
  const db = getDatabase();
  const rows = await db.getAllAsync<SessionRow>(
    `SELECT word_ids_json FROM sessions ORDER BY finished_at DESC LIMIT ?`,
    limitSessions,
  );

  const ids = new Set<string>();
  for (const row of rows) {
    const wordIds = JSON.parse(row.word_ids_json) as string[];
    for (const wordId of wordIds) {
      ids.add(wordId);
    }
  }
  return [...ids];
}

export async function pruneOldSessions(keepCount: number): Promise<void> {
  const db = getDatabase();
  await db.runAsync(
    `DELETE FROM sessions
     WHERE id NOT IN (
       SELECT id FROM sessions ORDER BY finished_at DESC LIMIT ?
     )`,
    keepCount,
  );
}

export async function getSessionCount(): Promise<number> {
  const db = getDatabase();
  const row = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM sessions');
  return row?.count ?? 0;
}
