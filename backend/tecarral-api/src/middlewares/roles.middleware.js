export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401).json({ error: "No autenticado" });
      return;
    }

    const userRole = String(req.user.role ?? "").trim().toLowerCase();

    const normalizedAllowedRoles = allowedRoles.map((role) => {
      return String(role).trim().toLowerCase();
    });

    const hasRequiredRole = normalizedAllowedRoles.includes(userRole);

    if (!hasRequiredRole) {
      res.status(403).json({ error: "No autorizado" });
      return;
    }

    next();
  };
}
