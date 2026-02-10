export function normalize(value) {
    const exists = value !== undefined && value !== null && String(value).trim() !== "";
    if (!exists) {
        return undefined;
    }
    return String(value).trim().toLowerCase();
}
