import * as propuestaSchema from "../../src/schemas/propuesta.schema.js";

describe("validatePropuestaCreate", () => {
  test("Debe validar correctamente un body válido de creación de propuesta", () => {
    const body = {
      id_maquina: 12,
      cliente: "Cliente de prueba",
      email_cliente: "cliente@test.com",
      telefono: "600123456",
      direccion: "Calle Mayor 1",
      cp: "28001",
      poblacion: "Madrid",
      precio: 1500,
      fecha_inicio: "2030-01-10T10:00:00Z",
      fecha_fin: "2030-01-15T10:00:00Z",
    };

    const result = propuestaSchema.validatePropuestaCreate(body);

    expect(result.ok).toEqual(true);
    expect(result.data).toEqual({
      id_maquina: 12,
      cliente: "Cliente de prueba",
      email_cliente: "cliente@test.com",
      telefono: "600123456",
      direccion: "Calle Mayor 1",
      cp: "28001",
      poblacion: "Madrid",
      precio: 1500,
      fecha_inicio: "2030-01-10T10:00:00Z",
      fecha_fin: "2030-01-15T10:00:00Z",
    });
    expect(result.errors).toEqual([]);
  });

  test("Debe invalidar un body de creación si falta el cliente", () => {
    const body = {
      id_maquina: 12,
      cliente: "",
      email_cliente: "cliente@test.com",
      telefono: "600123456",
      direccion: "Calle Mayor 1",
      cp: "28001",
      poblacion: "Madrid",
      precio: 1500,
      fecha_inicio: "2025-01-10T10:00:00Z",
      fecha_fin: "2025-01-15T10:00:00Z",
    };

    const result = propuestaSchema.validatePropuestaCreate(body);

    expect(result.ok).toEqual(false);
    expect(result.data).toEqual(null);
    expect(result.errors).toContain("cliente requerido");
  });

  test("Debe invalidar un body de creación si el email es incorrecto", () => {
    const body = {
      id_maquina: 12,
      cliente: "Cliente de prueba",
      email_cliente: "cliente-test.com",
      telefono: "600123456",
      direccion: "Calle Mayor 1",
      cp: "28001",
      poblacion: "Madrid",
      precio: 1500,
      fecha_inicio: "2025-01-10T10:00:00Z",
      fecha_fin: "2025-01-15T10:00:00Z",
    };

    const result = propuestaSchema.validatePropuestaCreate(body);

    expect(result.ok).toEqual(false);
    expect(result.data).toEqual(null);
    expect(result.errors).toContain("email_cliente inválido");
  });

  test("Debe invalidar un body de creación si el teléfono es incorrecto", () => {
    const body = {
      id_maquina: 12,
      cliente: "Cliente de prueba",
      email_cliente: "cliente@test.com",
      telefono: "123",
      direccion: "Calle Mayor 1",
      cp: "28001",
      poblacion: "Madrid",
      precio: 1500,
      fecha_inicio: "2025-01-10T10:00:00Z",
      fecha_fin: "2025-01-15T10:00:00Z",
    };

    const result = propuestaSchema.validatePropuestaCreate(body);

    expect(result.ok).toEqual(false);
    expect(result.data).toEqual(null);
    expect(result.errors).toContain("telefono inválido");
  });

  test("Debe invalidar un body de creación si el precio es incorrecto", () => {
    const body = {
      id_maquina: 12,
      cliente: "Cliente de prueba",
      email_cliente: "cliente@test.com",
      telefono: "600123456",
      direccion: "Calle Mayor 1",
      cp: "28001",
      poblacion: "Madrid",
      precio: -15,
      fecha_inicio: "2025-01-10T10:00:00Z",
      fecha_fin: "2025-01-15T10:00:00Z",
    };

    const result = propuestaSchema.validatePropuestaCreate(body);

    expect(result.ok).toEqual(false);
    expect(result.data).toEqual(null);
    expect(result.errors).toContain("precio inválido");
  });

  test("Debe invalidar un body de creación si fecha_fin es menor o igual que fecha_inicio", () => {
    const body = {
      id_maquina: 12,
      cliente: "Cliente de prueba",
      email_cliente: "cliente@test.com",
      telefono: "600123456",
      direccion: "Calle Mayor 1",
      cp: "28001",
      poblacion: "Madrid",
      precio: 1500,
      fecha_inicio: "2025-01-10T10:00:00Z",
      fecha_fin: "2025-01-10T09:00:00Z",
    };

    const result = propuestaSchema.validatePropuestaCreate(body);

    expect(result.ok).toEqual(false);
    expect(result.data).toEqual(null);
    expect(result.errors).toContain("fecha_fin debe ser mayor que fecha_inicio");
  });

  test("Debe invalidar un body de creación si id_maquina no es válido", () => {
    const body = {
      id_maquina: "abc",
      cliente: "Cliente de prueba",
      email_cliente: "cliente@test.com",
      telefono: "600123456",
      direccion: "Calle Mayor 1",
      cp: "28001",
      poblacion: "Madrid",
      precio: 1500,
      fecha_inicio: "2025-01-10T10:00:00Z",
      fecha_fin: "2025-01-15T10:00:00Z",
    };

    const result = propuestaSchema.validatePropuestaCreate(body);

    expect(result.ok).toEqual(false);
    expect(result.data).toEqual(null);
    expect(result.errors).toContain("id_maquina inválido");
  });

  test("Debe invalidar un body de creación si fecha_inicio es menor que la fecha actual", () => {
    const body = {
      id_maquina: 12,
      cliente: "Cliente de prueba",
      email_cliente: "cliente@test.com",
      telefono: "600123456",
      direccion: "Calle Mayor 1",
      cp: "28001",
      poblacion: "Madrid",
      precio: 1500,
      fecha_inicio: "2026-04-01T10:00:00Z",
      fecha_fin: "2026-04-07T09:00:00Z",
    };

    const result = propuestaSchema.validatePropuestaCreate(body);

    expect(result.ok).toEqual(false);
    expect(result.data).toEqual(null);
    expect(result.errors).toContain("fecha_inicio debe ser mayor a la fecha actual");
  });

});

describe("validatePropuestaUpdate", () => {
  test("Debe validar correctamente un body válido de actualización de propuesta", () => {
    const body = {
      cliente: "Cliente actualizado",
      email_cliente: "actualizado@test.com",
      telefono: "699123456",
      precio: 1750,
      fecha_inicio: "2030-02-01T10:00:00Z",
      fecha_fin: "2030-02-05T10:00:00Z",
    };

    const result = propuestaSchema.validatePropuestaUpdate(body);

    expect(result.ok).toEqual(true);
    expect(result.data).toEqual({
      cliente: "Cliente actualizado",
      email_cliente: "actualizado@test.com",
      telefono: "699123456",
      precio: 1750,
      fecha_inicio: "2030-02-01T10:00:00Z",
      fecha_fin: "2030-02-05T10:00:00Z",
    });
    expect(result.errors).toEqual([]);
  });

  test("Debe invalidar un body vacío de actualización", () => {
    const body = {};

    const result = propuestaSchema.validatePropuestaUpdate(body);

    expect(result.ok).toEqual(false);
    expect(result.data).toEqual(null);
    expect(result.errors).toContain("Body vacío: no hay campos para editar");
  });

  test("Debe invalidar un campo no editable en actualización", () => {
    const body = {
      cliente: "Cliente actualizado",
      id_maquina: 10,
    };

    const result = propuestaSchema.validatePropuestaUpdate(body);

    expect(result.ok).toEqual(false);
    expect(result.data).toEqual(null);
    expect(result.errors).toContain("Campo no editable: id_maquina");
  });

  test("Debe invalidar un email incorrecto en actualización", () => {
    const body = {
      email_cliente: "email-invalido",
    };

    const result = propuestaSchema.validatePropuestaUpdate(body);

    expect(result.ok).toEqual(false);
    expect(result.data).toEqual(null);
    expect(result.errors).toContain("email_cliente inválido");
  });

  test("Debe invalidar un teléfono incorrecto en actualización", () => {
    const body = {
      telefono: "1234",
    };

    const result = propuestaSchema.validatePropuestaUpdate(body);

    expect(result.ok).toEqual(false);
    expect(result.data).toEqual(null);
    expect(result.errors).toContain("telefono inválido");
  });

  test("Debe invalidar un precio incorrecto en actualización", () => {
    const body = {
      precio: 0,
    };

    const result = propuestaSchema.validatePropuestaUpdate(body);

    expect(result.ok).toEqual(false);
    expect(result.data).toEqual(null);
    expect(result.errors).toContain("precio inválido");
  });

  test("Debe invalidar fechas incorrectas en actualización", () => {
    const body = {
      fecha_inicio: "2025-03-10T10:00:00Z",
      fecha_fin: "2025-03-10T09:00:00Z",
    };

    const result = propuestaSchema.validatePropuestaUpdate(body);

    expect(result.ok).toEqual(false);
    expect(result.data).toEqual(null);
    expect(result.errors).toContain("fecha_fin debe ser mayor que fecha_inicio");
  });
});

describe("validateExpireQuery", () => {
  test("Debe validar correctamente una query vacía usando el limit por defecto", () => {
    const query = {};

    const result = propuestaSchema.validateExpireQuery(query);

    expect(result.ok).toEqual(true);
    expect(result.data).toEqual({ limit: 500 });
    expect(result.errors).toEqual([]);
  });

  test("Debe validar correctamente una query con limit válido", () => {
    const query = {
      limit: "1000",
    };

    const result = propuestaSchema.validateExpireQuery(query);

    expect(result.ok).toEqual(true);
    expect(result.data).toEqual({ limit: 1000 });
    expect(result.errors).toEqual([]);
  });

  test("Debe invalidar una query con limit incorrecto", () => {
    const query = {
      limit: "6000",
    };

    const result = propuestaSchema.validateExpireQuery(query);

    expect(result.ok).toEqual(false);
    expect(result.data).toEqual(null);
    expect(result.errors).toContain("limit inválido (1..5000)");
  });
});