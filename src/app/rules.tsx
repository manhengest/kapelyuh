import { useRouter } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { strings } from '@content/strings';
import { Button } from '@ui/components/Button';
import { Text } from '@ui/components/Text';

export default function RulesScreen() {
  const router = useRouter();
  const steps = strings.rules.steps;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerClassName="px-6 pt-8 pb-4">
        {steps.map((entry) => (
          <View key={entry.title} className="mb-8">
            <Text className="mb-4 text-2xl font-bold text-slate-900">{entry.title}</Text>
            <Text className="mb-6 text-base leading-6 text-slate-700">{entry.body}</Text>
            <View className="rounded-2xl bg-pink-100 px-4 py-4">
              <Text className="mb-1 text-xs font-bold uppercase text-pink-700">
                {entry.tipLabel}
              </Text>
              <Text className="text-base text-slate-800">{entry.tip}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View className="px-5 pb-8 pt-4">
        <Button label={strings.rules.wantToPlay} onPress={() => router.replace('/')} />
      </View>
    </SafeAreaView>
  );
}