import { useRouter } from 'expo-router';
import { type ReactNode } from 'react';
import { Image, ScrollView, View } from 'react-native';

import { strings } from '@content/strings';
import { ScreenFooter } from '@ui/components/ScreenFooter';
import { ScreenHeader } from '@ui/components/ScreenHeader';
import { ScreenShell } from '@ui/components/ScreenShell';
import { ShadowCard } from '@ui/components/ShadowCard';
import { Text } from '@ui/components/Text';

const ROUND_ICONS = {
  elias: require('@assets/images/icons/round-intro/elias-round-icon.png.png'),
  crocodile: require('@assets/images/icons/round-intro/crocodile-round-icon.png'),
  association: require('@assets/images/icons/round-intro/association-round-icon.png'),
} as const;

const ROUND_STRIPE = {
  elias: 'bg-round1',
  crocodile: 'bg-round2',
  association: 'bg-round3',
} as const;

function RulesCard({ children }: { children: ReactNode }) {
  return (
    <ShadowCard>
      <View className="panel-card">{children}</View>
    </ShadowCard>
  );
}

function RulesSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="gap-3">
      <Text className="section-title">{title}</Text>
      {children}
    </View>
  );
}

function Callout({
  variant,
  label,
  body,
}: {
  variant: 'warn' | 'tip';
  label: string;
  body: string;
}) {
  return (
    <View
      className={`rules-callout ${variant === 'warn' ? 'rules-callout--warn' : 'rules-callout--tip'}`}
    >
      <Text className="rules-callout-label">{label}</Text>
      <Text className="rules-callout-body">{body}</Text>
    </View>
  );
}

export default function RulesScreen() {
  const router = useRouter();
  const goHome = () => router.replace('/');

  return (
    <ScreenShell>
      <ScreenHeader title={strings.home.rules} backIcon="home" onBack={goHome} />
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-6 px-5 pb-32 pt-5"
        showsVerticalScrollIndicator={false}
      >
        <RulesSection title={strings.rules.basics.title}>
          <RulesCard>
            {strings.rules.basics.items.map((item, index) => (
              <View key={item}>
                {index > 0 ? <View className="numbered-item-divider" /> : null}
                <View className="numbered-item">
                  <View className="numbered-item-index">
                    <Text className="numbered-item-index-text">{index + 1}</Text>
                  </View>
                  <Text className="numbered-item-text">{item}</Text>
                </View>
              </View>
            ))}
          </RulesCard>
          <Callout
            variant="warn"
            label={strings.rules.basics.calloutLabel}
            body={strings.rules.basics.callout}
          />
        </RulesSection>

        <RulesSection title={strings.rules.explain.title}>
          <Text className="px-1 text-[15px] leading-5 text-primaryText/70">
            {strings.rules.explain.intro}
          </Text>
          <View className="gap-2.5">
            {strings.rules.explain.rounds.map((round) => (
              <RulesCard key={round.key}>
                <View className="flex-row">
                  <View className={`rules-round-stripe ${ROUND_STRIPE[round.key]}`} />
                  <View className="min-w-0 flex-1 flex-row items-center gap-3 px-4 py-3">
                    <Image
                      accessible={false}
                      source={ROUND_ICONS[round.key]}
                      style={{ width: 40, height: 40 }}
                      resizeMode="contain"
                    />
                    <View className="min-w-0 flex-1">
                      <Text className="rules-round-name">{round.name}</Text>
                      <Text className="rules-round-body">{round.body}</Text>
                    </View>
                  </View>
                </View>
              </RulesCard>
            ))}
          </View>
          <Callout
            variant="tip"
            label={strings.rules.explain.tipLabel}
            body={strings.rules.explain.tip}
          />
        </RulesSection>

        <RulesSection title={strings.rules.scoring.title}>
          <RulesCard>
            <View className="numbered-item">
              <View className="rules-score-badge">
                <Text className="rules-score-badge-text">+1</Text>
              </View>
              <Text className="numbered-item-text">{strings.rules.scoring.guess}</Text>
            </View>
            <View className="rules-card-divider" />
            <View className="numbered-item">
              <View className="rules-score-badge">
                <Text className="rules-score-badge-text">−1</Text>
              </View>
              <Text className="numbered-item-text">{strings.rules.scoring.skip}</Text>
            </View>
            <View className="rules-card-divider" />
            <View className="px-4 py-3.5">
              <Text className="numbered-item-text">{strings.rules.scoring.winner}</Text>
            </View>
          </RulesCard>
          <Callout
            variant="warn"
            label={strings.rules.scoring.calloutLabel}
            body={strings.rules.scoring.callout}
          />
        </RulesSection>

        <RulesSection title={strings.rules.prep.title}>
          <RulesCard>
            <View className="px-4 py-3.5">
              <Text className="numbered-item-text">{strings.rules.prep.body}</Text>
            </View>
          </RulesCard>
          <Callout
            variant="tip"
            label={strings.rules.prep.tipLabel}
            body={strings.rules.prep.tip}
          />
          <RulesCard>
            <View className="px-4 py-3.5">
              <Text className="mb-1 text-lg font-extrabold text-primaryText">
                {strings.rules.customHat.title}
              </Text>
              <Text className="numbered-item-text">{strings.rules.customHat.body}</Text>
            </View>
          </RulesCard>
          <Callout
            variant="tip"
            label={strings.rules.customHat.tipLabel}
            body={strings.rules.customHat.tip}
          />
        </RulesSection>

        <RulesSection title={strings.rules.emptyHat.title}>
          <RulesCard>
            {strings.rules.emptyHat.items.map((item, index) => (
              <View key={item.title}>
                {index > 0 ? <View className="rules-card-divider" /> : null}
                <View className="px-4 py-3.5">
                  <Text className="mb-0.5 text-lg font-extrabold text-primaryText">
                    {item.title}
                  </Text>
                  <Text className="rules-round-body">{item.body}</Text>
                </View>
              </View>
            ))}
          </RulesCard>
        </RulesSection>
      </ScrollView>
      <ScreenFooter label={strings.rules.wantToPlay} onPress={goHome} />
    </ScreenShell>
  );
}
