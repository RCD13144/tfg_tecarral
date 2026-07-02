import * as maquinaService from "../services/maquinaria.service.js";
import {
    validateTipoMaquina,
    validateSubtipoMaquina,
    validateAvailability,
    validateUbicacionType,
    validateMotorType,
    validateOwnershipType,
    canonicalMotor,
    canonicalUbicacionType,
    canonicalOwnershipType,
    validateRecomputeQuery,
    UBICACION_TIPO_DESTINO
} from "../schemas/maquina.schema.js";

import { normalize } from "../utils/normalize.js";
import { validateId, parseId } from "../schemas/common.schema.js";
import { UBICACION_TIPO } from "../constants/ubicacionesTipo.js";
import { validateMaintenanceStatusPatch } from "../schemas/maquina.schema.js";
import {
  validateAbrirIncidenciaBody,
  validateEscalarAveriaGraveBody,
} from "../schemas/maquina.schema.js";

function readNormalizedQueryValues(query, key) {
    const rawValue = query?.[key];

    if (rawValue === undefined) {
        return undefined;
    }

    const values = Array.isArray(rawValue) ? rawValue : [rawValue];
    const normalizedValues = values
        .map((value) => normalize(value))
        .filter((value) => value !== undefined);

    return normalizedValues.length > 0 ? normalizedValues : undefined;
}

export async function getMaquinaria(req, res) {
    try {
        const tipo = readNormalizedQueryValues(req.query, "tipo");
        const subtipo = readNormalizedQueryValues(req.query, "subtipo");
        const availability = readNormalizedQueryValues(req.query, "availability");
        const ubicacion = normalize(req.query.ubicacion);
        const marca = readNormalizedQueryValues(req.query, "marca");
        const q = normalize(req.query.q);
        const ubicacion_type = readNormalizedQueryValues(req.query, "ubicacion_type");
        const motor = readNormalizedQueryValues(req.query, "motor");
        const ownership_type = readNormalizedQueryValues(req.query, "ownership_type");

        let error = null;

        if (tipo !== undefined) {
            const okTipo = tipo.every((value) => validateTipoMaquina(value));
            if (!okTipo) {
                error = "Tipo inválido";
            }
        }

        if (error === null && subtipo !== undefined) {
            const okSubtipo = subtipo.every((value) => validateSubtipoMaquina(value));
            if (!okSubtipo) {
                error = "Subtipo inválido";
            }
        }

        if (error === null && availability !== undefined) {
            const okAvailability = availability.every((value) => validateAvailability(value));
            if (!okAvailability) {
                error = "Disponibilidad inválida";
            }
        }

        if (error === null && ubicacion_type !== undefined) {
            const okUbicacionType = ubicacion_type.every((value) => validateUbicacionType(value));
            if (!okUbicacionType) {
                error = "Ubicación inválida";
            }
        }

        if (error === null && motor !== undefined) {
            const okMotorType = motor.every((value) => validateMotorType(value));
            if (!okMotorType) {
                error = "Tipo de motor inválido";
            }
        }

        if (error === null && ownership_type !== undefined) {
            const okOwnership = ownership_type.every((value) => validateOwnershipType(value));
            if (!okOwnership) {
                error = "Tipo de propiedad inválido";
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
                motor,
                ownership_type: ownership_type?.map((value) => canonicalOwnershipType(value) ?? value),
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

export async function uploadMaquinaImage(req, res) {
    try {
        const idParam = req.params.id;

        if (!validateId(idParam)) {
            res.status(400).json({ error: "Id inválido" });
            return;
        }

        const fileBuffer = Buffer.isBuffer(req.body) ? req.body : null;

        if (!fileBuffer || fileBuffer.length === 0) {
            res.status(400).json({ error: "No se ha recibido ninguna imagen" });
            return;
        }

        const idMaquina = Number(idParam);
        const updatedMachine = await maquinaService.uploadMachineImage(idMaquina, {
            buffer: fileBuffer,
            fileName: req.headers["x-file-name"],
            mimeType: req.headers["content-type"],
        });

        res.status(200).json(updatedMachine);
    } catch (e) {
        res.status(e.statusCode ?? 500).json({ error: e.message ?? "Error" });
    }
}

export async function suggestIdMaquina(req, res) {
    const text = req.query.text;

    if (!text || text.length < 1)
        return res.json([]);

    const suggestions = await maquinaService.suggestIdMaquinaFromDB(text);
    res.json(suggestions);
}

export async function crearMaquina(req, res) {
    try {
        const body = req.body ?? {};
        const {
            subtipo,
            marca,
            motor,
            modelo,
            ns,
            seguro,
            num_poliza,
            ubicacion,
            observaciones,
            tipo,
            ownership_type,
        } = body;

        let e = null;

        const marcaTrim = String(marca ?? "").trim();
        const modeloTrim = String(modelo ?? "").trim();
        const nsTrim = String(ns ?? "").trim();

        const subtipoOk = subtipo === undefined || subtipo === null || subtipo === ""
          ? true
          : validateSubtipoMaquina(subtipo);
        const motorOk = motor === undefined || motor === null || motor === ""
          ? true
          : validateMotorType(motor);
        const tipoOk = tipo === undefined || tipo === null || tipo === ""
          ? true
          : validateTipoMaquina(tipo);
        const ownershipOk = ownership_type === undefined || ownership_type === null || ownership_type === ""
          ? true
          : validateOwnershipType(ownership_type);

        if (marcaTrim.length === 0 || modeloTrim.length === 0 || nsTrim.length === 0) {
            e = "Marca, modelo y numero de serie son obligatorios";
        } else if (!subtipoOk || !motorOk || !tipoOk || !ownershipOk) {
            e = "Tipo, subtipo, motor o propiedad inválidos";
        } else {
            const motorCanon = motor ? canonicalMotor(motor) : null;
            const ownershipCanon = ownership_type ? canonicalOwnershipType(ownership_type) : "TECARRAL";
            const ubicacionTrim = String(ubicacion ?? "").trim();
            const ubicacionTipoCanon = ownershipCanon === "CLIENTE" ? "CLIENTE" : "TALLER";

            if (ownershipCanon === "CLIENTE" && ubicacionTrim.length === 0) {
                res.status(400).json({ error: "La ubicación operativa de la máquina del cliente es obligatoria" });
                return;
            }

            const toNullableNumber = (value) => {
                if (value === undefined || value === null || value === "") return null;
                const numericValue = Number(value);
                return Number.isFinite(numericValue) ? numericValue : null;
            };

            const toNullableBoolean = (value) => {
                if (value === undefined || value === null || value === "") return null;
                if (typeof value === "boolean") return value;
                const normalized = String(value).trim().toLowerCase();
                if (normalized === "true") return true;
                if (normalized === "false") return false;
                return null;
            };

            const maquina = await maquinaService.crearMaquinaIntoDB({
                subtipo: subtipo ?? null,
                marca: marcaTrim,
                motor: motorCanon,
                modelo: modeloTrim,
                ns: nsTrim,
                seguro: seguro ?? null,
                num_poliza: num_poliza ?? null,
                ubicacion: ubicacionTrim || null,
                observaciones: observaciones ?? null,
                tipo: tipo ?? null,
                ubicacion_tipo: ubicacionTipoCanon,
                ownership_type: ownershipCanon,
                owner_cliente_nombre: body.owner_cliente_nombre ?? null,
                owner_cliente_email: body.owner_cliente_email ?? null,
                owner_cliente_telefono: body.owner_cliente_telefono ?? null,
                owner_cliente_direccion: body.owner_cliente_direccion ?? null,
                owner_cliente_poblacion: body.owner_cliente_poblacion ?? null,
                owner_cliente_cp: body.owner_cliente_cp ?? null,
                ubicacion_operativa_direccion: body.ubicacion_operativa_direccion ?? null,
                ubicacion_operativa_poblacion: body.ubicacion_operativa_poblacion ?? null,
                ubicacion_operativa_cp: body.ubicacion_operativa_cp ?? null,
                elev_ruedas: body.elev_ruedas ?? null,
                elev_cap_carga: body.elev_cap_carga ?? null,
                elev_replegado_mm: toNullableNumber(body.elev_replegado_mm),
                elev_elevacion_libre: toNullableBoolean(body.elev_elevacion_libre),
                elev_elevacion: body.elev_elevacion ?? null,
                elev_desplazamiento: body.elev_desplazamiento ?? null,
                elev_posicion: body.elev_posicion ?? null,
                elev_antihuella: body.elev_antihuella ?? null,
                elev_matricula: body.elev_matricula ?? null,
                elev_largo: toNullableNumber(body.elev_largo),
                elev_alto: toNullableNumber(body.elev_alto),
                elev_ancho: toNullableNumber(body.elev_ancho),
                elev_peso_kg: toNullableNumber(body.elev_peso_kg),
                elev_horquillas: body.elev_horquillas ?? null,
            });

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

function toNumberOrUndefined(value) {
    if (value === undefined || value === null || value === "") return undefined;
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : undefined;
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
        const ownershipTypeRaw = req.body.ownership_type;

        const marcaRaw = req.body.marca;
        const modeloRaw = req.body.modelo;
        const nsRaw = req.body.ns;

        const ubicacionRaw = req.body.ubicacion;
        const observacionesRaw = req.body.observaciones;

        const seguroRaw = req.body.seguro;
        const numPolizaRaw = req.body.num_poliza;
        const subtipo = subtipoRaw === undefined ? undefined : String(subtipoRaw);
        const tipo = tipoRaw === undefined ? undefined : normalize(tipoRaw);
        const availability = availabilityRaw === undefined ? undefined : String(availabilityRaw);

        const motorNorm = motorRaw === undefined ? undefined : normalize(motorRaw);
        const ubicacionTipoNorm = ubicacionTipoRaw === undefined ? undefined : normalize(ubicacionTipoRaw);
        const ownershipTypeNorm = ownershipTypeRaw === undefined ? undefined : normalize(ownershipTypeRaw);

        const marca = marcaRaw === undefined ? undefined : String(marcaRaw).trim();
        const modelo = modeloRaw === undefined ? undefined : String(modeloRaw).trim();
        const ns = nsRaw === undefined ? undefined : String(nsRaw).trim();

        const ubicacion = ubicacionRaw === undefined ? undefined : String(ubicacionRaw).trim();
        const observaciones = observacionesRaw === undefined ? undefined : String(observacionesRaw).trim();

        const seguro = toBooleanOrUndefined(seguroRaw);

        const num_poliza = numPolizaRaw === undefined ? undefined : numPolizaRaw;
        const elev_elevacion_libre = toBooleanOrUndefined(req.body.elev_elevacion_libre);
        const elev_antihuella = toBooleanOrUndefined(req.body.elev_antihuella);

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

        if (error === null && ownershipTypeNorm !== undefined && !validateOwnershipType(ownershipTypeNorm)) {
            error = "Tipo de propiedad inválido";
        }

        if (error === null && seguroRaw !== undefined && seguro === undefined) {
            error = "Seguro inválido (usa true/false)";
        }

        if (error === null && req.body.elev_elevacion_libre !== undefined && elev_elevacion_libre === undefined) {
            error = "Elevación libre inválida (usa true/false)";
        }

        if (error === null && req.body.elev_antihuella !== undefined && elev_antihuella === undefined) {
            error = "Antihuella inválida (usa true/false)";
        }

        if (error !== null) {
            res.status(400).json({ error });
            return;
        }


        const motorCanon = motorNorm === undefined ? undefined : canonicalMotor(motorNorm);
        const ubicacionTipoCanon = ubicacionTipoNorm === undefined ? undefined : canonicalUbicacionType(ubicacionTipoNorm);
        const ownershipTypeCanon = ownershipTypeNorm === undefined ? undefined : canonicalOwnershipType(ownershipTypeNorm);

        const patch = {
            subtipo,
            tipoMaquina: tipo,
            availability,
            motor: motorCanon,
            ubicacion_tipo: ubicacionTipoCanon,
            ownership_type: ownershipTypeCanon,

            marca,
            modelo,
            ns,
            ubicacion,
            observaciones,
            owner_cliente_nombre: req.body.owner_cliente_nombre === undefined ? undefined : String(req.body.owner_cliente_nombre).trim(),
            owner_cliente_email: req.body.owner_cliente_email === undefined ? undefined : String(req.body.owner_cliente_email).trim(),
            owner_cliente_telefono: req.body.owner_cliente_telefono === undefined ? undefined : String(req.body.owner_cliente_telefono).trim(),
            owner_cliente_direccion: req.body.owner_cliente_direccion === undefined ? undefined : String(req.body.owner_cliente_direccion).trim(),
            owner_cliente_poblacion: req.body.owner_cliente_poblacion === undefined ? undefined : String(req.body.owner_cliente_poblacion).trim(),
            owner_cliente_cp: req.body.owner_cliente_cp === undefined ? undefined : String(req.body.owner_cliente_cp).trim(),
            ubicacion_operativa_direccion: req.body.ubicacion_operativa_direccion === undefined ? undefined : String(req.body.ubicacion_operativa_direccion).trim(),
            ubicacion_operativa_poblacion: req.body.ubicacion_operativa_poblacion === undefined ? undefined : String(req.body.ubicacion_operativa_poblacion).trim(),
            ubicacion_operativa_cp: req.body.ubicacion_operativa_cp === undefined ? undefined : String(req.body.ubicacion_operativa_cp).trim(),

            seguro,
            num_poliza,
            elev_ruedas: req.body.elev_ruedas === undefined ? undefined : String(req.body.elev_ruedas).trim(),
            elev_cap_carga: req.body.elev_cap_carga === undefined ? undefined : String(req.body.elev_cap_carga).trim(),
            elev_replegado_mm: toNumberOrUndefined(req.body.elev_replegado_mm),
            elev_elevacion_libre,
            elev_elevacion: req.body.elev_elevacion === undefined ? undefined : String(req.body.elev_elevacion).trim(),
            elev_desplazamiento: req.body.elev_desplazamiento === undefined ? undefined : String(req.body.elev_desplazamiento).trim(),
            elev_posicion: req.body.elev_posicion === undefined ? undefined : String(req.body.elev_posicion).trim(),
            elev_antihuella,
            elev_matricula: req.body.elev_matricula === undefined ? undefined : String(req.body.elev_matricula).trim(),
            elev_largo: toNumberOrUndefined(req.body.elev_largo),
            elev_alto: toNumberOrUndefined(req.body.elev_alto),
            elev_ancho: toNumberOrUndefined(req.body.elev_ancho),
            elev_peso_kg: toNumberOrUndefined(req.body.elev_peso_kg),
            elev_horquillas: req.body.elev_horquillas === undefined ? undefined : String(req.body.elev_horquillas).trim(),
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

export async function deleteMaquinariaById(req, res) {
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


export async function markDelivered(req, res) {
    try {
        const idParam = req.params.id;

        if (!validateId(idParam)) {
            res.status(400).json({ error: "Id inválido" });
            return;
        }

        const idMaquina = parseId(idParam);

        const result = await maquinaService.markDelivered(idMaquina);

        if (!result.ok) {
            res.status(409).json({ error: "No existe propuesta aceptada para esta máquina" });
            return;
        }

        res.status(200).json(result);
    } catch (e) {
        res.status(e.statusCode ?? 500).json({ error: e.message ?? "Error" });
    }
}

export async function marcarUbicacion(req, res, ubicacionTipo) {
  try {
    const idParam = req.params.id;

    if (!validateId(idParam)) {
      res.status(400).json({ error: "Id inválido" });
    } else {
      const idMaquina = parseId(idParam);

      const result = await maquinaService.marcarRecibidaEnBase(idMaquina, ubicacionTipo);

        if (!result.ok) {
          if (result.reason === "NOT_FOUND") {
          res.status(404).json({ error: "Máquina no encontrada" });
        } else if (result.reason === "NOT_IN_TRANSITO") {
          res.status(409).json({ error: "La máquina debe estar en TRANSITO para marcar TALLER/ALMACEN" });
        } else if (result.reason === "REPAIR_RETURN_REQUIRES_CLIENT_DELIVERY") {
          res.status(409).json({
            error:
              "La máquina está en tránsito por reparación terminada y debe entregarse al cliente",
          });
        } else if (result.reason === "NOT_SEVERE_BREAKDOWN") {
          res.status(409).json({
            error:
              "Solo se puede recibir en TALLER/ALMACEN desde TRANSITO cuando la máquina está en AVERIADA_GRAVE",
          });
        } else if (result.reason === "ALBARAN_NOT_SIGNED") {
          res.status(409).json({
            error:
              "No se puede marcar TALLER/ALMACEN hasta que el albarán de la avería grave esté firmado",
          });
        } else {
          res.status(409).json({ error: "Operación no permitida" });
        }
      } else {
        res.status(200).json(result.data);
      }
    }
  } catch (e) {
    res.status(e.statusCode ?? 500).json({ error: e.message ?? "Error" });
  }
}

export async function marcarUbicacionTaller(req, res) {
  await marcarUbicacion(req, res, UBICACION_TIPO.TALLER);
}

export async function marcarUbicacionAlmacen(req, res) {
  await marcarUbicacion(req, res, UBICACION_TIPO.ALMACEN);
}

export async function recomputeLogistics(req, res) {
  try {
    const validation = validateRecomputeQuery(req.query);

    if (!validation.ok) {
      res.status(400).json({ error: "Parámetros inválidos", details: validation.errors });
    } else {
      const result = await maquinaService.recomputeLogisticsByEndedRentals(validation.data);
      res.status(200).json(result);
    }
  } catch (e) {
    res.status(e.statusCode ?? 500).json({ error: e.message ?? "Error" });
  }
}

async function mover(req, res, destino) {
  try {
    const idParam = req.params.id;

    if (!validateId(idParam)) {
      res.status(400).json({ error: "Id inválido" });
    } else {
      const idMaquina = parseId(idParam);

      const result = await maquinaService.moverEntreBases(idMaquina, destino);

      if (!result.ok) {
        if (result.reason === "NOT_FOUND") {
          res.status(404).json({ error: "Máquina no encontrada" });
        } else if (result.reason === "RENTED") {
          res.status(409).json({ error: "No se puede mover: la máquina está ALQUILADA" });
        } else if (result.reason === "MOVE_NOT_ALLOWED") {
          res.status(409).json({
            error:
              "No se puede mover esta máquina a otra base desde su ubicación o estado actual",
          });
        } else {
          res.status(409).json({ error: "Operación no permitida" });
        }
      } else {
        res.status(200).json(result.data);
      }
    }
  } catch (e) {
    res.status(e.statusCode ?? 500).json({ error: e.message ?? "Error" });
  }
}

export async function moverATaller(req, res) {
  await mover(req, res, UBICACION_TIPO_DESTINO.TALLER);
}

export async function moverAAlmacen(req, res) {
  await mover(req, res, UBICACION_TIPO_DESTINO.ALMACEN);
}

export async function getMaquinaById(req, res) {
  try {
    const idParam = req.params.id;

    if (!validateId(idParam)) {
      res.status(400).json({ error: "Id inválido" });
    } else {
      const idMaquina = parseId(idParam);
      const maquina = await maquinaService.getMaquinaById(idMaquina);

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

export async function cambiarMaintenanceStatus(req, res, next) {
  try {
    const idMaquina = Number(req.params.id);

    if (!Number.isInteger(idMaquina) || idMaquina <= 0) {
      const err = new Error("ID de máquina inválido");
      err.statusCode = 400;
      throw err;
    }

    const ok = validateMaintenanceStatusPatch(req.body);

    if (!ok) {
      const err = new Error("maintenance_status inválido");
      err.statusCode = 400;
      throw err;
    }

    const maintenanceStatus = req.body.maintenance_status;

    const result = await maquinaService.cambiarMaintenanceStatus(idMaquina, maintenanceStatus);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function abrirIncidencia(req, res) {
  try {
    const idMaquina = Number(req.params.id);

    if (!Number.isInteger(idMaquina) || idMaquina <= 0) {
      const err = new Error("ID de máquina inválido");
      err.statusCode = 400;
      throw err;
    }

    const ok = validateAbrirIncidenciaBody(req.body);

    if (!ok) {
      const err = new Error("Body inválido para abrir incidencia");
      err.statusCode = 400;
      throw err;
    }

    const idUser = Number(req.user?.id_user);

    if (!Number.isInteger(idUser) || idUser <= 0) {
      const err = new Error("No autenticado");
      err.statusCode = 401;
      throw err;
    }

    const {
      maintenance_status,
      propuesta_alquiler_id,
      service_context_type,
      service_context_id,
      service_case_type,
      comentario,
      fault_cause,
    } = req.body;

    const propuestaAlquilerId =
      propuesta_alquiler_id === undefined || propuesta_alquiler_id === null
        ? null
        : Number(propuesta_alquiler_id);
    const serviceContextId =
      service_context_id === undefined || service_context_id === null
        ? null
        : Number(service_context_id);

    const result = await maquinaService.abrirIncidenciaIntoDB(
      idMaquina,
      maintenance_status,
      propuestaAlquilerId,
      service_context_type ?? null,
      serviceContextId,
      service_case_type ?? null,
      comentario ?? null,
      fault_cause ?? null,
      idUser
    );

    res.status(201).json(result);
  } catch (e) {
    res.status(e.statusCode ?? 500).json({
      error: e.message ?? "Error",
      meta: e.meta,
    });
  }
}

export async function escalarAveriaGrave(req, res) {
  try {
    const idMaquina = Number(req.params.id);

    if (!Number.isInteger(idMaquina) || idMaquina <= 0) {
      const err = new Error("ID de máquina inválido");
      err.statusCode = 400;
      throw err;
    }

    if (!validateEscalarAveriaGraveBody(req.body)) {
      res.status(400).json({ error: "Body inválido para escalar avería grave" });
      return;
    }

    const result = await maquinaService.escalarAveriaGraveIntoDB(
      idMaquina,
      req.body?.comentario ?? null
    );
    res.status(200).json(result);
  } catch (e) {
    res.status(e.statusCode ?? 500).json({ error: e.message, meta: e.meta });
  }
}



