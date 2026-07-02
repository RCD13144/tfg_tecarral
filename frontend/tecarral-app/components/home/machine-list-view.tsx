import { Ionicons } from '@expo/vector-icons';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';

import { FilterPanel } from '@/components/home/filter-panel';
import { MachineCard } from '@/components/home/machine-card';
import { ScreenHeader } from '@/components/shared/screen-header';
import { AppColors } from '@/constants/theme';
import { homeStyles } from '@/styles/home.styles';
import type {
  FilterCategoryKey,
  InventoryOwnershipType,
  MachineFilters,
  Maquina,
  SearchSuggestion,
} from '@/types/maquina';

export function MachineListView({
  query,
  onQueryChange,
  activeFilterCount,
  filterPanelOpen,
  inventoryOwnershipType,
  onChangeInventoryOwnership,
  onToggleFilterPanel,
  suggestions,
  loadingSuggestions,
  onSelectSuggestion,
  filters,
  onToggleFilter,
  feedback,
  loadingMachines,
  machines,
  cardWidth,
  onOpenMachine,
  onOpenCreateMachine,
  canCreateMachine,
  onOpenHelp,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  activeFilterCount: number;
  filterPanelOpen: boolean;
  inventoryOwnershipType: InventoryOwnershipType;
  onChangeInventoryOwnership: (ownershipType: InventoryOwnershipType) => void;
  onToggleFilterPanel: () => void;
  suggestions: SearchSuggestion[];
  loadingSuggestions: boolean;
  onSelectSuggestion: (label: string) => void;
  filters: MachineFilters;
  onToggleFilter: (category: FilterCategoryKey, value: string) => void;
  feedback: string | null;
  loadingMachines: boolean;
  machines: Maquina[];
  cardWidth: number;
  onOpenMachine: (idMaquina: number) => void;
  onOpenCreateMachine: () => void;
  canCreateMachine: boolean;
  onOpenHelp: () => void;
}) {
  return (
    <View style={homeStyles.homeContent}>
      <ScreenHeader onHelpPress={onOpenHelp} />

      <View style={homeStyles.searchRow}>
        <View style={homeStyles.searchInputWrapper}>
          <Ionicons color={AppColors.primary50} name="search" size={18} />
          <TextInput
            placeholder="Buscar..."
            placeholderTextColor={AppColors.primary50}
            style={homeStyles.searchInput}
            value={query}
            onChangeText={onQueryChange}
          />
        </View>

        <Pressable
          style={homeStyles.filterButton}
          onPress={onToggleFilterPanel}>
          <Text style={homeStyles.filterButtonText}>
            Filtrar{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
          </Text>
        </Pressable>

        {canCreateMachine ? (
          <Pressable onPress={onOpenCreateMachine} style={homeStyles.addMachineButton}>
            <Ionicons color={AppColors.primary} name="add" size={20} />
          </Pressable>
        ) : null}
      </View>

      <View style={homeStyles.inventoryTabsRow}>
        {([
          { label: 'Tecarral', value: 'TECARRAL' },
          { label: 'Clientes', value: 'CLIENTE' },
        ] as const).map((option) => {
          const selected = inventoryOwnershipType === option.value;
          return (
            <Pressable
              key={option.value}
              onPress={() => onChangeInventoryOwnership(option.value)}
              style={[homeStyles.inventoryTabButton, selected && homeStyles.inventoryTabButtonActive]}>
              <Text style={[homeStyles.inventoryTabText, selected && homeStyles.inventoryTabTextActive]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={homeStyles.inventoryTabsHint}>
        {inventoryOwnershipType === 'CLIENTE'
          ? 'Inventario de máquinas propiedad de clientes'
          : 'Inventario de máquinas propiedad de Tecarral'}
      </Text>

      {query.trim().length >= 2 && (suggestions.length > 0 || loadingSuggestions) ? (
        <View style={homeStyles.suggestionsBox}>
          {loadingSuggestions ? (
            <Text style={homeStyles.suggestionText}>Buscando sugerencias...</Text>
          ) : (
            suggestions.map((suggestion) => (
              <Pressable
                key={suggestion.id}
                onPress={() => onSelectSuggestion(suggestion.label)}
                style={homeStyles.suggestionItem}>
                <Text style={homeStyles.suggestionText}>{suggestion.label}</Text>
                <Text style={homeStyles.suggestionSource}>{suggestion.source}</Text>
              </Pressable>
            ))
          )}
        </View>
      ) : null}

      {filterPanelOpen ? (
        <>
          <FilterPanel
            filters={filters}
            onClose={onToggleFilterPanel}
            onToggle={onToggleFilter}
            inventoryOwnershipType={inventoryOwnershipType}
          />
          <View style={homeStyles.filterPanelSpacer} />
        </>
      ) : null}

      {feedback ? (
        <Text style={[homeStyles.feedbackText, filterPanelOpen && homeStyles.feedbackTextWithFilter]}>
          {feedback}
        </Text>
      ) : null}

      {loadingMachines ? (
        <Text style={homeStyles.loadingText}>Cargando maquinaria...</Text>
      ) : (
        <FlatList
          columnWrapperStyle={homeStyles.machineGridRow}
          contentContainerStyle={homeStyles.machineListContent}
          data={machines}
          keyExtractor={(item) => String(item.id_maquina)}
          numColumns={2}
          renderItem={({ item }) => (
            <MachineCard item={item} onPress={() => onOpenMachine(item.id_maquina)} width={cardWidth} />
          )}
          scrollEnabled={false}
          ListEmptyComponent={
            <View style={homeStyles.emptyState}>
              <Text style={homeStyles.emptyStateText}>No hay maquinaria para esos filtros.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}
