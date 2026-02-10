import * as maquinaService from "../services/maquinaria.service.js";
import {
    validateId,
    validateTipoMaquina,
    validateSubtipoMaquina,
    validateAvailability
} from "../schemas/maquina.schema.js";

import { normalize } from "../utils/normalize.js";

export async function getMaquinaria(req, res) {
    try {
        const tipo = normalize(req.query.tipo);
        const subtipo = normalize(req.query.subtipo);
        const availability = normalize(req.query.availability);
        const ubicacion = normalize(req.query.ubicacion);
        const marca = normalize(req.query.marca);
        const q = normalize(req.query.q);


        let error = null;

        if (tipo !== undefined) {
            const okTipo = validateTipoMaquina(tipo);
            if (!okTipo) {
                error = "Tipo inválido";
            }
        }

        if (error === null && subtipo !== undefined) {
            const okSubtipo = validateSubtipoMaquina(subtipo);
            if (!okSubtipo) {
                error = "Subtipo inválido";
            }
        }

        if (error === null && availability !== undefined) {
            const okAvailability = validateAvailability(availability);
            if (!okAvailability) {
                error = "Availability inválida";
            }
        }

        if (error !== null) {
            res.status(400).json({ error });
        } else {
            const maquinas = await maquinaService.getMaquinaria({
                tipoMaquina: tipo,
                subtipo,
                availability,
                ubicacion, 
                marca, 
                q
            });

            res.status(200).json(maquinas);
        }
    } catch (e) {
        res.status(e.statusCode ?? 500).json({ error: e.message ?? "Error" });
    }
}

export async function getMaquinariaById(req, res) {
    try {
        const idParam = req.params.id;

        if (!validateId(idParam)) {
            res.status(400).json({ error: "Id inválido" });
        } else {
            const id = Number(idParam);
            const maquina = await maquinaService.getMaquinaById(id);

            if (maquina === null) {
                res.status(404).json({ error: "Máquina no encontrada" });
            } else {
                res.status(200).json(maquina);
            }
        }
    } catch (e) {
        res.status(e.statusCode ?? 500).json({ error: e.message ?? "Error" });
    }
}
