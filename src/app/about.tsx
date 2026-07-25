import { useRouter } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { strings } from '@content/strings';
import { getAppVersion } from '@shared/lib/appVersion';
import { AppLogo } from '@ui/components/AppLogo';
import { ContentColumn } from '@ui/components/ContentColumn';
import { ScreenFooter } from '@ui/components/ScreenFooter';
import { ScreenHeader } from '@ui/components/ScreenHeader';
import { Text } from '@ui/components/Text';

export default function AboutScreen() {
  const router = useRouter();
  const version = getAppVersion();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ContentColumn className="flex-1">
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
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={strings.about.privacy}
            onPress={() => router.push('/privacy')}
            className="items-center py-2"
          >
            <Text className="text-lg text-blue-600">{strings.about.privacy}</Text>
          </Pressable>
        </ScrollView>
        <ScreenFooter label={strings.settings.play} onPress={() => router.replace('/')} />
      </ContentColumn>
    </SafeAreaView>
  );
}
