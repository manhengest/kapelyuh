import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

import { useSettingsStore } from '@features/settings/store';

const END_SOURCE = require('../../../assets/sounds/end.wav');
const GUESS_SOURCE = require('../../../assets/sounds/guess.wav');
const SKIP_SOURCE = require('../../../assets/sounds/skip.wav');

let initialized = false;
let guessPlayer: AudioPlayer | null = null;
let skipPlayer: AudioPlayer | null = null;
let endPlayer: AudioPlayer | null = null;

function isSoundEnabled(): boolean {
  return useSettingsStore.getState().settings.soundEnabled;
}

function play(player: AudioPlayer | null): void {
  if (!player || !isSoundEnabled()) {
    return;
  }
  player.seekTo(0);
  player.play();
}

export async function initSounds(): Promise<void> {
  if (initialized) {
    return;
  }

  await setAudioModeAsync({
    playsInSilentMode: false,
    shouldPlayInBackground: false,
    interruptionMode: 'mixWithOthers',
  });

  guessPlayer = createAudioPlayer(GUESS_SOURCE);
  skipPlayer = createAudioPlayer(SKIP_SOURCE);
  endPlayer = createAudioPlayer(END_SOURCE);
  initialized = true;
}

export function playGuess(): void {
  play(guessPlayer);
}

export function playSkip(): void {
  play(skipPlayer);
}

export function playEnd(): void {
  play(endPlayer);
}
