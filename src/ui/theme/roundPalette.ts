import type { RoundType } from '@domain/game/types';

export const RoundPalette = {
  elias: { bg: '#F4A6C8', card: '#FFFFFF', text: '#1A1A1A', wordText: '#FF6B9D' },
  crocodile: { bg: '#5BA8AC', card: '#FFFFFF', text: '#1A1A1A', wordText: '#0D6E79' },
  association: { bg: '#E8F36C', card: '#FFFFFF', text: '#1A1A1A', wordText: '#7C5C00' },
} as const satisfies Record<RoundType, { bg: string; card: string; text: string; wordText: string }>;

export function getRoundPalette(roundType: RoundType | undefined) {
  if (!roundType) {
    return RoundPalette.elias;
  }
  return RoundPalette[roundType];
}
