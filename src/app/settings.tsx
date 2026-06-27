import { useRouter } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { strings } from '@content/strings';
import { useSettingsStore } from '@features/settings/store';
import { setSentryEnabled } from '@infrastructure/analytics/sentry';
import { HorizontalPicker } from '@ui/components/HorizontalPicker';
import { ScreenHeader } from '@ui/components/ScreenHeader';
import { SettingsLinkRow, SettingsToggleRow } from '@ui/components/SettingsRow';

const THEME_OPTIONS = ['system', 'light', 'dark'] as const;

function formatTheme(value: (typeof THEME_OPTIONS)[number]): string {
  switch (value) {
    case 'light':
      return strings.settings.themeLight;
    case 'dark':
      return strings.settings.themeDark;
    default:
      return strings.settings.themeSystem;
  }
}

export default function SettingsScreen() {
  const router = useRouter();
  const settings = useSettingsStore((store) => store.settings);
  const updateSettings = useSettingsStore((store) => store.updateSettings);

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-900">
      <ScreenHeader title={strings.settings.title} onBack={() => router.back()} />
      <ScrollView className="flex-1 px-5" contentContainerClassName="pb-8">
        <View className="divide-y divide-slate-200 dark:divide-slate-700">
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
            label={strings.settings.reduceMotion}
            description={strings.settings.reduceMotionDescription}
            value={settings.reduceMotion === 'on'}
            onValueChange={(enabled) =>
              updateSettings({ reduceMotion: enabled ? 'on' : 'system' })
            }
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
        </View>

        <View className="mt-6">
          <HorizontalPicker
            label={strings.settings.theme}
            options={[...THEME_OPTIONS]}
            value={settings.theme}
            onChange={(theme) => updateSettings({ theme })}
            formatOption={formatTheme}
          />
        </View>

        <View className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-700">
          <SettingsLinkRow
            label={strings.settings.about}
            onPress={() => router.push('/about')}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
