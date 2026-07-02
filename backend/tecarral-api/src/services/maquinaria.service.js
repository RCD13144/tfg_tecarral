import {
  getAllMaquinaria,
  getMaquinariaByIdFromDB,
  findMaquinaria,
  enforceTransitLogisticsConsistency,
  reconcileEndedRentalsTransit,
  suggestModelo,
  suggestMarca,
  suggestSubtipo,
  suggestNS,
  suggestMotor,
  suggestTipo,
  suggestIdMaquina,
  crearMaquina,
  editarMaquina,
  deleteMaquina,
  getMaquinaByIdForImageUpdate,
  marcarEntregadaAtomic,
  marcarRecibidaEnBaseTx,
  marcarTransitoPorAlquilerTerminadoTx,
  moverEntreBasesTx,
  getMaintenanceStatusById,
  updateMachineImagePath,
  updateMaintenanceStatus,
  abrirIncidenciaTx,
  escalarAveriaGraveTx
} from "../repositories/maquina.repository.js";
import { getActiveRepairByMachineId } from "./reparacion.service.js";
import { buildPublicImageUrl, storeMachineImage } from "../utils/machine-image-storage.js";
import { resolveCoverageForRepair } from "./serviceContract.service.js";

import {
  validateUbicacionTipoDestino,
  validateDestinoBase,
  isUbicacionTextUsable,
} from "../schemas/maquina.schema.js";

import { MAINTENANCE_STATUS } from "../constants/maintenanceStatus.js";

function buildMapsLinks(ubicacionText) {
  const raw = String(ubicacionText ?? "").trim();
  const q = encodeURIComponent(raw);

  const geo = `geo:0,0?q=${q}`;

  const google = `https://www.google.com/maps/search/?api=1&query=${q}`;
  const apple = `http://maps.apple.com/?q=${q}`;
  const waze = `https://waze.com/ul?q=${q}&navigate=yes`;

  return { query: raw, geo, google, apple, waze };
}

function isMaintenanceTransitionAllowed(current, next) {
  const okToAveriada = current === MAINTENANCE_STATUS.OK && next === MAINTENANCE_STATUS.AVERIADA;
  const okToGrave =
    current === MAINTENANCE_STATUS.OK && next === MAINTENANCE_STATUS.AVERIADA_GRAVE;
  const averiadaToGrave =
    current === MAINTENANCE_STATUS.AVERIADA && next === MAINTENANCE_STATUS.AVERIADA_GRAVE;

  return okToAveriada || okToGrave || averiadaToGrave;
}

function withMachineImageUrl(machine) {
  if (!machine) {
    return machine;
  }

  return {
    ...machine,
    image_url: buildPublicImageUrl(machine.image_path),
  };
}

export async function getMaquinaria(filters = {}) {
  await reconcileEndedRentalsTransit();
  await enforceTransitLogisticsConsistency();

  const ownershipFilter = Array.isArray(filters.ownership_type)
    ? filters.ownership_type
        .map((value) => String(value ?? "").trim().toUpperCase())
        .filter(Boolean)
    : [];

  function applyOwnershipFilter(items) {
    if (ownershipFilter.length === 0) {
      return items;
    }

    return items.filter((machine) => {
      const ownership = String(machine?.ownership_type ?? "TECARRAL")
        .trim()
        .toUpperCase();
      return ownershipFilter.includes(ownership);
    });
  }

  const hasFilters = Object.values(filters).some((value) => {
    if (Array.isArray(value)) {
      return value.length > 0;
    }

    return value !== undefined;
  });

  if (hasFilters) {
    const maquinas = await findMaquinaria(filters);
    return applyOwnershipFilter(maquinas).map(withMachineImageUrl);
  }

  const maquinas = await getAllMaquinaria();
  return applyOwnershipFilter(maquinas).map(withMachineImageUrl);
}

export async function suggestModeloFromDB(text) {
  const maquina = await suggestModelo(text);
  return maquina;
}

export async function suggestMarcaFromDB(text) {
  const maquina = await suggestMarca(text);
  return maquina;
}

export async function suggestSubtipoFromDB(text) {
  const maquina = await suggestSubtipo(text);
  return maquina;
}

export async function suggestNSfromDB(text) {
  const maquina = await suggestNS(text);
  return maquina;
}

export async function suggestMotorfromDB(text) {
  const maquina = await suggestMotor(text);
  return maquina;
}

export async function suggestTipofromDB(text) {
  const maquina = await suggestTipo(text);
  return maquina;
}

export async function suggestIdMaquinaFromDB(text) {
  const maquina = await suggestIdMaquina(text);
  return maquina;
}

export async function crearMaquinaIntoDB(data) {
  const maquina = await crearMaquina(data);
  return withMachineImageUrl(maquina);
}

export async function editarMaquinariaByIdFromDB(id, patch) {
  const maquina = await editarMaquina(id, patch);
  return withMachineImageUrl(maquina);
}

export async function deleteMaquinariaByIdFromDB(id) {
  const maquina = await deleteMaquina(id);
  return maquina;
}

export async function markDelivered(idMaquina) {
  const result = await marcarEntregadaAtomic(idMaquina);
  return result;
}

export async function marcarRecibidaEnBase(idMaquina, ubicacionTipo) {
  const okUbicacion = validateUbicacionTipoDestino(ubicacionTipo);

  if (!okUbicacion) {
    const err = new Error("Ubicación destino inválida");
    err.statusCode = 400;
    throw err;
  }

  const result = await marcarRecibidaEnBaseTx(idMaquina, ubicacionTipo);
  return result;
}

export async function recomputeLogisticsByEndedRentals(options) {
  const limit = options?.limit ?? 500;
  return marcarTransitoPorAlquilerTerminadoTx({ limit });
}

export async function moverEntreBases(idMaquina, ubicacionTipo) {
  const ok = validateDestinoBase(ubicacionTipo);

  if (!ok) {
    const err = new Error("Destino inválido");
    err.statusCode = 400;
    throw err;
  }

  const result = await moverEntreBasesTx(idMaquina, ubicacionTipo);
  return result;
}

function hasTecarralSignatureText(maquina, serviceCaseSummary) {
  const planLabel = serviceCaseSummary?.plan_label ?? "Sin contrato";
  const contractState = String(maquina.service_contract_state ?? "").trim();

  if (!contractState) {
    return "-";
  }

  if (maquina.service_contract_client_signed && maquina.service_contract_tecarral_signed) {
    return `${planLabel} activo y firmado por ambas partes.`;
  }

  if (maquina.service_contract_tecarral_signed) {
    return `${planLabel} firmado por Tecarral. Falta la firma del cliente.`;
  }

  if (maquina.service_contract_client_signed) {
    return `${planLabel} firmado por el cliente. Falta la firma de Tecarral.`;
  }

  return `${planLabel} en estado ${contractState}.`;
}

function buildCustomerTimeline(maquina, activeRepair, serviceCaseSummary) {
  const timeline = [];

  if (maquina.service_contract_id) {
    timeline.push({
      key: 'service-contract',
      title: 'Contrato de mantenimiento',
      description: hasTecarralSignatureText(maquina, serviceCaseSummary),
      date: maquina.service_contract_created_at ?? maquina.service_contract_start_date ?? null,
    });
  }

  if (activeRepair?.service_case_type) {
    timeline.push({
      key: 'service-case-type',
      title: 'Tipo de cliente del aviso',
      description:
        activeRepair.service_case_type === 'CLIENTE_NUEVO'
          ? 'El aviso se registr? como cliente nuevo.'
          : 'El aviso se registr? como cliente habitual.',
      date: activeRepair.created_at ?? null,
    });
  }

  if (maquina.next_service_visit_date) {
    timeline.push({
      key: 'service-visit',
      title: 'Próxima visita de mantenimiento',
      description: `Próxima visita programada para ${maquina.next_service_visit_date}.`,
      date: maquina.next_service_visit_date,
    });
  }

  if (activeRepair) {
    timeline.push({
      key: 'repair-opened',
      title: 'Avería abierta',
      description: `La máquina tiene una reparación activa en estado ${activeRepair.estado}.`,
      date: activeRepair.created_at ?? null,
    });

    if (activeRepair.fault_cause) {
      timeline.push({
        key: 'repair-cause',
        title: 'Causa registrada',
        description:
          activeRepair.fault_cause === 'GOLPE_ACCIDENTE'
            ? 'La avería se ha marcado como golpe o accidente.'
            : 'La avería se ha marcado como desgaste o uso normal.',
        date: activeRepair.created_at ?? null,
      });
    }

    if (activeRepair.id_albaran) {
      timeline.push({
        key: 'repair-albaran',
        title: 'Albarán de servicio',
        description: `Albarán #${activeRepair.id_albaran} en estado ${activeRepair.albaran_estado ?? "BORRADOR"}.`,
        date: activeRepair.created_at ?? null,
      });
    }

    if (activeRepair.presupuesto_reparacion_id) {
      timeline.push({
        key: 'repair-budget',
        title: 'Presupuesto de reparación',
        description: `Presupuesto #${activeRepair.presupuesto_reparacion_id} en estado ${activeRepair.presupuesto_estado ?? "PENDING"}.`,
        date: activeRepair.created_at ?? null,
      });
    }
  }

  return timeline;
}

function buildCustomerServiceCase(maquina, activeRepair) {
  const planType = maquina.service_contract_type ?? null;
  const planLabel =
    planType === 'TODO_INCLUIDO'
      ? 'Todo incluido'
      : planType === 'PREVENTIVO'
        ? 'Preventivo'
        : 'Sin contrato';

  const faultCause = activeRepair?.fault_cause ?? null;
  const resolvedCoverage = activeRepair?.presupuesto_coverage_decision
    ? {
        coverage_decision: activeRepair.presupuesto_coverage_decision,
        coverage_reason: activeRepair.presupuesto_coverage_reason,
      }
    : activeRepair
      ? resolveCoverageForRepair({
          contractType: planType,
          faultCause,
        })
      : null;

  let canCreateRepairBudget = false;
  let repairBudgetBlockReason = null;

  if (!activeRepair) {
    repairBudgetBlockReason = 'Primero hay que abrir una avería desde el estado de la máquina.';
  } else if (activeRepair.presupuesto_reparacion_id) {
    repairBudgetBlockReason = `Ya existe un presupuesto de reparación (#${activeRepair.presupuesto_reparacion_id}).`;
  } else if (activeRepair.albaran_estado !== "FIRMADO") {
    repairBudgetBlockReason = 'Antes hay que firmar el albarán de servicio correspondiente.';
  } else if (planType === 'TODO_INCLUIDO' && faultCause !== 'GOLPE_ACCIDENTE') {
    repairBudgetBlockReason = 'El contrato todo incluido cubre esta avería; no procede presupuesto al cliente.';
  } else {
    canCreateRepairBudget = true;
  }

  let nextServiceAction = null;

  if (activeRepair) {
    if (canCreateRepairBudget) {
      nextServiceAction = {
        code: 'CREATE_REPAIR_BUDGET',
        label: 'Crear presupuesto de reparaci?n',
        description: 'El albar?n ya est? firmado y la reparaci?n permite enviar presupuesto.',
      };
    } else if (activeRepair.albaran_estado !== "FIRMADO") {
      nextServiceAction = {
        code: 'WAIT_ALBARAN_SIGNATURE',
        label: 'Pendiente de firma de albar?n',
        description: 'El siguiente paso operativo es firmar el albar?n del servicio antes de continuar.',
      };
    } else if (activeRepair.presupuesto_reparacion_id && activeRepair.presupuesto_estado === "PENDING") {
      nextServiceAction = {
        code: 'WAIT_REPAIR_BUDGET_SIGNATURE',
        label: 'Pendiente de firma del presupuesto',
        description: 'El presupuesto ya se ha enviado y queda pendiente de respuesta del cliente.',
      };
    }
  }

  const serviceCaseSummary = {
    plan_type: planType,
    plan_label: planLabel,
    plan_status: maquina.service_contract_state ?? 'SIN_CONTRATO',
    customer_relationship_type: activeRepair?.service_case_type ?? null,
    customer_relationship_label:
      activeRepair?.service_case_type === 'CLIENTE_NUEVO'
        ? 'Cliente nuevo'
        : activeRepair?.service_case_type === 'CLIENTE_HABITUAL'
          ? 'Cliente habitual'
          : '-',
    fault_cause: faultCause,
    fault_cause_label:
      faultCause === 'GOLPE_ACCIDENTE'
        ? 'Golpe o accidente'
        : faultCause === 'DESGASTE_USO'
          ? 'Desgaste o uso normal'
          : 'Sin registrar',
    coverage_decision: resolvedCoverage?.coverage_decision ?? null,
    coverage_reason: resolvedCoverage?.coverage_reason ?? null,
    signature_status: hasTecarralSignatureText(maquina, { plan_label: planLabel }),
    next_visit_date: maquina.next_service_visit_date ?? null,
    repair_status: activeRepair?.estado ?? null,
    budget_status: activeRepair?.presupuesto_estado ?? null,
  };

  return {
    service_case_summary: serviceCaseSummary,
    next_service_action: nextServiceAction,
    can_create_repair_budget: canCreateRepairBudget,
    repair_budget_block_reason: repairBudgetBlockReason,
    timeline: buildCustomerTimeline(maquina, activeRepair, serviceCaseSummary),
  };
}
export async function getMaquinaById(idMaquina) {
  await reconcileEndedRentalsTransit(idMaquina);
  await enforceTransitLogisticsConsistency(idMaquina);

  const maquina = await getMaquinariaByIdFromDB(idMaquina);

  if (maquina === null) {
    return null;
  }

  const hasUbicacion = isUbicacionTextUsable(maquina.ubicacion);
  const maps = hasUbicacion ? buildMapsLinks(maquina.ubicacion) : null;
  const activeRepair = await getActiveRepairByMachineId(idMaquina);
  const isCustomerOwned = String(maquina.ownership_type ?? '').trim().toUpperCase() === 'CLIENTE';
  const customerServiceCase = isCustomerOwned
    ? buildCustomerServiceCase(maquina, activeRepair)
    : {
        service_case_summary: null,
        next_service_action: null,
        can_create_repair_budget: false,
        repair_budget_block_reason: null,
        timeline: [],
      };

  return {
    ...maquina,
    image_url: buildPublicImageUrl(maquina.image_path),
    maps,
    active_repair: activeRepair,
    ...customerServiceCase,
  };
}

export async function uploadMachineImage(idMaquina, { buffer, fileName, mimeType }) {
  const maquina = await getMaquinaByIdForImageUpdate(idMaquina);

  if (maquina === null) {
    const err = new Error("Máquina no encontrada");
    err.statusCode = 404;
    throw err;
  }

  const imagePath = await storeMachineImage({
    idMaquina,
    buffer,
    fileName,
    mimeType,
    previousImagePath: maquina.image_path,
  });

  await updateMachineImagePath(idMaquina, imagePath, true);

  return getMaquinaById(idMaquina);
}

export async function cambiarMaintenanceStatus(idMaquina, maintenanceStatus) {
  const current = await getMaintenanceStatusById(idMaquina);

  if (current === null) {
    const err = new Error("Máquina no encontrada");
    err.statusCode = 404;
    throw err;
  }

  const allowed = isMaintenanceTransitionAllowed(current, maintenanceStatus);

  if (!allowed) {
    const err = new Error("Transición de maintenance_status no permitida");
    err.statusCode = 409;
    err.meta = { from: current, to: maintenanceStatus };
    throw err;
  }

  await updateMaintenanceStatus(idMaquina, maintenanceStatus);

  return {
    id_maquina: idMaquina,
    maintenance_status: maintenanceStatus,
  };
}

export async function abrirIncidenciaIntoDB(
  idMaquina,
  maintenanceStatus,
  propuestaAlquilerId,
  serviceContextType,
  serviceContextId,
  serviceCaseType,
  comentario,
  faultCause,
  idUser
) {
  const okStatus =
    maintenanceStatus === MAINTENANCE_STATUS.AVERIADA ||
    maintenanceStatus === MAINTENANCE_STATUS.AVERIADA_GRAVE;

  if (!okStatus) {
    const err = new Error("maintenance_status inválido");
    err.statusCode = 400;
    throw err;
  }

  if (!Number.isInteger(idUser) || idUser <= 0) {
    const err = new Error("No autenticado");
    err.statusCode = 401;
    throw err;
  }

  if (
    (serviceContextType === "CONTRATO_MANTENIMIENTO" ||
      serviceContextType === "REPARACION_PUNTUAL_CLIENTE") &&
    Number.isInteger(serviceContextId) &&
    serviceContextId > 0
  ) {
    if (maintenanceStatus !== MAINTENANCE_STATUS.AVERIADA) {
      const err = new Error("La maquinaria de cliente debe abrirse primero como averiada simple y escalarse después si procede.");
      err.statusCode = 409;
      throw err;
    }

    const normalizedFaultCause = String(faultCause ?? "").trim().toUpperCase();
    const normalizedServiceCaseType = String(serviceCaseType ?? '').trim().toUpperCase();

    if (
      normalizedServiceCaseType !== 'CLIENTE_HABITUAL' &&
      normalizedServiceCaseType !== 'CLIENTE_NUEVO'
    ) {
      const err = new Error('Debes indicar si el aviso corresponde a un cliente habitual o a un cliente nuevo.');
      err.statusCode = 400;
      throw err;
    }

    if (
      normalizedFaultCause !== "DESGASTE_USO" &&
      normalizedFaultCause !== "GOLPE_ACCIDENTE"
    ) {
      const err = new Error("La causa de la avería es obligatoria para maquinaria de cliente");
      err.statusCode = 400;
      throw err;
    }

    return abrirIncidenciaTx({
      idMaquina,
      maintenanceStatus,
      propuestaAlquilerId: null,
      serviceContextType,
      serviceContextId,
      serviceCaseType: normalizedServiceCaseType,
      comentario: comentario ?? null,
      faultCause: normalizedFaultCause,
      idUser,
    });
  }

  if (!Number.isInteger(propuestaAlquilerId) || propuestaAlquilerId <= 0) {
    const err = new Error("propuesta_alquiler_id inválido");
    err.statusCode = 400;
    throw err;
  }

  const result = await abrirIncidenciaTx({
    idMaquina,
    maintenanceStatus,
    propuestaAlquilerId,
    serviceCaseType: String(serviceCaseType ?? '').trim().toUpperCase() || null,
    comentario: comentario ?? null,
    faultCause: String(faultCause ?? "").trim().toUpperCase() || null,
    idUser,
  });

  return result;
}

export async function escalarAveriaGraveIntoDB(idMaquina, comentario) {
  return escalarAveriaGraveTx({ idMaquina, comentario: comentario ?? null });
}

