import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

import { useAppSettings } from '@features/settings/store';

export function useReducedMotion(): boolean {
  const reduceMotionSetting = useAppSettings().reduceMotion;
  const [systemReduced, setSystemReduced] = useState(false);

  useEffect(() => {
    let mounted = true;

    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) {
        setSystemReduced(enabled);
      }
    });

    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) => {
      setSystemReduced(enabled);
    });

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  if (reduceMotionSetting === 'on') {
    return true;
  }

  return systemReduced;
}
