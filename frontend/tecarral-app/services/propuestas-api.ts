import { apiRequest } from '@/services/api';
import type { MachineProposalSummary, ProposalFormData } from '@/types/maquina';

export function getMachineProposals(idMaquina: number, token: string) {
  return apiRequest<MachineProposalSummary[]>(`/propuestas?id_maquina=${idMaquina}`, {
    token,
  });
}

export function createMachineProposal(
  idMaquina: number,
  data: ProposalFormData,
  token: string
) {
  return apiRequest<
    MachineProposalSummary & { public_url?: string; email_sent?: boolean; email_error?: string | null }
  >(
    '/propuestas',
    {
      method: 'POST',
      token,
      body: {
        id_maquina: idMaquina,
        cliente: data.cliente,
        email_cliente: data.email_cliente,
        telefono: data.telefono,
        direccion: data.direccion,
        cp: data.cp,
        poblacion: data.poblacion,
        precio: Number(data.precio),
        fecha_inicio: data.fecha_inicio,
        fecha_fin: data.fecha_fin,
      },
    }
  );
}
