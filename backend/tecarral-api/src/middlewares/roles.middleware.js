export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const userRole = String(req.user.role ?? "").trim().toLowerCase();
    const normalizedAllowedRoles = allowedRoles.map((role) =>
      String(role).trim().toLowerCase()
    );

    if (!normalizedAllowedRoles.includes(userRole)) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    next();
  };
}