import * as presupuestoReparacionSchema from "../../src/schemas/presupuestoReparacion.schema.js";

describe("validatePresupuestoReparacionIdParam", () => {
    test("Debe validar correctamente un id válido", () => {
        const value = 13;

        const result = presupuestoReparacionSchema.validatePresupuestoReparacionIdParam(value);

        expect(result).toEqual({
            "ok": true,
            "errors": [],
            "value": 13
        });
    });

    test("Debe fallar si se le pasa un id inválido", () => {
        const value = "13KLX";

        const result = presupuestoReparacionSchema.validatePresupuestoReparacionIdParam(value);

        expect(result).toEqual({
            "ok": false,
            "errors": ["id inválido"],
            "value": null
        });
    });
});


describe("validateCreatePresupuestoReparacionBody", () => {
    test("Debe validar correctamente el body si viene válido", () => {
        const body = {
            "reparacion_id": "7",
            "propuesta_alquiler_id": "9",
            "importe_total": 350.00,
            "condiciones": "Incluye cambio de motor y revisión completa",
            "expira_at": "2027-03-16T23:59:59+01:00"
        }

        const expectedDate = new Date(body.expira_at).toISOString(); 

        const result = presupuestoReparacionSchema.validateCreatePresupuestoReparacionBody(body);

        expect(result).toEqual({
            "ok": true,
            "errors": [],
            "value": {
                "reparacion_id": 7,
                "propuesta_alquiler_id": 9,
                "importe_total": 350.00,
                "condiciones": "Incluye cambio de motor y revisión completa",
                "expira_at": expectedDate
            }
        });
    });

    test("Debe fallar si le viene cualquier id inválido", () =>{
        const body = {
            "reparacion_id": "7KC",
            "propuesta_alquiler_id": "9KLD",
            "importe_total": 350.00,
            "condiciones": "Incluye cambio de motor y revisión completa",
            "expira_at": "2027-03-16T23:59:59+01:00"
        }

        const expectedDate = new Date(body.expira_at).toISOString(); 

        const result = presupuestoReparacionSchema.validateCreatePresupuestoReparacionBody(body);

        expect(result).toEqual({
            "ok": false,
            "errors": ["reparacion_id debe ser un entero positivo", "propuesta_alquiler_id debe ser un entero positivo"],
            "value": null
        });
    });

    test("Debe fallar cuando le viene un importe menor que 0", () =>{
        const body = {
            "reparacion_id": 7,
            "propuesta_alquiler_id": 9,
            "importe_total": -350,
            "condiciones": "Incluye cambio de motor y revisión completa",
            "expira_at": "2027-03-16T23:59:59+01:00"
        }

        const expectedDate = new Date(body.expira_at).toISOString(); 

        const result = presupuestoReparacionSchema.validateCreatePresupuestoReparacionBody(body);

        expect(result).toEqual({
            "ok": false,
            "errors": ["importe_total debe ser un número mayor o igual que 0"],
            "value": null
        });
    });

    test("Debe fallar cuando no le viene fecha en expira_at", () =>{
        const body = {
            "reparacion_id": 7,
            "propuesta_alquiler_id": 9,
            "importe_total": 350.00,
            "condiciones": "Incluye cambio de motor y revisión completa",
            "expira_at": ""
        } 

        const result = presupuestoReparacionSchema.validateCreatePresupuestoReparacionBody(body);

        expect(result).toEqual({
            "ok": false,
            "errors": ["expira_at es obligatorio","expira_at debe ser una fecha válida"],
            "value": null
        });
    });

    test("Debe salir bien aunque no tenga valor en condiciones", () =>{
        const body = {
            "reparacion_id": 7,
            "propuesta_alquiler_id": 9,
            "importe_total": 350.00,
            "expira_at": "2027-03-16T23:59:59+01:00"
        } 

        const expectedDate = new Date(body.expira_at).toISOString(); 

        const result = presupuestoReparacionSchema.validateCreatePresupuestoReparacionBody(body);

        expect(result).toEqual({
            "ok": true,
            "errors": [],
            "value": {
                "reparacion_id": 7,
                "propuesta_alquiler_id": 9,
                "importe_total": 350.00,
                "condiciones": null,
                "expira_at": expectedDate
            }
        });
    });

    test("Debe fallar cuando el importe total no es un numero", () =>{
        const body = {
            "reparacion_id": 7,
            "propuesta_alquiler_id": 9,
            "importe_total": "lasdkjf",
            "expira_at": "2027-03-16T23:59:59+01:00"
        } 

        
        const result = presupuestoReparacionSchema.validateCreatePresupuestoReparacionBody(body);

        expect(result).toEqual({
            "ok": false,
            "errors": ["importe_total debe ser un número"],
            "value": null
        });
    });

    test("Debe fallar cuando la fecha sea menor a la actual", () =>{
        const body = {
            "reparacion_id": 7,
            "propuesta_alquiler_id": 9,
            "importe_total": 360,
            "expira_at": "2026-03-16T23:59:59+01:00"
        } 

        //const expectedDate = new Date(body.expira_at).toISOString(); 

        const result = presupuestoReparacionSchema.validateCreatePresupuestoReparacionBody(body);

        expect(result).toEqual({
            "ok": false,
            "errors": ["expira_at debe ser una fecha futura"],
            "value": null
        });
    });
});
