import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';

import { FieldRow } from '@/components/home/field-row';
import { ProposalCard } from '@/components/home/proposal-card';
import { SelectorField } from '@/components/home/selector-field';
import { COMMON_DETAIL_FIELDS, ELEVATION_DETAIL_FIELDS } from '@/constants/home';
import { AppColors } from '@/constants/theme';
import { homeStyles } from '@/styles/home.styles';
import type { MachineDetail, MachineProposalSummary } from '@/types/maquina';
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
  onOpenProposalForm,
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
  onOpenProposalForm: () => void;
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
        <Pressable onPress={onOpenProposalForm} style={homeStyles.primaryActionButton}>
          <Text style={homeStyles.primaryActionButtonText}>Crear propuesta de alquiler</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
