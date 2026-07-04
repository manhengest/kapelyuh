import type { TextStyle } from 'react-native';

export const NUNITO_FAMILIES = {
  regular: 'Nunito_400Regular',
  medium: 'Nunito_500Medium',
  semibold: 'Nunito_600SemiBold',
  bold: 'Nunito_700Bold',
  extrabold: 'Nunito_800ExtraBold',
} as const;

export function nunitoFamilyForWeight(fontWeight: TextStyle['fontWeight'] | undefined): string {
  switch (String(fontWeight ?? '400')) {
    case '500':
    case 'medium':
      return NUNITO_FAMILIES.medium;
    case '600':
    case 'semibold':
      return NUNITO_FAMILIES.semibold;
    case '700':
    case 'bold':
      return NUNITO_FAMILIES.bold;
    case '800':
    case '900':
    case 'extrabold':
      return NUNITO_FAMILIES.extrabold;
    default:
      return NUNITO_FAMILIES.regular;
  }
}
