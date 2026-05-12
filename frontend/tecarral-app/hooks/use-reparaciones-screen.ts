import { useCallback, useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/contexts/auth-context';
import { ApiError } from '@/services/api';
import { assignRepair, finishRepair, getReparaciones } from '@/services/reparaciones-api';
import { getUsers } from '@/services/users-api';
import type { AuthSession } from '@/types/auth';
import type { AssignableUser, RepairListItem } from '@/types/reparacion';

function buildSelectedAssignees(repairs: RepairListItem[]) {
  return repairs.reduce<Record<number, string>>((acc, item) => {
    if (item.id_user_asignado) {
      acc[item.id_reparacion] = String(item.id_user_asignado);
    }
    return acc;
  }, {});
}

function buildSolutionTexts(repairs: RepairListItem[]) {
  return repairs.reduce<Record<number, string>>((acc, item) => {
    acc[item.id_reparacion] = item.solucion_aplicada ?? '';
    return acc;
  }, {});
}

export function useReparacionesScreen(session: AuthSession | null, visible: boolean) {
  const { signOut } = useAuth();
  const [reparaciones, setReparaciones] = useState<RepairListItem[]>([]);
  const [assignableUsers, setAssignableUsers] = useState<AssignableUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [openSelectorRepairId, setOpenSelectorRepairId] = useState<number | null>(null);
  const [selectedAssignees, setSelectedAssignees] = useState<Record<number, string>>({});
  const [solutionTexts, setSolutionTexts] = useState<Record<number, string>>({});
  const [submittingAssignmentRepairId, setSubmittingAssignmentRepairId] = useState<number | null>(
    null
  );
  const [submittingFinishRepairId, setSubmittingFinishRepairId] = useState<number | null>(null);

  const isAdmin = String(session?.user.role ?? '').trim().toLowerCase() === 'admin';

  const userOptions = useMemo(
    () =>
      assignableUsers.map((user) => ({
        label: `${user.nombre} (#${user.id_user})`,
        value: String(user.id_user),
      })),
    [assignableUsers]
  );

  const handleApiError = useCallback(
    async (
      error: unknown,
      setMessage: (message: string | null) => void,
      fallbackMessage: string
    ) => {
      if (error instanceof ApiError) {
        if (error.status === 401) {
          await signOut();
          return;
        }

        setMessage(error.message);
        return;
      }

      setMessage(fallbackMessage);
    },
    [signOut]
  );

  const refresh = useCallback(async () => {
    if (!session?.token) {
      return;
    }

    try {
      setLoading(true);
      setFeedback(null);
      setSuccessMessage(null);

      const [repairs, users] = await Promise.all([
        getReparaciones(session.token),
        isAdmin ? getUsers(session.token) : Promise.resolve([]),
      ]);

      setReparaciones(repairs);
      setAssignableUsers(users);
      setSelectedAssignees(buildSelectedAssignees(repairs));
      setSolutionTexts(buildSolutionTexts(repairs));
    } catch (error) {
      await handleApiError(error, setFeedback, 'No se pudieron cargar las reparaciones.');
    } finally {
      setLoading(false);
    }
  }, [handleApiError, isAdmin, session?.token]);

  useEffect(() => {
    if (!visible || !session?.token) {
      return;
    }

    void refresh();
  }, [refresh, session?.token, visible]);

  function toggleSelector(repairId: number) {
    setOpenSelectorRepairId((current) => (current === repairId ? null : repairId));
  }

  function selectAssignee(repairId: number, userId: string) {
    setSelectedAssignees((current) => ({
      ...current,
      [repairId]: userId,
    }));
    setOpenSelectorRepairId(null);
  }

  function updateSolutionText(repairId: number, value: string) {
    setSolutionTexts((current) => ({
      ...current,
      [repairId]: value,
    }));
  }

  async function submitAssignment(repairId: number) {
    if (!session?.token || !isAdmin) {
      return;
    }

    const userId = Number(selectedAssignees[repairId]);
    if (!Number.isInteger(userId) || userId <= 0) {
      setFeedback('Selecciona un usuario valido para asignar la reparacion.');
      return;
    }

    try {
      setSubmittingAssignmentRepairId(repairId);
      setFeedback(null);
      setSuccessMessage(null);

      await assignRepair(repairId, userId, session.token);

      const assignedUser = assignableUsers.find((user) => user.id_user === userId) ?? null;

      setReparaciones((current) =>
        current.map((item) =>
          item.id_reparacion === repairId
            ? {
                ...item,
                id_user_asignado: userId,
                assigned_user_nombre: assignedUser?.nombre ?? item.assigned_user_nombre,
                assigned_user_email: assignedUser?.email ?? item.assigned_user_email,
              }
            : item
        )
      );

      setSuccessMessage('Reparacion asignada correctamente.');
    } catch (error) {
      await handleApiError(error, setFeedback, 'No se pudo asignar la reparacion.');
    } finally {
      setSubmittingAssignmentRepairId(null);
    }
  }

  async function submitFinishRepair(repairId: number) {
    if (!session?.token) {
      return;
    }

    try {
      setSubmittingFinishRepairId(repairId);
      setFeedback(null);
      setSuccessMessage(null);

      const solutionText = solutionTexts[repairId]?.trim() ?? '';

      await finishRepair(repairId, solutionText.length > 0 ? solutionText : null, session.token);

      setReparaciones((current) => current.filter((item) => item.id_reparacion !== repairId));
      setSelectedAssignees((current) => {
        const next = { ...current };
        delete next[repairId];
        return next;
      });
      setSolutionTexts((current) => {
        const next = { ...current };
        delete next[repairId];
        return next;
      });
      setOpenSelectorRepairId((current) => (current === repairId ? null : current));

      setSuccessMessage('Reparacion terminada correctamente.');
    } catch (error) {
      await handleApiError(error, setFeedback, 'No se pudo terminar la reparacion.');
    } finally {
      setSubmittingFinishRepairId(null);
    }
  }

  return {
    reparaciones,
    assignableUsers,
    userOptions,
    loading,
    feedback,
    successMessage,
    isAdmin,
    openSelectorRepairId,
    selectedAssignees,
    solutionTexts,
    submittingAssignmentRepairId,
    submittingFinishRepairId,
    refresh,
    toggleSelector,
    selectAssignee,
    updateSolutionText,
    submitAssignment,
    submitFinishRepair,
  };
}
