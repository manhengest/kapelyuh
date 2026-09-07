import type { ReactElement } from 'react';
import { Pressable, Switch, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Text } from '@ui/components/Text';

const TRACK_OFF = '#D9D2CE';
const TRACK_ON = '#FB6694';
const THUMB = '#FEFBF8';
const GLYPH_COLOR = '#FB6694';
const GLYPH_ON = '#FEFBF8';

export type SettingsGlyphName = 'sound' | 'haptics' | 'sentry' | 'skip';

type SettingsRowProps = {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  glyph?: SettingsGlyphName;
  showDivider?: boolean;
};

export function SettingsToggleRow({
  label,
  description,
  value,
  onValueChange,
  glyph,
  showDivider = false,
}: SettingsRowProps) {
  return (
    <View>
      <Pressable
        accessibilityRole="switch"
        accessibilityState={{ checked: value }}
        accessibilityLabel={label}
        accessibilityHint={description}
        onPress={() => onValueChange(!value)}
        className="settings-row active:bg-pickerSurface/80"
      >
        {glyph ? (
          <View className="settings-row-icon">
            <SettingsGlyph name={glyph} />
          </View>
        ) : null}
        <View className="min-w-0 flex-1">
          <Text className="row-label">{label}</Text>
          {description ? <Text className="row-description">{description}</Text> : null}
        </View>
        <Switch
          accessible={false}
          importantForAccessibility="no"
          pointerEvents="none"
          value={value}
          trackColor={{ false: TRACK_OFF, true: TRACK_ON }}
          thumbColor={THUMB}
          ios_backgroundColor={TRACK_OFF}
        />
      </Pressable>
      {showDivider ? <View className="settings-row-divider" /> : null}
    </View>
  );
}

type SettingsLinkRowProps = {
  label: string;
  onPress: () => void;
};

export function SettingsLinkRow({ label, onPress }: SettingsLinkRowProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className="py-3"
    >
      <Text className="text-base font-medium text-blue-600">{label}</Text>
    </Pressable>
  );
}

const GLYPH_SIZE = 22;

const SETTINGS_GLYPHS: Record<SettingsGlyphName, () => ReactElement> = {
  sound: () => (
    <Svg width={GLYPH_SIZE} height={GLYPH_SIZE} viewBox="0 0 24 24" fill="none">
      <Path d="M3 10h3.2L11 6v12l-4.8-4H3a1 1 0 01-1-1v-2a1 1 0 011-1z" fill={GLYPH_COLOR} />
      <Path
        d="M15.2 8.2a4 4 0 010 7.6M17.8 6a7 7 0 010 12"
        stroke={GLYPH_COLOR}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  ),
  haptics: () => (
    <Svg width={GLYPH_SIZE} height={GLYPH_SIZE} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 4h6a2 2 0 012 2v12a2 2 0 01-2 2H9a2 2 0 01-2-2V6a2 2 0 012-2z"
        fill={GLYPH_COLOR}
      />
      <Path d="M12 17.2a.8.8 0 100-1.6.8.8 0 000 1.6z" fill={GLYPH_ON} />
      <Path d="M4 9v6M20 9v6" stroke={GLYPH_COLOR} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  ),
  sentry: () => (
    <Svg width={GLYPH_SIZE} height={GLYPH_SIZE} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3l8 3.2v6.2c0 4.4-3 7.5-8 8.6-5-1.1-8-4.2-8-8.6V6.2L12 3z"
        fill={GLYPH_COLOR}
      />
      <Path
        d="M9.2 12.2l1.8 1.8 4-4"
        stroke={GLYPH_ON}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  ),
  skip: () => (
    <Svg width={GLYPH_SIZE} height={GLYPH_SIZE} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3a9 9 0 100 18 9 9 0 000-18z" fill={GLYPH_COLOR} />
      <Path d="M8 12h8" stroke={GLYPH_ON} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  ),
};

function SettingsGlyph({ name }: { name: SettingsGlyphName }) {
  const Glyph = SETTINGS_GLYPHS[name];
  return <Glyph />;
}
