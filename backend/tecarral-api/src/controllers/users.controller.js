import * as usersService from "../services/users.service.js";
import { validateCreateUserBody } from "../schemas/users.schema.js";

export async function meController(req, res) {
  try {
    const user = usersService.getAuthenticatedUser(req.user);
    res.status(200).json(user);
  } catch (e) {
    res.status(e.statusCode ?? 500).json({ error: e.message ?? "Error" });
  }
}

export async function createUserController(req, res) {
  try {
    const validation = validateCreateUserBody(req.body);

    if (!validation.ok) {
      res.status(400).json({ error: validation.errors.join(", ") });
    } else {
      const { email, role, nombre, telefono } = validation.value;

      const result = await usersService.createUserByAdmin(
        email,
        role,
        nombre,
        telefono
      );

      res.status(201).json(result);
    }
  } catch (e) {
    res.status(e.statusCode ?? 500).json({ error: e.message ?? "Error" });
  }
}