import test from "node:test";
import assert from "node:assert/strict";
import {
  finalDetailsDueISO,
  isWorkingDayISO,
  previousWorkingDayISO,
} from "./finalDetailsDueDate.js";

test("uses Thursday in the week before a Saturday booking", () => {
  assert.equal(
    finalDetailsDueISO({ eventDateISO: "2026-11-21", bookingDateISO: "2026-09-27" }),
    "2026-11-12",
  );
});

test("uses the midpoint for a booking made after the standard deadline", () => {
  assert.equal(
    finalDetailsDueISO({ eventDateISO: "2026-11-21", bookingDateISO: "2026-11-18" }),
    "2026-11-19",
  );
});

test("moves a Christmas Eve deadline to the previous working day", () => {
  assert.equal(
    finalDetailsDueISO({ eventDateISO: "2026-12-31", bookingDateISO: "2026-01-15" }),
    "2026-12-23",
  );
});

test("treats weekends, England and Wales bank holidays, and Christmas Eve as closed", () => {
  assert.equal(isWorkingDayISO("2026-12-24"), false);
  assert.equal(isWorkingDayISO("2026-12-25"), false);
  assert.equal(isWorkingDayISO("2026-12-28"), false);
  assert.equal(isWorkingDayISO("2026-12-29"), true);
  assert.equal(previousWorkingDayISO("2026-12-28"), "2026-12-23");
});


test("Sarah's saved dates and deadline agree for the New Year's Eve booking", () => {
  const row = {eventDateISO: "2026-12-31", bookingDateISO: "2026-11-01", invoiceDueDateISO: "2026-12-23", extrasInvoiceDueDateISO: "2026-12-23"};
  assert.equal(finalDetailsDueISO(row), row.invoiceDueDateISO);
  assert.equal(finalDetailsDueISO(row), row.extrasInvoiceDueDateISO);
});

test("rolls back across Easter, bank-holiday Mondays and Christmas substitutes", () => {
  for (const [closed, expected] of [
    ["2026-04-06", "2026-04-02"],
    ["2026-05-04", "2026-05-01"],
    ["2026-05-25", "2026-05-22"],
    ["2026-08-31", "2026-08-28"],
    ["2027-01-01", "2026-12-31"],
    ["2027-12-28", "2027-12-23"],
  ]) assert.equal(previousWorkingDayISO(closed), expected);
});

test("moves late-booking midpoints off weekends and bank holidays", () => {
  assert.equal(finalDetailsDueISO({eventDateISO: "2026-11-22", bookingDateISO: "2026-11-20"}), "2026-11-20");
  assert.equal(finalDetailsDueISO({eventDateISO: "2026-05-08", bookingDateISO: "2026-05-01"}), "2026-05-01");
});

test("ordinary deadlines remain unchanged and missing dates remain blank", () => {
  assert.equal(finalDetailsDueISO({eventDateISO:"2026-12-30", bookingDateISO:"2026-11-01"}), "2026-12-23");
  assert.equal(finalDetailsDueISO({eventDateISO:"2026-12-19", bookingDateISO:"2026-11-01"}), "2026-12-10");
  assert.equal(finalDetailsDueISO({}), "");
});
