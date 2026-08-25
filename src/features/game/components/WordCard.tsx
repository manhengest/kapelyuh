import { View } from 'react-native';

import { Text } from '@ui/components/Text';

type WordCardProps = {
  word?: string;
  backgroundColor: string;
  textColor?: string;
  label?: string;
  hideFromAccessibility?: boolean;
  showWord?: boolean;
  isBackCard?: boolean;
};

export function WordCard({
  word = '',
  backgroundColor,
  textColor = '#1A1A1A',
  label,
  hideFromAccessibility = false,
  showWord = true,
  isBackCard = false,
}: WordCardProps) {
  const shadowOpacity = isBackCard ? 0.08 : 0.15;

  return (
    <View
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 5, height: 5 },
        shadowOpacity,
        shadowRadius: 3,
        elevation: isBackCard ? 4 : 10,
      }}
      className="w-full items-center gap-2 px-4"
    >
      <View className="h-8 items-center justify-center">
        {!isBackCard && label ? (
          <Text className="text-2xl font-bold uppercase tracking-widest text-primaryText">
            {label}
          </Text>
        ) : null}
      </View>
      <View
        className="min-h-[200px] w-full items-center justify-center rounded-3xl px-4 py-8"
        style={{ backgroundColor }}
        accessibilityElementsHidden={hideFromAccessibility}
        importantForAccessibility={hideFromAccessibility ? 'no-hide-descendants' : 'auto'}
      >
        {showWord && word ? (
          <Text
            accessibilityLabel={hideFromAccessibility ? undefined : `Слово: ${word}`}
            accessibilityElementsHidden={hideFromAccessibility}
            style={{ color: textColor, fontSize: 80 }}
            className="text-center font-bold uppercase"
            adjustsFontSizeToFit
            minimumFontScale={0.25}
            numberOfLines={1}
          >
            {word}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
