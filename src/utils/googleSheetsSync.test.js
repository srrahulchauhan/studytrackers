import assert from "node:assert/strict";
import test from "node:test";
import { buildGoogleSheetsPayload } from "./googleSheetsSync.js";

test("builds a Google Sheets payload with a stable client record", () => {
  const payload = buildGoogleSheetsPayload(
    {
      preparations: [{ id: "p-1", name: "Physics" }],
      subjects: [{ id: "s-1", name: "Mechanics" }],
      sessions: [
        { id: "sess-1", date: "2026-10-07", actualStudyDuration: 1800 },
      ],
    },
    "local-user",
  );

  assert.equal(payload.clientId, "local-user");
  assert.equal(payload.data.preparations[0].name, "Physics");
  assert.equal(payload.data.sessions[0].actualStudyDuration, 1800);
  assert.ok(payload.meta.syncedAt);
  assert.equal(payload.meta.version, "2.5.0");
});

test("drops unsupported fields and keeps a safe payload shape", () => {
  const payload = buildGoogleSheetsPayload(
    {
      preparations: [{ id: "p-1", name: "Physics", undefinedValue: undefined }],
      settings: { theme: "dark" },
      notifications: null,
    },
    "local-user",
  );

  assert.equal(payload.data.notifications, null);
  assert.deepEqual(payload.data.settings, { theme: "dark" });
  assert.deepEqual(Object.keys(payload.data), [
    "preparations",
    "settings",
    "notifications",
  ]);
});
