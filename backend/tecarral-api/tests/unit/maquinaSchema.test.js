import * as maquinaSchema from "../../src/schemas/maquina.schema.js";

describe("validateId", () => {
    test("Debe validar correctamente un id válido", () => {
        const value = 13;

        const result = maquinaSchema.validateId(value);

        expect(result).toEqual(true);
    });

    test("Debe validar correctamente un id válido", () => {
        const value = "13laksdfj";

        const result = maquinaSchema.validateId(value);

        expect(result).toEqual(false);
    });
});

describe("validateTipoMaquina", () => {
    test("Debe validar si el tipo de la maquina es correcto (elevacion/limpieza)", () => {
        const tipo = "elevacion";

        const result = maquinaSchema.validateTipoMaquina(tipo);

        expect(result).toEqual(true);
    });
});

describe("validateSubtipoMaquina", () => {
    test("Debe validar si el subtipo de la maquina es correcto (Carretilla elevad., Barredora, etc)", () => {
        const subtipo = "Barredora";

        const result = maquinaSchema.validateSubtipoMaquina(subtipo);

        expect(result).toEqual(true);
    });
});


describe("validateAvailability", () => {
    test("Debe validar si el tipo de disponibilidad es correcto", () => {
        const availability = "alquilada";

        const result = maquinaSchema.validateAvailability(availability);

        expect(result).toEqual(true);
    });
});

describe("validateUbicacionType", () => {
    test("Debe validar si el tipo de ubicacion es correcto", () => {
        const ubicacionTipo = "desconocida";

        const result = maquinaSchema.validateUbicacionType(ubicacionTipo);

        expect(result).toEqual(true);
    });
});

describe("validateMotorType", () => {
    test("Debe validar si el tipo de motor es correcto", () => {
        const motorTipo = "manual";

        const result = maquinaSchema.validateMotorType(motorTipo);

        expect(result).toEqual(true);
    });
});

describe("canonicalUbicacionType", () => {
    test("Debe validar si la asignacion de ubicaciones es correcta", () => {
        const ubicacionTipo = "alMaCeN";

        const result = maquinaSchema.canonicalUbicacionType(ubicacionTipo);

        expect(result).toEqual("ALMACEN");
    });
});


describe("canonicalMotor", () => {
    test("Debe validar si la asignacion de motores es correcta", () => {
        const motorTipo = "diéSel";

        const result = maquinaSchema.canonicalMotor(motorTipo);

        expect(result).toEqual("Diésel");
    });
});

describe("validateLogisticsStatus", () => {
    test("Debe validar si el tipo de estado de logistica es correcto", () => {
        const motorTipo = "entregada";

        const result = maquinaSchema.validateLogisticsStatus(motorTipo);

        expect(result).toEqual(true);
    });
});

describe("validateMaintenanceStatus", () => {
    test("Debe validar si el tipo de estado de mantenimiento es correcto", () => {
        const maintenanceStatus = "ok";

        const result = maquinaSchema.validateMaintenanceStatus(maintenanceStatus);

        expect(result).toEqual(true);
    });
});

describe("validateUbicacionTipoDestino", () => {
    test("Debe validar si el tipo de tipo de ubicacion es correcto para la funcion dada", () => {
        const ubicacionTipo = "taLlÉr";

        const result = maquinaSchema.validateUbicacionTipoDestino(ubicacionTipo);

        expect(result).toEqual(true);
    });
});

describe("validateDestinoBase", () => {
    test("Debe validar si el tipo de ubicacion es correcta con respecto al destino", () => {
        const ubicacionTipo = "tÁLlÉr";

        const result = maquinaSchema.validateDestinoBase(ubicacionTipo);

        expect(result).toEqual(true);
    });
});

describe("isUbicacionTextUsable", () => {
    test("Debe validar si el tipo de ubicación es correcta entre las posibles opciones", () => {
        const ubicacionTipo = "CLIENTE";

        const result = maquinaSchema.isUbicacionTextUsable(ubicacionTipo);

        expect(result).toEqual(true);
    });
});

describe("validateMaintenanceStatusPatch", () => {
    test("Debe validar si el tipo de ubicación AVERIADA o AVERIADA_GRAVE", () => {
        const maintenanceStatus = {maintenance_status: "AVERIADA_GRAVELKDLF"};

        const result = maquinaSchema.validateMaintenanceStatusPatch(maintenanceStatus);

        expect(result).toEqual(false);
    });
});

describe("validateAbrirIncidenciaBody", () => {
    test("Debe validar si el body entrante del endpoint abrir incidencia es válido o no", () => {
        const body = {
            "maintenance_status": "AVERIADA_GRAVE", 
            "propuesta_alquiler_id": 7,
            "comentario": "Comentario de prueba"
        }
        const result = maquinaSchema.validateAbrirIncidenciaBody(body);

        expect(result).toEqual(true);
    });
});
