import * as propuestaService from "../services/propuesta.service.js";
import { validatePropuestaCreate, validatePropuestaUpdate, validateExpireQuery } from "../schemas/propuesta.schema.js";
import { validateId, parseId } from "../schemas/common.schema.js";

export async function getPropuestas(req, res) {
  try {
    const propuestas = await propuestaService.getPropuestas({
      id_maquina: req.query?.id_maquina,
    });

    res.status(200).json(propuestas);
  } catch (e) {
    res.status(e.statusCode ?? 500).json({ error: e.message ?? "Error" });
  }
}

export async function crearPropuesta(req, res) {
  try {
    const body = req.body;

    const validation = validatePropuestaCreate(body);

    if (!validation) {
      res.status(400).json({ error: "Máquina, email o telefono inválidos" });
    } else {
      const propuesta = await propuestaService.crearPropuestaIntoDB(body);
      res.status(201).json(propuesta);
    }
  } catch (e) {
    const status = e.statusCode ?? 500;

    if (e.code === "MAQUINA_UNAVAILABLE") {
      res.status(status).json({
        error: e.message,
        code: e.code,
        maquina: e.details,
      });
      return;
    }

    if (e.code === "MAQUINA_NOT_FOUND") {
      res.status(status).json({ error: e.message, code: e.code });
      return;
    }

    res.status(status).json({ error: e.message ?? "Error" });
  }
}


export async function editarPropuesta(req, res) {
  try {
    const idParam = req.params.id;

    if (!validateId(idParam)) {
      res.status(400).json({ error: "Id inválido" });
      return;
    }

    const id = parseId(idParam);

    const validation = validatePropuestaUpdate(req.body);
    if (!validation.ok) {
      res.status(400).json({
        error: "Datos inválidos",
        details: validation.errors,
      });
      return;
    }

    const updated = await propuestaService.editarPropuesta(id, validation.data);

    res.status(200).json(updated);
  } catch (e) {
    res.status(e.statusCode ?? 500).json({ error: e.message ?? "Error" });
  }
}

export async function deletePropuesta(req, res) {
  try {
    const idParam = req.params.id;

    if (!validateId(idParam)) {
      res.status(400).json({ error: "Id inválido" });
      return;
    }

    const id = parseId(idParam);

    const deleted = await propuestaService.deletePropuestaFromDB(id);

    if (!deleted) {
      return res.status(404).json({ error: "Propuesta no encontrada" });
    }

    return res.status(204).send();

  } catch (e) {
    res.status(e.statusCode ?? 500).json({ error: e.message ?? "Error" });
  }
}

export async function expirePropuestas(req, res) {
  try {
    const validation = validateExpireQuery(req.query);

    if (!validation.ok) {
      res.status(400).json({ error: "Parámetros inválidos", details: validation.errors });
      return;
    }

    const result = await propuestaService.expirePropuestasAndRecompute(validation.data);

    res.status(200).json(result);
  } catch (e) {
    res.status(e.statusCode ?? 500).json({ error: e.message ?? "Error" });
  }
}


