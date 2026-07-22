import { describe, expect, it } from "vitest";

import { draftWindow } from "./auto-draft";

const hours = { open: "06:00", close: "19:00" };

describe("draftWindow", () => {
  it("uses a single range as-is when inside business hours", () => {
    expect(draftWindow([{ start: "08:00", end: "14:00" }], hours)).toEqual({
      start: "08:00",
      end: "14:00",
    });
  });

  it("spans earliest start to latest end across disjoint ranges", () => {
    expect(
      draftWindow(
        [
          { start: "06:00", end: "09:00" },
          { start: "13:00", end: "16:00" },
        ],
        hours,
      ),
    ).toEqual({ start: "06:00", end: "16:00" });
  });

  it("clamps to the day's open and close", () => {
    expect(
      draftWindow([{ start: "05:00", end: "22:00" }], hours),
    ).toEqual({ start: "06:00", end: "19:00" });
  });

  it("returns null with no ranges", () => {
    expect(draftWindow([], hours)).toBeNull();
  });

  it("returns null when availability is entirely before open", () => {
    expect(draftWindow([{ start: "03:00", end: "05:00" }], hours)).toBeNull();
  });

  it("returns null when availability is entirely after close", () => {
    expect(draftWindow([{ start: "20:00", end: "22:00" }], hours)).toBeNull();
  });
});
