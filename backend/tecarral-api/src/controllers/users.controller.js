import { getMe } from "../services/users.service.js";

export async function meController(req, res) {
  try {
    const me = await getMe(req.user.id_user);
    return res.json(me);
  } catch (err) {
    const status = err.statusCode ?? 500;
    return res.status(status).json({ message: err.message ?? "Server error" });
  }
}
