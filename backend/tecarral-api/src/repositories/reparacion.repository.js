import pool from "../config/db.js";
import { MAINTENANCE_STATUS } from "../constants/maintenanceStatus.js";
import { ReparacionStateService } from "../services/reparacionState.service.js";

function buildErr(statusCode, message, meta) {
  const err = new Error(message);
  err.statusCode = statusCode;
  err.meta = meta;
  return err;
}

export async function asignarAveriaTx({ idReparacion, idUserAsignado }) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const repRes = await client.query(
      `
      SELECT id_reparacion, id_maquina, estado
      FROM public.reparacion
      WHERE id_reparacion = $1
      FOR UPDATE
      `,
      [idReparacion]
    );

    if (repRes.rows.length === 0) {
      throw buildErr(404, "Reparación no encontrada", { idReparacion });
    }

    const reparacion = repRes.rows[0];

    if (reparacion.estado === "TERMINADA" || reparacion.estado === "CANCELADA") {
      throw buildErr(409, "No se puede asignar una reparación cerrada", {
        idReparacion,
        estado: reparacion.estado,
      });
    }

    const maqRes = await client.query(
      `
      SELECT id_maquina, maintenance_status
      FROM public.maquina
      WHERE id_maquina = $1
      `,
      [reparacion.id_maquina]
    );

    if (maqRes.rows.length === 0) {
      throw buildErr(404, "Máquina no encontrada", { id_maquina: reparacion.id_maquina });
    }

    const maintenanceStatus = maqRes.rows[0].maintenance_status;

    if (maintenanceStatus !== MAINTENANCE_STATUS.AVERIADA_GRAVE) {
      throw buildErr(409, "Solo se pueden asignar por admin las reparaciones de avería grave", {
        idReparacion,
        maintenance_status: maintenanceStatus,
      });
    }

    const userRes = await client.query(
      `
      SELECT id_user
      FROM public.users
      WHERE id_user = $1
      `,
      [idUserAsignado]
    );

    if (userRes.rows.length === 0) {
      throw buildErr(404, "Usuario asignado no encontrado", { idUserAsignado });
    }

    await client.query(
      `
      UPDATE public.reparacion
      SET id_user_asignado = $2
      WHERE id_reparacion = $1
      `,
      [idReparacion, idUserAsignado]
    );

    await client.query("COMMIT");

    return {
      id_reparacion: idReparacion,
      id_user_asignado: idUserAsignado,
    };
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

export async function marcarReparacionTerminadaTx(
  idReparacion,
  solucionAplicada,
  actor
) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const reparacionRes = await client.query(
      `
      SELECT
        r.id_reparacion,
        r.id_maquina,
        r.estado,
        r.id_albaran,
        r.id_user_asignado,
        r.fault_cause,
        r.service_context_type,
        r.service_context_id,
        COALESCE(repair_contract.contract_type, machine_contract.contract_type) AS contract_type
      FROM reparacion r
      JOIN maquina m
        ON m.id_maquina = r.id_maquina
      LEFT JOIN service_contract repair_contract
        ON repair_contract.id = r.service_context_id
       AND r.service_context_type = 'CONTRATO_MANTENIMIENTO'
      LEFT JOIN service_contract machine_contract
        ON machine_contract.id = m.service_contract_id
      WHERE r.id_reparacion = $1
      FOR UPDATE OF r
      `,
      [idReparacion]
    );

    if (reparacionRes.rowCount === 0) {
      throw buildErr(404, "Reparación no encontrada");
    }

    const reparacion = reparacionRes.rows[0];
    const actorUserId = Number(actor?.actorUserId);

    if (
      Number.isInteger(actorUserId) &&
      actorUserId > 0 &&
      reparacion.id_user_asignado !== null &&
      Number(reparacion.id_user_asignado) !== actorUserId
    ) {
      throw buildErr(
        409,
        "La reparación está asignada a otro usuario y no puedes terminarla",
        {
          idReparacion,
          id_user_asignado: reparacion.id_user_asignado,
          actor_user_id: actorUserId,
        }
      );
    }

    const maquinaEstadoRes = await client.query(
      `
      SELECT
        maintenance_status,
        ubicacion_tipo,
        ownership_type,
        ubicacion_operativa_direccion,
        ubicacion_operativa_cp,
        ubicacion_operativa_poblacion,
        owner_cliente_direccion,
        owner_cliente_cp,
        owner_cliente_poblacion,
        ubicacion
      FROM maquina
      WHERE id_maquina = $1
      `,
      [reparacion.id_maquina]
    );

    const maquinaEstado = maquinaEstadoRes.rows[0] ?? {};
    const maintenanceStatus = maquinaEstado.maintenance_status ?? null;
    const ubicacionTipoActual = maquinaEstado.ubicacion_tipo ?? null;
    const isCustomerOwnedMachine = String(maquinaEstado.ownership_type ?? "").trim().toUpperCase() === "CLIENTE";
    const customerOperationalLocation = [
      maquinaEstado.ubicacion_operativa_direccion,
      maquinaEstado.ubicacion_operativa_cp,
      maquinaEstado.ubicacion_operativa_poblacion,
    ]
      .map((value) => String(value ?? "").trim())
      .filter(Boolean)
      .join(", ") || [
        maquinaEstado.owner_cliente_direccion,
        maquinaEstado.owner_cliente_cp,
        maquinaEstado.owner_cliente_poblacion,
      ]
        .map((value) => String(value ?? "").trim())
        .filter(Boolean)
        .join(", ") || maquinaEstado.ubicacion || null;
    const severeWorkflowStates = new Set([
      "PENDIENTE_PRESUPUESTO",
      "PENDIENTE_ACEPTACION",
      "PRESUPUESTO_ACEPTADO",
      "PRESUPUESTO_RECHAZADO",
      "PRESUPUESTO_EXPIRADO",
    ]);
    const isSevereRepair =
      maintenanceStatus === MAINTENANCE_STATUS.AVERIADA_GRAVE ||
      severeWorkflowStates.has(reparacion.estado);

    if (reparacion.id_albaran) {
      const albaranRes = await client.query(
        `
        SELECT estado
        FROM public.albaran
        WHERE id_albaran = $1
        `,
        [reparacion.id_albaran]
      );

      if (albaranRes.rowCount > 0) {
        const estadoAlbaran = albaranRes.rows[0].estado;

        if (
          isSevereRepair &&
          estadoAlbaran !== "FIRMADO"
        ) {
          throw buildErr(
            409,
            "La máquina con avería grave debe firmar primero el albarán antes de repararse"
          );
        }
      }
    }

    const isAllIncludedCoveredRepair =
      isSevereRepair &&
      String(reparacion.contract_type ?? "").trim().toUpperCase() === "TODO_INCLUIDO" &&
      String(reparacion.fault_cause ?? "").trim().toUpperCase() !== "GOLPE_ACCIDENTE";

    const canTerminate =
      isAllIncludedCoveredRepair ||
      ReparacionStateService.canTransition(
        reparacion.estado,
        "TERMINADA",
        {
          maintenanceStatus,
          hasPresupuesto:
            reparacion.estado === "PENDIENTE_ACEPTACION" ||
            reparacion.estado === "PRESUPUESTO_ACEPTADO" ||
            reparacion.estado === "PRESUPUESTO_RECHAZADO" ||
            reparacion.estado === "PRESUPUESTO_EXPIRADO",
        }
      );

    if (!canTerminate) {
      throw buildErr(
        409,
        "La reparación no puede marcarse como TERMINADA desde su estado actual"
      );
    }

    if (isSevereRepair) {
      if (reparacion.estado !== "PRESUPUESTO_ACEPTADO" && !isAllIncludedCoveredRepair) {
        throw buildErr(
          409,
          "La reparaci?n de una aver?a grave solo puede terminarse desde PRESUPUESTO_ACEPTADO, salvo cobertura todo incluido por desgaste o uso normal",
          {
            idReparacion,
            estado: reparacion.estado,
            maintenance_status: maintenanceStatus,
            severe_workflow: true,
          }
        );
      }

      if (!reparacion.id_user_asignado) {
        throw buildErr(
          409,
          "La reparación de una avería grave debe estar asignada antes de marcarse como TERMINADA",
          {
            idReparacion,
            estado: reparacion.estado,
            maintenance_status: maintenanceStatus,
            severe_workflow: true,
          }
        );
      }
    }

    const terminateQuery = isSevereRepair
      ? isAllIncludedCoveredRepair
        ? `
        UPDATE reparacion
        SET
          estado = 'TERMINADA',
          solucion_aplicada = $2
        WHERE id_reparacion = $1
          AND id_user_asignado IS NOT NULL
          AND estado IN ('PENDIENTE_PRESUPUESTO', 'PENDIENTE_ACEPTACION', 'PRESUPUESTO_ACEPTADO')
        `
        : `
        UPDATE reparacion
        SET
          estado = 'TERMINADA',
          solucion_aplicada = $2
        WHERE id_reparacion = $1
          AND id_user_asignado IS NOT NULL
          AND estado = 'PRESUPUESTO_ACEPTADO'
        `
      : `
        UPDATE reparacion
        SET
          estado = 'TERMINADA',
          solucion_aplicada = $2
        WHERE id_reparacion = $1
        `;

    const terminateRes = await client.query(terminateQuery, [idReparacion, solucionAplicada]);

    if (terminateRes.rowCount === 0) {
      throw buildErr(
        409,
        "La reparación no puede marcarse como TERMINADA con el estado o asignación actual",
        {
          idReparacion,
          estado: reparacion.estado,
          id_user_asignado: reparacion.id_user_asignado,
          severe_workflow: isSevereRepair,
        }
      );
    }

    const shouldReturnToClientInTransit =
      isSevereRepair ||
      (
        maintenanceStatus === MAINTENANCE_STATUS.AVERIADA &&
        ubicacionTipoActual === "TRANSITO" &&
        reparacion.id_albaran
      );

    if (shouldReturnToClientInTransit) {
      const propuestaRes = await client.query(
        `
        SELECT propuesta_alquiler_id
        FROM albaran
        WHERE id_albaran = $1
        `,
        [reparacion.id_albaran]
      );

      const propuestaId = propuestaRes.rows[0]?.propuesta_alquiler_id ?? null;

      if (propuestaId) {
        const direccionRes = await client.query(
          `
          SELECT direccion, poblacion
          FROM propuesta_alquiler
          WHERE id = $1
          `,
          [propuestaId]
        );

        const direccion = direccionRes.rows[0]?.direccion ?? null;
        const poblacion = direccionRes.rows[0]?.poblacion ?? null;
        const ubicacionCliente =
          direccion && poblacion ? `${direccion}, ${poblacion}` : null;

        await client.query(
          `
          UPDATE maquina
          SET
            maintenance_status = 'OK',
            logistics_status = 'EN_CAMINO',
            ubicacion_tipo = 'TRANSITO',
            ubicacion_ref_id = $2,
            ubicacion = COALESCE($3, ubicacion),
            transit_reason = 'REPARACION_TERMINADA'
          WHERE id_maquina = $1
          `,
          [reparacion.id_maquina, propuestaId, ubicacionCliente]
        );
      } else {
        await client.query(
          `
          UPDATE maquina
          SET
            maintenance_status = 'OK',
            logistics_status = 'EN_CAMINO',
            ubicacion_tipo = 'TRANSITO',
            transit_reason = 'REPARACION_TERMINADA'
          WHERE id_maquina = $1
          `,
          [reparacion.id_maquina]
        );
      }
    } else {
      await client.query(
        `
        UPDATE maquina
        SET
          maintenance_status = 'OK',
          ubicacion_tipo = CASE
            WHEN ownership_type = 'CLIENTE' AND ubicacion_tipo IN ('TALLER', 'ALMACEN', 'TRANSITO') THEN 'TRANSITO'
            WHEN ownership_type = 'CLIENTE' THEN 'CLIENTE'
            ELSE ubicacion_tipo
          END,
          ubicacion = CASE
            WHEN ownership_type = 'CLIENTE' AND ubicacion_tipo = 'CLIENTE' THEN COALESCE($2, ubicacion)
            ELSE ubicacion
          END,
          logistics_status = CASE
            WHEN ownership_type = 'CLIENTE' AND ubicacion_tipo IN ('TALLER', 'ALMACEN', 'TRANSITO') THEN 'EN_CAMINO'
            WHEN ownership_type = 'CLIENTE' THEN NULL
            ELSE logistics_status
          END,
          transit_reason = CASE
            WHEN ownership_type = 'CLIENTE' AND ubicacion_tipo IN ('TALLER', 'ALMACEN', 'TRANSITO') THEN 'REPARACION_TERMINADA'
            WHEN ownership_type = 'CLIENTE' THEN NULL
            ELSE transit_reason
          END
        WHERE id_maquina = $1
        `,
        [reparacion.id_maquina, customerOperationalLocation]
      );
    }

    await client.query("COMMIT");

    return {
      id_reparacion: reparacion.id_reparacion,
      id_maquina: reparacion.id_maquina,
      estado_anterior: reparacion.estado,
      estado_actual: "TERMINADA",
      solucion_aplicada: solucionAplicada,
      maintenance_status_actual: "OK",
    };

  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

export async function findActiveRepairByMachineId(idMaquina) {
  const result = await pool.query(
    `
    SELECT
      r.id_reparacion,
      r.id_maquina,
      r.id_albaran,
      r.id_user_asignado,
      r.comentario,
      r.solucion_aplicada,
      r.estado,
      r.created_at,
      r.fault_cause,
      r.service_context_type,
      r.service_context_id,
      COALESCE(repair_contract.contract_type, machine_contract.contract_type) AS contract_type,
      a.service_case_type,
      a.estado AS albaran_estado,
      a.propuesta_alquiler_id,
      pr.id AS presupuesto_reparacion_id,
      pr.estado AS presupuesto_estado,
      pr.payer_type AS presupuesto_payer_type,
      pr.charge_reason AS presupuesto_charge_reason,
      pr.coverage_decision AS presupuesto_coverage_decision,
      pr.coverage_reason AS presupuesto_coverage_reason
    FROM reparacion r
    LEFT JOIN albaran a
      ON a.id_albaran = r.id_albaran
    LEFT JOIN maquina m
      ON m.id_maquina = r.id_maquina
    LEFT JOIN service_contract repair_contract
      ON repair_contract.id = r.service_context_id
     AND r.service_context_type = 'CONTRATO_MANTENIMIENTO'
    LEFT JOIN service_contract machine_contract
      ON machine_contract.id = m.service_contract_id
    LEFT JOIN presupuesto_reparacion pr
      ON pr.reparacion_id = r.id_reparacion
    WHERE r.id_maquina = $1
      AND r.estado NOT IN ('TERMINADA', 'CANCELADA')
    ORDER BY r.id_reparacion DESC
    LIMIT 1
    `,
    [idMaquina]
  );

  return result.rows[0] ?? null;
}

export async function findActiveReparaciones({ userId = null, isAdmin = false }) {
  const values = [];
  const conditions = [`r.estado NOT IN ('TERMINADA', 'CANCELADA')`];

  if (!isAdmin) {
    values.push(userId);
    conditions.push(`r.id_user_asignado = $${values.length}`);
  }

  const result = await pool.query(
    `
    SELECT
      r.id_reparacion,
      r.id_maquina,
      r.id_albaran,
      r.id_user_asignado,
      r.comentario,
      r.solucion_aplicada,
      r.estado,
      r.fault_cause,
      r.service_context_type,
      r.service_context_id,
      COALESCE(repair_contract.contract_type, machine_contract.contract_type) AS contract_type,
      r.created_at,
      a.service_case_type,
      a.estado AS albaran_estado,
      a.propuesta_alquiler_id,
      a.cliente,
      a.direccion,
      a.poblacion,
      a.marca,
      a.modelo,
      a.ns,
      m.tipo_maquina,
      m.maintenance_status,
      m.availability_status,
      m.ubicacion_tipo,
      u.nombre AS assigned_user_nombre,
      u.email AS assigned_user_email,
      pr.id AS presupuesto_reparacion_id,
      pr.estado AS presupuesto_estado,
      pr.payer_type AS presupuesto_payer_type,
      pr.charge_reason AS presupuesto_charge_reason,
      pr.coverage_decision AS presupuesto_coverage_decision,
      pr.coverage_reason AS presupuesto_coverage_reason,
      pr.importe_total,
      pr.expira_at
    FROM reparacion r
    LEFT JOIN albaran a
      ON a.id_albaran = r.id_albaran
    LEFT JOIN maquina m
      ON m.id_maquina = r.id_maquina
    LEFT JOIN service_contract repair_contract
      ON repair_contract.id = r.service_context_id
     AND r.service_context_type = 'CONTRATO_MANTENIMIENTO'
    LEFT JOIN service_contract machine_contract
      ON machine_contract.id = m.service_contract_id
    LEFT JOIN users u
      ON u.id_user = r.id_user_asignado
    LEFT JOIN presupuesto_reparacion pr
      ON pr.reparacion_id = r.id_reparacion
    WHERE ${conditions.join(" AND ")}
    ORDER BY r.created_at DESC, r.id_reparacion DESC
    `,
    values
  );

  return result.rows;
}
