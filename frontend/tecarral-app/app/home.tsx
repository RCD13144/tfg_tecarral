import { Redirect } from 'expo-router';
import { Animated, ScrollView, useWindowDimensions, View } from 'react-native';
import { useEffect, useRef, useState } from 'react';

import { AlbaranesScreen } from '@/components/albaranes/albaranes-screen';
import { HomeBottomTabBar } from '@/components/home/home-bottom-tab-bar';
import { MachineDetailView } from '@/components/home/machine-detail-view';
import { MachineListView } from '@/components/home/machine-list-view';
import { NavigationAppModal } from '@/components/home/navigation-app-modal';
import { PlaceholderTab } from '@/components/home/placeholder-tab';
import { ProposalFormView } from '@/components/home/proposal-form-view';
import {
  LOGIN_ROUTE,
  TAB_BAR_HORIZONTAL_PADDING,
  TAB_BAR_INNER_PADDING,
  TAB_KEYS,
} from '@/constants/home';
import { useAuth } from '@/contexts/auth-context';
import { useHomeScreen } from '@/hooks/use-home-screen';
import { homeStyles } from '@/styles/home.styles';

export default function HomeScreen() {
  const { isHydrating, session } = useAuth();
  const { width } = useWindowDimensions();
  const indicatorTranslateX = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const [parentScrollEnabled, setParentScrollEnabled] = useState(true);

  const home = useHomeScreen(session);

  const tabBarWidth = Math.max(0, width - TAB_BAR_HORIZONTAL_PADDING * 2);
  const tabSlotWidth = (tabBarWidth - TAB_BAR_INNER_PADDING * 2) / TAB_KEYS.length;
  const indicatorWidth = Math.max(44, tabSlotWidth - 16);
  const cardWidth = (width - 32 * 2 - 12) / 2;

  useEffect(() => {
    const index = TAB_KEYS.indexOf(home.activeTab);
    const translateX =
      TAB_BAR_INNER_PADDING + index * tabSlotWidth + (tabSlotWidth - indicatorWidth) / 2;

    Animated.spring(indicatorTranslateX, {
      toValue: translateX,
      friction: 8,
      tension: 70,
      useNativeDriver: true,
    }).start();
  }, [home.activeTab, indicatorTranslateX, indicatorWidth, tabSlotWidth]);

  useEffect(() => {
    if (home.activeTab !== 'home') {
      return;
    }

    if (home.homeSubview === 'proposalForm' || home.homeSubview === 'list') {
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    }
  }, [home.activeTab, home.homeSubview, home.homeScrollResetKey]);

  useEffect(() => {
    if (home.activeTab !== 'home' || home.homeSubview !== 'detail' || !home.incidencePanelVisible) {
      return;
    }

    scrollViewRef.current?.scrollTo({ y: 720, animated: true });
  }, [home.activeTab, home.homeSubview, home.incidencePanelVisible]);

  if (!isHydrating && !session) {
    return <Redirect href={LOGIN_ROUTE} />;
  }

  const scrollBottomPadding =
    home.filterPanelOpen && home.homeSubview === 'list' ? 300 : 126;

  function renderHomeContent() {
    if (home.homeSubview === 'detail') {
      return (
        <MachineDetailView
          acceptedProposal={home.acceptedProposal}
          canCreateProposal={home.canCreateProposal}
          canMarkDelivered={home.canMarkDelivered}
          canSubmitIncidence={home.canSubmitIncidence}
          detailFeedback={home.detailFeedback}
          detailLoading={home.detailLoading}
          locationActionLoading={home.locationActionLoading}
          locationOptions={home.locationOptions}
          locationPickerOpen={home.locationPickerOpen}
          machineImageSource={home.machineImageSource}
          maintenanceOptions={home.maintenanceOptions}
          onBack={home.resetToListView}
          onConfirmLocation={() => void home.handleConfirmLocation()}
          onOpenNavigation={() => void home.openNavigationOptions()}
          onOpenProposalForm={home.openProposalForm}
          onSelectLocation={home.handleLocationChange}
          onSelectMaintenance={(value) => void home.handleMaintenanceChange(value)}
          onChangeIncidenceComment={home.setIncidenceComment}
          onCancelIncidenceDraft={home.handleCancelIncidenceDraft}
          onSubmitIncidence={() => void home.handleOpenIncidence()}
          onToggleLocationPicker={home.handleToggleLocationPicker}
          onToggleProposals={() => home.setProposalsExpanded(!home.proposalsExpanded)}
          onToggleStatusPicker={home.handleToggleStatusPicker}
          detailSuccessFeedback={home.detailSuccessFeedback}
          proposals={home.selectedMachineProposals}
          proposalsExpanded={home.proposalsExpanded}
          incidenceComment={home.incidenceComment}
          incidenceEscalationMode={home.incidenceEscalationMode}
          incidencePanelVisible={home.incidencePanelVisible}
          selectedMaintenanceStatus={home.selectedMaintenanceStatus}
          selectedMachineDetail={home.selectedMachineDetail}
          selectedTargetLocation={home.selectedTargetLocation}
          statusActionLoading={home.statusActionLoading}
          statusPickerOpen={home.statusPickerOpen}
        />
      );
    }

    if (home.homeSubview === 'proposalForm') {
      return (
        <ProposalFormView
          onBack={() => home.setHomeSubview('detail')}
          onChangeField={home.updateProposalForm}
          onSubmit={() => void home.handleCreateProposal()}
          proposalFeedback={home.proposalFeedback}
          proposalForm={home.proposalForm}
          proposalSubmitting={home.proposalSubmitting}
          selectedMachineDetail={home.selectedMachineDetail}
        />
      );
    }

    return (
      <MachineListView
        activeFilterCount={home.activeFilterCount}
        cardWidth={cardWidth}
        feedback={home.feedback}
        filterPanelOpen={home.filterPanelOpen}
        filters={home.filters}
        loadingMachines={home.loadingMachines}
        loadingSuggestions={home.loadingSuggestions}
        machines={home.visibleMachines}
        onOpenMachine={(idMaquina) => void home.openMachineDetail(idMaquina)}
        onQueryChange={home.setQuery}
        onSelectSuggestion={home.handleSelectSuggestion}
        onToggleFilter={home.toggleFilter}
        onToggleFilterPanel={home.handleToggleFilterPanel}
        query={home.query}
        suggestions={home.suggestions}
      />
    );
  }

  function renderTabContent() {
    if (home.activeTab === 'home') {
      return renderHomeContent();
    }

    if (home.activeTab === 'albaran') {
      return (
        <AlbaranesScreen
          onChangeParentScrollEnabled={setParentScrollEnabled}
          session={session}
          visible={home.activeTab === 'albaran'}
        />
      );
    }

    if (home.activeTab === 'reparacion') {
      return (
        <PlaceholderTab
          subtitle="Aqui se dejará preparada la base para el contenido de reparaciones."
          title="Ventana reparacion"
        />
      );
    }

    return (
      <PlaceholderTab
        subtitle="Aqui se dejará preparada la base para la informacion del usuario."
        title="Ventana user"
      />
    );
  }

  return (
    <View style={homeStyles.container}>
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={[homeStyles.scrollContent, { paddingBottom: scrollBottomPadding }]}
        scrollEnabled={parentScrollEnabled}
        showsVerticalScrollIndicator={false}>
        {renderTabContent()}
      </ScrollView>

      <HomeBottomTabBar
        activeTab={home.activeTab}
        indicatorTranslateX={indicatorTranslateX}
        indicatorWidth={indicatorWidth}
        onSelectTab={home.handleSelectTab}
        tabBarWidth={tabBarWidth}
        tabSlotWidth={tabSlotWidth}
      />

      <NavigationAppModal
        apps={home.availableNavigationApps}
        onClose={() => home.setNavigationModalOpen(false)}
        onOpen={(url) => void home.handleOpenNavigation(url)}
        visible={home.navigationModalOpen}
      />
    </View>
  );
}
