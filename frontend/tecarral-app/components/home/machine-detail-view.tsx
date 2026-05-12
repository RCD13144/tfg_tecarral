import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
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
  machineTipoOptions,
  machineMotorOptions,
  machineSeguroOptions,
  onChangeMachineEditField,
  onOpenMachineEdit,
  onCancelMachineEdit,
  onSaveMachineEdit,
  onToggleMachineEditTipo,
  onToggleMachineEditMotor,
  onToggleMachineEditSeguro,
  onPickMachineEditImageFromLibrary,
  onTakeMachineEditPhoto,
  showRepairBudgetButton,
  canCreateRepairBudget,
  repairBudgetDisabledReason,
  onOpenRepairBudgetForm,
  onOpenNavigation,
  canSubmitIncidence,
  incidenceEscalationMode,
}: {
  detailLoading: boolean;
  selectedMachineDetail: MachineDetail | null;
  machineImageSource: unknown;
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
  machineTipoOptions: readonly { label: string; value: string }[];
  machineMotorOptions: readonly { label: string; value: string }[];
  machineSeguroOptions: readonly { label: string; value: string }[];
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
  onPickMachineEditImageFromLibrary: () => void;
  onTakeMachineEditPhoto: () => void;
  showRepairBudgetButton: boolean;
  canCreateRepairBudget: boolean;
  repairBudgetDisabledReason: string | null;
  onOpenRepairBudgetForm: () => void;
  onOpenNavigation: () => void;
  canSubmitIncidence: boolean;
  incidenceEscalationMode: boolean;
}) {
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
        <Text style={homeStyles.emptyStateText}>No se pudo cargar el detalle de la maquina.</Text>
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

  return (
    <View style={homeStyles.detailContainer}>
      <View style={homeStyles.detailHero}>
        <Pressable onPress={onBack} style={homeStyles.detailCloseButton}>
          <Ionicons color={AppColors.primary} name="close-circle-outline" size={28} />
        </Pressable>
        {machineImageSource ? (
          <ExpoImage contentFit="contain" source={machineImageSource} style={homeStyles.detailImage} />
        ) : (
          <Ionicons color={AppColors.primary50} name="image-outline" size={42} />
        )}
      </View>

      <Text style={homeStyles.detailTitle}>Maquina #{selectedMachineDetail.id_maquina}</Text>

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
            ? 'Si'
            : selectedMachineDetail.seguro === false
              ? 'No'
              : '-'}
        </Text>
      </Text>

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

          <Text style={homeStyles.formFieldLabel}>Numero de serie</Text>
          <TextInput
            onChangeText={(value) => onChangeMachineEditField('ns', value)}
            placeholder="Numero de serie"
            placeholderTextColor={AppColors.primary50}
            style={homeStyles.formInput}
            value={machineEditForm.ns}
          />

          <Text style={homeStyles.formFieldLabel}>Numero de poliza</Text>
          <TextInput
            onChangeText={(value) => onChangeMachineEditField('num_poliza', value)}
            placeholder="Numero de poliza"
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
            placeholder="Observaciones"
            placeholderTextColor={AppColors.primary50}
            style={[homeStyles.formInput, homeStyles.incidenceInput]}
            value={machineEditForm.observaciones}
          />
        </View>
      ) : null}

      <View style={homeStyles.detailActionsRow}>
        <View style={homeStyles.detailActionsColumn}>
          <SelectorField
            disabled={locationActionLoading || locationOptions.length <= 0}
            isOpen={locationPickerOpen}
            label="Ubicacion"
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
              Esta maquina necesita una propuesta aceptada para abrir la incidencia.
            </Text>
          )}
          <Text style={homeStyles.incidenceHint}>
            Describe qué le pasa a la máquina y si se puede reparar in situ antes de abrir la
            incidencia.
          </Text>
          <TextInput
            multiline
            onChangeText={onChangeIncidenceComment}
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
                  ? 'Escalando averia...'
                  : 'Abriendo incidencia...'
                : incidenceEscalationMode
                  ? 'Escalar a averia grave'
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
          <Text style={homeStyles.sectionHint}>No hay propuesta aceptada para esta maquina.</Text>
        )}

        {proposalsExpanded ? (
          proposals.length === 0 ? (
            <Text style={homeStyles.sectionHint}>Todavia no hay propuestas registradas.</Text>
          ) : (
            proposals.map((proposal) => <ProposalCard item={proposal} key={proposal.id} />)
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
          <Text style={homeStyles.secondaryActionButtonText}>Cancelar edicion</Text>
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
