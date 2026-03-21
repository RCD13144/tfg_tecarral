// src/constants/maintenanceStatus.js
export const MAINTENANCE_STATUS = Object.freeze({
  OK: "OK",
  AVERIADA: "AVERIADA",
  AVERIADA_GRAVE: "AVERIADA_GRAVE",
});

export const MAINTENANCE_STATUS_LIST = Object.freeze(Object.values(MAINTENANCE_STATUS));