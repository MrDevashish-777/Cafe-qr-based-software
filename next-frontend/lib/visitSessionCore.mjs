export const VISIT_TTL_MS = 3 * 60 * 60 * 1000;

export function parseVisitRecord(raw, now = Date.now()) {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    const visitId = typeof parsed === "string" ? parsed : parsed?.visitId;
    const expiresAt =
      typeof parsed === "object" && parsed !== null ? Number(parsed.expiresAt) : Number.NaN;

    if (!visitId) return null;
    if (Number.isFinite(expiresAt) && expiresAt <= now) return null;

    return {
      visitId,
      expiresAt: Number.isFinite(expiresAt) ? expiresAt : now + VISIT_TTL_MS,
    };
  } catch {
    return null;
  }
}

export function buildVisitRecord(visitId, now = Date.now()) {
  return JSON.stringify({
    visitId,
    expiresAt: now + VISIT_TTL_MS,
  });
}
