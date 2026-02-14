import { formatDateES } from "../utils/formatters.js";

export function buildPropuestaEmailHtml({ cliente, maquinaLabel, fechaInicio, fechaFin, precio, url }) {
  const safe = (v) => String(v ?? "");

  return `
  <div style="font-family: Arial, sans-serif; line-height: 1.4">
    <h2>Propuesta de alquiler</h2>

    <p>Hola ${safe(cliente)},</p>

    <p>Te enviamos la propuesta de alquiler para la máquina <b>${safe(maquinaLabel)}</b>.</p>

    <ul>
      <li><b>Fecha inicio:</b> ${safe(formatDateES(fechaInicio))}</li>
      <li><b>Fecha fin:</b> ${safe(formatDateES(fechaFin))}</li>
      <li><b>Precio:</b> ${safe(precio)} €</li>
    </ul>

    <p>
      Para ver la propuesta y aceptar o rechazar, entra aquí:
      <br/>
      <a href="${safe(url)}">${safe(url)}</a>
    </p>

    <p style="color:#666; font-size: 12px">
      Este enlace caduca en 48 horas.
    </p>
  </div>
  `;
}

export function buildPropuestaEmailText({ cliente, maquinaLabel, fechaInicio, fechaFin, precio, url }) {
  return [
    `Hola ${cliente},`,
    "",
    `Te enviamos la propuesta de alquiler para la máquina ${maquinaLabel}.`,
    `Fecha inicio: ${formatDateES(fechaInicio)}`,
    `Fecha fin: ${formatDateES(fechaFin)}`,
    `Precio: ${precio} €`,
    "",
    `Ver y responder: ${url}`,
    "",
    "Este enlace caduca en 48 horas.",
  ].join("\n");
}
