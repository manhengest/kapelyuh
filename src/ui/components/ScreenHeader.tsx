import { Image, Pressable, View } from 'react-native';

import { Text } from '@ui/components/Text';

const backArrowIcon = require('@assets/images/icons/back-arrow.png');

type ScreenHeaderProps = {
  title?: string;
  onBack?: () => void;
};

export function ScreenHeader({ title, onBack }: ScreenHeaderProps) {
  return (
    <View className="flex-row items-center justify-between px-4 pt-3">
      {onBack ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Назад"
          onPress={onBack}
          className="screen-header-action-btn screen-header-action-btn--back"
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
