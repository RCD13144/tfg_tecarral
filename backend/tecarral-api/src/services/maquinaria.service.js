import { getAllMaquinaria, getMaquinariaByIdFromDB, findMaquinaria } from "../repositories/maquina.repository.js";

export async function getMaquinaById(id) {
    const maquina = await getMaquinariaByIdFromDB(id);
    return maquina;
}

export async function getMaquinaria(filters = {}) {
    const hasFilters = Object.values(filters).some(v => v !== undefined);

    if (hasFilters) {
        const maquinas = await findMaquinaria(filters);
        return maquinas;
    }

    const maquinas = await getAllMaquinaria();
    return maquinas;
}
