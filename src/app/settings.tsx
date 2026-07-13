import { useRouter } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { strings } from '@content/strings';
import { useSettingsStore } from '@features/settings/store';
import { setSentryEnabled } from '@infrastructure/analytics/sentry';
import { ScreenHeader } from '@ui/components/ScreenHeader';
import { SettingsLinkRow, SettingsToggleRow } from '@ui/components/SettingsRow';

export default function SettingsScreen() {
  const router = useRouter();
  const settings = useSettingsStore((store) => store.settings);
  const updateSettings = useSettingsStore((store) => store.updateSettings);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScreenHeader title={strings.settings.title} onBack={() => router.back()} />
      <ScrollView className="flex-1 px-5" contentContainerClassName="pb-8">
        <View className="divide-y divide-slate-200">
          <SettingsToggleRow
            label={strings.settings.sound}
            description={strings.settings.soundDescription}
            value={settings.soundEnabled}
            onValueChange={(soundEnabled) => updateSettings({ soundEnabled })}
          />
          <SettingsToggleRow
            label={strings.settings.haptics}
            description={strings.settings.hapticsDescription}
            value={settings.hapticsEnabled}
            onValueChange={(hapticsEnabled) => updateSettings({ hapticsEnabled })}
          />
          <SettingsToggleRow
            label={strings.settings.sentry}
            description={strings.settings.sentryDescription}
            value={settings.sentryEnabled}
            onValueChange={(sentryEnabled) => {
              updateSettings({ sentryEnabled });
              setSentryEnabled(sentryEnabled);
            }}
          />
          <SettingsToggleRow
            label={strings.settings.skipPenalty}
            description={strings.settings.skipPenaltyDescription}
            value={settings.skipPenaltyEnabled}
            onValueChange={(skipPenaltyEnabled) => updateSettings({ skipPenaltyEnabled })}
          />
        </View>

        <View className="mt-4 border-t border-slate-200 pt-4">
          <SettingsLinkRow
            label={strings.settings.about}
            onPress={() => router.push('/about')}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
