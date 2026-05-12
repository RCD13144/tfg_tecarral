import type { AlbaranDetail, AlbaranListItem } from '@/types/albaran';

const DATE_FORMATTER = new Intl.DateTimeFormat('es-ES', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Europe/Madrid',
});

export function formatAlbaranDate(value: string | null | undefined) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return DATE_FORMATTER.format(date);
}

export function groupAlbaranes(albaranes: AlbaranListItem[]) {
  return {
    unsigned: albaranes.filter((item) => item.estado === 'BORRADOR'),
    signed: albaranes.filter((item) => item.estado === 'FIRMADO'),
  };
}

export function getAlbaranTitle(albaran: Pick<AlbaranDetail, 'id_albaran' | 'cliente'>) {
  const cliente = String(albaran.cliente ?? '').trim();
  return cliente ? `Albarán #${albaran.id_albaran} · ${cliente}` : `Albarán #${albaran.id_albaran}`;
}

export function getAlbaranSubtitle(albaran: Pick<AlbaranDetail, 'marca' | 'modelo' | 'ns'>) {
  const marca = String(albaran.marca ?? '').trim();
  const modelo = String(albaran.modelo ?? '').trim();
  const ns = String(albaran.ns ?? '').trim();

  return [marca, modelo, ns ? `NS ${ns}` : ''].filter(Boolean).join(' · ');
}

export function formatDisplayValue(value: unknown) {
  if (value === null || value === undefined) {
    return '-';
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : '-';
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  return '-';
}
