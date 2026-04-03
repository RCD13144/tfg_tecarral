import * as authSchema from "../../src/schemas/auth.schema.js"

describe("validateLoginBody", () => {
    test("Debe validar si el email contiene @ o no", () => {
        const body = {
            "email": "test4tecarral.com",
            "password": "123456"
        }

        const result = authSchema.validateLoginBody(body);

        expect(result).toEqual({
            ok: false,
            errors: ["email no es válido"],
            value: null
        });
    });

    test("Debe validar si un email vacio es valido (No deberia serlo)", () => {
        const body = {
            "email": "",
            "password": "123456"
        }

        const result = authSchema.validateLoginBody(body);

        expect(result).toEqual({
            ok: false,
            errors: ["email es obligatorio"],
            value: null
        });
    });

    test("Debe validar si la password existe", () => {
        const body = {
            "email": "test4@tecarral.com",
            "password": "1234"
        }

        const result = authSchema.validateLoginBody(body);

        expect(result).toEqual({
            ok: true,
            errors: [],
            value: {
                "email": "test4@tecarral.com",
                "password": "1234"
            }
        });
    });

    test("Debe validar si la password no existe", () => {
        const body = {
            "email": "test4@tecarral.com",
            "password": ""
        }

        const result = authSchema.validateLoginBody(body);

        expect(result).toEqual({
            ok: false,
            errors: ["password es obligatorio"],
            value: null
        });
    });
});