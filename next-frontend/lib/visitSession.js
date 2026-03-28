import { buildVisitRecord, parseVisitRecord } from "./visitSessionCore.mjs";

/**
 * Per-table visit session so a new party at the same physical table does not see prior orders.
 * Stored in localStorage with a short TTL so the same party can keep using the flow
 * across refreshes/reopens, but the visit naturally expires after a few hours.
 */

export function visitStorageKey(cafeId, tableNumber) {
  return `qrdine:visit:${cafeId}:table:${tableNumber}`;
}

function readVisitRecord(key) {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    const parsed = parseVisitRecord(raw, Date.now());
    if (!parsed) {
      if (raw) localStorage.removeItem(key);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeVisitRecord(key, visitId) {
  if (typeof window === "undefined" || !visitId) return "";
  try {
    localStorage.setItem(key, buildVisitRecord(visitId, Date.now()));
    return visitId;
  } catch {
    return "";
  }
}

export function getOrCreateVisitId(cafeId, tableNumber) {
  if (typeof window === "undefined" || !cafeId || tableNumber == null) return "";
  try {
    const key = visitStorageKey(cafeId, tableNumber);
    const existing = readVisitRecord(key);
    if (existing?.visitId) {
      return writeVisitRecord(key, existing.visitId);
    }
    return writeVisitRecord(key, crypto.randomUUID());
  } catch {
    return "";
  }
}

export function rotateVisitId(cafeId, tableNumber) {
  if (typeof window === "undefined" || !cafeId || tableNumber == null) return "";
  try {
    return writeVisitRecord(visitStorageKey(cafeId, tableNumber), crypto.randomUUID());
  } catch {
    return "";
  }
}

export function peekVisitId(cafeId, tableNumber) {
  if (typeof window === "undefined" || !cafeId || tableNumber == null) return "";
  try {
    return readVisitRecord(visitStorageKey(cafeId, tableNumber))?.visitId || "";
  } catch {
    return "";
  }
}
