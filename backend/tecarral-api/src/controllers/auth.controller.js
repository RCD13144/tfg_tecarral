import * as authService from "../services/auth.service.js";

export async function register(req, res) {
  try {
    const { email, password, role, nombre, telefono } = req.body;

    const user = await authService.register(email, password, role ?? "tecnico", nombre, telefono);

    res.status(201).json(user);
  } catch (e) {
    res.status(e.statusCode ?? 500).json({ error: e.message ?? "Error" });
  }
}


export async function login(req, res) {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.json(result);
  } catch (e) {
    res.status(e.statusCode ?? 500).json({ error: e.message ?? "Error" });
  }
}
