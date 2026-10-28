import test from "node:test";
import assert from "node:assert/strict";

import {
  allocationMatchesRoleSlot,
  normaliseAllocationRole,
} from "./allocationRoles.js";

test("legacy short roles match the formal lineup roles", () => {
  assert.equal(normaliseAllocationRole("Bass"), "Bass Guitar");
  assert.equal(normaliseAllocationRole("Keys"), "Keyboard");
  assert.equal(normaliseAllocationRole("Guitar"), "Electric Guitar");
  assert.equal(normaliseAllocationRole("Sax"), "Saxophone");
  assert.equal(normaliseAllocationRole("Female Lead Vocals"), "Lead Female Vocal");
  assert.equal(normaliseAllocationRole("Drums"), "Drums");
});

test("rapper roles remain distinct from ordinary lead-vocal slots", () => {
  assert.equal(
    normaliseAllocationRole("Female Vocal / Rapper"),
    "Lead Female Vocal / Rapper",
  );
});

test("legacy role slot ids still match canonical lineup slots", () => {
  assert.equal(
    allocationMatchesRoleSlot(
      { role: "Bass", roleSlotId: "bass-1" },
      { role: "Bass Guitar", roleSlotId: "bass-guitar-1" },
    ),
    true,
  );
  assert.equal(
    allocationMatchesRoleSlot(
      { role: "Female Lead Vocals", roleSlotId: "female-lead-vocals-1" },
      { role: "Lead Female Vocal", roleSlotId: "lead-female-vocal-1" },
    ),
    true,
  );
  assert.equal(
    allocationMatchesRoleSlot(
      { role: "Lead Female Vocal", roleSlotId: "lead-female-vocal-2" },
      { role: "Lead Female Vocal", roleSlotId: "lead-female-vocal-1" },
    ),
    false,
  );
});

