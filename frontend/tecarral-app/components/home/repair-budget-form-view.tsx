import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, TextInput, View } from 'react-native';

import { DateTimePickerField } from '@/components/home/date-time-picker-field';
import { FieldRow } from '@/components/home/field-row';
import { AppColors } from '@/constants/theme';
import { homeStyles } from '@/styles/home.styles';
import type { MachineDetail, MachineProposalSummary } from '@/types/maquina';
import type { RepairBudgetFormData } from '@/types/reparacion';
import { formatLocationLabel, formatMachineName } from '@/utils/home-format';

export function RepairBudgetFormView({
  selectedMachineDetail,
  proposalSummary,
  repairBudgetForm,
  repairBudgetFeedback,
  repairBudgetSubmitting,
  onBack,
  onChangeField,
  onSubmit,
}: {
  selectedMachineDetail: MachineDetail | null;
  proposalSummary: MachineProposalSummary | null;
  repairBudgetForm: RepairBudgetFormData;
  repairBudgetFeedback: string | null;
  repairBudgetSubmitting: boolean;
  onBack: () => void;
  onChangeField: <K extends keyof RepairBudgetFormData>(
    key: K,
    value: RepairBudgetFormData[K]
  ) => void;
  onSubmit: () => void;
}) {
  if (!selectedMachineDetail?.active_repair) {
    return (
      <View style={homeStyles.centeredBlock}>
        <Text style={homeStyles.emptyStateText}>No hay reparación activa para esta máquina.</Text>
      </View>
    );
  }

  const activeRepair = selectedMachineDetail.active_repair;

  return (
    <View style={homeStyles.detailContainer}>
      <Pressable onPress={onBack} style={homeStyles.formBackButton}>
        <Ionicons color={AppColors.primary} name="arrow-back" size={22} />
        <Text style={homeStyles.formBackButtonText}>Volver al detalle</Text>
      </Pressable>

      <Text style={homeStyles.detailTitle}>Nuevo presupuesto de reparación</Text>

      <View style={homeStyles.proposalSummaryCard}>
        <Text style={homeStyles.proposalSummaryTitle}>Información ya definida</Text>
        <FieldRow label="Máquina" value={formatMachineName(selectedMachineDetail)} />
        <FieldRow label="ID máquina" value={selectedMachineDetail.id_maquina} />
        <FieldRow label="Marca" value={selectedMachineDetail.marca} />
        <FieldRow label="Modelo" value={selectedMachineDetail.modelo} />
        <FieldRow label="Ubicación" value={formatLocationLabel(selectedMachineDetail.ubicacion_tipo)} />
        <FieldRow label="Reparación ID" value={activeRepair.id_reparacion} />
        <FieldRow label="Propuesta alquiler ID" value={activeRepair.propuesta_alquiler_id} />
        <FieldRow label="Estado reparación" value={activeRepair.estado} />
        {proposalSummary ? <FieldRow label="Cliente" value={proposalSummary.cliente} /> : null}
      </View>

      {repairBudgetFeedback ? (
        <Text style={homeStyles.feedbackText}>{repairBudgetFeedback}</Text>
      ) : null}

      <TextInput
        keyboardType="numeric"
        onChangeText={(value) => onChangeField('importe_total', value)}
        placeholder="Importe total"
        placeholderTextColor={AppColors.primary50}
        style={homeStyles.formInput}
        value={repairBudgetForm.importe_total}
      />
      <TextInput
        multiline
        onChangeText={(value) => onChangeField('condiciones', value)}
        placeholder="Condiciones"
        placeholderTextColor={AppColors.primary50}
        style={[homeStyles.formInput, homeStyles.incidenceInput]}
        value={repairBudgetForm.condiciones}
      />
      <DateTimePickerField
        label="Fecha de expedición"
        onChange={(value) => onChangeField('expira_at', value)}
        placeholder="Selecciona fecha y hora"
        value={repairBudgetForm.expira_at}
      />

      <Pressable
        onPress={onSubmit}
        style={[
          homeStyles.primaryActionButton,
          repairBudgetSubmitting && homeStyles.actionButtonDisabled,
        ]}>
        <Text style={homeStyles.primaryActionButtonText}>
          {repairBudgetSubmitting ? 'Guardando...' : 'Crear presupuesto de reparación'}
        </Text>
      </Pressable>
    </View>
  );
}
