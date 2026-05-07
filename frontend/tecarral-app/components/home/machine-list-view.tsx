import { Ionicons } from '@expo/vector-icons';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';

import { FilterPanel } from '@/components/home/filter-panel';
import { MachineCard } from '@/components/home/machine-card';
import { ScreenHeader } from '@/components/shared/screen-header';
import { AppColors } from '@/constants/theme';
import { homeStyles } from '@/styles/home.styles';
import type { FilterCategoryKey, MachineFilters, Maquina, SearchSuggestion } from '@/types/maquina';

export function MachineListView({
  query,
  onQueryChange,
  activeFilterCount,
  filterPanelOpen,
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
}: {
  query: string;
  onQueryChange: (value: string) => void;
  activeFilterCount: number;
  filterPanelOpen: boolean;
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
}) {
  return (
    <View style={homeStyles.homeContent}>
      <ScreenHeader />

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

        <Pressable style={homeStyles.filterButton} onPress={onToggleFilterPanel}>
          <Text style={homeStyles.filterButtonText}>
            Filtrar{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
          </Text>
        </Pressable>
      </View>

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
