import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { AlbaranFieldRow } from '@/components/albaranes/albaran-field-row';
import { AppColors } from '@/constants/theme';
import { albaranesStyles } from '@/styles/albaranes.styles';
import type { ServiceContractItem } from '@/types/user';

function getContractTypeLabel(value: ServiceContractItem['contract_type']) {
  return value === 'TODO_INCLUIDO' ? 'Todo incluido' : 'Preventivo';
}

function formatSafeDate(value: string | null | undefined) {
  const raw = String(value ?? '').trim();

  if (!raw) {
    return '-';
  }

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    return raw;
  }

  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

export function ContractDetailView({
  contract,
  feedback,
  onBack,
  onStartSignature,
}: {
  contract: ServiceContractItem;
  feedback: string | null;
  onBack: () => void;
  onStartSignature: () => void;
}) {
  const tecarralSigned = contract.tecarral_signed === true;
  const clientSigned = contract.client_signed === true;
  const canSign = !tecarralSigned && !clientSigned;
  const partiallySignedByClient = !tecarralSigned && clientSigned;

  return (
    <View style={albaranesStyles.detailContainer}>
      <Pressable onPress={onBack} style={albaranesStyles.backButton}>
        <Ionicons color={AppColors.primary} name="arrow-back" size={18} />
        <Text style={albaranesStyles.backButtonText}>Volver a contratos</Text>
      </Pressable>

      <View style={albaranesStyles.detailCard}>
        <View style={albaranesStyles.stepBadge}>
          <Text style={albaranesStyles.stepBadgeText}>Revisión previa a la firma</Text>
        </View>

        <Text style={albaranesStyles.detailTitle}>Contrato {contract.document_number ?? `#${contract.id}`}</Text>
        <Text style={albaranesStyles.detailSubtitle}>{contract.cliente_nombre}</Text>

        <AlbaranFieldRow label="Número" value={contract.document_number ?? `#${contract.id}`} />
        <AlbaranFieldRow label="Tipo" value={getContractTypeLabel(contract.contract_type)} />
        <AlbaranFieldRow label="Estado" value={contract.estado} />
        <AlbaranFieldRow label="Cliente" value={contract.cliente_nombre} />
        <AlbaranFieldRow label="Email cliente" value={contract.cliente_email ?? '-'} />
        <AlbaranFieldRow label="Máquina" value={`#${contract.id_maquina}`} />
        <AlbaranFieldRow label="Tarifa fija" value={contract.tarifa_fija} />
        <AlbaranFieldRow label="Fecha de inicio" value={formatSafeDate(contract.start_date)} />
        <AlbaranFieldRow label="Fecha de fin" value={formatSafeDate(contract.end_date)} />
        <AlbaranFieldRow label="Condiciones" value={contract.condiciones ?? '-'} />

        <Text style={albaranesStyles.signatureHint}>
          {tecarralSigned && clientSigned
            ? 'Este contrato ya está firmado por ambas partes y no admite una nueva firma.'
            : tecarralSigned
              ? 'Tecarral ya ha firmado este contrato. Queda pendiente la firma del cliente si aún no la ha completado.'
              : partiallySignedByClient
                ? 'El cliente ya ha firmado. Tecarral puede completar la firma desde la siguiente pantalla.'
                : 'Desde la siguiente pantalla Tecarral firma el contrato. Cuando el cliente ya haya firmado por email, el contrato quedará activado.'}
        </Text>

        {canSign || partiallySignedByClient ? (
          <Pressable onPress={onStartSignature} style={albaranesStyles.actionButton}>
            <Text style={albaranesStyles.actionButtonText}>Ir a firma</Text>
          </Pressable>
        ) : null}

        {feedback ? <Text style={albaranesStyles.feedbackText}>{feedback}</Text> : null}
      </View>
    </View>
  );
}
