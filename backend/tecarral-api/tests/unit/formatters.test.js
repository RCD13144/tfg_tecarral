import * as formatters from "../../src/utils/formatters.js";

describe("formatDateES", () => {
  test("Debe formatear correctamente una fecha válida", () => {
    const value = "2025-01-10T00:00:00Z";

    const result = formatters.formatDateES(value);

    expect(typeof result).toEqual("string");
    expect(result.length > 0).toEqual(true);
  });

  test("Debe devolver el valor original si la fecha es inválida", () => {
    const value = "fecha-invalida";

    const result = formatters.formatDateES(value);

    expect(result).toEqual("fecha-invalida");
  });
});

describe("humanizeLogisticsStatus", () => {
  test("Debe transformar EN_CAMINO correctamente", () => {
    const value = "EN_CAMINO";

    const result = formatters.humanizeLogisticsStatus(value);

    expect(result).toEqual("En camino");
  });

  test("Debe transformar ENTREGADA correctamente", () => {
    const value = "entregada";

    const result = formatters.humanizeLogisticsStatus(value);

    expect(result).toEqual("Entregada");
  });

  test("Debe devolver — si el estado no es válido", () => {
    const value = "otro";

    const result = formatters.humanizeLogisticsStatus(value);

    expect(result).toEqual("—");
  });
});

describe("humanizeMaintenanceStatus", () => {
  test("Debe transformar OK correctamente", () => {
    const value = "ok";

    const result = formatters.humanizeMaintenanceStatus(value);

    expect(result).toEqual("Correcta");
  });

  test("Debe transformar AVERIADA correctamente", () => {
    const value = "AVERIADA";

    const result = formatters.humanizeMaintenanceStatus(value);

    expect(result).toEqual("Averiada");
  });

  test("Debe transformar AVERIADA_GRAVE correctamente", () => {
    const value = "AVERIADA_GRAVE";

    const result = formatters.humanizeMaintenanceStatus(value);

    expect(result).toEqual("Averiada grave");
  });

  test("Debe devolver — si el estado no es válido", () => {
    const value = "otro";

    const result = formatters.humanizeMaintenanceStatus(value);

    expect(result).toEqual("—");
  });
});

describe("humanizeTipoMaquina", () => {
  test("Debe transformar elevacion correctamente", () => {
    const value = "elevacion";

    const result = formatters.humanizeTipoMaquina(value);

    expect(result).toEqual("Elevación");
  });

  test("Debe transformar limpieza correctamente", () => {
    const value = "LIMPIEZA";

    const result = formatters.humanizeTipoMaquina(value);

    expect(result).toEqual("Limpieza");
  });

  test("Debe devolver el valor original si no coincide", () => {
    const value = "otro";

    const result = formatters.humanizeTipoMaquina(value);

    expect(result).toEqual("otro");
  });

  test("Debe devolver — si el valor es null o undefined", () => {
    const value = null;

    const result = formatters.humanizeTipoMaquina(value);

    expect(result).toEqual("—");
  });
});