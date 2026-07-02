export function validatePublicTokenParam(token) {
  const value = String(token ?? "").trim();
  const ok = /^[a-f0-9]{64}$/i.test(value);

  return {
    ok,
    token: ok ? value : null,
    errors: ok ? [] : ["token inválido"],
  };
}
