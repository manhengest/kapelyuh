import type { CsvWord } from './words-csv';
import { normalizeTextKey } from './words-id';

export const PLAYABILITY_MIN = 6;

export interface PlayabilityScore {
  alias: number;
  crocodile: number;
  association: number;
  min: number;
  pass: boolean;
  reasons: string[];
}

export interface PlayabilityReportEntry extends PlayabilityScore {
  id: string;
  text: string;
  difficulty: string;
  category: string;
  status: string;
}

interface RoundScores {
  alias: number;
  crocodile: number;
  association: number;
}

interface PlayabilityOverride {
  alias?: number;
  crocodile?: number;
  association?: number;
  pass?: boolean;
  reason?: string;
}

const CATEGORY_BASE: Record<string, RoundScores> = {
  animals: { alias: 9, crocodile: 9, association: 9 },
  nature: { alias: 8, crocodile: 8, association: 8 },
  food: { alias: 9, crocodile: 9, association: 9 },
  drinks: { alias: 9, crocodile: 8, association: 9 },
  body: { alias: 8, crocodile: 8, association: 8 },
  clothing: { alias: 8, crocodile: 8, association: 8 },
  home: { alias: 8, crocodile: 9, association: 8 },
  tools: { alias: 8, crocodile: 9, association: 8 },
  transport: { alias: 8, crocodile: 8, association: 8 },
  technology: { alias: 7, crocodile: 7, association: 7 },
  places: { alias: 7, crocodile: 7, association: 7 },
  cities: { alias: 7, crocodile: 6, association: 7 },
  travel: { alias: 7, crocodile: 7, association: 7 },
  family: { alias: 7, crocodile: 6, association: 7 },
  people: { alias: 7, crocodile: 7, association: 7 },
  professions: { alias: 7, crocodile: 7, association: 7 },
  sports: { alias: 8, crocodile: 8, association: 8 },
  games: { alias: 8, crocodile: 8, association: 8 },
  music: { alias: 7, crocodile: 6, association: 7 },
  movies: { alias: 7, crocodile: 7, association: 7 },
  tv: { alias: 7, crocodile: 6, association: 7 },
  internet: { alias: 7, crocodile: 6, association: 7 },
  brands: { alias: 7, crocodile: 7, association: 7 },
  school: { alias: 7, crocodile: 6, association: 7 },
  work: { alias: 7, crocodile: 6, association: 7 },
  holidays: { alias: 7, crocodile: 7, association: 7 },
  events: { alias: 7, crocodile: 7, association: 7 },
  history: { alias: 6, crocodile: 5, association: 6 },
  science: { alias: 6, crocodile: 5, association: 6 },
  society: { alias: 7, crocodile: 5, association: 7 },
  emotions: { alias: 7, crocodile: 5, association: 7 },
  personality: { alias: 6, crocodile: 4, association: 6 },
  relationships: { alias: 6, crocodile: 5, association: 6 },
  actions: { alias: 8, crocodile: 8, association: 7 },
  behavior: { alias: 6, crocodile: 5, association: 6 },
  abstract: { alias: 6, crocodile: 4, association: 6 },
};

const DEFAULT_BASE: RoundScores = { alias: 7, crocodile: 6, association: 7 };

const ABSTRACTISH_CATEGORIES = new Set([
  'abstract',
  'emotions',
  'personality',
  'relationships',
  'behavior',
  'science',
  'society',
  'history',
]);

/** Curator overrides for words the heuristics mis-score. Key = normalizeTextKey(text). */
const OVERRIDES: Record<string, PlayabilityOverride> = {
  хабар: {
    alias: 7,
    crocodile: 6,
    association: 7,
    reason: 'visual hook: mime passing an envelope / bribe',
  },
  евакуація: {
    alias: 7,
    crocodile: 6,
    association: 7,
    reason: 'visual hook: run out with bag, alarm gesture',
  },
  корупція: {
    alias: 7,
    crocodile: 6,
    association: 7,
    reason: 'visual hook: envelope under table, handshake',
  },
  варіант: { alias: 5, crocodile: 3, association: 5, reason: 'pure abstract, no pantomime anchor' },
  критерій: { alias: 4, crocodile: 3, association: 4, reason: 'pure abstract, no pantomime anchor' },
  сенс: { alias: 4, crocodile: 3, association: 4, reason: 'pure abstract, no pantomime anchor' },
  'сенс життя': {
    alias: 5,
    crocodile: 4,
    association: 5,
    reason: 'abstract phrase, weak pantomime anchor',
  },
  парадигма: { alias: 4, crocodile: 3, association: 4, reason: 'academic abstract, no pantomime anchor' },
  гедонізм: { alias: 4, crocodile: 3, association: 4, reason: '-ізм abstract, no pantomime anchor' },
  децентралізація: {
    alias: 5,
    crocodile: 4,
    association: 5,
    reason: '-ція jargon, no stable pantomime anchor',
  },
  стоїцизм: { alias: 4, crocodile: 3, association: 4, reason: '-ізм abstract, no pantomime anchor' },
  свобода: { alias: 7, crocodile: 5, association: 7, reason: 'weak pantomime: arms spread, easy to miss' },
};

function clampScore(value: number): number {
  return Math.max(1, Math.min(10, Math.round(value)));
}

function applyMorphology(word: CsvWord, scores: RoundScores, reasons: string[]): RoundScores {
  const text = word.text.toLowerCase();
  let { alias, crocodile, association } = scores;

  if (/(?:ість|изм|ізм)$/u.test(text)) {
    crocodile -= 2;
    alias -= 1;
    reasons.push('morphology: abstract suffix (-ість/-ізм)');
  }

  if (/ція$/u.test(text) && ABSTRACTISH_CATEGORIES.has(word.category)) {
    crocodile -= 2;
    alias -= 1;
    reasons.push('morphology: -ція in abstract-ish category');
  }

  if (text.includes(' ') && !ABSTRACTISH_CATEGORIES.has(word.category)) {
    crocodile += 1;
    reasons.push('morphology: compound phrase (scene possible)');
  }

  if (word.difficulty === 'hard') {
    alias -= 1;
    crocodile -= 1;
    reasons.push('difficulty: hard');
  }

  return {
    alias: clampScore(alias),
    crocodile: clampScore(crocodile),
    association: clampScore(association),
  };
}

function applyOverride(
  key: string,
  scores: RoundScores,
  reasons: string[],
): { scores: RoundScores; passOverride?: boolean } {
  const override = OVERRIDES[key];
  if (!override) {
    return { scores };
  }

  const merged: RoundScores = {
    alias: override.alias ?? scores.alias,
    crocodile: override.crocodile ?? scores.crocodile,
    association: override.association ?? scores.association,
  };

  if (override.reason) {
    reasons.push(`override: ${override.reason}`);
  }

  return { scores: merged, passOverride: override.pass };
}

export function scorePlayability(word: CsvWord): PlayabilityScore {
  const reasons: string[] = [];
  const base = CATEGORY_BASE[word.category] ?? DEFAULT_BASE;
  reasons.push(`category base (${word.category}): ${base.alias}/${base.crocodile}/${base.association}`);

  let scores = applyMorphology(word, { ...base }, reasons);
  const key = normalizeTextKey(word.text);
  const { scores: overridden, passOverride } = applyOverride(key, scores, reasons);
  scores = overridden;

  const min = Math.min(scores.alias, scores.crocodile, scores.association);
  const pass =
    passOverride !== undefined ? passOverride : min >= PLAYABILITY_MIN;

  return {
    alias: scores.alias,
    crocodile: scores.crocodile,
    association: scores.association,
    min,
    pass,
    reasons,
  };
}

export function isPlayabilityCheckedStatus(status: CsvWord['status']): boolean {
  return status === 'core' || status === 'pack' || status === 'review';
}

export function buildPlayabilityReport(words: CsvWord[]): PlayabilityReportEntry[] {
  return words
    .filter((word) => isPlayabilityCheckedStatus(word.status))
    .map((word) => {
      const score = scorePlayability(word);
      return {
        id: word.id,
        text: word.text,
        difficulty: word.difficulty,
        category: word.category,
        status: word.status,
        ...score,
      };
    })
    .sort((a, b) => {
      if (a.pass !== b.pass) return a.pass ? 1 : -1;
      return a.min - b.min;
    });
}

export function summarizePlayabilityReport(entries: PlayabilityReportEntry[]): {
  total: number;
  passed: number;
  failed: number;
  failedByCategory: Record<string, number>;
} {
  const failedByCategory: Record<string, number> = {};
  let passed = 0;
  let failed = 0;

  for (const entry of entries) {
    if (entry.pass) {
      passed += 1;
    } else {
      failed += 1;
      failedByCategory[entry.category] = (failedByCategory[entry.category] ?? 0) + 1;
    }
  }

  return { total: entries.length, passed, failed, failedByCategory };
}
