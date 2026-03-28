import test from "node:test";
import assert from "node:assert/strict";
import { VISIT_TTL_MS, buildVisitRecord, parseVisitRecord } from "../lib/visitSessionCore.mjs";

test("buildVisitRecord sets a 3-hour expiry", () => {
  const now = 1_700_000_000_000;
  const raw = buildVisitRecord("visit_1", now);
  const parsed = JSON.parse(raw);

  assert.equal(parsed.visitId, "visit_1");
  assert.equal(parsed.expiresAt, now + VISIT_TTL_MS);
});

test("parseVisitRecord keeps a valid active visit", () => {
  const now = 1_700_000_000_000;
  const raw = JSON.stringify({ visitId: "visit_1", expiresAt: now + 1000 });

  assert.deepEqual(parseVisitRecord(raw, now), {
    visitId: "visit_1",
    expiresAt: now + 1000,
  });
});

test("parseVisitRecord drops expired visits", () => {
  const now = 1_700_000_000_000;
  const raw = JSON.stringify({ visitId: "visit_1", expiresAt: now - 1 });

  assert.equal(parseVisitRecord(raw, now), null);
});

test("parseVisitRecord upgrades legacy string storage", () => {
  const now = 1_700_000_000_000;
  const raw = JSON.stringify("legacy_visit");

  assert.deepEqual(parseVisitRecord(raw, now), {
    visitId: "legacy_visit",
    expiresAt: now + VISIT_TTL_MS,
  });
});
