function safe(v) {
  return String(v ?? "").trim();
}

export function buildAlbaranFirmadoEmail(data) {
  const cliente = safe(data.cliente);
  const email = safe(data.email_cliente);

  const marca = safe(data?.maquina?.marca);
  const modelo = safe(data?.maquina?.modelo);
  const ns = safe(data?.maquina?.ns);

  const observaciones = safe(data.observaciones);

  const subject = `Albarán firmado - Propuesta #${data.propuesta_alquiler_id}`;

  const text =
    `Hola ${cliente},\n\n` +
    `Tu albarán ha sido firmado.\n\n` +
    `Máquina:\n- Marca: ${marca}\n- Modelo: ${modelo}\n- Nº Serie: ${ns}\n\n` +
    (observaciones ? `Observaciones:\n${observaciones}\n\n` : "") +
    `Gracias.\nTecarral\n`;

  const html =
    `<p>Hola <b>${cliente}</b>,</p>` +
    `<p>Tu albarán ha sido firmado.</p>` +
    `<h3>Máquina</h3>` +
    `<ul>` +
    `<li><b>Marca:</b> ${marca}</li>` +
    `<li><b>Modelo:</b> ${modelo}</li>` +
    `<li><b>Nº serie:</b> ${ns}</li>` +
    `</ul>` +
    (observaciones ? `<h3>Observaciones</h3><p>${observaciones}</p>` : "") +
    `<p>Gracias.<br/>Tecarral</p>`;

  return { to: email, subject, html, text };
}