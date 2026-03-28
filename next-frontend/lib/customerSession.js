"use client";

const CUSTOMER_SESSION_TTL_MS = 3 * 60 * 60 * 1000;

export function customerSessionKey(cafeId, tableNumber) {
  return `customer:${cafeId}:table:${tableNumber}`;
}

export function getCustomerSession(cafeId, tableNumber) {
  if (typeof window === "undefined" || !cafeId || tableNumber == null) return null;
  try {
    const raw = localStorage.getItem(customerSessionKey(cafeId, tableNumber));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;

    const expiresAt = Number(parsed.expiresAt);
    if (Number.isFinite(expiresAt) && expiresAt <= Date.now()) {
      localStorage.removeItem(customerSessionKey(cafeId, tableNumber));
      return null;
    }

    return {
      cafeId: parsed.cafeId,
      tableNumber: parsed.tableNumber,
      name: parsed.name || "",
      phone: parsed.phone || "",
    };
  } catch {
    return null;
  }
}

export function setCustomerSession(cafeId, tableNumber, session) {
  if (typeof window === "undefined" || !cafeId || tableNumber == null) return;
  try {
    localStorage.setItem(
      customerSessionKey(cafeId, tableNumber),
      JSON.stringify({
        cafeId,
        tableNumber,
        name: session?.name || "",
        phone: session?.phone || "",
        expiresAt: Date.now() + CUSTOMER_SESSION_TTL_MS,
      })
    );
  } catch {
    // ignore
  }
}

export function clearCustomerSession(cafeId, tableNumber) {
  if (typeof window === "undefined" || !cafeId || tableNumber == null) return;
  try {
    localStorage.removeItem(customerSessionKey(cafeId, tableNumber));
  } catch {
    // ignore
  }
}
