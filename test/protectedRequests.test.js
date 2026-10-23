import test from "node:test";
import assert from "node:assert/strict";
import { attachProtectedRequestToken } from "../src/utils/protectedRequests.js";

const backend = "https://tsc-backend-v2.onrender.com";
test("finance and uploads receive the current login token", () => {
  for (const path of ["/api/finance/accounts", "/api/upload/doc", "/api/admin/rebuild-badge"]) {
    const config = attachProtectedRequestToken({ url: backend + path }, backend, () => "test-session");
    assert.equal(config.headers.Authorization, "Bearer test-session");
  }
});
test("tokens never go to external hosts, lookalike paths or public requests", () => {
  for (const url of ["https://external.example/api/finance/accounts", "https://tsc-backend-v2.onrender.com.evil.example/api/upload/doc", "/api/act/cards", "/api/finance-other"]) {
    const config = attachProtectedRequestToken({ url }, backend, () => "test-session");
    assert.equal(config.headers, undefined);
  }
});
test("an existing authorization header is preserved and signed-out requests stay anonymous", () => {
  const config = attachProtectedRequestToken({ url: backend + "/api/upload/doc", headers: { authorization: "Bearer original" } }, backend, () => "other");
  assert.deepEqual(config.headers, { authorization: "Bearer original" });
  assert.equal(attachProtectedRequestToken({ url: backend + "/api/finance/accounts" }, backend, () => "").headers, undefined);
});
