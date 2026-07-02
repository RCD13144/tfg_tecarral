import {
  completeServiceVisit,
  createServiceContract,
  getPublicContractHtml,
  getServiceContract,
  getServiceContractPdf,
  listContracts,
  signServiceContractByClientToken,
  signServiceContractByTecarral,
} from "../services/serviceContract.service.js";

export async function createContractController(req, res) {
  try {
    const idUser = Number(req.user?.id_user);
    const result = await createServiceContract(req.body ?? {}, idUser);
    res.status(201).json(result);
  } catch (error) {
    res.status(error.statusCode ?? 500).json({ error: error.message ?? "Error" });
  }
}

export async function listContractsController(req, res) {
  try {
    const machineId =
      req.query?.machine_id !== undefined ? Number(req.query.machine_id) : null;
    const pendingTecarralOnly =
      String(req.query?.pending_tecarral_only ?? "").trim().toLowerCase() === "true";

    const result = await listContracts({
      machineId:
        Number.isInteger(machineId) && machineId > 0 ? machineId : null,
      pendingTecarralOnly,
    });
    res.status(200).json(result);
  } catch (error) {
    res.status(error.statusCode ?? 500).json({ error: error.message ?? "Error" });
  }
}

export async function getContractController(req, res) {
  try {
    const id = Number(req.params.id);
    const result = await getServiceContract(id);
    res.status(200).json(result);
  } catch (error) {
    res.status(error.statusCode ?? 500).json({ error: error.message ?? "Error" });
  }
}

export async function getContractPdfController(req, res) {
  try {
    const id = Number(req.params.id);
    const stage = req.query?.stage;
    const pdf = await getServiceContractPdf(id, stage);
    const filename = pdf.pdf_filename ?? `${pdf.document_number ?? `contrato-${id}`}.pdf`;

    res.setHeader("Content-Type", pdf.pdf_mime_type ?? "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
    res.status(200).send(pdf.pdf_content);
  } catch (error) {
    res.status(error.statusCode ?? 500).json({ error: error.message ?? "Error" });
  }
}

export async function signContractTecarralController(req, res) {
  try {
    const id = Number(req.params.id);
    const result = await signServiceContractByTecarral(id, req.body ?? {});
    res.status(200).json(result);
  } catch (error) {
    res.status(error.statusCode ?? 500).json({ error: error.message ?? "Error" });
  }
}

export async function listContractVisitsController(req, res) {
  try {
    const id = Number(req.params.id);
    const contract = await getServiceContract(id);
    res.status(200).json(contract.visits ?? []);
  } catch (error) {
    res.status(error.statusCode ?? 500).json({ error: error.message ?? "Error" });
  }
}

export async function completeContractVisitController(req, res) {
  try {
    const visitId = Number(req.params.id);
    const completedBy = Number(req.user?.id_user);
    const result = await completeServiceVisit(visitId, completedBy, req.body?.notes ?? null);
    res.status(200).json(result);
  } catch (error) {
    res.status(error.statusCode ?? 500).json({ error: error.message ?? "Error" });
  }
}

export async function viewPublicContractHtmlController(req, res) {
  const html = await getPublicContractHtml(req.params.token);
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(html);
}

export async function signPublicContractController(req, res) {
  try {
    await signServiceContractByClientToken(req.params.token, req.body ?? {});
    res
      .status(200)
      .send("<html><body><p>Contrato firmado correctamente.</p></body></html>");
  } catch (error) {
    res
      .status(error.statusCode ?? 500)
      .send(`<html><body><p>${error.message ?? "Error"}</p></body></html>`);
  }
}

