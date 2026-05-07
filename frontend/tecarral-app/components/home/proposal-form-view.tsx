import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, TextInput, View } from 'react-native';

import { DateTimePickerField } from '@/components/home/date-time-picker-field';
import { FieldRow } from '@/components/home/field-row';
import { AppColors } from '@/constants/theme';
import { homeStyles } from '@/styles/home.styles';
import type { MachineDetail, ProposalFormData } from '@/types/maquina';
import { formatLocationLabel, formatMachineName } from '@/utils/home-format';

export function ProposalFormView({
  selectedMachineDetail,
  proposalFeedback,
  proposalForm,
  onBack,
  onChangeField,
  onSubmit,
  proposalSubmitting,
}: {
  selectedMachineDetail: MachineDetail | null;
  proposalFeedback: string | null;
  proposalForm: ProposalFormData;
  onBack: () => void;
  onChangeField: <K extends keyof ProposalFormData>(key: K, value: ProposalFormData[K]) => void;
  onSubmit: () => void;
  proposalSubmitting: boolean;
}) {
  if (!selectedMachineDetail) {
    return (
      <View style={homeStyles.centeredBlock}>
        <Text style={homeStyles.emptyStateText}>No hay maquina seleccionada.</Text>
      </View>
    );
  }

  return (
    <View style={homeStyles.detailContainer}>
      <Pressable onPress={onBack} style={homeStyles.formBackButton}>
        <Ionicons color={AppColors.primary} name="arrow-back" size={22} />
        <Text style={homeStyles.formBackButtonText}>Volver al detalle</Text>
      </Pressable>

      <Text style={homeStyles.detailTitle}>Nueva propuesta</Text>

      <View style={homeStyles.proposalSummaryCard}>
        <Text style={homeStyles.proposalSummaryTitle}>Maquina seleccionada</Text>
        <FieldRow label="ID" value={selectedMachineDetail.id_maquina} />
        <FieldRow label="Nombre" value={formatMachineName(selectedMachineDetail)} />
        <FieldRow label="Marca" value={selectedMachineDetail.marca} />
        <FieldRow label="Modelo" value={selectedMachineDetail.modelo} />
        <FieldRow label="Ubicacion" value={formatLocationLabel(selectedMachineDetail.ubicacion_tipo)} />
        <FieldRow label="Disponibilidad" value={selectedMachineDetail.availability_status} />
      </View>

      {proposalFeedback ? <Text style={homeStyles.feedbackText}>{proposalFeedback}</Text> : null}

      <TextInput
        onChangeText={(value) => onChangeField('cliente', value)}
        placeholder="Cliente"
        placeholderTextColor={AppColors.primary50}
        style={homeStyles.formInput}
        value={proposalForm.cliente}
      />
      <TextInput
        autoCapitalize="none"
        keyboardType="email-address"
        onChangeText={(value) => onChangeField('email_cliente', value)}
        placeholder="Email cliente"
        placeholderTextColor={AppColors.primary50}
        style={homeStyles.formInput}
        value={proposalForm.email_cliente}
      />
      <TextInput
        keyboardType="phone-pad"
        onChangeText={(value) => onChangeField('telefono', value)}
        placeholder="Telefono"
        placeholderTextColor={AppColors.primary50}
        style={homeStyles.formInput}
        value={proposalForm.telefono}
      />
      <TextInput
        onChangeText={(value) => onChangeField('direccion', value)}
        placeholder="Direccion"
        placeholderTextColor={AppColors.primary50}
        style={homeStyles.formInput}
        value={proposalForm.direccion}
      />
      <TextInput
        onChangeText={(value) => onChangeField('cp', value)}
        placeholder="Codigo postal"
        placeholderTextColor={AppColors.primary50}
        style={homeStyles.formInput}
        value={proposalForm.cp}
      />
      <TextInput
        onChangeText={(value) => onChangeField('poblacion', value)}
        placeholder="Poblacion"
        placeholderTextColor={AppColors.primary50}
        style={homeStyles.formInput}
        value={proposalForm.poblacion}
      />
      <TextInput
        keyboardType="numeric"
        onChangeText={(value) => onChangeField('precio', value)}
        placeholder="Precio"
        placeholderTextColor={AppColors.primary50}
        style={homeStyles.formInput}
        value={proposalForm.precio}
      />
      <DateTimePickerField
        label="Fecha inicio"
        onChange={(value) => onChangeField('fecha_inicio', value)}
        placeholder="Selecciona fecha y hora"
        value={proposalForm.fecha_inicio}
      />
      <DateTimePickerField
        label="Fecha fin"
        onChange={(value) => onChangeField('fecha_fin', value)}
        placeholder="Selecciona fecha y hora"
        value={proposalForm.fecha_fin}
      />

      <Pressable
        onPress={onSubmit}
        style={[homeStyles.primaryActionButton, proposalSubmitting && homeStyles.actionButtonDisabled]}>
        <Text style={homeStyles.primaryActionButtonText}>
          {proposalSubmitting ? 'Guardando...' : 'Crear propuesta'}
        </Text>
      </Pressable>
    </View>
  );
}
