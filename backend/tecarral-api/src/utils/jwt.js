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
  return process.env.JWT_EXPIRES_IN || "8h";
}

function getFirstAccessJwtExpiresIn() {
  return process.env.JWT_FIRST_ACCESS_EXPIRES_IN || "8h";
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

export function signFirstAccessToken(payload) {
  const secret = getJwtSecret();

  return jwt.sign(
    {
      ...payload,
      purpose: "first-access",
    },
    secret,
    {
      algorithm: "HS256",
      expiresIn: getFirstAccessJwtExpiresIn(),
      issuer: getJwtIssuer(),
      audience: getJwtAudience(),
    }
  );
}

export function verifyToken(token) {
  const secret = getJwtSecret();

  return jwt.verify(token, secret, {
    algorithms: ["HS256"],
    issuer: getJwtIssuer(),
    audience: getJwtAudience(),
  });
}

export function verifyFirstAccessToken(token) {
  const payload = verifyToken(token);

  if (payload?.purpose !== "first-access") {
    const error = new Error("Token de primer acceso inválido o expirado");
    error.statusCode = 401;
    throw error;
  }

  return payload;
}
