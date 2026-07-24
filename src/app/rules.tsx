import { useRouter } from 'expo-router';
import { ImageBackground, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { strings } from '@content/strings';
import { Button } from '@ui/components/Button';
import { ContentColumn } from '@ui/components/ContentColumn';
import { ScreenHeader } from '@ui/components/ScreenHeader';
import { Text } from '@ui/components/Text';

const mainBg = require('@assets/images/main-bg.png');

export default function RulesScreen() {
  const router = useRouter();
  const steps = strings.rules.steps;

  return (
    <ImageBackground source={mainBg} resizeMode="cover" style={{ flex: 1 }}>
      <SafeAreaView className="flex-1">
        <ContentColumn className="flex-1">
          <ScreenHeader title={strings.home.rules} onBack={() => router.replace('/')} />
          <ScrollView className="flex-1" contentContainerClassName="px-6 pt-8 pb-4">
            {steps.map((entry) => (
              <View key={entry.title} className="mb-8">
                <Text className="mb-4 text-2xl font-bold text-slate-900">{entry.title}</Text>
                <Text className="mb-6 text-lg leading-6 text-slate-700">{entry.body}</Text>
                {entry.tipLabel && (
                  <View className="rounded-2xl bg-white/70 px-4 py-4">
                    <Text className="mb-1 text-lg font-bold uppercase text-pink-700">
                      {entry.tipLabel}
                    </Text>
                    <Text className="text-lg text-slate-800">{entry.tip}</Text>
                  </View>
                )}
                
              </View>
            ))}
          </ScrollView>

          <View className="px-5 pb-8 pt-4">
            <Button label={strings.rules.wantToPlay} onPress={() => router.replace('/')} />
          </View>
        </ContentColumn>
      </SafeAreaView>
    </ImageBackground>
  );
}