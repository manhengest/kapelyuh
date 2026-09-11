import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';

import { difficultyLabels, strings } from '@content/strings';
import type { Difficulty } from '@domain/game/types';
import {
  clearSavedWords,
  deleteSavedWord,
  getSavedWords,
  type SavedWordsMap,
} from '@infrastructure/storage/savedWords';
import { Button } from '@ui/components/Button';
import { ScreenFooter } from '@ui/components/ScreenFooter';
import { ScreenHeader } from '@ui/components/ScreenHeader';
import { ScreenShell } from '@ui/components/ScreenShell';
import { ShadowCard } from '@ui/components/ShadowCard';
import { Text } from '@ui/components/Text';

const DIFFICULTY_ORDER: Difficulty[] = ['easy', 'medium', 'hard', 'elite'];

function groupSavedWords(
  words: SavedWordsMap,
): { difficulty: Difficulty; entries: { id: string; text: string }[] }[] {
  return DIFFICULTY_ORDER.map((difficulty) => ({
    difficulty,
    entries: Object.entries(words)
      .filter(([, word]) => word.difficulty === difficulty)
      .map(([id, word]) => ({ id, text: word.text }))
      .sort((left, right) => left.text.localeCompare(right.text, 'uk')),
  })).filter((section) => section.entries.length > 0);
}

export default function SavedWordsScreen() {
  const router = useRouter();
  const [words, setWords] = useState(getSavedWords);
  const [confirmVisible, setConfirmVisible] = useState(false);

  const sections = useMemo(() => groupSavedWords(words), [words]);
  const isEmpty = sections.length === 0;

  const reload = () => setWords(getSavedWords());

  const onDeleteOne = (id: string) => {
    deleteSavedWord(id);
    reload();
  };

  const onDeleteAll = () => {
    clearSavedWords();
    setConfirmVisible(false);
    reload();
  };

  return (
    <ScreenShell>
      <ScreenHeader title={strings.settings.savedWords} onBack={() => router.back()} />
      <ScrollView
        className="flex-1 px-5"
        contentContainerClassName="gap-6 pb-32 pt-6"
        showsVerticalScrollIndicator={false}
      >
        {isEmpty ? (
          <Text className="text-center text-base text-highlightText">
            {strings.settings.savedWordsEmpty}
          </Text>
        ) : (
          sections.map((section) => (
            <View key={section.difficulty}>
              <Text className="section-title">{difficultyLabels[section.difficulty]}</Text>
              <ShadowCard>
                <View className="panel-card">
                  {section.entries.map((entry, index) => (
                    <View key={entry.id}>
                      {index > 0 ? <View className="settings-row-divider ml-4" /> : null}
                      <View className="min-h-12 flex-row items-center gap-3 px-4 py-2">
                        <Text className="min-w-0 flex-1 text-lg font-semibold text-primaryText">
                          {entry.text}
                        </Text>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`${strings.settings.savedWordsDeleteOne}: ${entry.text}`}
                          onPress={() => onDeleteOne(entry.id)}
                          className="h-12 w-12 items-center justify-center"
                        >
                          <Text className="text-2xl text-pink">×</Text>
                        </Pressable>
                      </View>
                    </View>
                  ))}
                </View>
              </ShadowCard>
            </View>
          ))
        )}
      </ScrollView>
      {isEmpty ? null : (
        <ScreenFooter
          label={strings.settings.savedWordsDeleteAll}
          onPress={() => setConfirmVisible(true)}
        />
      )}
      <Modal visible={confirmVisible} transparent animationType="fade">
        <View className="flex-1 justify-end bg-black/50">
          <View className="rounded-t-3xl bg-white px-6 pb-10 pt-6">
            <Text className="mb-6 text-center text-2xl font-bold text-black">
              {strings.settings.savedWordsDeleteAllConfirm}
            </Text>
            <View className="gap-3">
              <Button
                textClassName="text-xl"
                label={strings.settings.savedWordsDeleteAll}
                onPress={onDeleteAll}
              />
              <Button
                textClassName="text-xl"
                label={strings.common.back}
                variant="outline"
                onPress={() => setConfirmVisible(false)}
              />
            </View>
          </View>
        </View>
      </Modal>
    </ScreenShell>
  );
}
