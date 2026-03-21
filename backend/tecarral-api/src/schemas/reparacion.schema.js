export function validateMarcarReparacionTerminadaBody(body) {
  const solucion = body?.solucion_aplicada;

  const errors = [];

  if (
    solucion !== undefined &&
    solucion !== null &&
    typeof solucion !== "string"
  ) {
    errors.push("solucion_aplicada debe ser texto o null");
  }

  if (typeof solucion === "string" && solucion.length > 2000) {
    errors.push(
      "solucion_aplicada no puede superar los 2000 caracteres"
    );
  }

  return {
    ok: errors.length === 0,
    errors,
    value: {
      solucion_aplicada:
        solucion === undefined ? null : solucion,
    },
  };
}