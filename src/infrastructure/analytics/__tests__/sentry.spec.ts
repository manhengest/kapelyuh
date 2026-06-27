import { describe, expect, it } from '@jest/globals';

import { getSentryRelease } from '@infrastructure/analytics/sentry';

describe('getSentryRelease', () => {
  it('returns release and dist from expo config', () => {
    const { release, dist } = getSentryRelease();
    expect(release).toMatch(/^kapelyukh@/);
    expect(dist).toBeTruthy();
  });
});
