import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { makeSettings, makeTeam } from '@domain/game/__tests__/helpers';
import { createInitialState } from '@domain/game/reducer';
import { useGameStore } from '@features/game/store';
import { saveFinishedSession } from '@infrastructure/db/sessions.repo';
import { clearActiveMatch } from '@infrastructure/storage/activeMatch';

jest.mock('@infrastructure/db/sessions.repo', () => ({
  saveFinishedSession: jest.fn(async () => undefined),
}));

jest.mock('@infrastructure/storage/activeMatch', () => ({
  getActiveMatch: jest.fn(() => null),
  setActiveMatch: jest.fn(),
  clearActiveMatch: jest.fn(),
}));

const saveFinishedSessionMock = saveFinishedSession as jest.MockedFunction<typeof saveFinishedSession>;
const clearActiveMatchMock = clearActiveMatch as jest.MockedFunction<typeof clearActiveMatch>;

describe('features/game/store session persistence', () => {
  beforeEach(() => {
    saveFinishedSessionMock.mockClear();
    clearActiveMatchMock.mockClear();
    useGameStore.setState({
      state: {
        ...createInitialState(100),
        status: 'stat_carousel',
        statCardsRemaining: 1,
        settings: makeSettings(),
        teams: [makeTeam('t1', 'A'), makeTeam('t2', 'B')],
        rounds: [
          {
            type: 'elias',
            sessionWordIds: ['w-1', 'w-2', 'w-3'],
            remainingWordIds: [],
            guessedWordIds: ['w-1', 'w-2', 'w-3'],
            turnIndex: 0,
          },
        ],
        currentRoundIndex: 2,
      },
      hydrated: true,
      pauseModalVisible: false,
    });
  });

  it('persists finished session when match ends', () => {
    useGameStore.getState().dispatch({ type: 'DISMISS_STAT_CAROUSEL', now: 200 });

    expect(useGameStore.getState().state.status).toBe('end_of_match');
    expect(saveFinishedSessionMock).toHaveBeenCalledTimes(1);
    expect(clearActiveMatchMock).toHaveBeenCalled();
  });
});
