"use client";

const STORAGE_PREFIX = "qrdine:table";

export function tableSessionKey(cafeId) {
  return `${STORAGE_PREFIX}:${cafeId}`;
}

export function getTableSession(cafeId) {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(tableSessionKey(cafeId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.tableNumber || !parsed.token) return null;
    return {
      tableNumber: parsed.tableNumber,
      token: parsed.token,
      ts: parsed.ts,
    };
  } catch {
    return null;
  }
}

export function setTableSession(cafeId, tableNumber, token) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(
      tableSessionKey(cafeId),
      JSON.stringify({
        tableNumber: Number(tableNumber),
        token,
        ts: Date.now(),
      })
    );
  } catch {
    // ignore
  }
}

export function clearTableSession(cafeId) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(tableSessionKey(cafeId));
  } catch {
    // ignore
  }
}
