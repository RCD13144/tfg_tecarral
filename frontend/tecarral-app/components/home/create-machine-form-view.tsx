import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { Pressable, Text, TextInput, View } from 'react-native';

import { SelectorField } from '@/components/home/selector-field';
import { ScreenHeader } from '@/components/shared/screen-header';
import { AppColors } from '@/constants/theme';
import { homeStyles } from '@/styles/home.styles';
import type { MachineCreateFormData } from '@/types/maquina';

export function CreateMachineFormView({
  form,
  feedback,
  submitting,
  tipoOpen,
  motorOpen,
  seguroOpen,
  tipoOptions,
  motorOptions,
  seguroOptions,
  onBack,
  onChangeField,
  onSubmit,
  onToggleTipo,
  onToggleMotor,
  onToggleSeguro,
  elevationLibreOpen,
  elevationLibreOptions,
  onToggleElevationLibre,
  onPickImageFromLibrary,
  onTakePhoto,
  onOpenHelp,
  onRequestScrollToFocusedInput,
}: {
  form: MachineCreateFormData;
  feedback: string | null;
  submitting: boolean;
  tipoOpen: boolean;
  motorOpen: boolean;
  seguroOpen: boolean;
  tipoOptions: readonly { label: string; value: string }[];
  motorOptions: readonly { label: string; value: string }[];
  seguroOptions: readonly { label: string; value: string }[];
  onBack: () => void;
  onChangeField: <K extends keyof MachineCreateFormData>(
    key: K,
    value: MachineCreateFormData[K]
  ) => void;
  onSubmit: () => void;
  onToggleTipo: () => void;
  onToggleMotor: () => void;
  onToggleSeguro: () => void;
  elevationLibreOpen: boolean;
  elevationLibreOptions: readonly { label: string; value: string }[];
  onToggleElevationLibre: () => void;
  onPickImageFromLibrary: () => void;
  onTakePhoto: () => void;
  onOpenHelp: () => void;
  onRequestScrollToFocusedInput?: () => void;
}) {
  const isElevation = form.tipo === 'elevacion';

  return (
    <View style={homeStyles.detailContainer}>
      <ScreenHeader onHelpPress={onOpenHelp} />

      <Pressable onPress={onBack} style={homeStyles.formBackButton}>
        <Ionicons color={AppColors.primary} name="arrow-back" size={22} />
        <Text style={homeStyles.formBackButtonText}>Volver al listado</Text>
      </Pressable>

      <Text style={homeStyles.detailTitle}>Nueva máquina</Text>
      <Text style={homeStyles.sectionHint}>
        Se creará automáticamente como disponible y ubicada en taller.
      </Text>

      {feedback ? <Text style={homeStyles.feedbackText}>{feedback}</Text> : null}

      <Text style={homeStyles.formFieldLabel}>Imagen</Text>
      <View style={homeStyles.inlineActionRow}>
        <Pressable onPress={onTakePhoto} style={homeStyles.inlineActionButton}>
          <Ionicons color={AppColors.primary} name="camera-outline" size={18} />
          <Text style={homeStyles.inlineActionButtonText}>Hacer foto</Text>
        </Pressable>

        <Pressable onPress={onPickImageFromLibrary} style={homeStyles.inlineActionButton}>
          <Ionicons color={AppColors.primary} name="images-outline" size={18} />
          <Text style={homeStyles.inlineActionButtonText}>Adjuntar</Text>
        </Pressable>
      </View>

      {form.image_uri ? (
        <View style={homeStyles.machineImagePreviewCard}>
          <ExpoImage
            contentFit="cover"
            source={{ uri: form.image_uri }}
            style={homeStyles.machineImagePreview}
          />
        </View>
      ) : null}

      <Text style={homeStyles.formFieldLabel}>Marca</Text>
      <TextInput
        onChangeText={(value) => onChangeField('marca', value)}
        placeholder="Marca"
        placeholderTextColor={AppColors.primary50}
        style={homeStyles.formInput}
        value={form.marca}
      />

      <Text style={homeStyles.formFieldLabel}>Modelo</Text>
      <TextInput
        onChangeText={(value) => onChangeField('modelo', value)}
        placeholder="Modelo"
        placeholderTextColor={AppColors.primary50}
        style={homeStyles.formInput}
        value={form.modelo}
      />

      <Text style={homeStyles.formFieldLabel}>Número de serie</Text>
      <TextInput
        onChangeText={(value) => onChangeField('ns', value)}
        placeholder="Número de serie"
        placeholderTextColor={AppColors.primary50}
        style={homeStyles.formInput}
        value={form.ns}
      />

      <SelectorField
        isOpen={tipoOpen}
        label="Tipo"
        onSelect={(value) => onChangeField('tipo', value as MachineCreateFormData['tipo'])}
        onToggleOpen={onToggleTipo}
        options={[...tipoOptions]}
        valueLabel={tipoOptions.find((option) => option.value === form.tipo)?.label ?? form.tipo}
      />

      <SelectorField
        isOpen={motorOpen}
        label="Motor"
        onSelect={(value) => onChangeField('motor', value as MachineCreateFormData['motor'])}
        onToggleOpen={onToggleMotor}
        options={[{ label: 'Sin definir', value: '' }, ...motorOptions]}
        valueLabel={
          form.motor
            ? motorOptions.find((option) => option.value === form.motor)?.label ?? form.motor
            : 'Sin definir'
        }
      />

      <SelectorField
        isOpen={seguroOpen}
        label="Seguro"
        onSelect={(value) => onChangeField('seguro', value as MachineCreateFormData['seguro'])}
        onToggleOpen={onToggleSeguro}
        options={[{ label: 'Sin definir', value: '' }, ...seguroOptions]}
        valueLabel={
          form.seguro
            ? seguroOptions.find((option) => option.value === form.seguro)?.label ?? form.seguro
            : 'Sin definir'
        }
      />

      <Text style={homeStyles.formFieldLabel}>Número de póliza</Text>
      <TextInput
        onChangeText={(value) => onChangeField('num_poliza', value)}
        onFocus={onRequestScrollToFocusedInput}
        placeholder="Número de póliza"
        placeholderTextColor={AppColors.primary50}
        style={homeStyles.formInput}
        value={form.num_poliza}
      />

      <Text style={homeStyles.formFieldLabel}>Observaciones</Text>
      <TextInput
        multiline
        onChangeText={(value) => onChangeField('observaciones', value)}
        onFocus={onRequestScrollToFocusedInput}
        placeholder="Observaciones"
        placeholderTextColor={AppColors.primary50}
        style={[homeStyles.formInput, homeStyles.incidenceInput]}
        value={form.observaciones}
      />

      {isElevation ? (
        <>
          <Text style={homeStyles.sectionTitle}>Datos de elevación</Text>

          <Text style={homeStyles.formFieldLabel}>Ruedas</Text>
          <TextInput
            onChangeText={(value) => onChangeField('elev_ruedas', value)}
            placeholder="Ruedas"
            placeholderTextColor={AppColors.primary50}
            style={homeStyles.formInput}
            value={form.elev_ruedas}
          />

          <Text style={homeStyles.formFieldLabel}>Capacidad de carga (Kg)</Text>
          <TextInput
            onChangeText={(value) => onChangeField('elev_cap_carga', value)}
            placeholder="Capacidad de carga (Kg)"
            placeholderTextColor={AppColors.primary50}
            style={homeStyles.formInput}
            value={form.elev_cap_carga}
          />

          <Text style={homeStyles.formFieldLabel}>Replegado (cm)</Text>
          <TextInput
            keyboardType="numeric"
            onChangeText={(value) => onChangeField('elev_replegado_mm', value)}
            placeholder="Replegado (cm)"
            placeholderTextColor={AppColors.primary50}
            style={homeStyles.formInput}
            value={form.elev_replegado_mm}
          />

          <SelectorField
            isOpen={elevationLibreOpen}
            label="Elevación libre"
            onSelect={(value) =>
              onChangeField(
                'elev_elevacion_libre',
                value as MachineCreateFormData['elev_elevacion_libre']
              )
            }
            onToggleOpen={onToggleElevationLibre}
            options={[{ label: 'Sin definir', value: '' }, ...elevationLibreOptions]}
            valueLabel={
              form.elev_elevacion_libre
                ? elevationLibreOptions.find((option) => option.value === form.elev_elevacion_libre)
                    ?.label ?? form.elev_elevacion_libre
                : 'Sin definir'
            }
          />

          <Text style={homeStyles.formFieldLabel}>Elevación (cm)</Text>
          <TextInput
            onChangeText={(value) => onChangeField('elev_elevacion', value)}
            placeholder="Elevación (cm)"
            placeholderTextColor={AppColors.primary50}
            style={homeStyles.formInput}
            value={form.elev_elevacion}
          />

          <Text style={homeStyles.formFieldLabel}>Desplazamiento</Text>
          <TextInput
            onChangeText={(value) => onChangeField('elev_desplazamiento', value)}
            placeholder="Desplazamiento"
            placeholderTextColor={AppColors.primary50}
            style={homeStyles.formInput}
            value={form.elev_desplazamiento}
          />

          <Text style={homeStyles.formFieldLabel}>Posición</Text>
          <TextInput
            onChangeText={(value) => onChangeField('elev_posicion', value)}
            placeholder="Posición"
            placeholderTextColor={AppColors.primary50}
            style={homeStyles.formInput}
            value={form.elev_posicion}
          />

          <Text style={homeStyles.formFieldLabel}>Antihuella</Text>
          <TextInput
            onChangeText={(value) => onChangeField('elev_antihuella', value)}
            placeholder="Antihuella"
            placeholderTextColor={AppColors.primary50}
            style={homeStyles.formInput}
            value={form.elev_antihuella}
          />

          <Text style={homeStyles.formFieldLabel}>Matrícula</Text>
          <TextInput
            onChangeText={(value) => onChangeField('elev_matricula', value)}
            placeholder="Matrícula"
            placeholderTextColor={AppColors.primary50}
            style={homeStyles.formInput}
            value={form.elev_matricula}
          />

          <Text style={homeStyles.formFieldLabel}>Largo (cm)</Text>
          <TextInput
            keyboardType="numeric"
            onChangeText={(value) => onChangeField('elev_largo', value)}
            placeholder="Largo (cm)"
            placeholderTextColor={AppColors.primary50}
            style={homeStyles.formInput}
            value={form.elev_largo}
          />

          <Text style={homeStyles.formFieldLabel}>Alto (cm)</Text>
          <TextInput
            keyboardType="numeric"
            onChangeText={(value) => onChangeField('elev_alto', value)}
            placeholder="Alto (cm)"
            placeholderTextColor={AppColors.primary50}
            style={homeStyles.formInput}
            value={form.elev_alto}
          />

          <Text style={homeStyles.formFieldLabel}>Ancho (cm)</Text>
          <TextInput
            keyboardType="numeric"
            onChangeText={(value) => onChangeField('elev_ancho', value)}
            placeholder="Ancho (cm)"
            placeholderTextColor={AppColors.primary50}
            style={homeStyles.formInput}
            value={form.elev_ancho}
          />

          <Text style={homeStyles.formFieldLabel}>Peso (Kg)</Text>
          <TextInput
            keyboardType="numeric"
            onChangeText={(value) => onChangeField('elev_peso_kg', value)}
            placeholder="Peso (Kg)"
            placeholderTextColor={AppColors.primary50}
            style={homeStyles.formInput}
            value={form.elev_peso_kg}
          />

          <Text style={homeStyles.formFieldLabel}>Horquillas (cm)</Text>
          <TextInput
            onChangeText={(value) => onChangeField('elev_horquillas', value)}
            placeholder="Horquillas (cm)"
            placeholderTextColor={AppColors.primary50}
            style={homeStyles.formInput}
            value={form.elev_horquillas}
          />
        </>
      ) : null}

      <Pressable
        disabled={submitting}
        onPress={onSubmit}
        style={[homeStyles.primaryActionButton, submitting && homeStyles.actionButtonDisabled]}>
        <Text style={homeStyles.primaryActionButtonText}>
          {submitting ? 'Creando...' : 'Crear máquina'}
        </Text>
      </Pressable>
    </View>
  );
}
