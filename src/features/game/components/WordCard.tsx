import { View } from 'react-native';

import { Text } from '@ui/components/Text';

type WordCardProps = {
  word?: string;
  backgroundColor: string;
  textColor?: string;
  label?: string;
  badge?: string;
  hideFromAccessibility?: boolean;
  showWord?: boolean;
  isBackCard?: boolean;
};

export function WordCardHeading({ label }: { label?: string }) {
  return (
    <View className="h-8 items-center justify-center">
      {label ? (
        <Text className="text-2xl font-bold uppercase tracking-widest text-primaryText">
          {label}
        </Text>
      ) : null}
    </View>
  );
}

export function WordCardLabel({ label }: { label?: string }) {
  if (!label) {
    return null;
  }

  return (
    <View className="word-card-badge" pointerEvents="none">
      <Text className="word-card-badge-text">{label}</Text>
    </View>
  );
}

export function WordCard({
  word = '',
  backgroundColor,
  textColor = '#1A1A1A',
  label,
  badge,
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
      <WordCardHeading label={isBackCard ? undefined : label} />
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
        {!isBackCard ? <WordCardLabel label={badge} /> : null}
      </View>
    </View>
  );
}
