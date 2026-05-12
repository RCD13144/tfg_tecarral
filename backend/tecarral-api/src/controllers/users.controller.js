import * as usersService from "../services/users.service.js";
import {
  validateChangeMyPasswordBody,
  validateCreateUserBody,
  validateUpdateMeBody,
} from "../schemas/users.schema.js";

export async function meController(req, res) {
  try {
    const user = usersService.getAuthenticatedUser(req.user);
    res.status(200).json(user);
  } catch (e) {
    res.status(e.statusCode ?? 500).json({ error: e.message ?? "Error" });
  }
}

export async function listUsersController(req, res) {
  try {
    const users = await usersService.listUsersForAdmin();
    res.status(200).json(users);
  } catch (e) {
    res.status(e.statusCode ?? 500).json({ error: e.message ?? "Error" });
  }
}

export async function createUserController(req, res) {
  try {
    const validation = validateCreateUserBody(req.body);

    if (!validation.ok) {
      res.status(400).json({ error: validation.errors.join(", ") });
      return;
    }

    const { email, role, nombre, telefono } = validation.value;

    const result = await usersService.createUserByAdmin(email, role, nombre, telefono);

    res.status(201).json(result);
  } catch (e) {
    res.status(e.statusCode ?? 500).json({ error: e.message ?? "Error" });
  }
}

export async function updateMeController(req, res) {
  try {
    const validation = validateUpdateMeBody(req.body);

    if (!validation.ok) {
      res.status(400).json({ error: validation.errors.join(", ") });
      return;
    }

    const result = await usersService.updateAuthenticatedUser(
      req.user.id_user,
      validation.value.telefono
    );

    res.status(200).json(result);
  } catch (e) {
    res.status(e.statusCode ?? 500).json({ error: e.message ?? "Error" });
  }
}

export async function deactivateUserController(req, res) {
  try {
    const targetUserId = Number(req.params.id);

    if (!Number.isInteger(targetUserId) || targetUserId <= 0) {
      res.status(400).json({ error: "id de usuario invalido" });
      return;
    }

    const result = await usersService.deactivateUserByAdmin(req.user.id_user, targetUserId);
    res.status(200).json(result);
  } catch (e) {
    res.status(e.statusCode ?? 500).json({ error: e.message ?? "Error" });
  }
}

export async function changeMyPasswordController(req, res) {
  try {
    const validation = validateChangeMyPasswordBody(req.body);

    if (!validation.ok) {
      res.status(400).json({ error: validation.errors.join(", ") });
      return;
    }

    const result = await usersService.changeAuthenticatedUserPassword(
      req.user.id_user,
      validation.value.currentPassword,
      validation.value.newPassword
    );

    res.status(200).json(result);
  } catch (e) {
    res.status(e.statusCode ?? 500).json({ error: e.message ?? "Error" });
  }
}
