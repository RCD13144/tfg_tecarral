import jwt from "jsonwebtoken";

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET no definido");
  }

  return secret;
}

function getJwtIssuer() {
  return process.env.JWT_ISSUER || "tecarral-api";
}

function getJwtAudience() {
  return process.env.JWT_AUDIENCE || "tecarral-app";
}

function getJwtExpiresIn() {
  return process.env.JWT_EXPIRES_IN || "15m";
}

export function signToken(payload) {
  const secret = getJwtSecret();

  return jwt.sign(payload, secret, {
    algorithm: "HS256",
    expiresIn: getJwtExpiresIn(),
    issuer: getJwtIssuer(),
    audience: getJwtAudience(),
  });
}

export function verifyToken(token) {
  const secret = getJwtSecret();

  return jwt.verify(token, secret, {
    algorithms: ["HS256"],
    issuer: getJwtIssuer(),
    audience: getJwtAudience(),
  });
}