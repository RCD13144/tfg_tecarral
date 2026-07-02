import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { AlbaranSection } from '@/components/albaranes/albaran-section';
import { ScreenHeader } from '@/components/shared/screen-header';
import { AppColors } from '@/constants/theme';
import { albaranesStyles } from '@/styles/albaranes.styles';
import type { AlbaranListItem } from '@/types/albaran';
import type { RepairBudgetItem, ServiceContractItem } from '@/types/user';

type DocumentCategory = 'albaranes' | 'contratos' | 'presupuestos';

function formatMoney(value: number) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value ?? 0));
}

function getContractTypeLabel(value: ServiceContractItem['contract_type']) {
  return value === 'TODO_INCLUIDO' ? 'Todo incluido' : 'Preventivo';
}

function getContractStatusHint(contract: ServiceContractItem) {
  if (contract.tecarral_signed && contract.client_signed) {
    return 'Firmado por ambas partes';
  }

  if (contract.tecarral_signed) {
    return 'Firmado por Tecarral · Falta firma del cliente';
  }

  if (contract.client_signed) {
    return 'Firmado por cliente · Falta firma de Tecarral';
  }

  return 'Sin firmas';
}

function getBudgetStatusHint(budget: RepairBudgetItem) {
  const estado = String(budget.estado ?? '').trim().toUpperCase();

  if (estado === 'PENDING' && !budget.firmado_tecnico_at) {
    return 'Pendiente de firma de Tecarral';
  }

  if (estado === 'PENDING' && budget.firmado_tecnico_at) {
    return 'Firmado por Tecarral ? Falta firma del cliente';
  }

  if (estado === 'ACEPTADA' && budget.firmado_cliente_at) {
    return 'Firmado por ambas partes';
  }

  if (estado === 'ACEPTADA' && budget.payer_type === 'EMPRESA') {
    return 'Aceptado internamente por Tecarral';
  }

  if (estado === 'RECHAZADA') {
    return 'Rechazado por el cliente';
  }

  if (estado === 'EXPIRADA') {
    return 'Pendiente sin firma ? Expirado';
  }

  return 'Pendiente de firma del cliente';
}

function DocumentPaginationControls({
  hiddenCount,
  pageSize,
  canShowLess,
  onShowMore,
  onShowLess,
}: {
  hiddenCount: number;
  pageSize: number;
  canShowLess: boolean;
  onShowMore: () => void;
  onShowLess: () => void;
}) {
  return (
    <>
      {hiddenCount > 0 ? (
        <Pressable onPress={onShowMore} style={albaranesStyles.showMoreButton}>
          <Text style={albaranesStyles.showMoreButtonText}>Ver más ({Math.min(pageSize, hiddenCount)})</Text>
        </Pressable>
      ) : null}
      {canShowLess ? (
        <Pressable onPress={onShowLess} style={albaranesStyles.showMoreButton}>
          <Text style={albaranesStyles.showMoreButtonText}>Ver menos</Text>
        </Pressable>
      ) : null}
    </>
  );
}

function FoldableSection({
  title,
  countLabel,
  expanded,
  onToggle,
  children,
  emptyText,
  hasItems,
}: {
  title: string;
  countLabel: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  emptyText: string;
  hasItems: boolean;
}) {
  return (
    <View style={albaranesStyles.sectionCard}>
      <Pressable onPress={onToggle} style={albaranesStyles.sectionHeader}>
        <View style={albaranesStyles.sectionHeaderTextBlock}>
          <Text style={albaranesStyles.sectionTitle}>{title}</Text>
          <Text style={albaranesStyles.sectionCount}>{countLabel}</Text>
        </View>

        <Ionicons
          color={AppColors.primary}
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={22}
        />
      </Pressable>

      {expanded ? (
        <View style={albaranesStyles.sectionBody}>
          {hasItems ? children : (
            <View style={albaranesStyles.emptyBox}>
              <Text style={albaranesStyles.emptyText}>{emptyText}</Text>
            </View>
          )}
        </View>
      ) : null}
    </View>
  );
}

function ContractsSection({
  title,
  items,
  emptyText,
  expanded,
  onToggle,
  onOpenContract,
}: {
  title: string;
  items: ServiceContractItem[];
  emptyText: string;
  expanded: boolean;
  onToggle: () => void;
  onOpenContract: (contract: ServiceContractItem) => void;
}) {
  const pageSize = 4;
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const visibleItems = useMemo(() => items.slice(0, visibleCount), [items, visibleCount]);
  const hiddenCount = Math.max(0, items.length - visibleItems.length);
  const canShowLess = visibleCount > pageSize;

  return (
    <FoldableSection
      countLabel={`${items.length} contratos`}
      emptyText={emptyText}
      expanded={expanded}
      hasItems={items.length > 0}
      onToggle={onToggle}
      title={title}>
      {visibleItems.map((contract) => (
        <Pressable
          key={contract.id}
          onPress={() => onOpenContract(contract)}
          style={albaranesStyles.albaranCard}>
          <Text style={albaranesStyles.albaranCardTitle}>Contrato {contract.document_number ?? `#${contract.id}`}</Text>
          <Text style={albaranesStyles.albaranCardSubtitle}>{contract.cliente_nombre}</Text>
          <Text style={albaranesStyles.albaranCardLine}>
            Tipo: {getContractTypeLabel(contract.contract_type)}
          </Text>
          <Text style={albaranesStyles.albaranCardLine}>Máquina #{contract.id_maquina}</Text>
          <Text style={albaranesStyles.albaranCardLine}>Estado: {contract.estado}</Text>
          <Text style={albaranesStyles.albaranCardLine}>{getContractStatusHint(contract)}</Text>
          <Text style={albaranesStyles.openHint}>Toca para revisar el estado y la firma</Text>
        </Pressable>
      ))}
      <DocumentPaginationControls
        canShowLess={canShowLess}
        hiddenCount={hiddenCount}
        onShowLess={() => setVisibleCount(pageSize)}
        onShowMore={() => setVisibleCount((current) => Math.min(items.length, current + pageSize))}
        pageSize={pageSize}
      />
    </FoldableSection>
  );
}

function RepairBudgetsSection({
  title,
  items,
  emptyText,
  expanded,
  onToggle,
  onOpenRepairBudget,
}: {
  title: string;
  items: RepairBudgetItem[];
  emptyText: string;
  expanded: boolean;
  onToggle: () => void;
  onOpenRepairBudget: (budget: RepairBudgetItem) => void;
}) {
  const pageSize = 4;
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const visibleItems = useMemo(() => items.slice(0, visibleCount), [items, visibleCount]);
  const hiddenCount = Math.max(0, items.length - visibleItems.length);
  const canShowLess = visibleCount > pageSize;

  return (
    <FoldableSection
      countLabel={`${items.length} presupuestos`}
      emptyText={emptyText}
      expanded={expanded}
      hasItems={items.length > 0}
      onToggle={onToggle}
      title={title}>
      {visibleItems.map((budget) => (
        <Pressable
          key={budget.id}
          onPress={() => onOpenRepairBudget(budget)}
          style={albaranesStyles.albaranCard}>
          <Text style={albaranesStyles.albaranCardTitle}>Presupuesto {budget.document_number ?? `#${budget.id}`}</Text>
          <Text style={albaranesStyles.albaranCardSubtitle}>{budget.cliente ?? 'Cliente'}</Text>
          <Text style={albaranesStyles.albaranCardLine}>Máquina #{budget.id_maquina}</Text>
          <Text style={albaranesStyles.albaranCardLine}>
            Importe: {formatMoney(budget.importe_total)}
          </Text>
          <Text style={albaranesStyles.albaranCardLine}>Estado: {budget.estado}</Text>
          <Text style={albaranesStyles.albaranCardLine}>{getBudgetStatusHint(budget)}</Text>
          <Text style={albaranesStyles.openHint}>Toca para revisar el detalle</Text>
        </Pressable>
      ))}
      <DocumentPaginationControls
        canShowLess={canShowLess}
        hiddenCount={hiddenCount}
        onShowLess={() => setVisibleCount(pageSize)}
        onShowMore={() => setVisibleCount((current) => Math.min(items.length, current + pageSize))}
        pageSize={pageSize}
      />
    </FoldableSection>
  );
}

export function AlbaranListView({
  selectedCategory,
  signed,
  unsigned,
  unsignedContracts,
  signedContracts,
  unsignedRepairBudgets,
  signedRepairBudgets,
  loading,
  feedback,
  successMessage,
  signedExpanded,
  unsignedExpanded,
  contractSignedExpanded,
  contractUnsignedExpanded,
  budgetSignedExpanded,
  budgetUnsignedExpanded,
  onToggleSigned,
  onToggleUnsigned,
  onToggleContractSigned,
  onToggleContractUnsigned,
  onToggleBudgetSigned,
  onToggleBudgetUnsigned,
  onSelectCategory,
  onOpenItem,
  onOpenContract,
  onOpenRepairBudget,
  onOpenHelp,
}: {
  selectedCategory: DocumentCategory;
  signed: AlbaranListItem[];
  unsigned: AlbaranListItem[];
  unsignedContracts: ServiceContractItem[];
  signedContracts: ServiceContractItem[];
  unsignedRepairBudgets: RepairBudgetItem[];
  signedRepairBudgets: RepairBudgetItem[];
  loading: boolean;
  feedback: string | null;
  successMessage: string | null;
  signedExpanded: boolean;
  unsignedExpanded: boolean;
  contractSignedExpanded: boolean;
  contractUnsignedExpanded: boolean;
  budgetSignedExpanded: boolean;
  budgetUnsignedExpanded: boolean;
  onToggleSigned: () => void;
  onToggleUnsigned: () => void;
  onToggleContractSigned: () => void;
  onToggleContractUnsigned: () => void;
  onToggleBudgetSigned: () => void;
  onToggleBudgetUnsigned: () => void;
  onSelectCategory: (category: DocumentCategory) => void;
  onOpenItem: (item: AlbaranListItem) => void;
  onOpenContract: (contract: ServiceContractItem) => void;
  onOpenRepairBudget: (budget: RepairBudgetItem) => void;
  onOpenHelp: () => void;
}) {
  const categories: Array<{ key: DocumentCategory; label: string; count: number }> = [
    { key: 'albaranes', label: 'Albaranes', count: unsigned.length + signed.length },
    {
      key: 'contratos',
      label: 'Contratos',
      count: unsignedContracts.length + signedContracts.length,
    },
    {
      key: 'presupuestos',
      label: 'Presupuestos',
      count: unsignedRepairBudgets.length + signedRepairBudgets.length,
    },
  ];

  return (
    <View style={albaranesStyles.container}>
      <ScreenHeader onHelpPress={onOpenHelp} />

      <Text style={albaranesStyles.browserTitle}>Centro de firmas</Text>
      <Text style={albaranesStyles.browserSubtitle}>
        Revisa cada tipo de documento por separado para firmar y controlar mejor el
        estado de albaranes, contratos y presupuestos.
      </Text>

      <View style={albaranesStyles.categoryRow}>
        {categories.map((category) => {
          const selected = selectedCategory === category.key;

          return (
            <Pressable
              key={category.key}
              onPress={() => onSelectCategory(category.key)}
              style={[
                albaranesStyles.categoryChip,
                selected && albaranesStyles.categoryChipActive,
              ]}>
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.78}
                style={[
                  albaranesStyles.categoryChipText,
                  selected && albaranesStyles.categoryChipTextActive,
                ]}>
                {category.label}
              </Text>
              <View
                style={[
                  albaranesStyles.categoryBadge,
                  selected && albaranesStyles.categoryBadgeActive,
                ]}>
                <Text
                  style={[
                    albaranesStyles.categoryBadgeText,
                    selected && albaranesStyles.categoryBadgeTextActive,
                  ]}>
                  {category.count}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      {feedback ? <Text style={albaranesStyles.feedbackText}>{feedback}</Text> : null}
      {successMessage ? <Text style={albaranesStyles.successText}>{successMessage}</Text> : null}
      {loading ? <Text style={albaranesStyles.loadingText}>Cargando documentos...</Text> : null}

      {selectedCategory === 'albaranes' ? (
        <>
          <AlbaranSection
            countLabel={`${unsigned.length} albaranes`}
            emptyText="No hay albaranes pendientes de firma."
            expanded={unsignedExpanded}
            items={unsigned}
            onOpenItem={onOpenItem}
            onToggle={onToggleUnsigned}
            title="No firmados"
          />

          <AlbaranSection
            countLabel={`${signed.length} albaranes`}
            emptyText="Todavía no hay albaranes firmados."
            expanded={signedExpanded}
            initialVisibleCount={4}
            items={signed}
            onOpenItem={onOpenItem}
            onToggle={onToggleSigned}
            title="Firmados"
          />
        </>
      ) : null}

      {selectedCategory === 'contratos' ? (
        <>
          <ContractsSection
            emptyText="No hay contratos sin firmar por ninguna de las partes."
            expanded={contractUnsignedExpanded}
            items={unsignedContracts}
            onOpenContract={onOpenContract}
            onToggle={onToggleContractUnsigned}
            title="No firmados"
          />
          <ContractsSection
            emptyText="Todavía no hay contratos firmados o iniciados por alguna de las partes."
            expanded={contractSignedExpanded}
            items={signedContracts}
            onOpenContract={onOpenContract}
            onToggle={onToggleContractSigned}
            title="Firmados"
          />
        </>
      ) : null}

      {selectedCategory === 'presupuestos' ? (
        <>
          <RepairBudgetsSection
            emptyText="No hay presupuestos pendientes de firma del cliente."
            expanded={budgetUnsignedExpanded}
            items={unsignedRepairBudgets}
            onOpenRepairBudget={onOpenRepairBudget}
            onToggle={onToggleBudgetUnsigned}
            title="No firmados"
          />
          <RepairBudgetsSection
            emptyText="Todavía no hay presupuestos aceptados, rechazados o cerrados."
            expanded={budgetSignedExpanded}
            items={signedRepairBudgets}
            onOpenRepairBudget={onOpenRepairBudget}
            onToggle={onToggleBudgetSigned}
            title="Firmados"
          />
        </>
      ) : null}
    </View>
  );
}
