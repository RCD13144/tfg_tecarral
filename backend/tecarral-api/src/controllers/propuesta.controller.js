import * as propuestaService from "../services/propuesta.service.js";
import { validatePropuestaCreate, validatePropuestaUpdate } from "../schemas/propuesta.schema.js";
import { validateId, parseId } from "../schemas/common.schema.js";

export async function crearPropuesta(req, res) {
  try {
    const validation = validatePropuestaCreate(req.body);

    if (!validation.ok) {
      res.status(400).json({
        error: "Datos inválidos",
        details: validation.errors,
      });
      return;
    }

    const propuesta = await propuestaService.crearPropuesta(validation.data);

    res.status(201).json(propuesta);
  } catch (e) {
    res.status(e.statusCode ?? 500).json({ error: e.message ?? "Error" });
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

