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
  onRequestScrollToFocusedInput,
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
  onRequestScrollToFocusedInput?: () => void;
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
  const payerTypeOptions = [
    { label: 'Empresa', value: 'EMPRESA' },
    { label: 'Cliente', value: 'CLIENTE' },
  ] as const;
  const payerTypeValueLabel =
    payerTypeOptions.find((option) => option.value === repairBudgetForm.payer_type)?.label ??
    'Selecciona quién paga';

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
        <FieldRow
          label="Ubicación"
          value={formatLocationLabel(selectedMachineDetail.ubicacion_tipo)}
        />
        <FieldRow label="Reparación ID" value={activeRepair.id_reparacion} />
        <FieldRow label="Propuesta alquiler ID" value={activeRepair.propuesta_alquiler_id} />
        <FieldRow label="Estado reparación" value={activeRepair.estado} />
        {proposalSummary ? <FieldRow label="Cliente" value={proposalSummary.cliente} /> : null}
      </View>

      {repairBudgetFeedback ? (
        <Text style={homeStyles.feedbackText}>{repairBudgetFeedback}</Text>
      ) : null}

      <Text style={homeStyles.formFieldLabel}>La reparación la paga</Text>
      <View style={homeStyles.inlineActionRow}>
        {payerTypeOptions.map((option) => {
          const selected = repairBudgetForm.payer_type === option.value;

          return (
            <Pressable
              key={option.value}
              onPress={() => onChangeField('payer_type', option.value)}
              style={[
                homeStyles.inlineActionButton,
                selected && homeStyles.filterChipActive,
              ]}>
              <Text
                style={[
                  homeStyles.inlineActionButtonText,
                  selected && homeStyles.filterChipTextActive,
                ]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={homeStyles.sectionHint}>
        {repairBudgetForm.payer_type === 'CLIENTE'
          ? 'Se enviará al email de la propuesta de alquiler y quedará pendiente de aceptación.'
          : 'Se enviará al email interno centralizado y quedará autoaceptado.'}
      </Text>

      <TextInput
        keyboardType="numeric"
        onChangeText={(value) => onChangeField('importe_total', value)}
        onFocus={onRequestScrollToFocusedInput}
        placeholder="Importe total"
        placeholderTextColor={AppColors.primary50}
        style={homeStyles.formInput}
        value={repairBudgetForm.importe_total}
      />
      <TextInput
        multiline
        onChangeText={(value) => onChangeField('condiciones', value)}
        onFocus={onRequestScrollToFocusedInput}
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
