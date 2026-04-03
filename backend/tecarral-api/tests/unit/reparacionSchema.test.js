import * as reparacionSchema from "../../src/schemas/reparacion.schema.js"

describe("validateMarcarReparacionTerminadaBody", () => {
    test("Debe validar si la solucion aplicada es un string", () => {
        const body = {
            "solucion_aplicada": "Se ha cambiado una bujía para que funcione el conjunto entero. Cambio de aceite al completo"
        }

        const result = reparacionSchema.validateMarcarReparacionTerminadaBody(body);

        expect(result).toEqual({
            ok: true,
            errors: [],
            value: {
                "solucion_aplicada": "Se ha cambiado una bujía para que funcione el conjunto entero. Cambio de aceite al completo"
            }
        });
    });

    test("Debe validar si la solucion aplicada no es un string", () => {
        const body = {
            "solucion_aplicada": 7
        }

        const result = reparacionSchema.validateMarcarReparacionTerminadaBody(body);

        expect(result).toEqual({
            ok: false,
            errors: ["solucion_aplicada debe ser texto o null"],
            value: null
        });
    });

    test("Debe validar si la solucion aplicada tiene más de 2000 caracteres o no", () => {
        const body = {
            "solucion_aplicada": `
                TextoDeEjemplo_0001_Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                TextoDeEjemplo_0002_Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                TextoDeEjemplo_0003_Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                TextoDeEjemplo_0004_Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                TextoDeEjemplo_0005_Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                TextoDeEjemplo_0006_Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                TextoDeEjemplo_0007_Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                TextoDeEjemplo_0008_Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                TextoDeEjemplo_0009_Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                TextoDeEjemplo_0010_Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                TextoDeEjemplo_0011_Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                TextoDeEjemplo_0012_Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                TextoDeEjemplo_0013_Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                TextoDeEjemplo_0014_Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                TextoDeEjemplo_0015_Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

            `
        }

        const result = reparacionSchema.validateMarcarReparacionTerminadaBody(body);

        expect(result).toEqual({
            ok: false,
            errors: ["solucion_aplicada no puede superar los 2000 caracteres"],
            value: null
        });
    });



});