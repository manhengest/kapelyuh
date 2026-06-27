import type { RoundType } from '@domain/game/types';

export const RoundPalette = {
  elias: { bg: '#F4A6C8', card: '#E8F36C', text: '#1A1A1A' },
  crocodile: { bg: '#5BA8AC', card: '#F4A6C8', text: '#1A1A1A' },
  association: { bg: '#E8F36C', card: '#F4A6C8', text: '#1A1A1A' },
} as const satisfies Record<RoundType, { bg: string; card: string; text: string }>;

export function getRoundPalette(roundType: RoundType | undefined) {
  if (!roundType) {
    return RoundPalette.elias;
  }
  return RoundPalette[roundType];
}
