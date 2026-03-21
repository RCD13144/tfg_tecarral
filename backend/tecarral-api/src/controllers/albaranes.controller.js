import * as albaranService from "../services/albaranes.service.js";
import { parseId, validateId } from "../schemas/common.schema.js";
import { validateFirmarAlbaranBody } from "../schemas/albaranes.schema.js";

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

    const idUser = Number(req.user?.id_user);

    if (!Number.isInteger(idUser) || idUser <= 0) {
      res.status(401).json({ error: "No autenticado" });
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