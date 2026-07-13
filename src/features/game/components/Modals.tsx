import { useEffect, useRef } from 'react';
import { Animated, Modal, Pressable, View } from 'react-native';

import { strings } from '@content/strings';
import { Button } from '@ui/components/Button';
import { Text } from '@ui/components/Text';

type PauseModalProps = {
  visible: boolean;
  roundNumber: number;
  teamName: string;
  onResume: () => void;
  onExit: () => void;
};

export function PauseModal({
  visible,
  roundNumber,
  teamName,
  onResume,
  onExit,
}: PauseModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 justify-end bg-black/50">
        <View className="rounded-t-3xl bg-white px-6 pb-10 pt-6">
          <Text className="mb-2 text-center text-2xl font-bold text-slate-900">
            {strings.pause.title}
          </Text>
          <Text className="mb-1 text-center text-base text-slate-600">
            {strings.pause.round(roundNumber)}
          </Text>
          <Text className="mb-6 text-center text-base text-slate-600">
            {strings.pause.team(teamName)}
          </Text>
          <View className="gap-3">
            <Button label={strings.pause.resume} onPress={onResume} />
            <Button label={strings.pause.exit} variant="outline" onPress={onExit} />
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
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(300)).current;

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
      <Animated.View
        style={{ opacity: overlayOpacity }}
        className="flex-1 justify-end bg-black/50"
      >
        <Animated.View
          style={{ transform: [{ translateY: contentTranslateY }] }}
          className="rounded-t-3xl bg-white px-6 pb-10 pt-6"
        >
          <Text className="mb-4 text-center text-xl font-bold text-slate-900">
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
                <Text className="text-base font-medium text-slate-900">{team.name}</Text>
              </Pressable>
            ))}
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ selected: selectedTeamId === null }}
              onPress={() => onSelect(null)}
              className={`award-option ${selectedTeamId === null ? 'award-option--selected' : ''}`}
            >
              <Text className="text-base font-medium text-slate-900">{strings.award.nobody}</Text>
            </Pressable>
          </View>
          <Button
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
          <Text className="mb-6 text-center text-2xl font-bold text-slate-900">
            {strings.review.confirmStop}
          </Text>
          <View className="gap-3">
            <Button label={strings.pause.exit} onPress={onConfirm} />
            <Button label={strings.common.back} variant="outline" onPress={onCancel} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

type PenaltyModalProps = {
  visible: boolean;
  onClose: () => void;
};

export function PenaltyModal({ visible, onClose }: PenaltyModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 justify-end bg-black/50">
        <View className="rounded-t-3xl bg-white px-6 pb-10 pt-6">
          <Text className="mb-3 text-center text-xl font-bold text-slate-900">
            {strings.review.penaltyTitle}
          </Text>
          <Text className="mb-2 text-base leading-6 text-slate-700">{strings.review.penaltyBody1}</Text>
          <Text className="mb-6 text-base leading-6 text-slate-700">{strings.review.penaltyBody2}</Text>
          <Button label={strings.common.understand} onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}
