import * as authService from "../services/auth.service.js";
import { ROLES } from "../constants/roles.js";
import { validateRegisterBody, validateLoginBody } from "../schemas/auth.schema.js";


export async function register(req, res) {
  try {
    const validation = validateRegisterBody(req.body);

    if (!validation.ok) {
      res.status(400).json({ error: validation.errors.join(", ") });
    } else {
      const { email, password, role, nombre, telefono } = validation.value;

      // Si quieres impedir crear admins desde fuera, fuerza TECNICO aquí:
      const safeRole = role ?? ROLES.TECNICO;

      const user = await authService.register(email, password, safeRole, nombre, telefono);
      res.status(201).json(user);
    }
  } catch (e) {
    res.status(e.statusCode ?? 500).json({ error: e.message ?? "Error" });
  }
}


export async function login(req, res) {
  try {
    const validation = validateLoginBody(req.body);

    if (!validation.ok) {
      res.status(400).json({ error: validation.errors.join(", ") });
    } else {
      const { email, password } = validation.value;
      const result = await authService.login(email, password);
      res.json(result);
    }
  } catch (e) {
    res.status(e.statusCode ?? 500).json({ error: e.message ?? "Error" });
  }
}
