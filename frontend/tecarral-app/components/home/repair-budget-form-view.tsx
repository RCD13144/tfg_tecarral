import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, TextInput, View } from 'react-native';

import { DateTimePickerField } from '@/components/home/date-time-picker-field';
import { FieldRow } from '@/components/home/field-row';
import { ScreenHeader } from '@/components/shared/screen-header';
import { AppColors } from '@/constants/theme';
import { homeStyles } from '@/styles/home.styles';
import type { MachineDetail, MachineProposalSummary } from '@/types/maquina';
import type { RepairBudgetFormData } from '@/types/reparacion';
import { formatLocationLabel, formatMachineName } from '@/utils/home-format';

function parseDecimalInput(value: string) {
  const parsed = Number(String(value ?? '').trim().replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(Number.isFinite(value) ? value : 0);
}

export function RepairBudgetFormView({
  selectedMachineDetail,
  proposalSummary,
  repairBudgetForm,
  repairBudgetFeedback,
  repairBudgetSubmitting,
  onBack,
  onChangeField,
  onOpenHelp,
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
  onOpenHelp: () => void;
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
  const lines = repairBudgetForm.items.length > 0
    ? repairBudgetForm.items
    : [{ referencia: '', descripcion: '', unidades: '1', precio_unitario: '' }];
  const base = lines.reduce(
    (sum, item) => sum + parseDecimalInput(item.unidades) * parseDecimalInput(item.precio_unitario),
    0
  );
  const iva = base * 0.21;
  const total = base + iva;

  function updateLine(
    index: number,
    key: keyof RepairBudgetFormData['items'][number],
    value: string
  ) {
    const next = lines.map((item, itemIndex) =>
      itemIndex === index ? { ...item, [key]: value } : item
    );
    onChangeField('items', next);
  }

  function addLine() {
    onChangeField('items', [
      ...lines,
      { referencia: '', descripcion: '', unidades: '1', precio_unitario: '' },
    ]);
  }

  function removeLine(index: number) {
    const next = lines.filter((_, itemIndex) => itemIndex !== index);
    onChangeField('items', next.length > 0 ? next : [{ referencia: '', descripcion: '', unidades: '1', precio_unitario: '' }]);
  }

  return (
    <View style={homeStyles.detailContainer}>
      <ScreenHeader onHelpPress={onOpenHelp} />

      <Pressable onPress={onBack} style={homeStyles.formBackButton}>
        <Ionicons color={AppColors.primary} name="arrow-back" size={22} />
        <Text style={homeStyles.formBackButtonText}>Volver al detalle</Text>
      </Pressable>

      <Text style={homeStyles.detailTitle}>Nuevo presupuesto de reparación</Text>

      <View style={homeStyles.proposalSummaryCard}>
        <Text style={homeStyles.proposalSummaryTitle}>Información del expediente</Text>
        <FieldRow label="Máquina" value={formatMachineName(selectedMachineDetail)} />
        <FieldRow label="ID máquina" value={selectedMachineDetail.id_maquina} />
        <FieldRow label="Marca" value={selectedMachineDetail.marca} />
        <FieldRow label="Modelo" value={selectedMachineDetail.modelo} />
        <FieldRow label="Ubicación" value={formatLocationLabel(selectedMachineDetail.ubicacion_tipo)} />
        <FieldRow label="Reparación ID" value={activeRepair.id_reparacion} />
        <FieldRow label="Estado reparación" value={activeRepair.estado} />
        <FieldRow label="Causa registrada" value={activeRepair.fault_cause === 'GOLPE_ACCIDENTE' ? 'Golpe o accidente' : 'Desgaste o uso normal'} />
        {proposalSummary ? <FieldRow label="Cliente" value={proposalSummary.cliente} /> : null}
      </View>

      <Text style={homeStyles.sectionHint}>
        La cobertura y quién paga la reparación los decide el backend desde la reparación, el contrato y la causa registrada. Aquí solo se introducen las líneas reales del presupuesto.
      </Text>

      {repairBudgetFeedback ? (
        <Text style={homeStyles.feedbackText}>{repairBudgetFeedback}</Text>
      ) : null}

      <Text style={homeStyles.sectionTitle}>Líneas del presupuesto</Text>
      {lines.map((item, index) => (
        <View key={index} style={homeStyles.proposalSummaryCard}>
          <View style={homeStyles.inlineActionRow}>
            <Text style={homeStyles.proposalSummaryTitle}>Línea {index + 1}</Text>
            {lines.length > 1 ? (
              <Pressable onPress={() => removeLine(index)} style={homeStyles.inlineActionButton}>
                <Text style={homeStyles.inlineActionButtonText}>Quitar</Text>
              </Pressable>
            ) : null}
          </View>

          <Text style={homeStyles.formFieldLabel}>Referencia</Text>
          <TextInput
            onChangeText={(value) => updateLine(index, 'referencia', value)}
            onFocus={onRequestScrollToFocusedInput}
            placeholder="Referencia opcional"
            placeholderTextColor={AppColors.primary50}
            style={homeStyles.formInput}
            value={item.referencia}
          />

          <Text style={homeStyles.formFieldLabel}>Descripción</Text>
          <TextInput
            multiline
            onChangeText={(value) => updateLine(index, 'descripcion', value)}
            onFocus={onRequestScrollToFocusedInput}
            placeholder="Trabajo, recambio o concepto"
            placeholderTextColor={AppColors.primary50}
            style={[homeStyles.formInput, homeStyles.incidenceInput]}
            value={item.descripcion}
          />

          <Text style={homeStyles.formFieldLabel}>Unidades</Text>
          <TextInput
            keyboardType="decimal-pad"
            onChangeText={(value) => updateLine(index, 'unidades', value)}
            onFocus={onRequestScrollToFocusedInput}
            placeholder="1"
            placeholderTextColor={AppColors.primary50}
            style={homeStyles.formInput}
            value={item.unidades}
          />

          <Text style={homeStyles.formFieldLabel}>Precio unitario</Text>
          <TextInput
            keyboardType="decimal-pad"
            onChangeText={(value) => updateLine(index, 'precio_unitario', value)}
            onFocus={onRequestScrollToFocusedInput}
            placeholder="0,00"
            placeholderTextColor={AppColors.primary50}
            style={homeStyles.formInput}
            value={item.precio_unitario}
          />
        </View>
      ))}

      <Pressable onPress={addLine} style={homeStyles.secondaryActionButtonBlock}>
        <Text style={homeStyles.secondaryActionButtonText}>Añadir línea</Text>
      </Pressable>

      <View style={homeStyles.proposalSummaryCard}>
        <FieldRow label="Base imponible" value={formatMoney(base)} />
        <FieldRow label="IVA 21 %" value={formatMoney(iva)} />
        <FieldRow label="Total" value={formatMoney(total)} />
      </View>

      <Text style={homeStyles.formFieldLabel}>Condiciones</Text>
      <TextInput
        multiline
        onChangeText={(value) => onChangeField('condiciones', value)}
        onFocus={onRequestScrollToFocusedInput}
        placeholder="Condiciones particulares del presupuesto"
        placeholderTextColor={AppColors.primary50}
        style={[homeStyles.formInput, homeStyles.incidenceInput]}
        value={repairBudgetForm.condiciones}
      />

      <DateTimePickerField
        label="Fecha de expiración"
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