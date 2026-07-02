import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { AlbaranFieldRow } from '@/components/albaranes/albaran-field-row';
import { AppColors } from '@/constants/theme';
import { albaranesStyles } from '@/styles/albaranes.styles';
import type { RepairBudgetItem } from '@/types/user';

function formatMoney(value: number) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value ?? 0));
}

function getBudgetBadgeText(budget: RepairBudgetItem) {
  const estado = String(budget.estado ?? '').trim().toUpperCase();

  if (estado === 'PENDING' && !budget.firmado_tecnico_at) {
    return 'Pendiente de firma de Tecarral';
  }

  if (estado === 'PENDING' && budget.firmado_tecnico_at) {
    return 'Firmado por Tecarral · falta el cliente';
  }

  if (estado === 'ACEPTADA' && budget.firmado_cliente_at) {
    return 'Firmado por ambas partes';
  }

  if (estado === 'ACEPTADA' && budget.payer_type === 'EMPRESA') {
    return 'Aceptado internamente';
  }

  if (estado === 'RECHAZADA') {
    return 'Rechazado por el cliente';
  }

  if (estado === 'EXPIRADA') {
    return 'Expirado sin firma';
  }

  return budget.estado;
}

export function RepairBudgetDetailView({
  budget,
  onBack,
  onStartSignature,
}: {
  budget: RepairBudgetItem;
  onBack: () => void;
  onStartSignature: () => void;
}) {
  const canSignByTecarral =
    String(budget.estado ?? '').trim().toUpperCase() === 'PENDING' && !budget.firmado_tecnico_at;

  return (
    <View style={albaranesStyles.detailContainer}>
      <Pressable onPress={onBack} style={albaranesStyles.backButton}>
        <Ionicons color={AppColors.primary} name="arrow-back" size={18} />
        <Text style={albaranesStyles.backButtonText}>Volver a presupuestos</Text>
      </Pressable>

      <View style={albaranesStyles.detailCard}>
        <View style={albaranesStyles.stepBadge}>
          <Text style={albaranesStyles.stepBadgeText}>{getBudgetBadgeText(budget)}</Text>
        </View>

        <Text style={albaranesStyles.detailTitle}>Presupuesto {budget.document_number ?? `#${budget.id}`}</Text>
        <Text style={albaranesStyles.detailSubtitle}>{budget.cliente ?? 'Cliente'}</Text>

        <AlbaranFieldRow label="Número" value={budget.document_number ?? `#${budget.id}`} />
        <AlbaranFieldRow label="Estado" value={budget.estado} />
        <AlbaranFieldRow label="Cliente" value={budget.cliente} />
        <AlbaranFieldRow label="Email cliente" value={budget.email_cliente} />
        <AlbaranFieldRow label="Máquina" value={`#${budget.id_maquina}`} />
        <AlbaranFieldRow label="Marca" value={budget.maquina_marca} />
        <AlbaranFieldRow label="Modelo" value={budget.maquina_modelo} />
        <AlbaranFieldRow label="NS" value={budget.maquina_ns} />
        <AlbaranFieldRow label="Base imponible" value={formatMoney(Number(budget.base_imponible ?? 0))} />
        <AlbaranFieldRow label="IVA" value={formatMoney(Number(budget.iva_amount ?? 0))} />
        <AlbaranFieldRow label="Total" value={formatMoney(budget.importe_total)} />
        <AlbaranFieldRow label="Reparación" value={budget.reparacion_estado} />
        <AlbaranFieldRow label="Expira" value={budget.expira_at} />
        <AlbaranFieldRow label="Firma Tecarral" value={budget.firmado_tecnico_at ? 'Firmado' : '-'} />
        <AlbaranFieldRow label="Firma cliente" value={budget.firmado_cliente_at ? 'Firmado' : '-'} />

        {canSignByTecarral ? (
          <Pressable onPress={onStartSignature} style={albaranesStyles.primaryActionButton}>
            <Text style={albaranesStyles.primaryActionButtonText}>Firmar y emitir presupuesto</Text>
          </Pressable>
        ) : null}

        <Text style={albaranesStyles.signatureHint}>
          Tecarral firma primero para emitir el PDF oficial. Después el cliente recibe el enlace público para aceptar, rechazar y firmar.
        </Text>
      </View>
    </View>
  );
}
