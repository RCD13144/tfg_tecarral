import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.routes.js";
import usersRoutes from "./routes/users.routes.js";
import maquinasRoutes from "./routes/maquinas.routes.js"
import propuestaRoutes from "./routes/propuesta.routes.js"
import publicPropuestaRoutes from "./routes/publicPropuesta.routes.js"

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "API Tecarra funcionando correctamente" });
});

app.use("/api/auth", authRoutes);
app.use("/api", usersRoutes);
app.use("/api/maquinas", maquinasRoutes);
app.use("/api/propuestas", propuestaRoutes);
app.use("/public", publicPropuestaRoutes)

export default app;
