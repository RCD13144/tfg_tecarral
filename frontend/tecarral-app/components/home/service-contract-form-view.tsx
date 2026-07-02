import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, TextInput, View } from 'react-native';

import { DateTimePickerField } from '@/components/home/date-time-picker-field';
import { FieldRow } from '@/components/home/field-row';
import { ScreenHeader } from '@/components/shared/screen-header';
import { AppColors } from '@/constants/theme';
import { homeStyles } from '@/styles/home.styles';
import type { MachineDetail, ServiceContractCreateFormData } from '@/types/maquina';
import { formatMachineName } from '@/utils/home-format';

const WEEKDAY_OPTIONS = [
  { label: 'Lunes', value: '1' },
  { label: 'Martes', value: '2' },
  { label: 'Miercoles', value: '3' },
  { label: 'Jueves', value: '4' },
  { label: 'Viernes', value: '5' },
] as const;

export function ServiceContractFormView({
  selectedMachineDetail,
  form,
  feedback,
  submitting,
  onBack,
  onChangeField,
  onSubmit,
  onOpenHelp,
  onRequestScrollToFocusedInput: _onRequestScrollToFocusedInput,
}: {
  selectedMachineDetail: MachineDetail | null;
  form: ServiceContractCreateFormData;
  feedback: string | null;
  submitting: boolean;
  onBack: () => void;
  onChangeField: <K extends keyof ServiceContractCreateFormData>(
    key: K,
    value: ServiceContractCreateFormData[K]
  ) => void;
  onSubmit: () => void;
  onOpenHelp: () => void;
  onRequestScrollToFocusedInput?: () => void;
}) {
  const contractTypeOptions = [
    { label: 'Preventivo', value: 'PREVENTIVO' },
    { label: 'Todo incluido', value: 'TODO_INCLUIDO' },
  ] as const;
  const recurrenceOptions = [
    { label: 'Semanas', value: 'WEEK' },
    { label: 'Meses', value: 'MONTH' },
  ] as const;
  const isWeekly = form.recurrencia_unidad === 'WEEK';
  const isMonthly = form.recurrencia_unidad === 'MONTH';

  if (!selectedMachineDetail) {
    return (
      <View style={homeStyles.centeredBlock}>
        <Text style={homeStyles.emptyStateText}>No hay maquina seleccionada.</Text>
      </View>
    );
  }

  return (
    <View style={homeStyles.detailContainer}>
      <ScreenHeader onHelpPress={onOpenHelp} />

      <Pressable onPress={onBack} style={homeStyles.formBackButton}>
        <Ionicons color={AppColors.primary} name="arrow-back" size={22} />
        <Text style={homeStyles.formBackButtonText}>Volver al detalle</Text>
      </Pressable>

      <Text style={homeStyles.detailTitle}>Nuevo contrato de mantenimiento</Text>

      <View style={homeStyles.proposalSummaryCard}>
        <Text style={homeStyles.proposalSummaryTitle}>Maquina</Text>
        <FieldRow label="Maquina" value={formatMachineName(selectedMachineDetail)} />
        <FieldRow label="ID maquina" value={selectedMachineDetail.id_maquina} />
        <FieldRow label="Ubicación operativa" value={selectedMachineDetail.ubicacion} />
      </View>

      {feedback ? <Text style={homeStyles.feedbackText}>{feedback}</Text> : null}

      <Text style={homeStyles.formFieldLabel}>Tipo de contrato</Text>
      <View style={homeStyles.inlineActionRow}>
        {contractTypeOptions.map((option) => {
          const selected = form.contract_type === option.value;
          return (
            <Pressable
              key={option.value}
              onPress={() => onChangeField('contract_type', option.value)}
              style={[homeStyles.inlineActionButton, selected && homeStyles.filterChipActive]}>
              <Text style={[homeStyles.inlineActionButtonText, selected && homeStyles.filterChipTextActive]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={homeStyles.formFieldLabel}>Tarifa fija</Text>
      <TextInput
        keyboardType="numeric"
        onChangeText={(value) => onChangeField('tarifa_fija', value)}
        placeholder="Tarifa fija"
        placeholderTextColor={AppColors.primary50}
        style={homeStyles.formInput}
        value={form.tarifa_fija}
      />

      <DateTimePickerField
        label="Fecha inicio"
        onChange={(value) => onChangeField('start_date', value)}
        placeholder="Selecciona la fecha de inicio"
        value={form.start_date}
      />

      <DateTimePickerField
        label="Fecha fin opcional"
        onChange={(value) => onChangeField('end_date', value)}
        placeholder="Selecciona la fecha fin"
        value={form.end_date}
      />

      <Text style={homeStyles.formFieldLabel}>Frecuencia de visitas</Text>
      <View style={homeStyles.inlineActionRow}>
        {recurrenceOptions.map((option) => {
          const selected = form.recurrencia_unidad === option.value;
          return (
            <Pressable
              key={option.value}
              onPress={() => onChangeField('recurrencia_unidad', option.value)}
              style={[homeStyles.inlineActionButton, selected && homeStyles.filterChipActive]}>
              <Text style={[homeStyles.inlineActionButtonText, selected && homeStyles.filterChipTextActive]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {isWeekly ? (
        <>
          <Text style={homeStyles.formFieldLabel}>Dia de visita</Text>
          <View style={homeStyles.inlineActionColumn}>
            {WEEKDAY_OPTIONS.map((option) => {
              const selected = form.maintenance_weekday === option.value;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => onChangeField('maintenance_weekday', option.value)}
                  style={[homeStyles.inlineActionButton, selected && homeStyles.filterChipActive]}>
                  <Text style={[homeStyles.inlineActionButtonText, selected && homeStyles.filterChipTextActive]}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </>
      ) : null}

      {isMonthly ? (
        <>
          <Text style={homeStyles.formFieldLabel}>Dia del mes</Text>
          <TextInput
            keyboardType="number-pad"
            maxLength={2}
            onChangeText={(value) => onChangeField('maintenance_day_of_month', value.replace(/[^0-9]/g, '').slice(0, 2))}
            placeholder="Ej. 15"
            placeholderTextColor={AppColors.primary50}
            style={homeStyles.formInput}
            value={form.maintenance_day_of_month}
          />
        </>
      ) : null}

      <Text style={homeStyles.sectionTitle}>Cliente</Text>

      <Text style={homeStyles.formFieldLabel}>Nombre</Text>
      <TextInput
        onChangeText={(value) => onChangeField('cliente_nombre', value)}
        placeholder="Nombre del cliente"
        placeholderTextColor={AppColors.primary50}
        style={homeStyles.formInput}
        value={form.cliente_nombre}
      />

      <Text style={homeStyles.formFieldLabel}>Email</Text>
      <TextInput
        autoCapitalize="none"
        keyboardType="email-address"
        onChangeText={(value) => onChangeField('cliente_email', value)}
        placeholder="Email del cliente"
        placeholderTextColor={AppColors.primary50}
        style={homeStyles.formInput}
        value={form.cliente_email}
      />

      <Text style={homeStyles.formFieldLabel}>Telefono</Text>
      <TextInput
        keyboardType="phone-pad"
        onChangeText={(value) => onChangeField('cliente_telefono', value)}
        placeholder="Telefono"
        placeholderTextColor={AppColors.primary50}
        style={homeStyles.formInput}
        value={form.cliente_telefono}
      />

      <Text style={homeStyles.formFieldLabel}>Direccion oficinas</Text>
      <TextInput
        onChangeText={(value) => onChangeField('cliente_direccion', value)}
        placeholder="Direccion fiscal u oficinas"
        placeholderTextColor={AppColors.primary50}
        style={homeStyles.formInput}
        value={form.cliente_direccion}
      />

      <Text style={homeStyles.formFieldLabel}>Poblacion</Text>
      <TextInput
        onChangeText={(value) => onChangeField('cliente_poblacion', value)}
        placeholder="Poblacion"
        placeholderTextColor={AppColors.primary50}
        style={homeStyles.formInput}
        value={form.cliente_poblacion}
      />

      <Text style={homeStyles.formFieldLabel}>Codigo postal</Text>
      <TextInput
        keyboardType="number-pad"
        onChangeText={(value) => onChangeField('cliente_cp', value)}
        placeholder="Codigo postal"
        placeholderTextColor={AppColors.primary50}
        style={homeStyles.formInput}
        value={form.cliente_cp}
      />

      <Text style={homeStyles.formFieldLabel}>Condiciones</Text>
      <TextInput
        multiline
        onChangeText={(value) => onChangeField('condiciones', value)}
        placeholder="Condiciones del contrato"
        placeholderTextColor={AppColors.primary50}
        style={[homeStyles.formInput, homeStyles.incidenceInput]}
        value={form.condiciones}
      />

      <Pressable
        disabled={submitting}
        onPress={onSubmit}
        style={[homeStyles.primaryActionButton, submitting && homeStyles.actionButtonDisabled]}>
        <Text style={homeStyles.primaryActionButtonText}>
          {submitting ? 'Creando...' : 'Crear contrato'}
        </Text>
      </Pressable>
    </View>
  );
}
