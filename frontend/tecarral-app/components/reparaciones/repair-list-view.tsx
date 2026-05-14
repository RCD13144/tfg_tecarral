import { Text, View } from 'react-native';

import { RepairCard } from '@/components/reparaciones/repair-card';
import { ScreenHeader } from '@/components/shared/screen-header';
import { reparacionesStyles } from '@/styles/reparaciones.styles';
import type { RepairListItem } from '@/types/reparacion';

export function RepairListView({
  repairs,
  loading,
  feedback,
  successMessage,
  isAdmin,
  currentUserId,
  userOptions,
  openSelectorRepairId,
  selectedAssignees,
  solutionTexts,
  submittingAssignmentRepairId,
  submittingFinishRepairId,
  onToggleSelector,
  onSelectAssignee,
  onChangeSolutionText,
  onSubmitAssignment,
  onSubmitFinish,
  onOpenHelp,
  onRequestScrollToFocusedInput,
}: {
  repairs: RepairListItem[];
  loading: boolean;
  feedback: string | null;
  successMessage: string | null;
  isAdmin: boolean;
  currentUserId: number | null;
  userOptions: { label: string; value: string }[];
  openSelectorRepairId: number | null;
  selectedAssignees: Record<number, string>;
  solutionTexts: Record<number, string>;
  submittingAssignmentRepairId: number | null;
  submittingFinishRepairId: number | null;
  onToggleSelector: (repairId: number) => void;
  onSelectAssignee: (repairId: number, userId: string) => void;
  onChangeSolutionText: (repairId: number, value: string) => void;
  onSubmitAssignment: (repairId: number) => void;
  onSubmitFinish: (repairId: number) => void;
  onOpenHelp: () => void;
  onRequestScrollToFocusedInput?: () => void;
}) {
  return (
    <View style={reparacionesStyles.container}>
      <ScreenHeader onHelpPress={onOpenHelp} />

      <Text style={reparacionesStyles.title}>Reparaciones activas</Text>
      <Text style={reparacionesStyles.subtitle}>
        {isAdmin
          ? 'Aquí puedes ver todas las reparaciones activas y asignar las averías graves.'
          : 'Aquí puedes consultar las reparaciones activas que tienes asignadas.'}
      </Text>

      {feedback ? <Text style={reparacionesStyles.feedback}>{feedback}</Text> : null}
      {successMessage ? <Text style={reparacionesStyles.success}>{successMessage}</Text> : null}

      {loading ? <Text style={reparacionesStyles.loadingText}>Cargando reparaciones...</Text> : null}

      {!loading && repairs.length === 0 ? (
        <View style={reparacionesStyles.emptyCard}>
          <Text style={reparacionesStyles.emptyText}>No hay reparaciones activas para mostrar.</Text>
        </View>
      ) : null}

      <View style={reparacionesStyles.listBlock}>
        {repairs.map((item) => (
          <RepairCard
            currentUserId={currentUserId}
            isAdmin={isAdmin}
            item={item}
            key={item.id_reparacion}
            onChangeSolutionText={(value) => onChangeSolutionText(item.id_reparacion, value)}
            onRequestScrollToFocusedInput={onRequestScrollToFocusedInput}
            onSelectAssignee={(value) => onSelectAssignee(item.id_reparacion, value)}
            onSubmitAssignment={() => onSubmitAssignment(item.id_reparacion)}
            onSubmitFinish={() => onSubmitFinish(item.id_reparacion)}
            onToggleSelector={() => onToggleSelector(item.id_reparacion)}
            selectedAssignee={selectedAssignees[item.id_reparacion] ?? ''}
            selectorOpen={openSelectorRepairId === item.id_reparacion}
            solutionText={solutionTexts[item.id_reparacion] ?? ''}
            submittingAssignment={submittingAssignmentRepairId === item.id_reparacion}
            submittingFinish={submittingFinishRepairId === item.id_reparacion}
            userOptions={userOptions}
          />
        ))}
      </View>
    </View>
  );
}
