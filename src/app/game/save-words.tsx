import { useRouter } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';

import { difficultyLabels, strings } from '@content/strings';
import { DIFFICULTY_ORDER, type Difficulty } from '@domain/game/types';
import { customHatWordTexts } from '@features/game/customHatWords';
import { useGameActions, useGameState } from '@features/game/hooks';
import { useBundledWordTexts } from '@features/game/useWordTextMap';
import { playTap } from '@infrastructure/audio/sounds';
import {
  classifyHatWord,
  deleteSavedWord,
  savedWordId,
  saveWords,
  type HatWordClassification,
} from '@infrastructure/storage/savedWords';
import { Button } from '@ui/components/Button';
import { CloseIcon } from '@ui/components/CloseIcon';
import { HorizontalPicker } from '@ui/components/HorizontalPicker';
import { ScreenFooter } from '@ui/components/ScreenFooter';
import { ScreenHeader } from '@ui/components/ScreenHeader';
import { ScreenShell } from '@ui/components/ScreenShell';
import { ShadowCard } from '@ui/components/ShadowCard';
import { Text } from '@ui/components/Text';

const DEFAULT_DIFFICULTY: Difficulty = 'hard';

type SaveRow = {
  text: string;
  classification: HatWordClassification;
  difficulty: Difficulty;
};

type HatRowView = {
  showDelete: boolean;
  removeSavedWord: boolean;
  showPicker: boolean;
  includeInSave: boolean;
  lockedLabel: string | null;
  difficulty: Difficulty;
};

function hatRowView(classification: HatWordClassification): HatRowView {
  switch (classification.state) {
    case 'new':
      return {
        showDelete: true,
        removeSavedWord: false,
        showPicker: true,
        includeInSave: true,
        lockedLabel: null,
        difficulty: DEFAULT_DIFFICULTY,
      };
    case 'saved':
      return {
        showDelete: true,
        removeSavedWord: true,
        showPicker: false,
        includeInSave: false,
        lockedLabel: strings.results.saveWords.alreadySaved(
          difficultyLabels[classification.difficulty],
        ),
        difficulty: classification.difficulty,
      };
    case 'bundled':
      return {
        showDelete: false,
        removeSavedWord: false,
        showPicker: false,
        includeInSave: false,
        lockedLabel: strings.results.saveWords.alreadyBundled,
        difficulty: DEFAULT_DIFFICULTY,
      };
  }
}

export default function SaveWordsScreen() {
  const router = useRouter();
  const gameState = useGameState();
  const { abandonMatch } = useGameActions();
  const [rows, setRows] = useState<SaveRow[] | null>(null);
  const [noticeVisible, setNoticeVisible] = useState(false);
  const savingRef = useRef(false);

  const bundledTexts = useBundledWordTexts();
  const customHatTexts = useMemo(() => customHatWordTexts(gameState), [gameState]);
  const classifiedRows = useMemo(() => {
    if (!bundledTexts) {
      return null;
    }
    return customHatTexts.map((text) => {
      const classification = classifyHatWord(text, bundledTexts);
      return {
        text,
        classification,
        difficulty: hatRowView(classification).difficulty,
      };
    });
  }, [bundledTexts, customHatTexts]);
  const [classifiedSnapshot, setClassifiedSnapshot] = useState(classifiedRows);

  if (classifiedRows !== classifiedSnapshot) {
    setClassifiedSnapshot(classifiedRows);
    setRows(classifiedRows);
  }

  const onBack = () => {
    if (savingRef.current) {
      return;
    }
    router.back();
  };

  const onChangeDifficulty = (index: number, difficulty: Difficulty) => {
    setRows(
      (current) =>
        current?.map((row, rowIndex) => (rowIndex === index ? { ...row, difficulty } : row)) ??
        null,
    );
  };

  const onDelete = (index: number) => {
    if (savingRef.current || !rows) {
      return;
    }
    const row = rows[index];
    const view = row ? hatRowView(row.classification) : null;
    if (!row || !view?.showDelete) {
      return;
    }
    playTap();
    if (view.removeSavedWord) {
      deleteSavedWord(savedWordId(row.text));
    }
    setRows(rows.filter((_, rowIndex) => rowIndex !== index));
  };

  const onSave = () => {
    if (!rows || !bundledTexts || savingRef.current) {
      return;
    }
    savingRef.current = true;
    try {
      saveWords(
        rows
          .filter((row) => hatRowView(row.classification).includeInSave)
          .map((row) => ({ text: row.text, difficulty: row.difficulty })),
        bundledTexts,
      );
      setNoticeVisible(true);
    } catch {
      savingRef.current = false;
    }
  };

  const onNoticeDone = () => {
    abandonMatch();
    router.replace('/');
  };

  return (
    <ScreenShell>
      <ScreenHeader title={strings.results.saveWords.screenTitle} onBack={onBack} />
      <ScrollView
        className="flex-1 px-5"
        contentContainerClassName="gap-3 pb-32 pt-6"
        showsVerticalScrollIndicator={false}
      >
        {rows?.map((row, index) => {
          const view = hatRowView(row.classification);
          return (
            <ShadowCard key={`${row.text}-${index}`}>
              <View className="panel-card gap-3 px-4 py-3">
                <View className="min-h-12 flex-row items-center gap-3">
                  <Text className="min-w-0 flex-1 text-lg font-semibold text-primaryText">
                    {row.text}
                  </Text>
                  {view.showDelete ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`${strings.settings.savedWordsDeleteOne}: ${row.text}`}
                      onPress={() => onDelete(index)}
                      className="h-12 w-12 items-center justify-center"
                    >
                      <CloseIcon size={22} />
                    </Pressable>
                  ) : null}
                </View>
                {view.showPicker ? (
                  <HorizontalPicker
                    options={DIFFICULTY_ORDER}
                    value={row.difficulty}
                    onChange={(difficulty) => onChangeDifficulty(index, difficulty)}
                    formatOption={(difficulty) => difficultyLabels[difficulty]}
                  />
                ) : (
                  <Text className="text-base text-highlightText">{view.lockedLabel}</Text>
                )}
              </View>
            </ShadowCard>
          );
        })}
      </ScrollView>
      {rows ? <ScreenFooter label={strings.results.saveWords.save} onPress={onSave} /> : null}
      <Modal visible={noticeVisible} transparent animationType="fade" onRequestClose={onNoticeDone}>
        <View className="flex-1 justify-end bg-black/50">
          <View className="rounded-t-3xl bg-white px-6 pb-10 pt-6">
            <Text className="mb-6 text-center text-2xl font-bold text-black">
              {strings.results.saveWords.savedNotice}
            </Text>
            <Button
              textClassName="text-xl"
              label={strings.common.understand}
              onPress={onNoticeDone}
            />
          </View>
        </View>
      </Modal>
    </ScreenShell>
  );
}
