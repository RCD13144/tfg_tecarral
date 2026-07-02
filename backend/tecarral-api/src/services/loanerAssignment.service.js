import {
  createLoanerAssignmentTx,
  listLoanerAssignments,
  updateLoanerAssignmentState,
} from "../repositories/loanerAssignment.repository.js";

export async function createLoanerAssignment(data, createdBy) {
  return createLoanerAssignmentTx({
    ...data,
    created_by: createdBy,
  });
}

export async function getLoanerAssignments() {
  return listLoanerAssignments();
}

export async function changeLoanerAssignmentState(id, nextState) {
  const updated = await updateLoanerAssignmentState(id, nextState);

  if (!updated) {
    const error = new Error("Asignación de sustitución no encontrada");
    error.statusCode = 404;
    throw error;
  }

  return updated;
}
