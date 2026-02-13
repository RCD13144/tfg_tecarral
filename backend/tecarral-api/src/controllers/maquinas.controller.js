import * as maquinaService from "../services/maquinaria.service.js";
import {
    validateId,
    validateTipoMaquina,
    validateSubtipoMaquina,
    validateAvailability,
    validateUbicacionType,
    validateMotorType,
    canonicalMotor,
    canonicalUbicacionType
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
        const ubicacion_type = normalize(req.query.ubicacion_type);
        const motor = normalize(req.query.motor);

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
                error = "Disponibilidad inválida";
            }
        }

        if (error === null && ubicacion_type !== undefined) {
            const okUbicacionType = validateUbicacionType(ubicacion_type);
            if (!okUbicacionType) {
                error = "Ubicación inválida";
            }
        }

        if (error === null && motor !== undefined) {
            const okMotorType = validateMotorType(motor);
            if (!okMotorType) {
                error = "Tipo de motor inválido";
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
                q,
                ubicacion_type,
                motor
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

export async function suggestModelo(req, res) {
    const text = req.query.text;

    if (!text || text.length < 2)
        return res.json([]);

    const suggestions = await maquinaService.suggestModeloFromDB(text);
    res.json(suggestions);
}

export async function suggestMarca(req, res) {
    const text = req.query.text;

    if (!text || text.length < 2)
        return res.json([]);

    const suggestions = await maquinaService.suggestMarcaFromDB(text);
    res.json(suggestions);
}

export async function suggestSubtipo(req, res) {
    const text = req.query.text;

    if (!text || text.length < 2)
        return res.json([]);

    const suggestions = await maquinaService.suggestSubtipoFromDB(text);
    res.json(suggestions);
}

export async function suggestNS(req, res) {
    const text = req.query.text;

    if (!text || text.length < 2)
        return res.json([]);

    const suggestions = await maquinaService.suggestNSfromDB(text);
    res.json(suggestions);
}

export async function suggestMotor(req, res) {
    const text = req.query.text;

    if (!text || text.length < 2)
        return res.json([]);

    const suggestions = await maquinaService.suggestMotorfromDB(text);
    res.json(suggestions);
}

export async function suggestTipo(req, res) {
    const text = req.query.text;

    if (!text || text.length < 2)
        return res.json([]);

    const suggestions = await maquinaService.suggestTipofromDB(text);
    res.json(suggestions);
}

export async function crearMaquina(req, res) {
    try {
        const {
            subtipo,
            marca,
            motor,
            modelo,
            ns,
            seguro,
            num_poliza,
            alquilada,
            ubicacion,
            observaciones,
            tipo,
            ubicacion_tipo

        } = req.body;

        let e = null;

        const subtipoOk = validateSubtipoMaquina(subtipo);
        const motorOk = validateMotorType(motor);
        const tipoOk = validateTipoMaquina(tipo);
        const ubicacion_tipoOk = validateUbicacionType(ubicacion_tipo);

        const ubicacionTipoCanon = canonicalUbicacionType(ubicacion_tipo);
        const motorCanon = canonicalMotor(motor);


        if (!subtipoOk || !motorOk || !tipoOk || !ubicacion_tipoOk) {
            e = "Tipo, subtipo, motor o tipo de ubicación inválido";
        } else {
            const maquina = await maquinaService.crearMaquinaIntoDB(
                subtipo,
                marca,
                motorCanon,
                modelo,
                ns,
                seguro,
                num_poliza,
                alquilada,
                ubicacion,
                observaciones,
                tipo,
                ubicacionTipoCanon
            );

            res.status(201).json(maquina);
        }
    } catch (e) {
        res.status(e.statusCode ?? 500).json({ error: e.message ?? "Error" });
    }


}

function toBooleanOrUndefined(value) {
    if (value === undefined || value === null) return undefined;
    if (typeof value === "boolean") return value;
    const s = String(value).trim().toLowerCase();
    if (s === "true") return true;
    if (s === "false") return false;
    return undefined;
}

export async function editarMaquinariaById(req, res) {
    try {
        const idParam = req.params.id;

        if (!validateId(idParam)) {
            res.status(400).json({ error: "Id inválido" });
            return;
        }

        const id = Number(idParam);

        const subtipoRaw = req.body.subtipo;
        const tipoRaw = req.body.tipo;
        const availabilityRaw = req.body.availability;

        const motorRaw = req.body.motor;
        const ubicacionTipoRaw = req.body.ubicacion_tipo;

        const marcaRaw = req.body.marca;
        const modeloRaw = req.body.modelo;
        const nsRaw = req.body.ns;

        const ubicacionRaw = req.body.ubicacion;
        const observacionesRaw = req.body.observaciones;

        const seguroRaw = req.body.seguro;
        const numPolizaRaw = req.body.num_poliza;
        const alquiladaRaw = req.body.alquilada;

        const subtipo = subtipoRaw === undefined ? undefined : String(subtipoRaw);
        const tipo = tipoRaw === undefined ? undefined : normalize(tipoRaw);
        const availability = availabilityRaw === undefined ? undefined : String(availabilityRaw);

        const motorNorm = motorRaw === undefined ? undefined : normalize(motorRaw);
        const ubicacionTipoNorm = ubicacionTipoRaw === undefined ? undefined : normalize(ubicacionTipoRaw);

        const marca = marcaRaw === undefined ? undefined : String(marcaRaw).trim();
        const modelo = modeloRaw === undefined ? undefined : String(modeloRaw).trim();
        const ns = nsRaw === undefined ? undefined : String(nsRaw).trim();

        const ubicacion = ubicacionRaw === undefined ? undefined : String(ubicacionRaw).trim();
        const observaciones = observacionesRaw === undefined ? undefined : String(observacionesRaw).trim();

        const seguro = toBooleanOrUndefined(seguroRaw);

        const num_poliza = numPolizaRaw === undefined ? undefined : numPolizaRaw;
        const alquilada = alquiladaRaw === undefined ? undefined : alquiladaRaw;

        let error = null;

        if (tipo !== undefined && !validateTipoMaquina(tipo)) {
            error = "Tipo inválido";
        }

        if (error === null && subtipo !== undefined && !validateSubtipoMaquina(subtipo)) {
            error = "Subtipo inválido";
        }

        if (error === null && availability !== undefined && !validateAvailability(availability)) {
            error = "Disponibilidad inválida";
        }

        if (error === null && ubicacionTipoNorm !== undefined && !validateUbicacionType(ubicacionTipoNorm)) {
            error = "Tipo de ubicación inválido";
        }

        if (error === null && motorNorm !== undefined && !validateMotorType(motorNorm)) {
            error = "Tipo de motor inválido";
        }

        if (error === null && seguroRaw !== undefined && seguro === undefined) {
            error = "Seguro inválido (usa true/false)";
        }

        if (error !== null) {
            res.status(400).json({ error });
            return;
        }

        
        const motorCanon = motorNorm === undefined ? undefined : canonicalMotor(motorNorm);
        const ubicacionTipoCanon = ubicacionTipoNorm === undefined ? undefined : canonicalUbicacionType(ubicacionTipoNorm);

        const patch = {
            subtipo,
            tipoMaquina: tipo,
            availability,
            motor: motorCanon,
            ubicacion_tipo: ubicacionTipoCanon,

            marca,
            modelo,
            ns,
            ubicacion,
            observaciones,

            seguro,
            num_poliza,
            alquilada
        };

        const updated = await maquinaService.editarMaquinariaByIdFromDB(id, patch);

        if (updated === null) {
            res.status(404).json({ error: "Máquina no encontrada" });
        } else {
            res.status(200).json(updated);
        }
    } catch (e) {
        res.status(e.statusCode ?? 500).json({ error: e.message ?? "Error" });
    }
}

export async function deleteMaquinariaById(req, res){
    try {
        const id = Number(req.params.id); 

        if (!validateId(id)) {
            return res.status(400).json({ error: "Id inválido" });
        }


        const deleted = maquinaService.deleteMaquinariaByIdFromDB(id); 
        
        if (!deleted) {
            return res.status(404).json({ error: "Máquina no encontrada" });
        }

        return res.status(204).send();
    } catch (e) {
        res.status(e.statusCode ?? 500).json({ error: e.message ?? "Error" });
    }
}


