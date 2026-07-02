import cron from "node-cron";
import {
  dispatchMaintenanceReminders,
  expireEndedContracts,
} from "../services/serviceContract.service.js";

export function startMaintenanceRemindersJob() {
  const enabled =
    String(process.env.MAINTENANCE_REMINDERS_JOB_ENABLED ?? "true").toLowerCase() === "true";

  if (!enabled) {
    return;
  }

  const cronExpression =
    String(process.env.MAINTENANCE_REMINDERS_JOB_CRON ?? "0 8 * * *").trim();

  cron.schedule(cronExpression, async () => {
    try {
      await expireEndedContracts();
      await dispatchMaintenanceReminders();
    } catch (error) {
      console.error("[maintenanceRemindersJob] Error:", error?.message ?? error);
    }
  });
}
