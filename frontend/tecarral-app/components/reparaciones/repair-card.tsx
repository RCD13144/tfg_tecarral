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
  currentUserId,
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
  onRequestScrollToFocusedInput,
}: {
  item: RepairListItem;
  isAdmin: boolean;
  currentUserId: number | null;
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
  onRequestScrollToFocusedInput?: () => void;
}) {
  const assignmentEnabled = canAssignRepair(item, isAdmin);
  const finishEnabled = canFinishRepair(item, currentUserId, isAdmin);
  const finishBlockedReason = getFinishRepairBlockedReason(item, currentUserId, isAdmin);
  const selectedUserLabel =
    userOptions.find((option) => option.value === selectedAssignee)?.label ?? 'Selecciona usuario';

  const finishBlock = (
    <View style={reparacionesStyles.finishBlock}>
      <Text style={reparacionesStyles.hint}>
        Añade una breve solución aplicada antes de intentar terminar la reparación.
      </Text>
      <TextInput
        autoCorrect
        cursorColor={AppColors.primary}
        editable={!submittingFinish}
        multiline
        onChangeText={onChangeSolutionText}
        onFocus={onRequestScrollToFocusedInput}
        placeholder="Solución aplicada"
        placeholderTextColor={AppColors.primary50}
        selectionColor={AppColors.primary}
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
          {submittingFinish ? 'Terminando...' : 'Terminar reparación'}
        </Text>
      </Pressable>
    </View>
  );

  return (
    <View style={reparacionesStyles.card}>
      <View style={reparacionesStyles.cardHeader}>
        <Text style={reparacionesStyles.cardTitle}>Reparación #{item.id_reparacion}</Text>
        <View style={reparacionesStyles.cardBadge}>
          <Text style={reparacionesStyles.cardBadgeText}>{item.estado}</Text>
        </View>
      </View>

      <Text style={reparacionesStyles.line}>
        <Text style={reparacionesStyles.label}>Máquina: </Text>
        <Text style={reparacionesStyles.value}>
          #{item.id_maquina} · {formatRepairMachineLabel(item)}
        </Text>
      </Text>
      <Text style={reparacionesStyles.line}>
        <Text style={reparacionesStyles.label}>Cliente: </Text>
        <Text style={reparacionesStyles.value}>{item.cliente ?? '-'}</Text>
      </Text>
      <Text style={reparacionesStyles.line}>
        <Text style={reparacionesStyles.label}>Tipo de avería: </Text>
        <Text style={reparacionesStyles.value}>{item.maintenance_status ?? '-'}</Text>
      </Text>
      <Text style={reparacionesStyles.line}>
        <Text style={reparacionesStyles.label}>Albarán: </Text>
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
        <Text style={reparacionesStyles.label}>Paga: </Text>
        <Text style={reparacionesStyles.value}>
          {item.presupuesto_payer_type === 'CLIENTE'
            ? 'Cliente'
            : item.presupuesto_payer_type === 'EMPRESA'
              ? 'Empresa'
              : '-'}
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
              {submittingAssignment ? 'Asignando...' : 'Asignar reparación'}
            </Text>
          </Pressable>

          <Text style={reparacionesStyles.hint}>
            Solo las reparaciones de avería grave pueden ser asignadas por un admin.
          </Text>
        </View>
      ) : null}

      {isAdmin ? finishBlock : null}
    </View>
  );
}
