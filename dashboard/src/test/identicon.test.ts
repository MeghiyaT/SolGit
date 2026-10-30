import test from "node:test";
import assert from "node:assert/strict";
import { getIdenticonGrid } from "../lib/identicon.ts";

test("getIdenticonGrid produces 5x5 symmetric grid", () => {
  const addr = "0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7";
  const { grid, color } = getIdenticonGrid(addr);

  assert.equal(grid.length, 5);
  for (const row of grid) {
    assert.equal(row.length, 5);
    // GitHub identicons are horizontally symmetric: cell 0 == cell 4, cell 1 == cell 3
    assert.equal(row[0], row[4]);
    assert.equal(row[1], row[3]);
  }

  assert.match(color, /^hsl\(\d+, \d+%, \d+%\)$/);
});

test("getIdenticonGrid is deterministic", () => {
  const addr = "0x1234567890123456789012345678901234567890";
  const res1 = getIdenticonGrid(addr);
  const res2 = getIdenticonGrid(addr);
  assert.deepEqual(res1, res2);
});
