import { verifyToken } from "../utils/jwt.js";
import { findUserById } from "../repositories/users.repository.js";

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization;

  if (!header) {
    res.status(401).json({ error: "Falta autorización" });
    return;
  }

  const parts = header.split(" ");

  if (parts.length !== 2) {
    res.status(401).json({ error: "Autorización inválida" });
    return;
  }

  const scheme = String(parts[0]).trim().toLowerCase();
  const token = String(parts[1] ?? "").trim();

  if (scheme !== "bearer" || !token) {
    res.status(401).json({ error: "Autorización inválida" });
    return;
  }

  try {
    const payload = verifyToken(token);

    if (!payload || typeof payload !== "object") {
      res.status(401).json({ error: "Token inválido" });
      return;
    }

    const userId = payload.sub;

    if (!userId) {
      res.status(401).json({ error: "Token inválido o incompleto" });
      return;
    }

    const user = await findUserById(userId);

    if (!user) {
      res.status(401).json({ error: "Usuario no encontrado" });
      return;
    }

    if (user.is_active === false) {
      res.status(401).json({ error: "Usuario dado de baja" });
      return;
    }

    req.user = {
      id_user: user.id_user,
      email: user.email,
      role: user.role,
      nombre: user.nombre,
      telefono: user.telefono,
      is_active: user.is_active,
    };

    next();
  } catch {
    res.status(401).json({ error: "Token inválido o expirado" });
  }
}
