import { useFocusEffect, useRouter } from 'expo-router';
import { type ReactNode, useCallback, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { strings } from '@content/strings';
import { useSettingsStore } from '@features/settings/store';
import { setSentryEnabled } from '@infrastructure/analytics/sentry';
import { getSavedWordCount } from '@infrastructure/storage/savedWords';
import { ScreenFooter } from '@ui/components/ScreenFooter';
import { ScreenHeader } from '@ui/components/ScreenHeader';
import { ScreenShell } from '@ui/components/ScreenShell';
import { SettingsNavRow, SettingsToggleRow } from '@ui/components/SettingsRow';
import { ShadowCard } from '@ui/components/ShadowCard';
import { Text } from '@ui/components/Text';

function SettingsSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View>
      <Text className="section-title">{title}</Text>
      <ShadowCard>
        <View className="panel-card">{children}</View>
      </ShadowCard>
    </View>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const settings = useSettingsStore((store) => store.settings);
  const updateSettings = useSettingsStore((store) => store.updateSettings);
  const [savedCount, setSavedCount] = useState(getSavedWordCount);

  useFocusEffect(
    useCallback(() => {
      setSavedCount(getSavedWordCount());
    }, []),
  );

  return (
    <ScreenShell>
      <ScreenHeader title={strings.settings.title} onBack={() => router.back()} />
      <ScrollView className="flex-1 px-5" contentContainerClassName="gap-6 pb-32 pt-6">
        <SettingsSection title={strings.settings.sectionPlay}>
          <SettingsToggleRow
            glyph="sound"
            label={strings.settings.sound}
            description={strings.settings.soundDescription}
            value={settings.soundEnabled}
            onValueChange={(soundEnabled) => updateSettings({ soundEnabled })}
            showDivider
          />
          <SettingsToggleRow
            glyph="haptics"
            label={strings.settings.haptics}
            description={strings.settings.hapticsDescription}
            value={settings.hapticsEnabled}
            onValueChange={(hapticsEnabled) => updateSettings({ hapticsEnabled })}
            showDivider
          />
          <SettingsNavRow
            label={`${strings.settings.savedWords} · ${savedCount}`}
            onPress={() => router.push('/saved-words')}
          />
        </SettingsSection>
        <SettingsSection title={strings.settings.sectionScore}>
          <SettingsToggleRow
            glyph="skip"
            label={strings.settings.skipPenalty}
            description={strings.settings.skipPenaltyDescription}
            value={settings.skipPenaltyEnabled}
            onValueChange={(skipPenaltyEnabled) => updateSettings({ skipPenaltyEnabled })}
          />
        </SettingsSection>
        <SettingsSection title={strings.settings.sectionApp}>
          <SettingsToggleRow
            glyph="sentry"
            label={strings.settings.sentry}
            description={strings.settings.sentryDescription}
            value={settings.sentryEnabled}
            onValueChange={(sentryEnabled) => {
              updateSettings({ sentryEnabled });
              setSentryEnabled(sentryEnabled);
            }}
          />
        </SettingsSection>
      </ScrollView>
      <ScreenFooter label={strings.settings.play} onPress={() => router.replace('/')} />
    </ScreenShell>
  );
}
