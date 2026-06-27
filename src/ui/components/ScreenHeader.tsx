import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

type ScreenHeaderProps = {
  title?: string;
  showHome?: boolean;
  onHomePress?: () => void;
  onBack?: () => void;
  textColor?: string;
};

export function ScreenHeader({
  title,
  showHome = false,
  onHomePress,
  onBack,
  textColor = '#1A1A1A',
}: ScreenHeaderProps) {
  const router = useRouter();

  const leftAction = onBack ?? (showHome ? (onHomePress ?? (() => router.replace('/'))) : undefined);

  return (
    <View className="flex-row items-center justify-between px-4 pt-2">
      {leftAction ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={onBack ? 'Назад' : 'На головну'}
          onPress={leftAction}
          className={`h-11 w-11 items-center justify-center rounded-full ${onBack ? 'bg-slate-100 dark:bg-slate-800' : 'bg-black/10'}`}
        >
          <Text style={{ color: textColor, fontSize: onBack ? 24 : 20 }}>{onBack ? '‹' : '🏠'}</Text>
        </Pressable>
      ) : (
        <View className="h-11 w-11" />
      )}
      {title ? (
        <Text style={{ color: textColor }} className="text-lg font-semibold">
          {title}
        </Text>
      ) : (
        <View />
      )}
      <View className="h-11 w-11" />
    </View>
  );
}
