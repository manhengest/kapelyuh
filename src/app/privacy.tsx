import { useRouter } from 'expo-router';
import { ImageBackground, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { strings } from '@content/strings';
import { ScreenFooter } from '@ui/components/ScreenFooter';
import { ScreenHeader } from '@ui/components/ScreenHeader';
import { Text } from '@ui/components/Text';

const mainBg = require('@assets/images/main-bg.png');

export default function PrivacyScreen() {
  const router = useRouter();

  return (
    <ImageBackground source={mainBg} resizeMode="cover" style={{ flex: 1 }}>
      <SafeAreaView className="flex-1">
        <ScreenHeader title={strings.privacy.headerTitle} onBack={() => router.back()} />

        <ScrollView className="flex-1 px-5" contentContainerClassName="py-6">
          <Text className="mb-6 text-sm text-slate-500">{strings.privacy.updated}</Text>
          {strings.privacy.sections.map((section) => (
            <View key={section.title} className="mb-6">
              <Text className="mb-2 text-lg font-bold text-slate-900">{section.title}</Text>
              <Text className="text-base leading-6 text-slate-700">{section.body}</Text>
            </View>
          ))}
        </ScrollView>

        <ScreenFooter label={strings.rules.wantToPlay} onPress={() => router.replace('/')} />
      </SafeAreaView>
    </ImageBackground>
  );
}
