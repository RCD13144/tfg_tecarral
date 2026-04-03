import request from "supertest";
import pool from "../../src/config/db.js";
import { hashPassword } from "../../src/utils/password.js";

const { default: app } = await import("../../src/app.js");


function buildTecnico(){
  const timestamp = Date.now();
  const tecnico = {
    email: `tecnico_${timestamp}@test.com`,
    role: "tecnico",
    nombre: "Tecnico 2",
    telefono: "600123456"
  }
  return tecnico;
}

function buildAdmin() {
  const timestamp = Date.now();
  const admin = {
    email: `admin_${timestamp}@test.com`,
    password: "123456",
    role: "admin",
    nombre: "Admin 2", 
    telefono: "600123456"
  }

  return admin;
}

async function insertAdmin(admin){

  const hashedPass = await hashPassword(admin.password);

  const result = await pool.query(
    `
    INSERT INTO public.users(
      email, 
      password_hash,
      role,
      nombre,
      telefono,
      must_change_password
    ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id_user, email, role
    `,
    [
      admin.email,
      hashedPass,
      admin.role,
      admin.nombre,
      admin.telefono, 
      false
    ]
  );

  return result.rows[0];
}

describe("flujo completo de registro de usuarios tecnicos", () =>{
  test("valida que se cree un admin, este admin meta un usuario con contraseña temporal y el usuario cambie su contraseña", async () =>{

    const admin = buildAdmin();
    await insertAdmin(admin);
    const tecnico = buildTecnico();

    const adminLogin = await request(app).post("/api/auth/login").send({
      email: admin.email,
      password: admin.password
    });

    expect(adminLogin.status).toBe(200);
    const adminToken = adminLogin.body.token;

    const createTecnicoResponse = await request(app).post("/api/users").set("Authorization", `Bearer ${adminToken}`).send({
      email: tecnico.email,
      role: tecnico.role,
      nombre: tecnico.nombre,
      telefono: tecnico.telefono
    });

    expect(createTecnicoResponse.status).toBe(201);
    expect(createTecnicoResponse.body).toHaveProperty("user");
    expect(createTecnicoResponse.body).toHaveProperty("temporaryPassword");


    const temporaryPassword = createTecnicoResponse.body.temporaryPassword;

    const tecnicoLogin = await request(app).post("/api/auth/login").send({
      email: tecnico.email,
      password: temporaryPassword
    });

    expect(tecnicoLogin.status).toBe(200);


    const cambiarPasswordTecnicoResponse = await request(app).post("/api/auth/change-temporary-password").send({
      email: tecnico.email,
      temporaryPassword: temporaryPassword,
      newPassword: "123456!"
    });

    expect(cambiarPasswordTecnicoResponse.status).toBe(200);
    expect(cambiarPasswordTecnicoResponse.body).toHaveProperty("token");

    const tecnicoToken = cambiarPasswordTecnicoResponse.body.token;

    const meResponse = await request(app).get("/api/users/me").set("Authorization", `Bearer ${tecnicoToken}`);

    expect(meResponse.status).toBe(200);
    expect(meResponse.body.email).toBe(tecnico.email);
  });

  test("rechaza /api/users si no hay token admin", async () => {
    const tecnico = buildTecnico();

    const response = await request(app)
      .post("/api/users")
      .send({
        email: tecnico.email,
        role: tecnico.role,
        nombre: tecnico.nombre,
        telefono: tecnico.telefono,
      });

    expect(response.status).toBe(401);
  });
});