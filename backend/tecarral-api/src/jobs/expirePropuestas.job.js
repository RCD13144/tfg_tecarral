import cron from "node-cron";
import * as propuestaService from "../services/propuesta.service.js";

function formatNowMadrid() {
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "short",
    timeStyle: "medium",
    timeZone: "Europe/Madrid",
  }).format(new Date());
}

export function startExpirePropuestasJob() {
  const enabled =
    String(process.env.EXPIRE_JOB_ENABLED ?? "true").toLowerCase() === "true";

  if (!enabled) {
    return;
  }

  const cronExpression =
    String(process.env.EXPIRE_JOB_CRON ?? "*/5 * * * *").trim();

  cron.schedule(cronExpression, async () => {
    console.log("[expirePropuestasJob] tick", formatNowMadrid());

    try {
      const result = await propuestaService.finalizeOrExpirePropuestas();

      console.log(
        "[expirePropuestasJob] expiradas:",
        result.expired,
        "| finalizadas:",
        result.finalized,
        "| movidas a tránsito:",
        result.moved_to_transit ?? 0,
        "| hora:",
        formatNowMadrid()
      );
    } catch (e) {
      console.error(
        "[expirePropuestasJob] Error:",
        e?.message ?? e,
        "| hora:",
        formatNowMadrid()
      );
    }
  });
}
