export function formatDateES(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value ?? "");

  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Madrid",
  }).format(d);
}


export function humanizeLogisticsStatus(value) {
  const v = String(value ?? "").trim().toUpperCase();
  if (v === "EN_CAMINO") return "En camino";
  if (v === "ENTREGADA") return "Entregada";
  return "—";
}

export function humanizeMaintenanceStatus(value) {
  const v = String(value ?? "").trim().toUpperCase();
  if (v === "OK") return "Correcta";
  if (v === "AVERIADA") return "Averiada";
  if (v === "EN_TALLER") return "En taller";
  return "—";
}

export function humanizeTipoMaquina(value) {
  const v = String(value ?? "").trim().toLowerCase();
  if (v === "elevacion") return "Elevación";
  if (v === "limpieza") return "Limpieza";
  return value ?? "—";
}
