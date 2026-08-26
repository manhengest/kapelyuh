import { createHash } from 'node:crypto';

/** Stable word id: `w_` + first 10 hex chars of sha1(NFC(lowercase(text))). */
export function stableWordId(text: string): string {
  const normalized = text.normalize('NFC').toLowerCase();
  const hash = createHash('sha1').update(normalized, 'utf8').digest('hex');
  return `w_${hash.slice(0, 10)}`;
}

/** Strip hyphens/spaces/punctuation for near-duplicate detection. */
export function normalizeTextKey(text: string): string {
  return text
    .normalize('NFC')
    .toLowerCase()
    .replace(/\u2019/g, "'")
    .replace(/ʼ/g, "'")
    .replace(/[^a-zа-яіїєґ0-9']/gi, '');
}
