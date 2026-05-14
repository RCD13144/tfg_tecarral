import { Redirect } from 'expo-router';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useEffect, useRef, useState } from 'react';

import { AlbaranesScreen } from '@/components/albaranes/albaranes-screen';
import { HomeBottomTabBar } from '@/components/home/home-bottom-tab-bar';
import { CreateMachineFormView } from '@/components/home/create-machine-form-view';
import { MachineDetailView } from '@/components/home/machine-detail-view';
import { MachineListView } from '@/components/home/machine-list-view';
import { NavigationAppModal } from '@/components/home/navigation-app-modal';
import { ProposalFormView } from '@/components/home/proposal-form-view';
import { RepairBudgetFormView } from '@/components/home/repair-budget-form-view';
import { ReparacionesScreen } from '@/components/reparaciones/reparaciones-screen';
import { HelpSidePanel } from '@/components/shared/help-side-panel';
import { UserScreen } from '@/components/user/user-screen';
import {
  TAB_BAR_HORIZONTAL_PADDING,
  TAB_BAR_INNER_PADDING,
  TAB_KEYS,
} from '@/constants/home';
import { useAuth } from '@/contexts/auth-context';
import { useHomeScreen } from '@/hooks/use-home-screen';
import { homeStyles } from '@/styles/home.styles';

export default function HomeScreen() {
  const { isHydrating, session } = useAuth();
  const { width, height } = useWindowDimensions();
  const indicatorTranslateX = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollOffsetRef = useRef(0);
  const [parentScrollEnabled, setParentScrollEnabled] = useState(true);
  const [helpOpen, setHelpOpen] = useState(false);

  const home = useHomeScreen(session);
  const isAdmin = String(session?.user.role ?? '').trim().toLowerCase() === 'admin';

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

    if (
      home.homeSubview === 'proposalForm' ||
      home.homeSubview === 'repairBudgetForm' ||
      home.homeSubview === 'list'
    ) {
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
    return <Redirect href={'/' as never} />;
  }

  const scrollBottomPadding =
    home.filterPanelOpen && home.homeSubview === 'list' ? 300 : 126;

  function scrollFocusedInputIntoView() {
    requestAnimationFrame(() => {
      const focusedInput = TextInput.State.currentlyFocusedInput?.();

      if (!focusedInput || typeof focusedInput.measure !== 'function') {
        return;
      }

      focusedInput.measure((_x, _y, _width, inputHeight, _pageX, pageY) => {
        const visibleTop = 120;
        const visibleBottom = height - (Platform.OS === 'ios' ? 320 : 280);

        if (pageY + inputHeight > visibleBottom) {
          const delta = pageY + inputHeight - visibleBottom;
          scrollViewRef.current?.scrollTo({
            y: Math.max(0, scrollOffsetRef.current + delta + 24),
            animated: true,
          });
          return;
        }

        if (pageY < visibleTop) {
          scrollViewRef.current?.scrollTo({
            y: Math.max(0, scrollOffsetRef.current + pageY - visibleTop - 12),
            animated: true,
          });
        }
      });
    });
  }

  function getHelpContent() {
    if (home.activeTab === 'home') {
      return {
        title: 'Ayuda · Maquinaria',
        subtitle: isAdmin ? 'Vista para administrador' : 'Vista para técnico',
        items: isAdmin
          ? [
              'Consulta toda la maquinaria, aplica filtros y abre el detalle de cada máquina.',
              'Desde esta pestaña puedes crear máquinas nuevas y preparar propuestas de alquiler cuando corresponda.',
              'En el detalle puedes editar datos de maquinaria, confirmar ubicaciones y cambiar estados de mantenimiento.',
              'Si una máquina queda en tránsito, las opciones de ubicación se ajustan automáticamente al contexto real del flujo.',
            ]
          : [
              'Consulta toda la maquinaria disponible y abre el detalle de cada máquina.',
              'Desde el detalle puedes revisar estados, confirmar ubicaciones permitidas y registrar incidencias.',
              'Las opciones de ubicación cambian según si la máquina viene de reparación o de un alquiler finalizado.',
              'La información que ves aquí siempre debe reflejar lo persistido en backend.',
            ],
      };
    }

    if (home.activeTab === 'albaran') {
      return {
        title: 'Ayuda · Albaranes',
        subtitle: isAdmin ? 'Vista para administrador' : 'Vista para técnico',
        items: isAdmin
          ? [
              'Revisa albaranes firmados y pendientes para hacer seguimiento de entregas e incidencias.',
              'Puedes abrir cualquier albarán para comprobar su detalle y su estado de firma.',
              'Esta pestaña sirve para supervisar el circuito documental asociado a alquileres y reparaciones.',
            ]
          : [
              'Consulta los albaranes pendientes y los ya firmados.',
              'Desde un albarán pendiente puedes avanzar por el flujo de firma técnica y firma del cliente.',
              'Usa esta pestaña para dejar cerrada la documentación de cada intervención o entrega.',
            ],
      };
    }

    if (home.activeTab === 'reparacion') {
      return {
        title: 'Ayuda · Reparaciones',
        subtitle: isAdmin ? 'Vista para administrador' : 'Vista para técnico',
        items: isAdmin
          ? [
              'Consulta todas las reparaciones activas y detecta las averías graves pendientes.',
              'Puedes asignar reparaciones graves al técnico correspondiente y seguir su evolución.',
              'También puedes cerrar reparaciones cuando el flujo y los requisitos del backend lo permitan.',
            ]
          : [
              'Consulta únicamente las reparaciones activas que tienes asignadas.',
              'Desde aquí puedes revisar el contexto de la avería y registrar la solución aplicada.',
              'Cuando una reparación se complete, esta pestaña te permite cerrarla siguiendo el flujo permitido.',
            ],
      };
    }

    return {
      title: 'Ayuda · Usuario',
      subtitle: isAdmin ? 'Vista para administrador' : 'Vista para técnico',
      items: isAdmin
        ? [
            'Gestiona tu perfil, cambia tu contraseña y cierra sesión desde esta pestaña.',
            'Además puedes registrar nuevos usuarios y desactivar usuarios activos cuando haga falta.',
            'La parte administrativa de usuarios solo aparece para cuentas con rol admin.',
          ]
        : [
            'Gestiona tu perfil personal, cambia tu contraseña y cierra sesión.',
            'Aquí solo se muestran acciones relacionadas con tu propia cuenta.',
            'Los datos sensibles como rol, nombre y email se muestran en solo lectura.',
          ],
    };
  }

  const helpContent = getHelpContent();

  function renderHomeContent() {
    if (home.homeSubview === 'detail') {
      return (
        <MachineDetailView
          acceptedProposal={home.acceptedProposal}
          canCreateProposal={home.canCreateProposal}
          canOpenProposalForm={home.canOpenProposalForm}
          canCreateRepairBudget={home.canCreateRepairBudget}
          canMarkDelivered={home.canMarkDelivered}
          canSubmitIncidence={home.canSubmitIncidence}
          detailFeedback={home.detailFeedback}
          detailLoading={home.detailLoading}
          detailSuccessFeedback={home.detailSuccessFeedback}
          incidenceComment={home.incidenceComment}
          incidenceEscalationMode={home.incidenceEscalationMode}
          incidencePanelVisible={home.incidencePanelVisible}
          locationActionLoading={home.locationActionLoading}
          locationOptions={home.locationOptions}
          locationPickerOpen={home.locationPickerOpen}
          machineEditFeedback={home.machineEditFeedback}
          machineEditForm={home.machineEditForm}
          machineBooleanOptions={home.machineBooleanOptions}
          machineEditAntihuellaOpen={home.machineEditAntihuellaOpen}
          machineEditElevationLibreOpen={home.machineEditElevationLibreOpen}
          machineEditMode={home.machineEditMode}
          machineEditMotorOpen={home.machineEditMotorOpen}
          machineEditSeguroOpen={home.machineEditSeguroOpen}
          machineEditSubmitting={home.machineEditSubmitting}
          machineEditTipoOpen={home.machineEditTipoOpen}
          machineImageSource={home.machineImageSource}
          machineMotorOptions={home.machineMotorOptions}
          machineSeguroOptions={home.machineSeguroOptions}
          machineTipoOptions={home.machineTipoOptions}
          maintenanceOptions={home.maintenanceOptions}
          onBack={home.resetToListView}
          onCancelIncidenceDraft={home.handleCancelIncidenceDraft}
          onChangeIncidenceComment={home.setIncidenceComment}
          onChangeMachineEditField={home.updateMachineEditForm}
          onConfirmLocation={() => void home.handleConfirmLocation()}
          onCancelMachineEdit={home.handleCancelMachineEdit}
          onOpenMachineEdit={home.handleOpenMachineEdit}
          onOpenNavigation={() => void home.openNavigationOptions()}
          onOpenProposalForm={home.openProposalForm}
          onOpenRepairBudgetForm={home.openRepairBudgetForm}
          onPickMachineEditImageFromLibrary={() => void home.pickMachineImage('library', 'edit')}
          onRequestScrollToFocusedInput={scrollFocusedInputIntoView}
          onSaveMachineEdit={() => void home.handleSaveMachineEdit()}
          onSelectLocation={home.handleLocationChange}
          onSelectMaintenance={(value) => void home.handleMaintenanceChange(value)}
          onSubmitIncidence={() => void home.handleOpenIncidence()}
          onTakeMachineEditPhoto={() => void home.pickMachineImage('camera', 'edit')}
          onToggleLocationPicker={home.handleToggleLocationPicker}
          onToggleMachineEditMotor={() =>
            home.setMachineEditMotorOpen((current: boolean) => !current)
          }
          onToggleMachineEditAntihuella={() =>
            home.setMachineEditAntihuellaOpen((current: boolean) => !current)
          }
          onToggleMachineEditElevationLibre={() =>
            home.setMachineEditElevationLibreOpen((current: boolean) => !current)
          }
          onToggleMachineEditSeguro={() =>
            home.setMachineEditSeguroOpen((current: boolean) => !current)
          }
          onToggleMachineEditTipo={() =>
            home.setMachineEditTipoOpen((current: boolean) => !current)
          }
          onToggleProposals={() => home.setProposalsExpanded(!home.proposalsExpanded)}
          onToggleStatusPicker={home.handleToggleStatusPicker}
          proposalButtonDisabledReason={home.proposalButtonDisabledReason}
          proposals={home.selectedMachineProposals}
          proposalsExpanded={home.proposalsExpanded}
          repairBudgetDisabledReason={home.repairBudgetDisabledReason}
          selectedMachineDetail={home.selectedMachineDetail}
          selectedMaintenanceStatus={home.selectedMaintenanceStatus}
          selectedTargetLocation={home.selectedTargetLocation}
          showRepairBudgetButton={home.showRepairBudgetButton}
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
          onRequestScrollToFocusedInput={scrollFocusedInputIntoView}
          onSubmit={() => void home.handleCreateProposal()}
          proposalFeedback={home.proposalFeedback}
          proposalForm={home.proposalForm}
          proposalSubmitting={home.proposalSubmitting}
          selectedMachineDetail={home.selectedMachineDetail}
        />
      );
    }

    if (home.homeSubview === 'repairBudgetForm') {
      return (
        <RepairBudgetFormView
          onBack={() => home.setHomeSubview('detail')}
          onChangeField={home.updateRepairBudgetForm}
          onRequestScrollToFocusedInput={scrollFocusedInputIntoView}
          onSubmit={() => void home.handleCreateRepairBudget()}
          proposalSummary={home.acceptedProposal}
          repairBudgetFeedback={home.repairBudgetFeedback}
          repairBudgetForm={home.repairBudgetForm}
          repairBudgetSubmitting={home.repairBudgetSubmitting}
          selectedMachineDetail={home.selectedMachineDetail}
        />
      );
    }

    if (home.homeSubview === 'createMachineForm') {
      return (
        <CreateMachineFormView
          elevationLibreOpen={home.machineCreateElevationLibreOpen}
          elevationLibreOptions={home.machineBooleanOptions}
          feedback={home.machineCreateFeedback}
          form={home.machineCreateForm}
          motorOpen={home.machineCreateMotorOpen}
          motorOptions={home.machineMotorOptions}
          onBack={home.resetToListView}
          onChangeField={home.updateMachineCreateForm}
          onPickImageFromLibrary={() => void home.pickMachineImage('library')}
          onRequestScrollToFocusedInput={scrollFocusedInputIntoView}
          onSubmit={() => void home.handleCreateMachine()}
          onTakePhoto={() => void home.pickMachineImage('camera')}
          onToggleElevationLibre={() =>
            home.setMachineCreateElevationLibreOpen((current: boolean) => !current)
          }
          onToggleMotor={() => home.setMachineCreateMotorOpen((current: boolean) => !current)}
          onToggleSeguro={() => home.setMachineCreateSeguroOpen((current: boolean) => !current)}
          onToggleTipo={() => home.setMachineCreateTipoOpen((current: boolean) => !current)}
          seguroOpen={home.machineCreateSeguroOpen}
          seguroOptions={home.machineSeguroOptions}
          submitting={home.machineCreateSubmitting}
          tipoOpen={home.machineCreateTipoOpen}
          tipoOptions={home.machineTipoOptions}
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
        canCreateMachine={home.canCreateMachine}
        onOpenHelp={() => setHelpOpen(true)}
        onOpenCreateMachine={home.openCreateMachineForm}
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
          onOpenHelp={() => setHelpOpen(true)}
          session={session}
          visible={home.activeTab === 'albaran'}
        />
      );
    }

    if (home.activeTab === 'reparacion') {
      return (
        <ReparacionesScreen
          onOpenHelp={() => setHelpOpen(true)}
          onRequestScrollToFocusedInput={scrollFocusedInputIntoView}
          session={session}
          visible={home.activeTab === 'reparacion'}
        />
      );
    }

    return (
      <UserScreen
        onOpenHelp={() => setHelpOpen(true)}
        onRequestScrollToFocusedInput={scrollFocusedInputIntoView}
        session={session}
        visible={home.activeTab === 'user'}
      />
    );
  }

  return (
    <View style={homeStyles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 0}
        style={homeStyles.keyboardContainer}>
        <ScrollView
          ref={scrollViewRef}
          automaticallyAdjustKeyboardInsets
          contentContainerStyle={[homeStyles.scrollContent, { paddingBottom: scrollBottomPadding }]}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          onScroll={(event) => {
            scrollOffsetRef.current = event.nativeEvent.contentOffset.y;
          }}
          scrollEnabled={parentScrollEnabled}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}>
          {renderTabContent()}
        </ScrollView>
      </KeyboardAvoidingView>

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

      <HelpSidePanel
        items={helpContent.items}
        onClose={() => setHelpOpen(false)}
        subtitle={helpContent.subtitle}
        title={helpContent.title}
        visible={helpOpen}
      />
    </View>
  );
}
