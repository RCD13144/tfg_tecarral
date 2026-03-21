import { firmarAlbaranTx } from "../repositories/albaranes.repository.js";
import { sendMail } from "../utils/mailer.js";
import { buildAlbaranFirmadoEmail } from "../templates/albaranFirmadoEmail.template.js";

function base64ToBuffer(input) {
  const s = String(input ?? "").trim();
  const parts = s.split("base64,");
  const b64 = parts.length === 2 ? parts[1] : s;
  return Buffer.from(b64, "base64");
}

export async function firmarAlbaranIntoDB(idAlbaran, payload) {
  const firmaCliente = base64ToBuffer(payload.firmaClienteBase64);
  const firmaTecnico = base64ToBuffer(payload.firmaTecnicoBase64);

  if (!firmaCliente || firmaCliente.length === 0) {
    const err = new Error("Firma cliente inválida");
    err.statusCode = 400;
    throw err;
  }

  if (!firmaTecnico || firmaTecnico.length === 0) {
    const err = new Error("Firma técnico inválida");
    err.statusCode = 400;
    throw err;
  }

  const dbResult = await firmarAlbaranTx({
    idAlbaran,
    idUser: payload.idUser,
    observaciones: payload.observaciones ?? null,
    firmaCliente,
    firmaTecnico,
    firmaClienteMime: "image/png",
    firmaTecnicoMime: "image/png",
  });

  let emailSent = false;
  let emailError = null;

  try {
    const mail = buildAlbaranFirmadoEmail(dbResult);

    if (mail.to) {
      await sendMail(mail);
      emailSent = true;
    }
  } catch (e) {
    emailSent = false;
    emailError = e?.message ?? "Error enviando email";
  }

  return {
    id_albaran: dbResult.id_albaran,
    estado: dbResult.estado,
    firmado: dbResult.firmado,
    maintenance_status: dbResult.maintenance_status,
    reparacion_paso_a_pendiente_presupuesto: dbResult.reparacion_paso_a_pendiente_presupuesto,
    email_sent: emailSent,
    email_error: emailError,
  };
}