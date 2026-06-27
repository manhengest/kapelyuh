import * as Haptics from 'expo-haptics';

import { useSettingsStore } from '@features/settings/store';

export type HapticType = 'light' | 'warning' | 'heavy' | 'success';

function isHapticsEnabled(): boolean {
  return useSettingsStore.getState().settings.hapticsEnabled;
}

export async function triggerHaptic(type: HapticType): Promise<void> {
  if (!isHapticsEnabled()) {
    return;
  }

  switch (type) {
    case 'light':
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      break;
    case 'warning':
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      break;
    case 'heavy':
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      break;
    case 'success':
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      break;
  }
}

/** @deprecated Use triggerHaptic('light') */
export async function hapticLight(): Promise<void> {
  await triggerHaptic('light');
}

/** @deprecated Use triggerHaptic('warning') */
export async function hapticWarning(): Promise<void> {
  await triggerHaptic('warning');
}

/** @deprecated Use triggerHaptic('heavy') */
export async function hapticHeavy(): Promise<void> {
  await triggerHaptic('heavy');
}

/** @deprecated Use triggerHaptic('success') */
export async function hapticSuccess(): Promise<void> {
  await triggerHaptic('success');
}
