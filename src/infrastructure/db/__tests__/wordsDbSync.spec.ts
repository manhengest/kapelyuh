import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import {
  clearWordsDbSyncStamp,
  markWordsDbSynced,
  shouldForceOverwriteWordsDb,
} from '@infrastructure/db/wordsDbSync';
import { getAppVersion } from '@shared/lib/appVersion';

jest.mock('@shared/lib/appVersion', () => ({
  getAppVersion: jest.fn(() => '1.0.3'),
  APP_VERSION: '1.0.3',
}));

const getAppVersionMock = getAppVersion as jest.MockedFunction<typeof getAppVersion>;

describe('infrastructure/db/wordsDbSync', () => {
  beforeEach(() => {
    clearWordsDbSyncStamp();
    getAppVersionMock.mockReturnValue('1.0.3');
  });

  it('requires overwrite when no version stamp is stored', () => {
    expect(shouldForceOverwriteWordsDb()).toBe(true);
  });

  it('skips overwrite when the stored stamp matches the app version', () => {
    markWordsDbSynced();
    expect(shouldForceOverwriteWordsDb()).toBe(false);
  });

  it('requires overwrite when the app version changes', () => {
    markWordsDbSynced();
    getAppVersionMock.mockReturnValue('1.0.4');
    expect(shouldForceOverwriteWordsDb()).toBe(true);
  });
});
