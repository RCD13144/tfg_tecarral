import {
  changeLoanerAssignmentState,
  createLoanerAssignment,
  getLoanerAssignments,
} from "../services/loanerAssignment.service.js";

export async function createLoanerAssignmentController(req, res) {
  try {
    const createdBy = Number(req.user?.id_user);
    const result = await createLoanerAssignment(req.body ?? {}, createdBy);
    res.status(201).json(result);
  } catch (error) {
    res.status(error.statusCode ?? 500).json({ error: error.message ?? "Error" });
  }
}

export async function listLoanerAssignmentsController(_req, res) {
  try {
    res.status(200).json(await getLoanerAssignments());
  } catch (error) {
    res.status(error.statusCode ?? 500).json({ error: error.message ?? "Error" });
  }
}

export async function updateLoanerAssignmentStateController(req, res) {
  try {
    const id = Number(req.params.id);
    const result = await changeLoanerAssignmentState(id, req.body?.estado);
    res.status(200).json(result);
  } catch (error) {
    res.status(error.statusCode ?? 500).json({ error: error.message ?? "Error" });
  }
}
