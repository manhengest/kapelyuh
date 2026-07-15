import { useRouter } from 'expo-router';
import { ImageBackground, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { strings } from '@content/strings';
import { useSettingsStore } from '@features/settings/store';
import { setSentryEnabled } from '@infrastructure/analytics/sentry';
import { ScreenFooter } from '@ui/components/ScreenFooter';
import { ScreenHeader } from '@ui/components/ScreenHeader';
import { SettingsToggleRow } from '@ui/components/SettingsRow';

const mainBg = require('@assets/images/main-bg.png');

export default function SettingsScreen() {
  const router = useRouter();
  const settings = useSettingsStore((store) => store.settings);
  const updateSettings = useSettingsStore((store) => store.updateSettings);

  return (
    <ImageBackground source={mainBg} resizeMode="cover" style={{ flex: 1 }}>
      <SafeAreaView className="flex-1">
        <ScreenHeader title={strings.settings.title} onBack={() => router.back()} />
        <ScrollView className="flex-1 px-5" contentContainerClassName="pb-8">
          <View>
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
        </ScrollView>
        <ScreenFooter label={strings.settings.play} onPress={() => router.replace('/')} />
      </SafeAreaView>
    </ImageBackground>
  );
}
