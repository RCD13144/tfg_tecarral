import { getAllMaquinaria, getMaquinariaByIdFromDB, findMaquinaria, suggestModelo, suggestMarca, suggestSubtipo, suggestNS, suggestMotor, suggestTipo, crearMaquina, editarMaquina, deleteMaquina} from "../repositories/maquina.repository.js";

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

export async function suggestModeloFromDB(text) {
    const maquina = await suggestModelo(text);
    return maquina;
}

export async function suggestMarcaFromDB(text) {
    const maquina = await suggestMarca(text);
    return maquina;
}

export async function suggestSubtipoFromDB(text) {
    const maquina = await suggestSubtipo(text);
    return maquina;
}

export async function suggestNSfromDB(text) {
    const maquina = await suggestNS(text);
    return maquina;
}

export async function suggestMotorfromDB(text) {
    const maquina = await suggestMotor(text);
    return maquina;
}

export async function suggestTipofromDB(text) {
    const maquina = await suggestTipo(text);
    return maquina;
}

export async function crearMaquinaIntoDB(subtipo, marca, motor, modelo, ns, seguro, num_poliza, alquilada, ubicacion, observaciones, tipo, ubicacion_tipo){
    const maquina = await crearMaquina(subtipo, marca, motor, modelo, ns, seguro, num_poliza, alquilada, ubicacion, observaciones, tipo, ubicacion_tipo);
    return maquina;
}

export async function editarMaquinariaByIdFromDB(id, patch) {
    const maquina = await editarMaquina(id, patch);
    return maquina;
}

export async function deleteMaquinariaByIdFromDB(id){
    const maquina = await deleteMaquina(id);
    return maquina;
}