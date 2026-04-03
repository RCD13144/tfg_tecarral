import * as publicPresupuestoReparacionSchema from "../../src/schemas/publicPresupuestoReparacion.schema.js"

describe("validateTokenParam", () => {
    test("Debe validar un token publico recibido correcto", () => {
        const token = "a3f9c2e4b7d8f1a6c9e0d2b4f8a1c3e5d7f9a0b2c4e6d8f1a3b5c7d9e0f2a4c6"

        const result = publicPresupuestoReparacionSchema.validatePublicTokenParam(token);

        expect(result.ok).toEqual(true);
        expect(result.token).toEqual("a3f9c2e4b7d8f1a6c9e0d2b4f8a1c3e5d7f9a0b2c4e6d8f1a3b5c7d9e0f2a4c6");
        expect(result.errors).toEqual([]);

    });

    test("Debe invalidar un token publico recibido incorrecto", () => {
        const token = "a3f9c2e4b7d8f1a6c9e0d2b4f8a1c3e5d7f9a0b2c4e6d8f1a3b5c7d9e0f2a4c!"

        const result = publicPresupuestoReparacionSchema.validatePublicTokenParam(token);

        expect(result.ok).toEqual(false);
        expect(result.token).toEqual(null);
        expect(result.errors).toEqual(["token inválido"]);

    });

});