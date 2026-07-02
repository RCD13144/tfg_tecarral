import pool from "../config/db.js";

function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

export async function createLoanerAssignmentTx(data) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const repairRes = await client.query(
      `
      SELECT r.id_reparacion, r.id_maquina, m.ownership_type, m.maintenance_status
      FROM public.reparacion r
      JOIN public.maquina m
        ON m.id_maquina = r.id_maquina
      WHERE r.id_reparacion = $1
      FOR UPDATE
      `,
      [data.reparacion_id]
    );

    if (repairRes.rowCount === 0) {
      throw createHttpError(404, "Reparación no encontrada");
    }

    const repair = repairRes.rows[0];

    if (repair.ownership_type !== "CLIENTE") {
      throw createHttpError(409, "Solo las máquinas del cliente admiten sustitución");
    }

    const loanerRes = await client.query(
      `
      SELECT id_maquina, ownership_type, availability_status, maintenance_status
      FROM public.maquina
      WHERE id_maquina = $1
      FOR UPDATE
      `,
      [data.loaner_machine_id]
    );

    if (loanerRes.rowCount === 0) {
      throw createHttpError(404, "Máquina de sustitución no encontrada");
    }

    const loaner = loanerRes.rows[0];

    if (loaner.ownership_type !== "TECARRAL") {
      throw createHttpError(409, "La máquina de sustitución debe ser de Tecarral");
    }

    if (loaner.availability_status !== "DISPONIBLE" || loaner.maintenance_status !== "OK") {
      throw createHttpError(409, "La máquina de sustitución no está disponible");
    }

    const insertRes = await client.query(
      `
      INSERT INTO public.loaner_assignment (
        reparacion_id,
        customer_machine_id,
        loaner_machine_id,
        estado,
        motivo,
        created_by
      )
      VALUES ($1, $2, $3, 'RESERVADA', $4, $5)
      RETURNING *
      `,
      [
        data.reparacion_id,
        repair.id_maquina,
        data.loaner_machine_id,
        data.motivo ?? null,
        data.created_by ?? null,
      ]
    );

    await client.query(
      `
      UPDATE public.maquina
      SET availability_status = 'ALQUILADA',
          logistics_status = 'EN_CAMINO',
          ubicacion_tipo = 'TRANSITO',
          transit_reason = 'ALQUILER_FINALIZADO'
      WHERE id_maquina = $1
      `,
      [data.loaner_machine_id]
    );

    await client.query("COMMIT");
    return insertRes.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function listLoanerAssignments() {
  const result = await pool.query(
    `
    SELECT
      la.*,
      cm.marca AS customer_machine_marca,
      cm.modelo AS customer_machine_modelo,
      lm.marca AS loaner_machine_marca,
      lm.modelo AS loaner_machine_modelo
    FROM public.loaner_assignment la
    JOIN public.maquina cm
      ON cm.id_maquina = la.customer_machine_id
    JOIN public.maquina lm
      ON lm.id_maquina = la.loaner_machine_id
    ORDER BY la.created_at DESC, la.id DESC
    `
  );

  return result.rows;
}

export async function updateLoanerAssignmentState(id, nextState) {
  const sets = ["estado = $2", "updated_at = NOW()"];

  if (nextState === "ENTREGADA") {
    sets.push("delivered_at = NOW()");
  } else if (nextState === "DEVUELTA") {
    sets.push("returned_at = NOW()");
  } else if (nextState === "CANCELADA") {
    sets.push("cancelled_at = NOW()");
  }

  const result = await pool.query(
    `
    UPDATE public.loaner_assignment
    SET ${sets.join(", ")}
    WHERE id = $1
    RETURNING *
    `,
    [id, nextState]
  );

  return result.rows[0] ?? null;
}
