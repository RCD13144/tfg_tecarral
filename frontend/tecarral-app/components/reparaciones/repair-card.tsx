import { Pressable, Text, TextInput, View } from 'react-native';

import { SelectorField } from '@/components/home/selector-field';
import { AppColors } from '@/constants/theme';
import { reparacionesStyles } from '@/styles/reparaciones.styles';
import type { RepairListItem } from '@/types/reparacion';
import {
  canAssignRepair,
  canFinishRepair,
  formatRepairDate,
  formatRepairMachineLabel,
  getFinishRepairBlockedReason,
} from '@/utils/reparaciones-format';

export function RepairCard({
  item,
  isAdmin,
  userOptions,
  selectedAssignee,
  solutionText,
  selectorOpen,
  submittingAssignment,
  submittingFinish,
  onToggleSelector,
  onSelectAssignee,
  onChangeSolutionText,
  onSubmitAssignment,
  onSubmitFinish,
}: {
  item: RepairListItem;
  isAdmin: boolean;
  userOptions: { label: string; value: string }[];
  selectedAssignee: string;
  solutionText: string;
  selectorOpen: boolean;
  submittingAssignment: boolean;
  submittingFinish: boolean;
  onToggleSelector: () => void;
  onSelectAssignee: (value: string) => void;
  onChangeSolutionText: (value: string) => void;
  onSubmitAssignment: () => void;
  onSubmitFinish: () => void;
}) {
  const assignmentEnabled = canAssignRepair(item, isAdmin);
  const finishEnabled = canFinishRepair(item);
  const finishBlockedReason = getFinishRepairBlockedReason(item);
  const selectedUserLabel =
    userOptions.find((option) => option.value === selectedAssignee)?.label ?? 'Selecciona usuario';

  const finishBlock = (
    <View style={reparacionesStyles.finishBlock}>
      <Text style={reparacionesStyles.hint}>
        Anade una breve solucion aplicada antes de intentar terminar la reparacion.
      </Text>
      <TextInput
        editable={!submittingFinish}
        multiline
        onChangeText={onChangeSolutionText}
        placeholder="Solucion aplicada"
        placeholderTextColor={AppColors.primary50}
        style={reparacionesStyles.solutionInput}
        value={solutionText}
      />
      {finishBlockedReason ? (
        <Text style={reparacionesStyles.warningText}>{finishBlockedReason}</Text>
      ) : null}
      <Pressable
        disabled={!finishEnabled || submittingFinish}
        onPress={onSubmitFinish}
        style={[
          reparacionesStyles.assignButton,
          (!finishEnabled || submittingFinish) && reparacionesStyles.assignButtonDisabled,
        ]}>
        <Text style={reparacionesStyles.assignButtonText}>
          {submittingFinish ? 'Terminando...' : 'Terminar reparacion'}
        </Text>
      </Pressable>
    </View>
  );

  return (
    <View style={reparacionesStyles.card}>
      <View style={reparacionesStyles.cardHeader}>
        <Text style={reparacionesStyles.cardTitle}>Reparacion #{item.id_reparacion}</Text>
        <View style={reparacionesStyles.cardBadge}>
          <Text style={reparacionesStyles.cardBadgeText}>{item.estado}</Text>
        </View>
      </View>

      <Text style={reparacionesStyles.line}>
        <Text style={reparacionesStyles.label}>Maquina: </Text>
        <Text style={reparacionesStyles.value}>
          #{item.id_maquina} · {formatRepairMachineLabel(item)}
        </Text>
      </Text>
      <Text style={reparacionesStyles.line}>
        <Text style={reparacionesStyles.label}>Cliente: </Text>
        <Text style={reparacionesStyles.value}>{item.cliente ?? '-'}</Text>
      </Text>
      <Text style={reparacionesStyles.line}>
        <Text style={reparacionesStyles.label}>Tipo averia: </Text>
        <Text style={reparacionesStyles.value}>{item.maintenance_status ?? '-'}</Text>
      </Text>
      <Text style={reparacionesStyles.line}>
        <Text style={reparacionesStyles.label}>Albaran: </Text>
        <Text style={reparacionesStyles.value}>
          #{item.id_albaran ?? '-'} · {item.albaran_estado ?? '-'}
        </Text>
      </Text>
      <Text style={reparacionesStyles.line}>
        <Text style={reparacionesStyles.label}>Presupuesto: </Text>
        <Text style={reparacionesStyles.value}>
          {item.presupuesto_reparacion_id
            ? `#${item.presupuesto_reparacion_id} · ${item.presupuesto_estado ?? '-'}`
            : 'Sin presupuesto'}
        </Text>
      </Text>
      <Text style={reparacionesStyles.line}>
        <Text style={reparacionesStyles.label}>Creada: </Text>
        <Text style={reparacionesStyles.value}>{formatRepairDate(item.created_at)}</Text>
      </Text>
      <Text style={reparacionesStyles.line}>
        <Text style={reparacionesStyles.label}>Asignada a: </Text>
        <Text style={reparacionesStyles.value}>
          {item.assigned_user_nombre
            ? `${item.assigned_user_nombre}${item.assigned_user_email ? ` · ${item.assigned_user_email}` : ''}`
            : 'Sin asignar'}
        </Text>
      </Text>
      <Text style={reparacionesStyles.line}>
        <Text style={reparacionesStyles.label}>Comentario: </Text>
        <Text style={reparacionesStyles.value}>{item.comentario ?? '-'}</Text>
      </Text>

      {!isAdmin ? finishBlock : null}

      {assignmentEnabled ? (
        <View style={reparacionesStyles.assignmentBlock}>
          <SelectorField
            disabled={userOptions.length === 0 || submittingAssignment}
            isOpen={selectorOpen}
            label="Asignar a"
            onSelect={onSelectAssignee}
            onToggleOpen={onToggleSelector}
            options={userOptions}
            valueLabel={selectedUserLabel}
          />

          <Pressable
            disabled={!selectedAssignee || submittingAssignment}
            onPress={onSubmitAssignment}
            style={[
              reparacionesStyles.assignButton,
              (!selectedAssignee || submittingAssignment) &&
                reparacionesStyles.assignButtonDisabled,
            ]}>
            <Text style={reparacionesStyles.assignButtonText}>
              {submittingAssignment ? 'Asignando...' : 'Asignar reparacion'}
            </Text>
          </Pressable>

          <Text style={reparacionesStyles.hint}>
            Solo las reparaciones de averia grave pueden ser asignadas por un admin.
          </Text>
        </View>
      ) : null}

      {isAdmin ? finishBlock : null}
    </View>
  );
}
