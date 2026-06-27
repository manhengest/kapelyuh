import { Modal, Pressable, Text, View } from 'react-native';

import { strings } from '@content/strings';
import { Button } from '@ui/components/Button';

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
        <View className="rounded-t-3xl bg-white px-6 pb-10 pt-6 dark:bg-slate-900">
          <Text className="mb-2 text-center text-2xl font-bold text-slate-900 dark:text-white">
            {strings.pause.title}
          </Text>
          <Text className="mb-1 text-center text-base text-slate-600 dark:text-slate-300">
            {strings.pause.round(roundNumber)}
          </Text>
          <Text className="mb-6 text-center text-base text-slate-600 dark:text-slate-300">
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

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 justify-end bg-black/50">
        <View className="rounded-t-3xl bg-white px-6 pb-10 pt-6 dark:bg-slate-900">
          <Text className="mb-4 text-center text-xl font-bold text-slate-900 dark:text-white">
            {strings.award.title}
          </Text>
          <View className="mb-4 gap-2">
            {teams.map((team) => (
              <Pressable
                key={team.id}
                accessibilityRole="radio"
                accessibilityState={{ selected: selectedTeamId === team.id }}
                onPress={() => onSelect(team.id)}
                className={`rounded-xl border px-4 py-3 ${selectedTeamId === team.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200'}`}
              >
                <Text className="text-base font-medium text-slate-900">{team.name}</Text>
              </Pressable>
            ))}
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ selected: selectedTeamId === null }}
              onPress={() => onSelect(null)}
              className={`rounded-xl border px-4 py-3 ${selectedTeamId === null ? 'border-blue-500 bg-blue-50' : 'border-slate-200'}`}
            >
              <Text className="text-base font-medium text-slate-900">{strings.award.nobody}</Text>
            </Pressable>
          </View>
          <Button
            label={strings.common.done}
            disabled={!hasSelection}
            onPress={onConfirm}
          />
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
