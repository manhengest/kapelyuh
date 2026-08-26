export const DATABASE_VERSION = 2;

export const BUNDLED_PACK_ID = 'bundled-default';
export const BUNDLED_PACK_NAME = 'Базовий набір';

export const THEMATIC_PACK_ID = 'pack:thematic';
export const THEMATIC_PACK_NAME = 'Тематичний набір';

export const CREATE_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS packs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('bundled','custom')),
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS words (
  id TEXT PRIMARY KEY,
  pack_id TEXT NOT NULL REFERENCES packs(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy','medium','hard')),
  category_id TEXT NOT NULL,
  group_id TEXT
);

CREATE INDEX IF NOT EXISTS idx_words_difficulty ON words(difficulty);
CREATE INDEX IF NOT EXISTS idx_words_pack ON words(pack_id);
CREATE INDEX IF NOT EXISTS idx_words_group ON words(group_id) WHERE group_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  finished_at INTEGER NOT NULL,
  duration_ms INTEGER NOT NULL,
  payload_json TEXT NOT NULL,
  word_ids_json TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_finished_at ON sessions(finished_at DESC);
`;

export const MIN_WORD_COUNT = 90;
export const MAX_SESSION_HISTORY = 20;
