import jwt from "jsonwebtoken";

export function signToken(payload) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET no definido");
  }

  const expiresIn = process.env.JWT_EXPIRES_IN || "8h";
  return jwt.sign(payload, secret, { expiresIn });
}


export function verifyToken(token) {
  const secret = process.env.JWT_SECRET;
  return jwt.verify(token, secret);
}
