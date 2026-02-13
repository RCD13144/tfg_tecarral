export function validateTokenParam(token) {
  const t = String(token ?? "").trim();

  const ok = /^[a-f0-9]{64}$/i.test(t);

  return {
    ok,
    token: ok ? t : null,
    errors: ok ? [] : ["token inválido"],
  };
}
