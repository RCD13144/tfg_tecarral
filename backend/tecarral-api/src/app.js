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
import reparacionRoutes from "./routes/reparacion.routes.js";
import albaranesRoutes from "./routes/albaranes.routes.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.get("/", (req, res) => {
  res.json({ message: "API Tecarra funcionando correctamente" });
});

app.use("/api/auth", authRoutes);
app.use("/api", usersRoutes);
app.use("/api/maquinas", maquinasRoutes);
app.use("/api/propuestas", propuestaRoutes);
app.use("/api/presupuestos-reparacion", presupuestoReparacionRoutes);
app.use("/public", publicPropuestaRoutes);
app.use("/public", publicPresupuestoReparacionRoutes);
app.use("/api/reparaciones", reparacionRoutes);
app.use("/api/albaranes", albaranesRoutes);

startExpirePropuestasJob();
startExpirePresupuestosReparacionJob();

export default app;