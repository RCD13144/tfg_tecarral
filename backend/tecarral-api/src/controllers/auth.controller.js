import * as authService from "../services/auth.service.js";
import {
  validateLoginBody,
  validateChangeTemporaryPasswordBody,
} from "../schemas/auth.schema.js";

export async function login(req, res) {
  try {
    const validation = validateLoginBody(req.body);

    if (!validation.ok) {
      res.status(400).json({ error: validation.errors.join(", ") });
    } else {
      const { email, password } = validation.value;
      const result = await authService.login(email, password);
      res.status(200).json(result);
    }
  } catch (e) {
    res.status(e.statusCode ?? 500).json({ error: e.message ?? "Error" });
  }
}

export async function changeTemporaryPassword(req, res) {
  try {
    const validation = validateChangeTemporaryPasswordBody(req.body);

    if (!validation.ok) {
      res.status(400).json({ error: validation.errors.join(", ") });
      return;
    }

    const authHeader = String(req.headers.authorization ?? "").trim();
    const [scheme, token] = authHeader.split(" ");

    if (scheme?.toLowerCase() !== "bearer" || !token) {
      res.status(401).json({
        error: "Token de primer acceso inválido o expirado",
      });
      return;
    }

    const { newPassword } = validation.value;
    const result = await authService.changeTemporaryPassword(token, newPassword);

    res.status(200).json(result);
  } catch (e) {
    res.status(e.statusCode ?? 500).json({ error: e.message ?? "Error" });
  }
}
