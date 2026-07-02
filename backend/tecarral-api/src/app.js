import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import usersRoutes from "./routes/users.routes.js";
import maquinasRoutes from "./routes/maquinas.routes.js";
import propuestaRoutes from "./routes/propuesta.routes.js";
import publicPropuestaRoutes from "./routes/publicPropuesta.routes.js";
import presupuestoReparacionRoutes from "./routes/presupuestoReparacion.routes.js";
import publicPresupuestoReparacionRoutes from "./routes/publicPresupuestoReparacion.routes.js";
import { startExpirePropuestasJob } from "./jobs/expirePropuestas.job.js";
import { startExpirePresupuestosReparacionJob } from "./jobs/expirePresupuestosReparacion.job.js";
import { startMaintenanceRemindersJob } from "./jobs/maintenanceReminders.job.js";
import reparacionRoutes from "./routes/reparacion.routes.js";
import albaranesRoutes from "./routes/albaranes.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import serviceContractRoutes from "./routes/serviceContract.routes.js";
import publicServiceContractRoutes from "./routes/publicServiceContract.routes.js";
import loanerAssignmentRoutes from "./routes/loanerAssignment.routes.js";
import { getUploadsDirectory } from "./utils/machine-image-storage.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.get("/", (req, res) => {
  res.json({ message: "API Tecarral funcionando correctamente" });
});

app.use("/uploads", express.static(getUploadsDirectory()));

app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/maquinas", maquinasRoutes);
app.use("/api/propuestas", propuestaRoutes);
app.use("/api/presupuestos-reparacion", presupuestoReparacionRoutes);
app.use("/public", publicPropuestaRoutes);
app.use("/public", publicPresupuestoReparacionRoutes);
app.use("/public", publicServiceContractRoutes);
app.use("/api/reparaciones", reparacionRoutes);
app.use("/api/albaranes", albaranesRoutes);
app.use("/api/notificaciones", notificationRoutes);
app.use("/api/contratos-mantenimiento", serviceContractRoutes);
app.use("/api/maquinas-sustitucion", loanerAssignmentRoutes);

if (process.env.NODE_ENV !== "test") {
  startExpirePropuestasJob();
  startExpirePresupuestosReparacionJob();
  startMaintenanceRemindersJob();
}

export default app;
