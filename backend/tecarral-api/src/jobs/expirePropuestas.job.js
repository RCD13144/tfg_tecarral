import cron from "node-cron";
import * as propuestaService from "../services/propuesta.service.js";

export function startExpirePropuestasJob() {
  const enabled =
    String(process.env.EXPIRE_JOB_ENABLED ?? "true").toLowerCase() === "true";

  if (!enabled) {
    return;
  }

  const limit = Number(process.env.EXPIRE_JOB_LIMIT ?? "1000");
  const safeLimit =
    Number.isInteger(limit) && limit > 0 ? limit : 1000;

  cron.schedule("*/5 * * * *", async () => {
    console.log("[expirePropuestasJob] tick", new Date().toISOString());
    try {
      const result =
        await propuestaService.expirePropuestasAndRecompute({
          limit: safeLimit,
        });

      if (
        result.expired_count > 0 ||
        result.transit_moved > 0
      ) {
        console.log(
          "[expirePropuestasJob] expired:",
          result.expired_count,
          "| moved to TRANSITO:",
          result.transit_moved
        );
      }
    } catch (e) {
      console.error(
        "[expirePropuestasJob] Error:",
        e?.message ?? e
      );
    }
  });
}
