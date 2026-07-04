import { useRouter } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { strings } from '@content/strings';
import { ScreenHeader } from '@ui/components/ScreenHeader';
import { Text } from '@ui/components/Text';

export default function PrivacyScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScreenHeader title={strings.privacy.title} onBack={() => router.back()} />
      <ScrollView className="flex-1 px-5" contentContainerClassName="py-6">
        <Text className="mb-6 text-sm text-slate-500">
          {strings.privacy.updated}
        </Text>
        {strings.privacy.sections.map((section) => (
          <View key={section.title} className="mb-6">
            <Text className="mb-2 text-lg font-bold text-slate-900">
              {section.title}
            </Text>
            <Text className="text-base leading-6 text-slate-700">
              {section.body}
            </Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
