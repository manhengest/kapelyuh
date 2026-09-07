import { useRouter } from 'expo-router';
import { Image, Pressable, ScrollView, View } from 'react-native';

import { strings } from '@content/strings';
import { playTap } from '@infrastructure/audio/sounds';
import { getAppVersion } from '@shared/lib/appVersion';
import { AppLogo } from '@ui/components/AppLogo';
import { ScreenFooter } from '@ui/components/ScreenFooter';
import { ScreenHeader } from '@ui/components/ScreenHeader';
import { ScreenShell } from '@ui/components/ScreenShell';
import { ShadowCard } from '@ui/components/ShadowCard';
import { Text } from '@ui/components/Text';

const chevronIcon = require('@assets/images/icons/landing/chevron-arrow-right.png');

export default function AboutScreen() {
  const router = useRouter();
  const version = getAppVersion();

  const goHome = () => router.replace('/');
  const openPrivacy = () => {
    playTap();
    router.push('/privacy');
  };

  return (
    <ScreenShell>
      <ScreenHeader title={strings.about.title} onBack={() => router.back()} />
      <ScrollView
        className="flex-1 px-5"
        contentContainerClassName="gap-5 pb-32 pt-6"
        showsVerticalScrollIndicator={false}
      >
        <ShadowCard>
          <View className="panel-card items-center px-6 py-7">
            <AppLogo size="md" rounded />
            <Text className="mt-3 text-center text-3xl font-extrabold text-primaryText">
              {strings.appName}
            </Text>
            <Text className="mt-1 text-center text-sm font-bold text-primaryText/55">
              {strings.about.version(version)}
            </Text>
            <Text className="mt-3 text-center text-base font-bold text-primaryText">
              {strings.home.tagline}
            </Text>
          </View>
        </ShadowCard>

        <View>
          <Text className="section-title">{strings.about.summaryTitle}</Text>
          <ShadowCard>
            <View className="panel-card">
              {strings.about.facts.map((fact, index) => (
                <View key={fact.title}>
                  {index > 0 ? <View className="numbered-item-divider" /> : null}
                  <View className="numbered-item">
                    <View className="numbered-item-index">
                      <Text className="numbered-item-index-text">{index + 1}</Text>
                    </View>
                    <View className="min-w-0 flex-1">
                      <Text className="row-label">{fact.title}</Text>
                      <Text className="row-description">{fact.body}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </ShadowCard>
        </View>

        <ShadowCard>
          <View className="panel-card">
            <Pressable
              accessibilityRole="link"
              accessibilityLabel={strings.about.privacy}
              onPress={openPrivacy}
              className="panel-row active:bg-pickerSurface/80"
            >
              <Text className="row-label min-w-0 flex-1">{strings.about.privacy}</Text>
              <Image
                accessible={false}
                source={chevronIcon}
                style={{ width: 10, height: 16 }}
                resizeMode="contain"
              />
            </Pressable>
          </View>
        </ShadowCard>
      </ScrollView>
      <ScreenFooter label={strings.settings.play} onPress={goHome} />
    </ScreenShell>
  );
}
