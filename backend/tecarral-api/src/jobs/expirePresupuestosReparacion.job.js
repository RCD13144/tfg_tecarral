import cron from "node-cron";
import * as presupuestoReparacionRepository from "../repositories/presupuestoReparacion.repository.js";

function formatNowMadrid() {
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "short",
    timeStyle: "medium",
    timeZone: "Europe/Madrid",
  }).format(new Date());
}

export function startExpirePresupuestosReparacionJob() {
  const enabled =
    String(
      process.env.EXPIRE_PRESUPUESTOS_REPARACION_JOB_ENABLED ?? "true"
    ).toLowerCase() === "true";

  if (!enabled) {
    return;
  }

  const cronExpression = String(
    process.env.EXPIRE_PRESUPUESTOS_REPARACION_JOB_CRON ?? "*/5 * * * *"
  ).trim();

  cron.schedule(cronExpression, async () => {
    console.log(
      "[expirePresupuestosReparacionJob] tick",
      formatNowMadrid()
    );

    try {
      const expired =
        await presupuestoReparacionRepository.expirePendingPresupuestosByDate();

      console.log(
        "[expirePresupuestosReparacionJob] expirados:",
        expired,
        "| hora:",
        formatNowMadrid()
      );
    } catch (error) {
      console.error(
        "[expirePresupuestosReparacionJob] Error:",
        error?.message ?? error,
        "| hora:",
        formatNowMadrid()
      );
    }
  });
}