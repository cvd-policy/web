import { parsePolicyText } from "@cvd-policy/core/v1";
import { describe, expect, it } from "vitest";
import {
  createInitialV1Policy,
  isoDateTime,
  joinLines,
  localDateTime,
  parsePorts,
  positiveInteger,
  positiveNumber,
  splitLines,
} from "../src/lib/v1Editor.js";

describe("V1 guided editor helpers", () => {
  it("starts with a valid report-only V1 document", () => {
    const policy = createInitialV1Policy(new Date("2026-09-05T12:00:00Z"));
    const result = parsePolicyText(JSON.stringify(policy), { now: new Date("2026-09-05T12:00:00Z") });

    expect(result.valid).toBe(true);
    expect(policy.cvd_policy).toBe(1);
    expect(policy.expires).toBe("2027-03-05T12:00:00.000Z");
    expect(policy).not.toHaveProperty("canonical");
    expect(policy).not.toHaveProperty("report_requirements");
  });

  it("round-trips line lists and parses port lists", () => {
    expect(splitLines(" en\n\nde-DE\nen \n")).toEqual(["en", "de-DE"]);
    expect(joinLines(["en", "de-DE"])).toBe("en\nde-DE");
    expect(parsePorts("443, 8443 9443")).toEqual([443, 8443, 9443]);
    expect(parsePorts("443, 443")).toEqual([443]);
    expect(parsePorts(" ")).toBeUndefined();
    expect(parsePorts("0, 443")).toBeUndefined();
    expect(parsePorts("443.5")).toBeUndefined();
    expect(parsePorts("65536")).toBeUndefined();
  });

  it("accepts only positive numbers and integers", () => {
    expect(positiveNumber("0.25")).toBe(0.25);
    expect(positiveNumber("0")).toBeUndefined();
    expect(positiveNumber("not-a-number")).toBeUndefined();
    expect(positiveInteger("3")).toBe(3);
    expect(positiveInteger("3.5")).toBeUndefined();
  });

  it("round-trips a local date-time through an RFC3339 instant", () => {
    const instant = "2026-09-05T12:34:56.000Z";
    expect(isoDateTime(localDateTime(instant))).toBe(instant);
  });
});
