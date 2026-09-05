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

/**
 * Curator overrides from scripts/audit/playability-calibration.md.
 * Abstract-ish categories fail crocodile by default; this list opts in visual hooks
 * and opts out rare/unrecognizable cards. Key = normalizeTextKey(text).
 */
const OVERRIDES: Record<string, PlayabilityOverride> = {
  // Visual-hook abstracts / traits / civic scenes — pass
  варіант: {
    alias: 8,
    crocodile: 6,
    association: 7,
    reason: 'hook: mime a choice between options',
  },
  думка: { alias: 8, crocodile: 7, association: 7, reason: 'hook: tapping temple / thinking' },
  ідея: { alias: 10, crocodile: 8, association: 6, reason: 'hook: lightbulb over the head' },
  акуратність: {
    alias: 7,
    crocodile: 6,
    association: 7,
    reason: 'hook: mime cleaning / lining things up',
  },
  працьовитість: { alias: 7, crocodile: 6, association: 8, reason: 'hook: mime working hard' },
  асиметрія: { alias: 7, crocodile: 7, association: 8, reason: 'hook: crooked / lopsided pose' },
  хабар: { alias: 8, crocodile: 8, association: 8, reason: 'hook: passing an envelope' },
  корупція: { alias: 7, crocodile: 6, association: 7, reason: 'hook: envelope under the table' },
  арешт: { alias: 8, crocodile: 8, association: 8, reason: 'hook: hands cuffed behind back' },
  барикада: {
    alias: 6,
    crocodile: 6,
    association: 6,
    reason: 'hook: stacking furniture / blocking',
  },
  бюрократія: {
    alias: 7,
    crocodile: 6,
    association: 6,
    reason: 'hook: queue at a window, stamp, papers',
  },
  евакуація: { alias: 7, crocodile: 7, association: 7, reason: 'hook: run out with a bag, alarm' },

  // No visual hook (and often no association) — fail
  знання: { alias: 7, crocodile: 5, association: 5, reason: 'no stable pantomime or association' },
  критерій: { alias: 6, crocodile: 3, association: 3, reason: 'no visual or associative hook' },
  логіка: { alias: 6, crocodile: 2, association: 4, reason: 'no visual hook' },
  мета: { alias: 8, crocodile: 5, association: 8, reason: 'alias ok, no pantomime anchor' },
  назва: { alias: 6, crocodile: 2, association: 8, reason: 'alias/association ok, no pantomime' },
  життя: { alias: 8, crocodile: 3, association: 8, reason: 'too abstract to mime' },
  принцип: { alias: 6, crocodile: 3, association: 3, reason: 'no visual or associative hook' },
  аналогія: { alias: 3, crocodile: 3, association: 3, reason: 'rare academic, no hook' },
  аргумент: { alias: 6, crocodile: 3, association: 4, reason: 'no pantomime anchor' },
  асоціація: { alias: 6, crocodile: 3, association: 6, reason: 'no pantomime anchor' },
  альтруїзм: { alias: 1, crocodile: 1, association: 1, reason: 'rare -ізм, nobody mimes this' },
  амбітність: { alias: 1, crocodile: 1, association: 1, reason: 'rare form, not party vocabulary' },
  субсидія: { alias: 6, crocodile: 3, association: 6, reason: 'civic jargon, no pantomime' },
  щирість: { alias: 5, crocodile: 3, association: 6, reason: 'trait form, weak mime' },
  абсурд: { alias: 6, crocodile: 3, association: 6, reason: 'no pantomime anchor' },
  сенс: { alias: 4, crocodile: 3, association: 4, reason: 'pure abstract' },
  'сенс життя': { alias: 5, crocodile: 4, association: 5, reason: 'abstract phrase, weak mime' },
  парадигма: { alias: 4, crocodile: 3, association: 4, reason: 'academic abstract' },
  гедонізм: { alias: 4, crocodile: 3, association: 4, reason: '-ізм, no pantomime' },
  децентралізація: { alias: 4, crocodile: 3, association: 4, reason: '-ція jargon, no pantomime' },
  стоїцизм: { alias: 4, crocodile: 3, association: 4, reason: '-ізм, no pantomime' },
  алегорія: { alias: 4, crocodile: 3, association: 4, reason: 'literary jargon' },
  алюзія: { alias: 4, crocodile: 3, association: 4, reason: 'literary jargon' },
  аномалія: { alias: 4, crocodile: 3, association: 4, reason: 'no pantomime anchor' },
  гіпотеза: { alias: 4, crocodile: 3, association: 4, reason: 'science abstract, no pantomime' },
  свобода: { alias: 7, crocodile: 5, association: 7, reason: 'weak mime: arms spread' },

  // Recognition fail: average adult does not know the referent
  альпака: { alias: 5, crocodile: 4, association: 6, reason: 'exotic animal, low recognition' },
  ламантин: { alias: 5, crocodile: 5, association: 5, reason: 'exotic animal, low recognition' },
  лобзик: { alias: 5, crocodile: 5, association: 5, reason: 'niche tool, low recognition' },
};

function clampScore(value: number): number {
  return Math.max(1, Math.min(10, Math.round(value)));
}

function applyMorphology(word: CsvWord, scores: RoundScores, reasons: string[]): RoundScores {
  const text = word.text.toLowerCase();
  let { alias, crocodile, association } = scores;

  if (/(?:изм|ізм)$/u.test(text)) {
    alias -= 3;
    crocodile -= 3;
    association -= 2;
    reasons.push('morphology: -ізм (academic / rare)');
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

  // Hard is "less common", not "unrecognizable". Only abstract-ish cards get a
  // difficulty tax; concrete hard words (жонглювання, керлінг) stay mimeable.
  if (word.difficulty === 'hard' && ABSTRACTISH_CATEGORIES.has(word.category)) {
    alias -= 1;
    crocodile -= 1;
    reasons.push('difficulty: hard abstract-ish');
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
  reasons.push(
    `category base (${word.category}): ${base.alias}/${base.crocodile}/${base.association}`,
  );

  let scores = applyMorphology(word, { ...base }, reasons);
  const key = normalizeTextKey(word.text);
  const { scores: overridden, passOverride } = applyOverride(key, scores, reasons);
  scores = overridden;

  const min = Math.min(scores.alias, scores.crocodile, scores.association);
  const pass = passOverride !== undefined ? passOverride : min >= PLAYABILITY_MIN;

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
