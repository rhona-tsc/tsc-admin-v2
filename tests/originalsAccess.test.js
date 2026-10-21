import test from "node:test";
import assert from "node:assert/strict";

import { canAccessOriginalsPreview } from "../src/utils/originalsAccess.js";

test("named private-preview accounts can access Originals", () => {
  assert.equal(
    canAccessOriginalsPreview({ email: "hello@thesupremecollective.co.uk" }),
    true
  );
  assert.equal(
    canAccessOriginalsPreview({ email: "rhona@thesupremecollective.co.uk" }),
    true
  );
  assert.equal(
    canAccessOriginalsPreview({ email: "ewanneilmcintosh@gmail.com" }),
    true
  );
});

test("any Gmail username beginning with tsc can access Originals", () => {
  assert.equal(
    canAccessOriginalsPreview({ email: "tsc.test.account@gmail.com" }),
    true
  );
  assert.equal(
    canAccessOriginalsPreview({ email: "TSCanything@GMAIL.COM" }),
    true
  );
});

test("similar but non-matching addresses remain outside the preview", () => {
  assert.equal(
    canAccessOriginalsPreview({ email: "someone.tsc@gmail.com" }),
    false
  );
  assert.equal(
    canAccessOriginalsPreview({ email: "tsc.test.account@outlook.com" }),
    false
  );
});
