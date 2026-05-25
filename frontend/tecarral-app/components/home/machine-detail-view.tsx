import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';

import { FieldRow } from '@/components/home/field-row';
import { ProposalCard } from '@/components/home/proposal-card';
import { SelectorField } from '@/components/home/selector-field';
import { COMMON_DETAIL_FIELDS, ELEVATION_DETAIL_FIELDS } from '@/constants/home';
import { AppColors } from '@/constants/theme';
import { homeStyles } from '@/styles/home.styles';
import type { MachineDetail, MachineEditFormData, MachineProposalSummary } from '@/types/maquina';
import {
  formatLocationLabel,
  formatMachineName,
  formatMaintenanceLabel,
  normalizeValue,
} from '@/utils/home-format';

export function MachineDetailView({
  detailLoading,
  selectedMachineDetail,
  machineImageSource,
  machineImageHasBackground,
  detailFeedback,
  detailSuccessFeedback,
  onBack,
  locationActionLoading,
  locationOptions,
  locationPickerOpen,
  selectedTargetLocation,
  onToggleLocationPicker,
  onSelectLocation,
  canMarkDelivered,
  onConfirmLocation,
  statusActionLoading,
  maintenanceOptions,
  statusPickerOpen,
  selectedMaintenanceStatus,
  incidenceComment,
  incidencePanelVisible,
  onChangeIncidenceComment,
  onCancelIncidenceDraft,
  onSubmitIncidence,
  onToggleStatusPicker,
  onSelectMaintenance,
  acceptedProposal,
  proposalsExpanded,
  onToggleProposals,
  proposals,
  onOpenProposalDetail,
  canCreateProposal,
  canOpenProposalForm,
  proposalButtonDisabledReason,
  onOpenProposalForm,
  machineEditForm,
  machineEditFeedback,
  machineEditSubmitting,
  machineEditMode,
  machineEditTipoOpen,
  machineEditMotorOpen,
  machineEditSeguroOpen,
  machineEditElevationLibreOpen,
  machineEditAntihuellaOpen,
  machineTipoOptions,
  machineMotorOptions,
  machineSeguroOptions,
  machineBooleanOptions,
  onChangeMachineEditField,
  onOpenMachineEdit,
  onCancelMachineEdit,
  onSaveMachineEdit,
  onToggleMachineEditTipo,
  onToggleMachineEditMotor,
  onToggleMachineEditSeguro,
  onToggleMachineEditElevationLibre,
  onToggleMachineEditAntihuella,
  onPickMachineEditImageFromLibrary,
  onTakeMachineEditPhoto,
  showRepairBudgetButton,
  canCreateRepairBudget,
  repairBudgetDisabledReason,
  onOpenRepairBudgetForm,
  onOpenNavigation,
  canSubmitIncidence,
  incidenceEscalationMode,
  onRequestScrollToFocusedInput,
}: {
  detailLoading: boolean;
  selectedMachineDetail: MachineDetail | null;
  machineImageSource: unknown;
  machineImageHasBackground: boolean;
  detailFeedback: string | null;
  detailSuccessFeedback: string | null;
  onBack: () => void;
  locationActionLoading: boolean;
  locationOptions: { label: string; value: string }[];
  locationPickerOpen: boolean;
  selectedTargetLocation: string;
  onToggleLocationPicker: () => void;
  onSelectLocation: (value: string) => void;
  canMarkDelivered: boolean;
  onConfirmLocation: () => void;
  statusActionLoading: boolean;
  maintenanceOptions: { label: string; value: string }[];
  statusPickerOpen: boolean;
  selectedMaintenanceStatus: string;
  incidenceComment: string;
  incidencePanelVisible: boolean;
  onChangeIncidenceComment: (value: string) => void;
  onCancelIncidenceDraft: () => void;
  onSubmitIncidence: () => void;
  onToggleStatusPicker: () => void;
  onSelectMaintenance: (value: string) => void;
  acceptedProposal: MachineProposalSummary | null;
  proposalsExpanded: boolean;
  onToggleProposals: () => void;
  proposals: MachineProposalSummary[];
  onOpenProposalDetail: (proposal: MachineProposalSummary) => void;
  canCreateProposal: boolean;
  canOpenProposalForm: boolean;
  proposalButtonDisabledReason: string | null;
  onOpenProposalForm: () => void;
  machineEditForm: MachineEditFormData;
  machineEditFeedback: string | null;
  machineEditSubmitting: boolean;
  machineEditMode: boolean;
  machineEditTipoOpen: boolean;
  machineEditMotorOpen: boolean;
  machineEditSeguroOpen: boolean;
  machineEditElevationLibreOpen: boolean;
  machineEditAntihuellaOpen: boolean;
  machineTipoOptions: readonly { label: string; value: string }[];
  machineMotorOptions: readonly { label: string; value: string }[];
  machineSeguroOptions: readonly { label: string; value: string }[];
  machineBooleanOptions: readonly { label: string; value: string }[];
  onChangeMachineEditField: <K extends keyof MachineEditFormData>(
    key: K,
    value: MachineEditFormData[K]
  ) => void;
  onOpenMachineEdit: () => void;
  onCancelMachineEdit: () => void;
  onSaveMachineEdit: () => void;
  onToggleMachineEditTipo: () => void;
  onToggleMachineEditMotor: () => void;
  onToggleMachineEditSeguro: () => void;
  onToggleMachineEditElevationLibre: () => void;
  onToggleMachineEditAntihuella: () => void;
  onPickMachineEditImageFromLibrary: () => void;
  onTakeMachineEditPhoto: () => void;
  showRepairBudgetButton: boolean;
  canCreateRepairBudget: boolean;
  repairBudgetDisabledReason: string | null;
  onOpenRepairBudgetForm: () => void;
  onOpenNavigation: () => void;
  canSubmitIncidence: boolean;
  incidenceEscalationMode: boolean;
  onRequestScrollToFocusedInput?: () => void;
}) {
  const insets = useSafeAreaInsets();

  if (detailLoading) {
    return (
      <View style={homeStyles.centeredBlock}>
        <ActivityIndicator color={AppColors.primary} />
        <Text style={homeStyles.loadingText}>Cargando detalle...</Text>
      </View>
    );
  }

  if (!selectedMachineDetail) {
    return (
      <View style={homeStyles.centeredBlock}>
        <Text style={homeStyles.emptyStateText}>No se pudo cargar el detalle de la máquina.</Text>
      </View>
    );
  }

  const locationValue = formatLocationLabel(
    selectedTargetLocation || selectedMachineDetail.ubicacion_tipo
  );
  const statusValue = formatMaintenanceLabel(
    selectedMaintenanceStatus || selectedMachineDetail.maintenance_status
  );
  const isElevation = normalizeValue(selectedMachineDetail.tipo_maquina) === 'elevacion';
  const isEditElevation = machineEditForm.tipo === 'elevacion';

  return (
    <View style={homeStyles.detailContainer}>
      <View style={[homeStyles.detailHero, { paddingTop: insets.top }]}>
        <Pressable onPress={onBack} style={[homeStyles.detailCloseButton, { top: insets.top + 18 }]}>
          <Ionicons color={AppColors.primary} name="close-circle-outline" size={28} />
        </Pressable>
        {machineImageSource ? (
          machineImageHasBackground ? (
            <View style={homeStyles.detailImageFrame}>
              <ExpoImage contentFit="contain" source={machineImageSource} style={homeStyles.detailImage} />
            </View>
          ) : (
            <ExpoImage
              contentFit="contain"
              source={machineImageSource}
              style={homeStyles.detailImageBare}
            />
          )
        ) : (
          <Ionicons color={AppColors.primary50} name="image-outline" size={42} />
        )}
      </View>

      <Text style={homeStyles.detailTitle}>Máquina #{selectedMachineDetail.id_maquina}</Text>

      {detailFeedback ? <Text style={homeStyles.feedbackText}>{detailFeedback}</Text> : null}
      {detailSuccessFeedback ? (
        <Text style={homeStyles.successFeedbackText}>{detailSuccessFeedback}</Text>
      ) : null}

      <FieldRow label="Nombre" value={formatMachineName(selectedMachineDetail)} />

      {COMMON_DETAIL_FIELDS.map((field) => (
        <FieldRow key={field.key} label={field.label} value={selectedMachineDetail[field.key]} />
      ))}

      <Text style={homeStyles.detailLine}>
        <Text style={homeStyles.detailLabel}>Seguro: </Text>
        <Text style={homeStyles.detailValue}>
          {selectedMachineDetail.seguro === true
            ? 'Sí'
            : selectedMachineDetail.seguro === false
              ? 'No'
              : '-'}
        </Text>
      </Text>

      {selectedMachineDetail.active_repair?.presupuesto_reparacion_id ? (
        <Text style={homeStyles.detailLine}>
          <Text style={homeStyles.detailLabel}>Presupuesto reparación: </Text>
          <Text style={homeStyles.detailValue}>
            #{selectedMachineDetail.active_repair.presupuesto_reparacion_id} ·{' '}
            {selectedMachineDetail.active_repair.presupuesto_estado ?? '-'} ·{' '}
            {selectedMachineDetail.active_repair.presupuesto_payer_type === 'CLIENTE'
              ? 'Paga cliente'
              : selectedMachineDetail.active_repair.presupuesto_payer_type === 'EMPRESA'
                ? 'Paga empresa'
                : '-'}
          </Text>
        </Text>
      ) : null}

      {machineEditMode ? (
        <View style={homeStyles.sectionBlock}>
          <Text style={homeStyles.sectionTitle}>Editar maquinaria</Text>
          {machineEditFeedback ? <Text style={homeStyles.feedbackText}>{machineEditFeedback}</Text> : null}

          <Text style={homeStyles.formFieldLabel}>Marca</Text>
          <TextInput
            onChangeText={(value) => onChangeMachineEditField('marca', value)}
            placeholder="Marca"
            placeholderTextColor={AppColors.primary50}
            style={homeStyles.formInput}
            value={machineEditForm.marca}
          />

          <Text style={homeStyles.formFieldLabel}>Modelo</Text>
          <TextInput
            onChangeText={(value) => onChangeMachineEditField('modelo', value)}
            placeholder="Modelo"
            placeholderTextColor={AppColors.primary50}
            style={homeStyles.formInput}
            value={machineEditForm.modelo}
          />

          <Text style={homeStyles.formFieldLabel}>Imagen</Text>
          <View style={homeStyles.inlineActionRow}>
            <Pressable onPress={onTakeMachineEditPhoto} style={homeStyles.inlineActionButton}>
              <Ionicons color={AppColors.primary} name="camera-outline" size={18} />
              <Text style={homeStyles.inlineActionButtonText}>Hacer foto</Text>
            </Pressable>

            <Pressable
              onPress={onPickMachineEditImageFromLibrary}
              style={homeStyles.inlineActionButton}>
              <Ionicons color={AppColors.primary} name="images-outline" size={18} />
              <Text style={homeStyles.inlineActionButtonText}>Adjuntar</Text>
            </Pressable>
          </View>

          {machineEditForm.image_uri ? (
            <View style={homeStyles.machineImagePreviewCard}>
              <ExpoImage
                contentFit="cover"
                source={{ uri: machineEditForm.image_uri }}
                style={homeStyles.machineImagePreview}
              />
            </View>
          ) : null}

          <SelectorField
            isOpen={machineEditTipoOpen}
            label="Tipo"
            labelStyle={homeStyles.formFieldLabel}
            onSelect={(value) => onChangeMachineEditField('tipo', value as MachineEditFormData['tipo'])}
            onToggleOpen={onToggleMachineEditTipo}
            options={[...machineTipoOptions]}
            valueLabel={
              machineTipoOptions.find((option) => option.value === machineEditForm.tipo)?.label ??
              machineEditForm.tipo
            }
          />

          <SelectorField
            isOpen={machineEditMotorOpen}
            label="Motor"
            labelStyle={homeStyles.formFieldLabel}
            onSelect={(value) =>
              onChangeMachineEditField('motor', value as MachineEditFormData['motor'])
            }
            onToggleOpen={onToggleMachineEditMotor}
            options={[...machineMotorOptions]}
            valueLabel={
              machineMotorOptions.find((option) => option.value === machineEditForm.motor)?.label ??
              machineEditForm.motor
            }
          />

          <Text style={homeStyles.formFieldLabel}>Número de serie</Text>
          <TextInput
            onChangeText={(value) => onChangeMachineEditField('ns', value)}
            placeholder="Número de serie"
            placeholderTextColor={AppColors.primary50}
            style={homeStyles.formInput}
            value={machineEditForm.ns}
          />

          <Text style={homeStyles.formFieldLabel}>Número de póliza</Text>
          <TextInput
            onChangeText={(value) => onChangeMachineEditField('num_poliza', value)}
            onFocus={onRequestScrollToFocusedInput}
            placeholder="Número de póliza"
            placeholderTextColor={AppColors.primary50}
            style={homeStyles.formInput}
            value={machineEditForm.num_poliza}
          />

          <SelectorField
            isOpen={machineEditSeguroOpen}
            label="Seguro"
            labelStyle={homeStyles.formFieldLabel}
            onSelect={(value) =>
              onChangeMachineEditField('seguro', value as MachineEditFormData['seguro'])
            }
            onToggleOpen={onToggleMachineEditSeguro}
            options={[...machineSeguroOptions]}
            valueLabel={
              machineSeguroOptions.find((option) => option.value === machineEditForm.seguro)?.label ??
              machineEditForm.seguro
            }
          />

          <Text style={homeStyles.formFieldLabel}>Observaciones</Text>
          <TextInput
            multiline
            onChangeText={(value) => onChangeMachineEditField('observaciones', value)}
            onFocus={onRequestScrollToFocusedInput}
            placeholder="Observaciones"
            placeholderTextColor={AppColors.primary50}
            style={[homeStyles.formInput, homeStyles.incidenceInput]}
            value={machineEditForm.observaciones}
          />

          {isEditElevation ? (
            <>
              <Text style={homeStyles.sectionTitle}>Datos de elevación</Text>

              <Text style={homeStyles.formFieldLabel}>Ruedas</Text>
              <TextInput
                onChangeText={(value) => onChangeMachineEditField('elev_ruedas', value)}
                placeholder="Ruedas"
                placeholderTextColor={AppColors.primary50}
                style={homeStyles.formInput}
                value={machineEditForm.elev_ruedas}
              />

              <Text style={homeStyles.formFieldLabel}>Capacidad de carga (Kg)</Text>
              <TextInput
                onChangeText={(value) => onChangeMachineEditField('elev_cap_carga', value)}
                placeholder="Capacidad de carga (Kg)"
                placeholderTextColor={AppColors.primary50}
                style={homeStyles.formInput}
                value={machineEditForm.elev_cap_carga}
              />

              <Text style={homeStyles.formFieldLabel}>Replegado (cm)</Text>
              <TextInput
                keyboardType="numeric"
                onChangeText={(value) => onChangeMachineEditField('elev_replegado_mm', value)}
                placeholder="Replegado (cm)"
                placeholderTextColor={AppColors.primary50}
                style={homeStyles.formInput}
                value={machineEditForm.elev_replegado_mm}
              />

              <SelectorField
                isOpen={machineEditElevationLibreOpen}
                label="Elevación libre"
                labelStyle={homeStyles.formFieldLabel}
                onSelect={(value) =>
                  onChangeMachineEditField(
                    'elev_elevacion_libre',
                    value as MachineEditFormData['elev_elevacion_libre']
                  )
                }
                onToggleOpen={onToggleMachineEditElevationLibre}
                options={[{ label: 'Sin definir', value: '' }, ...machineBooleanOptions]}
                valueLabel={
                  machineEditForm.elev_elevacion_libre
                    ? machineBooleanOptions.find(
                        (option) => option.value === machineEditForm.elev_elevacion_libre
                      )?.label ?? machineEditForm.elev_elevacion_libre
                    : 'Sin definir'
                }
              />

              <Text style={homeStyles.formFieldLabel}>Elevación (cm)</Text>
              <TextInput
                onChangeText={(value) => onChangeMachineEditField('elev_elevacion', value)}
                placeholder="Elevacion (cm)"
                placeholderTextColor={AppColors.primary50}
                style={homeStyles.formInput}
                value={machineEditForm.elev_elevacion}
              />

              <Text style={homeStyles.formFieldLabel}>Desplazamiento</Text>
              <TextInput
                onChangeText={(value) => onChangeMachineEditField('elev_desplazamiento', value)}
                placeholder="Desplazamiento"
                placeholderTextColor={AppColors.primary50}
                style={homeStyles.formInput}
                value={machineEditForm.elev_desplazamiento}
              />

              <Text style={homeStyles.formFieldLabel}>Posición</Text>
              <TextInput
                onChangeText={(value) => onChangeMachineEditField('elev_posicion', value)}
                placeholder="Posicion"
                placeholderTextColor={AppColors.primary50}
                style={homeStyles.formInput}
                value={machineEditForm.elev_posicion}
              />

              <SelectorField
                isOpen={machineEditAntihuellaOpen}
                label="Antihuella"
                labelStyle={homeStyles.formFieldLabel}
                onSelect={(value) =>
                  onChangeMachineEditField(
                    'elev_antihuella',
                    value as MachineEditFormData['elev_antihuella']
                  )
                }
                onToggleOpen={onToggleMachineEditAntihuella}
                options={[{ label: 'Sin definir', value: '' }, ...machineBooleanOptions]}
                valueLabel={
                  machineEditForm.elev_antihuella
                    ? machineBooleanOptions.find(
                        (option) => option.value === machineEditForm.elev_antihuella
                      )?.label ?? machineEditForm.elev_antihuella
                    : 'Sin definir'
                }
              />

              <Text style={homeStyles.formFieldLabel}>Matrícula</Text>
              <TextInput
                onChangeText={(value) => onChangeMachineEditField('elev_matricula', value)}
                placeholder="Matricula"
                placeholderTextColor={AppColors.primary50}
                style={homeStyles.formInput}
                value={machineEditForm.elev_matricula}
              />

              <Text style={homeStyles.formFieldLabel}>Largo (cm)</Text>
              <TextInput
                keyboardType="numeric"
                onChangeText={(value) => onChangeMachineEditField('elev_largo', value)}
                placeholder="Largo (cm)"
                placeholderTextColor={AppColors.primary50}
                style={homeStyles.formInput}
                value={machineEditForm.elev_largo}
              />

              <Text style={homeStyles.formFieldLabel}>Alto (cm)</Text>
              <TextInput
                keyboardType="numeric"
                onChangeText={(value) => onChangeMachineEditField('elev_alto', value)}
                placeholder="Alto (cm)"
                placeholderTextColor={AppColors.primary50}
                style={homeStyles.formInput}
                value={machineEditForm.elev_alto}
              />

              <Text style={homeStyles.formFieldLabel}>Ancho (cm)</Text>
              <TextInput
                keyboardType="numeric"
                onChangeText={(value) => onChangeMachineEditField('elev_ancho', value)}
                placeholder="Ancho (cm)"
                placeholderTextColor={AppColors.primary50}
                style={homeStyles.formInput}
                value={machineEditForm.elev_ancho}
              />

              <Text style={homeStyles.formFieldLabel}>Peso (Kg)</Text>
              <TextInput
                keyboardType="numeric"
                onChangeText={(value) => onChangeMachineEditField('elev_peso_kg', value)}
                placeholder="Peso (Kg)"
                placeholderTextColor={AppColors.primary50}
                style={homeStyles.formInput}
                value={machineEditForm.elev_peso_kg}
              />

              <Text style={homeStyles.formFieldLabel}>Horquillas (cm)</Text>
              <TextInput
                onChangeText={(value) => onChangeMachineEditField('elev_horquillas', value)}
                placeholder="Horquillas (cm)"
                placeholderTextColor={AppColors.primary50}
                style={homeStyles.formInput}
                value={machineEditForm.elev_horquillas}
              />
            </>
          ) : null}
        </View>
      ) : null}

      <View style={homeStyles.detailActionsRow}>
        <View style={homeStyles.detailActionsColumn}>
          <SelectorField
            disabled={locationActionLoading || locationOptions.length <= 0}
            isOpen={locationPickerOpen}
            label="Ubicación"
            onSelect={onSelectLocation}
            onToggleOpen={onToggleLocationPicker}
            options={locationOptions}
            valueLabel={locationValue}
          />
        </View>

        {canMarkDelivered ? (
          <Pressable
            onPress={onConfirmLocation}
            style={[
              homeStyles.secondaryActionButton,
              locationActionLoading && homeStyles.actionButtonDisabled,
            ]}>
            <Text style={homeStyles.secondaryActionButtonText}>
              {locationActionLoading ? 'Procesando...' : 'Confirmar ubicación'}
            </Text>
          </Pressable>
        ) : null}
      </View>

      <SelectorField
        disabled={statusActionLoading || maintenanceOptions.length <= 1}
        isOpen={statusPickerOpen}
        label="Estado"
        onSelect={onSelectMaintenance}
        onToggleOpen={onToggleStatusPicker}
        options={maintenanceOptions}
        valueLabel={statusValue}
      />

      {incidencePanelVisible ? (
        <View style={homeStyles.incidencePanel}>
          <Text style={homeStyles.sectionTitle}>Abrir incidencia</Text>
          <Text style={homeStyles.sectionHint}>
            Estado seleccionado: {formatMaintenanceLabel(selectedMaintenanceStatus)}
          </Text>
          {acceptedProposal ? (
            <Text style={homeStyles.acceptedProposalText}>
              Propuesta aceptada vinculada: #{acceptedProposal.id}
            </Text>
          ) : incidenceEscalationMode ? (
            <Text style={homeStyles.sectionHint}>
              Se reutilizará el albarán e incidencia actuales para escalar a avería grave.
            </Text>
          ) : (
            <Text style={homeStyles.feedbackText}>
              Esta máquina necesita una propuesta aceptada para abrir la incidencia.
            </Text>
          )}
          <Text style={homeStyles.incidenceHint}>
            Describe qué le pasa a la máquina y si se puede reparar in situ antes de abrir la
            incidencia.
          </Text>
          <TextInput
            multiline
            onChangeText={onChangeIncidenceComment}
            onFocus={onRequestScrollToFocusedInput}
            placeholder="Comentario de la incidencia"
            placeholderTextColor={AppColors.primary50}
            style={homeStyles.incidenceInput}
            value={incidenceComment}
          />
          <Pressable
            disabled={!canSubmitIncidence || statusActionLoading}
            onPress={onSubmitIncidence}
            style={[
              homeStyles.secondaryActionButton,
              (!canSubmitIncidence || statusActionLoading) && homeStyles.actionButtonDisabled,
            ]}>
            <Text style={homeStyles.secondaryActionButtonText}>
              {statusActionLoading
                ? incidenceEscalationMode
                  ? 'Escalando avería...'
                  : 'Abriendo incidencia...'
                : incidenceEscalationMode
                  ? 'Escalar a avería grave'
                  : 'Abrir incidencia'}
            </Text>
          </Pressable>
          <Pressable onPress={onCancelIncidenceDraft} style={homeStyles.primaryActionButton}>
            <Text style={homeStyles.primaryActionButtonText}>Cancelar selección</Text>
          </Pressable>
        </View>
      ) : null}

      {selectedMachineDetail.maps?.query ? (
        <View style={homeStyles.mapsRow}>
          <View style={homeStyles.mapsTextBlock}>
            <FieldRow label="Maps" value={selectedMachineDetail.maps.query} />
          </View>
          <Pressable onPress={onOpenNavigation} style={homeStyles.mapsActionButton}>
            <Ionicons color={AppColors.primary} name="navigate" size={20} />
          </Pressable>
        </View>
      ) : null}

      {isElevation
        ? ELEVATION_DETAIL_FIELDS.map((field) => (
            <FieldRow key={field.key} label={field.label} value={selectedMachineDetail[field.key]} />
          ))
        : null}

      <View style={homeStyles.sectionBlock}>
        <Pressable onPress={onToggleProposals} style={homeStyles.sectionHeaderButton}>
          <Text style={homeStyles.sectionTitle}>Propuestas de alquiler</Text>
          <Ionicons
            color={AppColors.primary}
            name={proposalsExpanded ? 'chevron-up' : 'chevron-down'}
            size={22}
          />
        </Pressable>

        {acceptedProposal ? (
          <Text style={homeStyles.acceptedProposalText}>
            Hay una propuesta aceptada: #{acceptedProposal.id}
          </Text>
        ) : (
          <Text style={homeStyles.sectionHint}>No hay propuesta aceptada para esta máquina.</Text>
        )}

        {proposalsExpanded ? (
          proposals.length === 0 ? (
            <Text style={homeStyles.sectionHint}>Todavía no hay propuestas registradas.</Text>
          ) : (
            proposals.map((proposal) => (
              <ProposalCard
                item={proposal}
                key={proposal.id}
                onPress={canCreateProposal ? onOpenProposalDetail : undefined}
              />
            ))
          )
        ) : null}
      </View>

      {canCreateProposal ? (
        <Pressable
          disabled={!canOpenProposalForm}
          onPress={onOpenProposalForm}
          style={[homeStyles.primaryActionButton, !canOpenProposalForm && homeStyles.actionButtonDisabled]}>
          <Text style={homeStyles.primaryActionButtonText}>Crear propuesta de alquiler</Text>
        </Pressable>
      ) : null}

      {canCreateProposal && proposalButtonDisabledReason ? (
        <Text style={homeStyles.sectionHint}>{proposalButtonDisabledReason}</Text>
      ) : null}

      <Pressable
        disabled={machineEditSubmitting}
        onPress={machineEditMode ? onSaveMachineEdit : onOpenMachineEdit}
        style={[homeStyles.primaryActionButton, machineEditSubmitting && homeStyles.actionButtonDisabled]}>
        <Text style={homeStyles.primaryActionButtonText}>
          {machineEditSubmitting
            ? 'Guardando...'
            : machineEditMode
              ? 'Guardar cambios'
              : 'Editar maquinaria'}
        </Text>
      </Pressable>

      {machineEditMode ? (
        <Pressable onPress={onCancelMachineEdit} style={homeStyles.secondaryActionButtonBlock}>
          <Text style={homeStyles.secondaryActionButtonText}>Cancelar edición</Text>
        </Pressable>
      ) : null}

      {showRepairBudgetButton ? (
        <View>
          <Pressable
            disabled={!canCreateRepairBudget}
            onPress={onOpenRepairBudgetForm}
            style={[
              homeStyles.primaryActionButton,
              !canCreateRepairBudget && homeStyles.actionButtonDisabled,
            ]}>
            <Text style={homeStyles.primaryActionButtonText}>Crear presupuesto de reparación</Text>
          </Pressable>
          {repairBudgetDisabledReason ? (
            <Text style={homeStyles.sectionHint}>{repairBudgetDisabledReason}</Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
