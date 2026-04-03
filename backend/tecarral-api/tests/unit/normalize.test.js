import * as normalizeFile from "../../src/utils/normalize.js";

describe("validateFirmarAlbaranBody", () => {
    test("Debe validar si la normalizacion acepta tildes como entrada", () => {

        const value = "máquina con avería";
        const result = normalizeFile.normalize(value);
        expect(result).toEqual("maquina con averia");
    });

    test("Debe validar si la normalizacion acepta tildes y mayusculas como entrada", () => {

        const value = "aVeríAda_GraVE";
        const result = normalizeFile.normalize(value);
        expect(result).toEqual("averiada_grave");
    });

});