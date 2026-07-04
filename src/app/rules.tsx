import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Dimensions, NativeScrollEvent, NativeSyntheticEvent, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { strings } from '@content/strings';
import { Button } from '@ui/components/Button';
import { Text } from '@ui/components/Text';

const { width } = Dimensions.get('window');

export default function RulesScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [step, setStep] = useState(0);
  const steps = strings.rules.steps;

  const onMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nextStep = Math.round(event.nativeEvent.contentOffset.x / width);
    setStep(nextStep);
  };

  const goNext = () => {
    if (step >= steps.length - 1) {
      router.replace('/');
      return;
    }
    const next = step + 1;
    scrollRef.current?.scrollTo({ x: next * width, animated: true });
    setStep(next);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumScrollEnd}
      >
        {steps.map((entry) => (
          <View key={entry.title} style={{ width }} className="flex-1 px-6 pt-8">
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
        <Text className="mb-4 text-center text-sm text-slate-500">
          {step + 1} / {steps.length}
        </Text>
        <Button
          label={step === steps.length - 1 ? strings.rules.wantToPlay : strings.common.next}
          onPress={goNext}
        />
        <View className="mt-3">
          <Button label={strings.rules.skipAll} variant="outline" onPress={() => router.replace('/')} />
        </View>
      </View>
    </SafeAreaView>
  );
}
