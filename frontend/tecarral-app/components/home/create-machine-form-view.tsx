import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Image as ExpoImage } from 'expo-image';
import { Pressable, Text, TextInput, View } from 'react-native';

import { SelectorField } from '@/components/home/selector-field';
import { ScreenHeader } from '@/components/shared/screen-header';
import { AppColors } from '@/constants/theme';
import { homeStyles } from '@/styles/home.styles';
import type { InventoryOwnershipType, MachineCreateFormData } from '@/types/maquina';

export function CreateMachineFormView({
  form,
  feedback,
  inventoryOwnershipType,
  submitting,
  subtipoOpen,
  tipoOpen,
  motorOpen,
  seguroOpen,
  subtipoOptions,
  tipoOptions,
  motorOptions,
  seguroOptions,
  onBack,
  onChangeField,
  onSubmit,
  onToggleSubtipo,
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
  inventoryOwnershipType: InventoryOwnershipType;
  submitting: boolean;
  subtipoOpen: boolean;
  tipoOpen: boolean;
  motorOpen: boolean;
  seguroOpen: boolean;
  subtipoOptions: readonly { label: string; value: string }[];
  tipoOptions: readonly { label: string; value: string }[];
  motorOptions: readonly { label: string; value: string }[];
  seguroOptions: readonly { label: string; value: string }[];
  onBack: () => void;
  onChangeField: <K extends keyof MachineCreateFormData>(
    key: K,
    value: MachineCreateFormData[K]
  ) => void;
  onSubmit: () => void;
  onToggleSubtipo: () => void;
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
  const isCustomerInventory = inventoryOwnershipType === 'CLIENTE';
  const cleaningSubtypes = new Set([
    'Fregadora',
    'Barredora',
    'Criógena',
    'Hidrolimpiadora',
    'Aspirador',
    'Vaporeta',
    'Limpiamoquetas',
    'Pulidora',
  ]);
  const filteredSubtipoOptions = subtipoOptions.filter((option) =>
    form.tipo === 'limpieza'
      ? cleaningSubtypes.has(option.value)
      : !cleaningSubtypes.has(option.value)
  );
  const [step, setStep] = useState(0);
  const steps = useMemo(
    () => [
      'Datos básicos',
      ...(isCustomerInventory ? ['Cliente propietario', 'Ubicación operativa'] : []),
      'Datos técnicos',
      ...(isElevation ? ['Datos de elevación'] : []),
    ],
    [isCustomerInventory, isElevation]
  );
  const isLastStep = step >= steps.length - 1;

  function goNext() {
    setStep((current) => Math.min(current + 1, steps.length - 1));
  }

  function goBackStep() {
    setStep((current) => Math.max(current - 1, 0));
  }

  const currentStep = steps[step];

  return (
    <View style={homeStyles.detailContainer}>
      <ScreenHeader onHelpPress={onOpenHelp} />

      <Pressable onPress={onBack} style={homeStyles.formBackButton}>
        <Ionicons color={AppColors.primary} name="arrow-back" size={22} />
        <Text style={homeStyles.formBackButtonText}>Volver al listado</Text>
      </Pressable>

      <Text style={homeStyles.detailTitle}>Nueva máquina</Text>
      <Text style={homeStyles.sectionHint}>
        {isCustomerInventory
          ? 'Se creará como máquina propiedad del cliente. La dirección del cliente y la ubicación operativa se guardan por separado.'
          : 'Se creará automáticamente como máquina de Tecarral, disponible y ubicada en taller.'}
      </Text>

      {feedback ? <Text style={homeStyles.feedbackText}>{feedback}</Text> : null}

      <View style={homeStyles.wizardHeader}>
        <Text style={homeStyles.sectionTitle}>{currentStep}</Text>
        <Text style={homeStyles.sectionHint}>Paso {step + 1} de {steps.length}</Text>
      </View>

      {currentStep === 'Datos básicos' ? (
        <>
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

          <SelectorField
            isOpen={tipoOpen}
            label="Línea técnica"
            onSelect={(value) => onChangeField('tipo', value as MachineCreateFormData['tipo'])}
            onToggleOpen={onToggleTipo}
            options={[...tipoOptions]}
            valueLabel={tipoOptions.find((option) => option.value === form.tipo)?.label ?? form.tipo}
          />

          <SelectorField
            isOpen={subtipoOpen}
            label="Nombre / tipo de máquina"
            onSelect={(value) => onChangeField('subtipo', value)}
            onToggleOpen={onToggleSubtipo}
            options={[{ label: 'Selecciona un tipo', value: '' }, ...filteredSubtipoOptions]}
            valueLabel={
              filteredSubtipoOptions.find((option) => option.value === form.subtipo)?.label ??
              (form.subtipo || 'Selecciona un tipo')
            }
          />

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
        </>
      ) : null}

      {currentStep === 'Cliente propietario' ? (
        <>
          <Text style={homeStyles.sectionHint}>
            Estos datos identifican al cliente propietario y se usarán en albaranes, presupuestos, contratos y correos.
          </Text>

          <Text style={homeStyles.formFieldLabel}>Nombre del cliente</Text>
          <TextInput
            onChangeText={(value) => onChangeField('owner_cliente_nombre', value)}
            onFocus={onRequestScrollToFocusedInput}
            placeholder="Empresa o nombre del cliente"
            placeholderTextColor={AppColors.primary50}
            style={homeStyles.formInput}
            value={form.owner_cliente_nombre}
          />

          <Text style={homeStyles.formFieldLabel}>Email</Text>
          <TextInput
            autoCapitalize="none"
            keyboardType="email-address"
            onChangeText={(value) => onChangeField('owner_cliente_email', value)}
            onFocus={onRequestScrollToFocusedInput}
            placeholder="correo@cliente.com"
            placeholderTextColor={AppColors.primary50}
            style={homeStyles.formInput}
            value={form.owner_cliente_email}
          />

          <Text style={homeStyles.formFieldLabel}>Teléfono</Text>
          <TextInput
            keyboardType="phone-pad"
            onChangeText={(value) => onChangeField('owner_cliente_telefono', value)}
            onFocus={onRequestScrollToFocusedInput}
            placeholder="Teléfono"
            placeholderTextColor={AppColors.primary50}
            style={homeStyles.formInput}
            value={form.owner_cliente_telefono}
          />

          <Text style={homeStyles.formFieldLabel}>Dirección fiscal / oficinas</Text>
          <TextInput
            onChangeText={(value) => onChangeField('owner_cliente_direccion', value)}
            onFocus={onRequestScrollToFocusedInput}
            placeholder="Calle, número, nave, polígono..."
            placeholderTextColor={AppColors.primary50}
            style={homeStyles.formInput}
            value={form.owner_cliente_direccion}
          />

          <Text style={homeStyles.formFieldLabel}>Código postal</Text>
          <TextInput
            keyboardType="number-pad"
            maxLength={5}
            onChangeText={(value) => onChangeField('owner_cliente_cp', value)}
            onFocus={onRequestScrollToFocusedInput}
            placeholder="Código postal"
            placeholderTextColor={AppColors.primary50}
            style={homeStyles.formInput}
            value={form.owner_cliente_cp}
          />

          <Text style={homeStyles.formFieldLabel}>Población</Text>
          <TextInput
            onChangeText={(value) => onChangeField('owner_cliente_poblacion', value)}
            onFocus={onRequestScrollToFocusedInput}
            placeholder="Población o ciudad"
            placeholderTextColor={AppColors.primary50}
            style={homeStyles.formInput}
            value={form.owner_cliente_poblacion}
          />
        </>
      ) : null}

      {currentStep === 'Ubicación operativa' ? (
        <>
          <Text style={homeStyles.sectionHint}>
            Esta dirección es donde trabaja físicamente la máquina. Se usará para Maps, Waze o Apple Mapas y puede ser distinta de las oficinas del cliente.
          </Text>

          <Text style={homeStyles.formFieldLabel}>Calle y número</Text>
          <TextInput
            onChangeText={(value) => onChangeField('ubicacion_operativa_direccion', value)}
            onFocus={onRequestScrollToFocusedInput}
            placeholder="Calle, número, nave, polígono..."
            placeholderTextColor={AppColors.primary50}
            style={homeStyles.formInput}
            value={form.ubicacion_operativa_direccion}
          />

          <Text style={homeStyles.formFieldLabel}>Código postal</Text>
          <TextInput
            keyboardType="number-pad"
            maxLength={5}
            onChangeText={(value) => onChangeField('ubicacion_operativa_cp', value)}
            onFocus={onRequestScrollToFocusedInput}
            placeholder="Código postal"
            placeholderTextColor={AppColors.primary50}
            style={homeStyles.formInput}
            value={form.ubicacion_operativa_cp}
          />

          <Text style={homeStyles.formFieldLabel}>Población</Text>
          <TextInput
            onChangeText={(value) => onChangeField('ubicacion_operativa_poblacion', value)}
            onFocus={onRequestScrollToFocusedInput}
            placeholder="Población o ciudad"
            placeholderTextColor={AppColors.primary50}
            style={homeStyles.formInput}
            value={form.ubicacion_operativa_poblacion}
          />
        </>
      ) : null}

      {currentStep === 'Datos técnicos' ? (
        <>
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
        </>
      ) : null}

      {currentStep === 'Datos de elevación' && isElevation ? (
        <>
          <Text style={homeStyles.formFieldLabel}>Ruedas</Text>
          <TextInput onChangeText={(value) => onChangeField('elev_ruedas', value)} placeholder="Ruedas" placeholderTextColor={AppColors.primary50} style={homeStyles.formInput} value={form.elev_ruedas} />
          <Text style={homeStyles.formFieldLabel}>Capacidad de carga (kg)</Text>
          <TextInput onChangeText={(value) => onChangeField('elev_cap_carga', value)} placeholder="Capacidad de carga" placeholderTextColor={AppColors.primary50} style={homeStyles.formInput} value={form.elev_cap_carga} />
          <Text style={homeStyles.formFieldLabel}>Replegado (cm)</Text>
          <TextInput keyboardType="numeric" onChangeText={(value) => onChangeField('elev_replegado_mm', value)} placeholder="Replegado" placeholderTextColor={AppColors.primary50} style={homeStyles.formInput} value={form.elev_replegado_mm} />
          <SelectorField isOpen={elevationLibreOpen} label="Elevación libre" onSelect={(value) => onChangeField('elev_elevacion_libre', value as MachineCreateFormData['elev_elevacion_libre'])} onToggleOpen={onToggleElevationLibre} options={[{ label: 'Sin definir', value: '' }, ...elevationLibreOptions]} valueLabel={form.elev_elevacion_libre ? elevationLibreOptions.find((option) => option.value === form.elev_elevacion_libre)?.label ?? form.elev_elevacion_libre : 'Sin definir'} />
          <Text style={homeStyles.formFieldLabel}>Elevación (cm)</Text>
          <TextInput onChangeText={(value) => onChangeField('elev_elevacion', value)} placeholder="Elevación" placeholderTextColor={AppColors.primary50} style={homeStyles.formInput} value={form.elev_elevacion} />
          <Text style={homeStyles.formFieldLabel}>Desplazamiento</Text>
          <TextInput onChangeText={(value) => onChangeField('elev_desplazamiento', value)} placeholder="Desplazamiento" placeholderTextColor={AppColors.primary50} style={homeStyles.formInput} value={form.elev_desplazamiento} />
          <Text style={homeStyles.formFieldLabel}>Posición</Text>
          <TextInput onChangeText={(value) => onChangeField('elev_posicion', value)} placeholder="Posición" placeholderTextColor={AppColors.primary50} style={homeStyles.formInput} value={form.elev_posicion} />
          <Text style={homeStyles.formFieldLabel}>Antihuella</Text>
          <TextInput onChangeText={(value) => onChangeField('elev_antihuella', value)} placeholder="Antihuella" placeholderTextColor={AppColors.primary50} style={homeStyles.formInput} value={form.elev_antihuella} />
          <Text style={homeStyles.formFieldLabel}>Matrícula</Text>
          <TextInput onChangeText={(value) => onChangeField('elev_matricula', value)} placeholder="Matrícula" placeholderTextColor={AppColors.primary50} style={homeStyles.formInput} value={form.elev_matricula} />
          <Text style={homeStyles.formFieldLabel}>Largo (cm)</Text>
          <TextInput keyboardType="numeric" onChangeText={(value) => onChangeField('elev_largo', value)} placeholder="Largo" placeholderTextColor={AppColors.primary50} style={homeStyles.formInput} value={form.elev_largo} />
          <Text style={homeStyles.formFieldLabel}>Alto (cm)</Text>
          <TextInput keyboardType="numeric" onChangeText={(value) => onChangeField('elev_alto', value)} placeholder="Alto" placeholderTextColor={AppColors.primary50} style={homeStyles.formInput} value={form.elev_alto} />
          <Text style={homeStyles.formFieldLabel}>Ancho (cm)</Text>
          <TextInput keyboardType="numeric" onChangeText={(value) => onChangeField('elev_ancho', value)} placeholder="Ancho" placeholderTextColor={AppColors.primary50} style={homeStyles.formInput} value={form.elev_ancho} />
          <Text style={homeStyles.formFieldLabel}>Peso (kg)</Text>
          <TextInput keyboardType="numeric" onChangeText={(value) => onChangeField('elev_peso_kg', value)} placeholder="Peso" placeholderTextColor={AppColors.primary50} style={homeStyles.formInput} value={form.elev_peso_kg} />
          <Text style={homeStyles.formFieldLabel}>Horquillas (cm)</Text>
          <TextInput onChangeText={(value) => onChangeField('elev_horquillas', value)} placeholder="Horquillas" placeholderTextColor={AppColors.primary50} style={homeStyles.formInput} value={form.elev_horquillas} />
        </>
      ) : null}

      <View style={homeStyles.wizardActionsRow}>
        {step > 0 ? (
          <Pressable onPress={goBackStep} style={homeStyles.secondaryActionButtonBlock}>
            <Text style={homeStyles.secondaryActionButtonText}>Anterior</Text>
          </Pressable>
        ) : null}

        <Pressable
          disabled={submitting}
          onPress={isLastStep ? onSubmit : goNext}
          style={[homeStyles.primaryActionButton, submitting && homeStyles.actionButtonDisabled]}>
          <Text style={homeStyles.primaryActionButtonText}>
            {submitting ? 'Creando...' : isLastStep ? 'Crear máquina' : 'Continuar'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}