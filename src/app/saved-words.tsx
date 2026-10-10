import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, View } from 'react-native';

import { difficultyLabels, strings } from '@content/strings';
import { DIFFICULTY_ORDER, type Difficulty } from '@domain/game/types';
import { useBundledWordTexts } from '@features/game/useWordTextMap';
import { playTap } from '@infrastructure/audio/sounds';
import { MAX_CUSTOM_WORD_LENGTH } from '@infrastructure/storage/customWords';
import {
  clearSavedWords,
  deleteSavedWord,
  getSavedWords,
  updateSavedWord,
  type SavedWordsMap,
} from '@infrastructure/storage/savedWords';
import { Button } from '@ui/components/Button';
import { CloseIcon } from '@ui/components/CloseIcon';
import { EditIcon } from '@ui/components/EditIcon';
import { HorizontalPicker } from '@ui/components/HorizontalPicker';
import { ScreenFooter } from '@ui/components/ScreenFooter';
import { ScreenHeader } from '@ui/components/ScreenHeader';
import { ScreenShell } from '@ui/components/ScreenShell';
import { ShadowCard } from '@ui/components/ShadowCard';
import { Text } from '@ui/components/Text';
import { TextInput } from '@ui/components/TextInput';

type EditDraft = {
  id: string;
  text: string;
  difficulty: Difficulty;
};

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
  const [editDraft, setEditDraft] = useState<EditDraft | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const bundledTexts = useBundledWordTexts();

  const sections = useMemo(() => groupSavedWords(words), [words]);
  const isEmpty = sections.length === 0;

  const reload = () => setWords(getSavedWords());

  const onDeleteOne = (id: string) => {
    deleteSavedWord(id);
    reload();
  };

  const onOpenEdit = (draft: EditDraft) => {
    setEditError(null);
    setEditDraft(draft);
  };

  const onCloseEdit = () => {
    setEditDraft(null);
    setEditError(null);
  };

  const onSaveEdit = () => {
    if (!editDraft || !bundledTexts) {
      return;
    }
    const result = updateSavedWord(
      editDraft.id,
      editDraft.text,
      editDraft.difficulty,
      bundledTexts,
    );
    if (result === 'empty') {
      setEditError(strings.settings.savedWordsEditEmpty);
      return;
    }
    if (result === 'duplicate') {
      setEditError(strings.settings.savedWordsEditDuplicate);
      return;
    }
    onCloseEdit();
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
                      <View className="min-h-12 flex-row items-center gap-1 px-4 py-2">
                        <Text
                          className="min-w-0 flex-1 text-lg font-semibold text-primaryText"
                          numberOfLines={1}
                        >
                          {entry.text}
                        </Text>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`${strings.settings.savedWordsEditOne}: ${entry.text}`}
                          onPress={() => {
                            playTap();
                            onOpenEdit({
                              id: entry.id,
                              text: entry.text,
                              difficulty: section.difficulty,
                            });
                          }}
                          className="h-12 w-12 items-center justify-center"
                        >
                          <EditIcon size={22} />
                        </Pressable>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`${strings.settings.savedWordsDeleteOne}: ${entry.text}`}
                          onPress={() => {
                            playTap();
                            onDeleteOne(entry.id);
                          }}
                          className="h-12 w-12 items-center justify-center"
                        >
                          <CloseIcon size={22} />
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
      <Modal
        visible={editDraft !== null}
        transparent
        animationType="fade"
        onRequestClose={onCloseEdit}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1 justify-end bg-black/50"
        >
          <View className="rounded-t-3xl bg-white px-6 pb-10 pt-6">
            <Text className="mb-6 text-center text-2xl font-bold text-black">
              {strings.settings.savedWordsEditTitle}
            </Text>
            <TextInput
              value={editDraft?.text ?? ''}
              onChangeText={(text) => {
                setEditDraft((current) => (current ? { ...current, text } : current));
                if (editError) {
                  setEditError(null);
                }
              }}
              placeholder={strings.buildingHat.placeholder}
              maxLength={MAX_CUSTOM_WORD_LENGTH}
              accessibilityLabel={strings.buildingHat.placeholder}
              className="min-h-[56px] w-full rounded-2xl border border-pickerBorder bg-white px-4 text-xl font-bold text-primaryText"
            />
            <View className="mt-4">
              <HorizontalPicker
                label={strings.setup.difficulty}
                options={DIFFICULTY_ORDER}
                value={editDraft?.difficulty ?? 'hard'}
                onChange={(difficulty) =>
                  setEditDraft((current) => (current ? { ...current, difficulty } : current))
                }
                formatOption={(difficulty) => difficultyLabels[difficulty]}
              />
            </View>
            <Text
              className="mb-4 mt-3 min-h-6 text-center text-base font-bold text-pink"
              accessibilityLiveRegion="polite"
            >
              {editError ?? ' '}
            </Text>
            <View className="gap-3">
              <Button
                textClassName="text-xl"
                label={strings.settings.savedWordsEditSave}
                onPress={onSaveEdit}
              />
              <Button
                textClassName="text-xl"
                label={strings.common.back}
                variant="outline"
                onPress={onCloseEdit}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScreenShell>
  );
}
