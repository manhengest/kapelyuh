import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { strings } from '@content/strings';
import { AppLogo } from '@ui/components/AppLogo';
import { Button } from '@ui/components/Button';
import { ScreenHeader } from '@ui/components/ScreenHeader';
import { Text } from '@ui/components/Text';

export default function AboutScreen() {
  const router = useRouter();
  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScreenHeader title={strings.about.title} onBack={() => router.back()} />
      <ScrollView className="flex-1 px-5" contentContainerClassName="py-6">
        <View className="mb-2 items-center">
          <AppLogo size="lg" />
        </View>
        <Text className="mb-2 text-center text-3xl font-bold text-slate-900">
          {strings.appName}
        </Text>
        <Text className="mb-6 text-center text-sm text-slate-500">
          {strings.about.version(version)}
        </Text>
        <Text className="mb-8 text-center text-base leading-6 text-slate-700">
          {strings.about.description}
        </Text>
        <Button
          label={strings.about.privacy}
          variant="outline"
          onPress={() => router.push('/privacy')}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
