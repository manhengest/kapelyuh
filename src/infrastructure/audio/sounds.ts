import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

import { useSettingsStore } from '@features/settings/store';

const END_SOURCE = require('@assets/sounds/game-end.mp3');
const GAME_START_SOURCE = require('@assets/sounds/game-start.mp3');
const GUESS_SOURCE = require('@assets/sounds/guessed.mp3');
const SKIP_SOURCE = require('@assets/sounds/skip.m4a');
const TAP_SOURCE = require('@assets/sounds/tap.mp3');
const TIMER_END_SOURCE = require('@assets/sounds/timer-end.m4a');

let initialized = false;
let guessPlayer: AudioPlayer | null = null;
let skipPlayer: AudioPlayer | null = null;
let endPlayer: AudioPlayer | null = null;
let tapPlayer: AudioPlayer | null = null;
let gameStartPlayer: AudioPlayer | null = null;
let timerEndPlayer: AudioPlayer | null = null;

function isSoundEnabled(): boolean {
  return useSettingsStore.getState().settings.soundEnabled;
}

async function play(player: AudioPlayer | null): Promise<void> {
  if (!player || !isSoundEnabled()) {
    return;
  }
  await player.seekTo(0);
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
  tapPlayer = createAudioPlayer(TAP_SOURCE);
  gameStartPlayer = createAudioPlayer(GAME_START_SOURCE);
  timerEndPlayer = createAudioPlayer(TIMER_END_SOURCE);
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

export function playTap(): void {
  play(tapPlayer);
}

export function playGameStart(): void {
  play(gameStartPlayer);
}

export function playTimerEnd(): void {
  play(timerEndPlayer);
}
