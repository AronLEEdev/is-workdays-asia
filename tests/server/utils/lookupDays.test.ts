import { describe, it, expect, vi } from "vitest";
import { resolveDay, lookupDaysInRange } from "../../../server/utils/lookupDays";

describe("resolveDay", () => {
  it("returns the DB entry as-is when one is provided", () => {
    const entry = {
      date: "2026-02-17",
      country: "CN",
      is_working: false,
      day_type: "holiday" as const,
      name_en: "Chinese New Year's Day",
      name_local: "春节",
    };
    expect(resolveDay("2026-02-17", "CN", entry)).toEqual(entry);
  });

  it("infers working day for a weekday with no DB entry", () => {
    // 2026-02-02 is a Monday
    expect(resolveDay("2026-02-02", "CN")).toEqual({
      date: "2026-02-02",
      country: "CN",
      is_working: true,
      day_type: "working",
      name_en: null,
      name_local: null,
    });
  });

  it("infers weekend for Saturday with no DB entry", () => {
    // 2026-02-07 is a Saturday
    expect(resolveDay("2026-02-07", "CN")).toEqual({
      date: "2026-02-07",
      country: "CN",
      is_working: false,
      day_type: "weekend",
      name_en: null,
      name_local: null,
    });
  });

  it("infers weekend for Sunday with no DB entry", () => {
    // 2026-02-08 is a Sunday
    expect(resolveDay("2026-02-08", "CN")).toEqual({
      date: "2026-02-08",
      country: "CN",
      is_working: false,
      day_type: "weekend",
      name_en: null,
      name_local: null,
    });
  });

  it("returns a makeup entry as-is (is_working: true from DB)", () => {
    const entry = {
      date: "2026-02-28",
      country: "CN",
      is_working: true,
      day_type: "makeup" as const,
      name_en: "Makeup workday for Chinese New Year Holiday",
      name_local: "春节调休上班",
    };
    expect(resolveDay("2026-02-28", "CN", entry)).toEqual(entry);
  });
});

describe("lookupDaysInRange", () => {
  it("returns all inferred days when no DB entries exist", async () => {
    const sql = vi.fn().mockResolvedValue([]);
    // 2026-02-02 (Mon) to 2026-02-04 (Wed) — 3 working days
    const days = await lookupDaysInRange(sql as any, "CN", "2026-02-02", "2026-02-04");
    expect(days).toHaveLength(3);
    expect(days.every((d) => d.is_working)).toBe(true);
    expect(days.every((d) => d.day_type === "working")).toBe(true);
  });

  it("uses DB entry for special days and infers the rest", async () => {
    const sql = vi.fn().mockResolvedValue([
      {
        date: "2026-02-17",
        country: "CN",
        is_working: false,
        day_type: "holiday",
        name_en: "Chinese New Year's Day",
        name_local: "春节",
      },
    ]);
    // 2026-02-16 (Mon), 2026-02-17 (Tue, holiday), 2026-02-18 (Wed)
    const days = await lookupDaysInRange(sql as any, "CN", "2026-02-16", "2026-02-18");
    expect(days).toHaveLength(3);
    expect(days[0]).toMatchObject({ date: "2026-02-16", is_working: true, day_type: "working" });
    expect(days[1]).toMatchObject({ date: "2026-02-17", is_working: false, day_type: "holiday", name_en: "Chinese New Year's Day" });
    expect(days[2]).toMatchObject({ date: "2026-02-18", is_working: true, day_type: "working" });
  });

  it("returns days sorted by date ascending", async () => {
    const sql = vi.fn().mockResolvedValue([]);
    const days = await lookupDaysInRange(sql as any, "CN", "2026-02-02", "2026-02-06");
    const dates = days.map((d) => d.date);
    expect(dates).toEqual(["2026-02-02", "2026-02-03", "2026-02-04", "2026-02-05", "2026-02-06"]);
  });

  it("returns the full range even when no special entries exist", async () => {
    const sql = vi.fn().mockResolvedValue([]);
    const days = await lookupDaysInRange(sql as any, "CN", "2026-03-01", "2026-03-07");
    expect(days).toHaveLength(7);
  });
});
