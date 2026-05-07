import { Text, View } from 'react-native';

import { AlbaranSection } from '@/components/albaranes/albaran-section';
import { ScreenHeader } from '@/components/shared/screen-header';
import { albaranesStyles } from '@/styles/albaranes.styles';
import type { AlbaranListItem } from '@/types/albaran';

export function AlbaranListView({
  signed,
  unsigned,
  loading,
  feedback,
  signedExpanded,
  unsignedExpanded,
  onToggleSigned,
  onToggleUnsigned,
  onOpenItem,
}: {
  signed: AlbaranListItem[];
  unsigned: AlbaranListItem[];
  loading: boolean;
  feedback: string | null;
  signedExpanded: boolean;
  unsignedExpanded: boolean;
  onToggleSigned: () => void;
  onToggleUnsigned: () => void;
  onOpenItem: (item: AlbaranListItem) => void;
}) {
  return (
    <View style={albaranesStyles.container}>
      <ScreenHeader />

      {feedback ? <Text style={albaranesStyles.feedbackText}>{feedback}</Text> : null}
      {loading ? <Text style={albaranesStyles.loadingText}>Cargando albaranes...</Text> : null}

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
        items={signed}
        onOpenItem={onOpenItem}
        onToggle={onToggleSigned}
        title="Firmados"
      />
    </View>
  );
}
