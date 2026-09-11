import { useEffect, useRef, useState } from 'react';
import { Animated, Modal, Pressable, View } from 'react-native';

import { difficultyLabels, strings } from '@content/strings';
import type { Difficulty } from '@domain/game/types';
import { getWordTextMap } from '@infrastructure/db/words.repo';
import { saveWords } from '@infrastructure/storage/savedWords';
import { Button } from '@ui/components/Button';
import { Text } from '@ui/components/Text';

type PauseModalProps = {
  visible: boolean;
  roundLine: string;
  teamName: string;
  onResume: () => void;
  onExit: () => void;
};

export function PauseModal({ visible, roundLine, teamName, onResume, onExit }: PauseModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 justify-end bg-black/50">
        <View className="rounded-t-3xl bg-white px-6 pb-10 pt-6">
          <Text className="mb-2 text-center text-2xl font-bold text-black">
            {strings.pause.title}
          </Text>
          <Text className="mb-1 text-center text-base text-slate-600">{roundLine}</Text>
          <Text className="mb-8 text-center text-base text-slate-600">
            {strings.pause.team(teamName)}
          </Text>
          <View className="gap-3">
            <Button textClassName="text-xl" label={strings.pause.resume} onPress={onResume} />
            <Button
              textClassName="text-xl"
              label={strings.pause.exit}
              variant="outline"
              onPress={onExit}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

type AwardModalProps = {
  visible: boolean;
  teams: { id: string; name: string }[];
  selectedTeamId: string | null | undefined;
  onSelect: (teamId: string | null) => void;
  onConfirm: () => void;
};

export function AwardModal({
  visible,
  teams,
  selectedTeamId,
  onSelect,
  onConfirm,
}: AwardModalProps) {
  const hasSelection = selectedTeamId !== undefined;
  const [overlayOpacity] = useState(() => new Animated.Value(0));
  const [contentTranslateY] = useState(() => new Animated.Value(300));

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(overlayOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.timing(contentTranslateY, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]).start();
    } else {
      overlayOpacity.setValue(0);
      contentTranslateY.setValue(300);
    }
  }, [visible, overlayOpacity, contentTranslateY]);

  return (
    <Modal visible={visible} transparent animationType="none">
      <Animated.View style={{ opacity: overlayOpacity }} className="flex-1 justify-end bg-black/50">
        <Animated.View
          style={{ transform: [{ translateY: contentTranslateY }] }}
          className="rounded-t-3xl bg-white px-6 pb-10 pt-6"
        >
          <Text className="mb-4 text-center text-2xl font-bold text-black">
            {strings.award.title}
          </Text>
          <View className="mb-4 gap-2">
            {teams.map((team) => (
              <Pressable
                key={team.id}
                accessibilityRole="radio"
                accessibilityState={{ selected: selectedTeamId === team.id }}
                onPress={() => onSelect(team.id)}
                className={`award-option ${selectedTeamId === team.id ? 'award-option--selected' : ''}`}
              >
                <Text className="text-base font-medium text-black">{team.name}</Text>
              </Pressable>
            ))}
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ selected: selectedTeamId === null }}
              onPress={() => onSelect(null)}
              className={`award-option ${selectedTeamId === null ? 'award-option--selected' : ''}`}
            >
              <Text className="text-base font-medium text-black">{strings.award.nobody}</Text>
            </Pressable>
          </View>
          <Button
            textClassName="text-2xl"
            label={strings.common.done}
            disabled={!hasSelection}
            onPress={onConfirm}
          />
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

type ConfirmExitModalProps = {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmExitModal({ visible, onConfirm, onCancel }: ConfirmExitModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 justify-end bg-black/50">
        <View className="rounded-t-3xl bg-white px-6 pb-10 pt-6">
          <Text className="mb-6 text-center text-2xl font-bold text-black">
            {strings.review.confirmStop}
          </Text>
          <View className="gap-3">
            <Button textClassName="text-xl" label={strings.pause.exit} onPress={onConfirm} />
            <Button
              textClassName="text-xl"
              label={strings.common.back}
              variant="outline"
              onPress={onCancel}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const SAVE_WORDS_DIFFICULTIES = ['easy', 'medium', 'hard', 'elite'] as const;

type SaveWordsModalProps = {
  texts: readonly string[];
  onDecline: () => void;
  onComplete: () => void;
};

type SaveWordsStep = 'prompt' | 'difficulty' | 'result';

export function SaveWordsModal({ texts, onDecline, onComplete }: SaveWordsModalProps) {
  const [step, setStep] = useState<SaveWordsStep>('prompt');
  const [saved, setSaved] = useState(0);
  const [skipped, setSkipped] = useState(0);
  const savingRef = useRef(false);

  const onPickDifficulty = (difficulty: Difficulty) => {
    if (savingRef.current) {
      return;
    }
    savingRef.current = true;
    void (async () => {
      const bundled = await getWordTextMap();
      const result = saveWords(texts, difficulty, Object.values(bundled));
      setSaved(result.saved);
      setSkipped(result.skipped);
      setStep('result');
      savingRef.current = false;
    })();
  };

  return (
    <Modal visible transparent animationType="fade">
      <View className="flex-1 justify-end bg-black/50">
        <View className="rounded-t-3xl bg-white px-6 pb-10 pt-6">
          {step === 'prompt' ? (
            <>
              <Text className="mb-6 text-center text-2xl font-bold text-black">
                {strings.results.saveWords.promptTitle}
              </Text>
              <View className="gap-3">
                <Button
                  textClassName="text-xl"
                  label={strings.results.saveWords.yes}
                  onPress={() => setStep('difficulty')}
                />
                <Button
                  textClassName="text-xl"
                  label={strings.results.saveWords.no}
                  variant="outline"
                  onPress={onDecline}
                />
              </View>
            </>
          ) : null}
          {step === 'difficulty' ? (
            <>
              <Text className="mb-4 text-center text-2xl font-bold text-black">
                {strings.results.saveWords.difficultyTitle}
              </Text>
              <View className="gap-2">
                {SAVE_WORDS_DIFFICULTIES.map((id) => (
                  <Button
                    key={id}
                    textClassName="text-xl"
                    label={difficultyLabels[id]}
                    onPress={() => onPickDifficulty(id)}
                  />
                ))}
              </View>
            </>
          ) : null}
          {step === 'result' ? (
            <>
              <Text className="mb-2 text-center text-2xl font-bold text-black">
                {strings.results.saveWords.result(saved, texts.length)}
              </Text>
              {skipped > 0 ? (
                <Text className="mb-6 text-center text-base text-slate-600">
                  {strings.results.saveWords.duplicatesRemoved}
                </Text>
              ) : (
                <View className="mb-6" />
              )}
              <Button textClassName="text-xl" label={strings.common.done} onPress={onComplete} />
            </>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}
