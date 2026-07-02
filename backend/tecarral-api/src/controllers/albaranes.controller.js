import * as albaranService from "../services/albaranes.service.js";
import { parseId, validateId } from "../schemas/common.schema.js";
import {
  validateAlbaranEstadoQuery,
  validateFirmarAlbaranBody,
} from "../schemas/albaranes.schema.js";

function getAuthUserId(req, res) {
  const idUser = Number(req.user?.id_user);

  if (!Number.isInteger(idUser) || idUser <= 0) {
    res.status(401).json({ error: "No autenticado" });
    return null;
  }

  return idUser;
}

export async function getAlbaranes(req, res) {
  try {
    const idUser = getAuthUserId(req, res);

    if (idUser === null) {
      return;
    }

    const estado = req.query?.estado;

    if (!validateAlbaranEstadoQuery(estado)) {
      res.status(400).json({ error: "Estado de albarán inválido" });
      return;
    }

    const albaranes = await albaranService.getAlbaranes({
      idUser,
      estado: typeof estado === "string" ? estado.trim().toUpperCase() : null,
    });

    res.status(200).json(albaranes);
  } catch (e) {
    res.status(e.statusCode ?? 500).json({ error: e.message ?? "Error", meta: e.meta });
  }
}

export async function getAlbaranById(req, res) {
  try {
    const idAlbaran = parseId(req.params.id);

    if (!validateId(idAlbaran)) {
      res.status(400).json({ error: "Id de albarán inválido" });
      return;
    }

    const idUser = getAuthUserId(req, res);

    if (idUser === null) {
      return;
    }

    const albaran = await albaranService.getAlbaranDetail({
      idAlbaran,
      idUser,
    });

    res.status(200).json(albaran);
  } catch (e) {
    res.status(e.statusCode ?? 500).json({ error: e.message ?? "Error", meta: e.meta });
  }
}

export async function getAlbaranPdf(req, res) {
  try {
    const idAlbaran = parseId(req.params.id);

    if (!validateId(idAlbaran)) {
      res.status(400).json({ error: "Id de albarán inválido" });
      return;
    }

    const idUser = getAuthUserId(req, res);
    if (idUser === null) return;

    const pdf = await albaranService.getAlbaranPdf({ idAlbaran, idUser });
    const disposition = req.query?.download === "1" ? "attachment" : "inline";
    const safeFilename = String(pdf.filename).replace(/["\r\n]/g, "");

    res.setHeader("Content-Type", pdf.mimeType);
    res.setHeader("Content-Disposition", `${disposition}; filename="${safeFilename}"`);
    res.setHeader("Content-Length", pdf.content.length);
    if (pdf.sha256) res.setHeader("X-Document-SHA256", pdf.sha256);
    res.status(200).send(pdf.content);
  } catch (e) {
    res.status(e.statusCode ?? 500).json({ error: e.message ?? "Error", meta: e.meta });
  }
}

export async function firmarAlbaran(req, res) {
  try {
    const idAlbaran = parseId(req.params.id);

    const okId = validateId(idAlbaran);

    if (!okId) {
      res.status(400).json({ error: "Id de albarán inválido" });
      return;
    }

    const okBody = validateFirmarAlbaranBody(req.body);

    if (!okBody) {
      res.status(400).json({ error: "Body inválido para firmar albarán" });
      return;
    }

    const idUser = getAuthUserId(req, res);

    if (idUser === null) {
      return;
    }

    const result = await albaranService.firmarAlbaranIntoDB(idAlbaran, {
      idUser,
      observaciones: req.body?.observaciones ?? null,
      firmaClienteBase64: req.body.firma_cliente_base64,
      firmaTecnicoBase64: req.body.firma_tecnico_base64,
    });

    res.status(200).json(result);
  } catch (e) {
    res.status(e.statusCode ?? 500).json({ error: e.message ?? "Error", meta: e.meta });
  }
}
