import { Pressable, Text, View } from 'react-native';

import { homeStyles } from '@/styles/home.styles';
import type { MachineProposalSummary } from '@/types/maquina';
import { formatProposalDate } from '@/utils/home-format';

export function ProposalCard({
  item,
  onPress,
}: {
  item: MachineProposalSummary;
  onPress?: (proposal: MachineProposalSummary) => void;
}) {
  const isPending = String(item.estado).trim().toUpperCase() === 'PENDING';

  if (!isPending || !onPress) {
    return (
      <View style={homeStyles.proposalCard}>
        <Text style={homeStyles.proposalCardTitle}>
          Propuesta #{item.id} - {item.estado}
        </Text>
        <Text style={homeStyles.proposalCardLine}>Cliente: {item.cliente}</Text>
        <Text style={homeStyles.proposalCardLine}>
          Destino: {item.direccion}, {item.poblacion}
        </Text>
        <Text style={homeStyles.proposalCardLine}>Precio: {item.precio}</Text>
        <Text style={homeStyles.proposalCardLine}>Inicio: {formatProposalDate(item.fecha_inicio)}</Text>
        <Text style={homeStyles.proposalCardLine}>Fin: {formatProposalDate(item.fecha_fin)}</Text>
      </View>
    );
  }

  return (
    <Pressable onPress={() => onPress(item)} style={homeStyles.proposalCard}>
      <Text style={homeStyles.proposalCardTitle}>
        Propuesta #{item.id} - {item.estado}
      </Text>
      <Text style={homeStyles.proposalCardLine}>Cliente: {item.cliente}</Text>
      <Text style={homeStyles.proposalCardLine}>
        Destino: {item.direccion}, {item.poblacion}
      </Text>
      <Text style={homeStyles.proposalCardLine}>Precio: {item.precio}</Text>
      <Text style={homeStyles.proposalCardLine}>Inicio: {formatProposalDate(item.fecha_inicio)}</Text>
      <Text style={homeStyles.proposalCardLine}>Fin: {formatProposalDate(item.fecha_fin)}</Text>
      <Text style={homeStyles.sectionHint}>Toca para ver o editar esta propuesta pendiente.</Text>
    </Pressable>
  );
}
