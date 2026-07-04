import { useRouter } from 'expo-router';
import { Image, Pressable, View } from 'react-native';

import { Text } from '@ui/components/Text';

const backArrowIcon = require('../../../assets/images/icons/back-arrow.png');

type ScreenHeaderProps = {
  title?: string;
  showHome?: boolean;
  onHomePress?: () => void;
  onBack?: () => void;
};

export function ScreenHeader({
  title,
  showHome = false,
  onHomePress,
  onBack,
}: ScreenHeaderProps) {
  const router = useRouter();

  const leftAction = onBack ?? (showHome ? (onHomePress ?? (() => router.replace('/'))) : undefined);

  return (
    <View className="flex-row items-center justify-between px-4 pt-3">
      {leftAction ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={onBack ? 'Назад' : 'На головну'}
          onPress={leftAction}
          className={`screen-header-action-btn ${onBack ? 'screen-header-action-btn--back' : 'screen-header-action-btn--home'}`}
        >
          <Image source={backArrowIcon} style={{ width: 22, height: 18 }} resizeMode="contain" />
        </Pressable>
      ) : (
        <View className="h-11 w-11" />
      )}
      {title ? <Text className="text-4xl font-bold text-primaryText">{title}</Text> : <View />}
      <View className="h-11 w-11" />
    </View>
  );
}
