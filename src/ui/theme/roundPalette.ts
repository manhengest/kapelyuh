import type { ImageSourcePropType } from 'react-native';

import type { RoundType } from '@domain/game/types';

/** Default screen background (`main-bg.jpg`). */
export const bg = require('@assets/images/main-bg.jpg');

const roundBackgroundByType = {
  elias: bg,
  crocodile: require('@assets/images/bg-crocodile.jpg'),
  association: require('@assets/images/bg-association.jpg'),
} as const satisfies Record<RoundType, ImageSourcePropType>;

export function getRoundBackground(roundType: RoundType | undefined): ImageSourcePropType {
  if (!roundType) {
    return bg;
  }
  return roundBackgroundByType[roundType];
}

export const RoundPalette = {
  elias: { bg: '#F4A6C8', card: '#FFFFFF', text: '#1A1A1A', wordText: '#FF6B9D' },
  crocodile: { bg: '#46d319', card: '#FFFFFF', text: '#1A1A1A', wordText: '#388c18' },
  association: { bg: '#E8F36C', card: '#FFFFFF', text: '#1A1A1A', wordText: '#7C5C00' },
} as const satisfies Record<
  RoundType,
  { bg: string; card: string; text: string; wordText: string }
>;

export function getRoundPalette(roundType: RoundType | undefined) {
  if (!roundType) {
    return RoundPalette.elias;
  }
  return RoundPalette[roundType];
}

export const RoundTitleStyle = {
  elias: { color: '#FB6694', fontSize: 80 },
  crocodile: { color: '#388c18', fontSize: 60 },
  association: { color: '#7C5C00', fontSize: 65 },
} as const satisfies Record<RoundType, { color: string; fontSize: number }>;

export function getRoundTitleStyle(roundType: RoundType | undefined) {
  if (!roundType) {
    return RoundTitleStyle.elias;
  }
  return RoundTitleStyle[roundType];
}

export const RoundIntroIconStyle = {
  elias: { width: 84, height: 62, top: 20, left: '60%' },
  crocodile: { width: 110, height: 110, top: -10, left: '40%' },
  association: { width: 130, height: 80, top: 10, left: '30%' },
} as const satisfies Record<
  RoundType,
  { width: number; height: number; top: number; left: `${number}%` }
>;

export function getRoundIntroIconStyle(roundType: RoundType | undefined) {
  if (!roundType) {
    return RoundIntroIconStyle.elias;
  }
  return RoundIntroIconStyle[roundType];
}

export const HatIconStyle = {
  elias: { width: 120, height: 121, right: -10, bottom: 0 },
  crocodile: { width: 100, height: 121, right: 0, bottom: -20 },
  association: { width: 90, height: 111, right: 20, bottom: -20 },
} as const satisfies Record<
  RoundType,
  { width: number; height: number; right: number; bottom: number }
>;

export function getHatIconStyle(roundType: RoundType | undefined) {
  if (!roundType) {
    return HatIconStyle.elias;
  }
  return HatIconStyle[roundType];
}
