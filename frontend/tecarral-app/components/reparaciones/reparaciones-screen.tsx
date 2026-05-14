import { RepairListView } from '@/components/reparaciones/repair-list-view';
import { useReparacionesScreen } from '@/hooks/use-reparaciones-screen';
import type { AuthSession } from '@/types/auth';

export function ReparacionesScreen({
  session,
  visible,
  onOpenHelp,
  onRequestScrollToFocusedInput,
}: {
  session: AuthSession | null;
  visible: boolean;
  onOpenHelp: () => void;
  onRequestScrollToFocusedInput?: () => void;
}) {
  const repairs = useReparacionesScreen(session, visible);

  return (
    <RepairListView
      currentUserId={session?.user.id_user ?? null}
      feedback={repairs.feedback}
      isAdmin={repairs.isAdmin}
      loading={repairs.loading}
      onChangeSolutionText={repairs.updateSolutionText}
      onOpenHelp={onOpenHelp}
      onRequestScrollToFocusedInput={onRequestScrollToFocusedInput}
      onSelectAssignee={repairs.selectAssignee}
      onSubmitAssignment={(repairId) => void repairs.submitAssignment(repairId)}
      onSubmitFinish={(repairId) => void repairs.submitFinishRepair(repairId)}
      onToggleSelector={repairs.toggleSelector}
      openSelectorRepairId={repairs.openSelectorRepairId}
      repairs={repairs.reparaciones}
      selectedAssignees={repairs.selectedAssignees}
      solutionTexts={repairs.solutionTexts}
      submittingAssignmentRepairId={repairs.submittingAssignmentRepairId}
      submittingFinishRepairId={repairs.submittingFinishRepairId}
      successMessage={repairs.successMessage}
      userOptions={repairs.userOptions}
    />
  );
}
