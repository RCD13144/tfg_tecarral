import { verifyToken } from "../utils/jwt.js";

export function requireAuth(req, res, next) {
  const header = req.headers.authorization;

  if (!header) {
    res.status(401).json({ error: "Falta Autorización" });
    return;
  }

  const parts = header.split(" ");
  const scheme = parts[0];
  const token = parts[1];

  if (scheme !== "Bearer" || !token) {
    res.status(401).json({ error: "Autorización inválida" });
    return;
  }

  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: "Token inválido o expirado" });
  }
}
