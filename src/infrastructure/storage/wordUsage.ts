import { clearJson, getJson, setJson } from './mmkv';

const USAGE_KEY = 'kapelyukh.wordUsage.v1';
const MARKED_SESSIONS_KEY = 'kapelyukh.wordUsage.markedSessions.v1';
const MAX_MARKED_SESSIONS = 64;

export type WordUsageMap = Record<string, number>;

function readUsage(): WordUsageMap {
  return getJson<WordUsageMap>(USAGE_KEY) ?? {};
}

function writeUsage(usage: WordUsageMap): void {
  setJson(USAGE_KEY, usage);
}

function readMarkedSessions(): string[] {
  return getJson<string[]>(MARKED_SESSIONS_KEY) ?? [];
}

function writeMarkedSessions(sessions: string[]): void {
  setJson(MARKED_SESSIONS_KEY, sessions);
}

export function getWordUsage(wordId: string): number {
  return readUsage()[wordId] ?? 0;
}

export function getUsageMap(): WordUsageMap {
  return { ...readUsage() };
}

/**
 * Idempotent: the same sessionKey increments usage at most once.
 * sessionKey should be stable per match (e.g. String(GameState.createdAt)).
 */
export function markWordsUsed(wordIds: readonly string[], sessionKey: string): void {
  if (wordIds.length === 0 || !sessionKey) {
    return;
  }

  const marked = readMarkedSessions();
  if (marked.includes(sessionKey)) {
    return;
  }

  const usage = readUsage();
  for (const id of wordIds) {
    usage[id] = (usage[id] ?? 0) + 1;
  }
  writeUsage(usage);

  const nextMarked = [...marked, sessionKey];
  while (nextMarked.length > MAX_MARKED_SESSIONS) {
    nextMarked.shift();
  }
  writeMarkedSessions(nextMarked);
}

export function resetWordUsage(): void {
  clearJson(USAGE_KEY);
  clearJson(MARKED_SESSIONS_KEY);
}

export const wordUsageStore = {
  get: getWordUsage,
  getMap: getUsageMap,
  markUsed: markWordsUsed,
  reset: resetWordUsage,
};
