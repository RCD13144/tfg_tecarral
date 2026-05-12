import { RepairListView } from '@/components/reparaciones/repair-list-view';
import { useReparacionesScreen } from '@/hooks/use-reparaciones-screen';
import type { AuthSession } from '@/types/auth';

export function ReparacionesScreen({
  session,
  visible,
  onOpenHelp,
}: {
  session: AuthSession | null;
  visible: boolean;
  onOpenHelp: () => void;
}) {
  const repairs = useReparacionesScreen(session, visible);

  return (
    <RepairListView
      feedback={repairs.feedback}
      isAdmin={repairs.isAdmin}
      loading={repairs.loading}
      onChangeSolutionText={repairs.updateSolutionText}
      onSelectAssignee={repairs.selectAssignee}
      onSubmitAssignment={(repairId) => void repairs.submitAssignment(repairId)}
      onSubmitFinish={(repairId) => void repairs.submitFinishRepair(repairId)}
      onToggleSelector={repairs.toggleSelector}
      onOpenHelp={onOpenHelp}
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
