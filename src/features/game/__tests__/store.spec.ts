import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { makeSettings, makeTeam } from '@domain/game/__tests__/helpers';
import { createInitialState } from '@domain/game/reducer';
import { useGameStore } from '@features/game/store';
import { saveFinishedSession } from '@infrastructure/db/sessions.repo';
import { clearActiveMatch } from '@infrastructure/storage/activeMatch';
import {
  addCustomWord,
  clearCustomWords,
  getCustomWords,
} from '@infrastructure/storage/customWords';
import {
  getUsageMap,
  getWordUsage,
  markWordsUsed,
  resetWordUsage,
} from '@infrastructure/storage/wordUsage';

jest.mock('@infrastructure/db/sessions.repo', () => ({
  saveFinishedSession: jest.fn(async () => undefined),
}));

jest.mock('@infrastructure/storage/activeMatch', () => ({
  getActiveMatch: jest.fn(() => null),
  setActiveMatch: jest.fn(),
  clearActiveMatch: jest.fn(),
}));

const saveFinishedSessionMock = saveFinishedSession as jest.MockedFunction<
  typeof saveFinishedSession
>;
const clearActiveMatchMock = clearActiveMatch as jest.MockedFunction<typeof clearActiveMatch>;

describe('features/game/store session persistence', () => {
  beforeEach(() => {
    saveFinishedSessionMock.mockClear();
    clearActiveMatchMock.mockClear();
    resetWordUsage();
    clearCustomWords();
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

  it('marks session words used exactly once per match', () => {
    useGameStore.getState().dispatch({ type: 'DISMISS_STAT_CAROUSEL', now: 200 });

    expect(getWordUsage('w-1')).toBe(1);
    expect(getWordUsage('w-2')).toBe(1);
    expect(getWordUsage('w-3')).toBe(1);

    // Explicit second mark with same session key is a no-op
    markWordsUsed(['w-1', 'w-2', 'w-3'], '100');
    expect(getWordUsage('w-1')).toBe(1);
  });

  it('does not mark words used when a match is abandoned', () => {
    useGameStore.setState({
      state: {
        ...createInitialState(100),
        status: 'in_turn',
        settings: makeSettings(),
        teams: [makeTeam('t1', 'A'), makeTeam('t2', 'B')],
        rounds: [
          {
            type: 'elias',
            sessionWordIds: ['w-1', 'w-2', 'w-3'],
            remainingWordIds: ['w-2', 'w-3'],
            guessedWordIds: ['w-1'],
            turnIndex: 0,
          },
        ],
      },
    });

    useGameStore.getState().abandonMatch();

    expect(useGameStore.getState().state.status).toBe('idle');
    expect(getWordUsage('w-1')).toBe(0);
    expect(getWordUsage('w-2')).toBe(0);
    expect(getWordUsage('w-3')).toBe(0);
    expect(getUsageMap()).toEqual({});
    expect(clearActiveMatchMock).toHaveBeenCalled();
  });

  it('skips usage marking and clears custom words when a custom match ends', () => {
    expect(addCustomWord('футбол')).toBe('added');
    useGameStore.setState({
      state: {
        ...createInitialState(100),
        status: 'stat_carousel',
        statCardsRemaining: 1,
        settings: makeSettings({ wordSource: 'custom' }),
        teams: [makeTeam('t1', 'A'), makeTeam('t2', 'B')],
        rounds: [
          {
            type: 'elias',
            sessionWordIds: ['custom_1'],
            remainingWordIds: [],
            guessedWordIds: ['custom_1'],
            turnIndex: 0,
          },
        ],
        currentRoundIndex: 2,
      },
    });

    useGameStore.getState().dispatch({ type: 'DISMISS_STAT_CAROUSEL', now: 200 });

    expect(getWordUsage('custom_1')).toBe(0);
    expect(getCustomWords()).toEqual({});
    expect(saveFinishedSessionMock).toHaveBeenCalledTimes(1);
  });

  it('clears leftover custom words when entering building_hat', () => {
    expect(addCustomWord('старий')).toBe('added');
    useGameStore.setState({
      state: {
        ...createInitialState(100),
        status: 'setup_teams',
        settings: makeSettings({ wordSource: 'custom' }),
      },
    });

    useGameStore.getState().dispatch({
      type: 'TEAMS_COMPLETED',
      teams: [makeTeam('t1', 'A'), makeTeam('t2', 'B')],
      sessionWordIds: [],
      now: 200,
    });

    expect(useGameStore.getState().state.status).toBe('building_hat');
    expect(getCustomWords()).toEqual({});
  });

  it('clears custom words when a match is abandoned', () => {
    expect(addCustomWord('футбол')).toBe('added');
    useGameStore.setState({
      state: {
        ...createInitialState(100),
        status: 'building_hat',
        settings: makeSettings({ wordSource: 'custom' }),
        teams: [makeTeam('t1', 'A'), makeTeam('t2', 'B')],
      },
    });

    useGameStore.getState().abandonMatch();

    expect(getCustomWords()).toEqual({});
  });
});
