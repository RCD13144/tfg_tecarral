export interface ActiveRepairSummary {
  id_reparacion: number;
  id_maquina: number;
  id_albaran: number | null;
  id_user_asignado: number | null;
  comentario: string | null;
  solucion_aplicada: string | null;
  estado: string;
  created_at?: string | null;
  fault_cause?: 'DESGASTE_USO' | 'GOLPE_ACCIDENTE' | null;
  service_case_type?: 'CLIENTE_HABITUAL' | 'CLIENTE_NUEVO' | null;
  service_context_type?: 'ALQUILER' | 'CONTRATO_MANTENIMIENTO' | 'REPARACION_PUNTUAL_CLIENTE' | null;
  service_context_id?: number | null;
  contract_type?: 'PREVENTIVO' | 'TODO_INCLUIDO' | string | null;
  albaran_estado: string | null;
  propuesta_alquiler_id: number | null;
  presupuesto_reparacion_id: number | null;
  presupuesto_estado: string | null;
  presupuesto_payer_type: 'CLIENTE' | 'EMPRESA' | null;
  presupuesto_charge_reason: 'GOLPE_ACCIDENTE' | null;
  presupuesto_coverage_decision?: 'CLIENTE' | 'TECARRAL' | null;
  presupuesto_coverage_reason?: string | null;
}

export interface RepairListItem extends ActiveRepairSummary {
  created_at: string;
  cliente: string | null;
  direccion: string | null;
  poblacion: string | null;
  marca: string | null;
  modelo: string | null;
  ns: string | null;
  tipo_maquina: string | null;
  maintenance_status: string | null;
  availability_status: string | null;
  ubicacion_tipo: string | null;
  assigned_user_nombre: string | null;
  assigned_user_email: string | null;
  importe_total: number | null;
  expira_at: string | null;
}

export interface AssignableUser {
  id_user: number;
  email: string;
  role: string;
  nombre: string;
  telefono: string | null;
  must_change_password?: boolean;
}

export interface RepairBudgetFormData {
  items: Array<{
    referencia: string;
    descripcion: string;
    unidades: string;
    precio_unitario: string;
  }>;
  condiciones: string;
  expira_at: string;
  payer_type: 'CLIENTE' | 'EMPRESA' | '';
  fault_cause: 'DESGASTE_USO' | 'GOLPE_ACCIDENTE' | '';
  contract_type: 'PREVENTIVO' | 'TODO_INCLUIDO' | '';
}

