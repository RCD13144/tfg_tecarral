import pool from "../../src/config/db.js";

describe("Base de datos", () => {
  test("usa tecarral_test", async () => {
    const result = await pool.query("SELECT current_database()");
    
    console.log("DB actual:", result.rows[0].current_database);

    expect(result.rows[0].current_database).toBe("tecarral_test");
  });
});

afterAll(async () => {
  await pool.end();
});