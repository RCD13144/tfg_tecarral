import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.routes.js";
import usersRoutes from "./routes/users.routes.js";
import maquinasRoutes from "./routes/maquinas.routes.js"

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "API Tecarra funcionando correctamente" });
});

app.use("/api/auth", authRoutes);
app.use("/api", usersRoutes);
app.use("/api/maquinas", maquinasRoutes);

export default app;
