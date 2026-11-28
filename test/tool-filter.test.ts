import { describe, expect, it } from "vitest";
import { isToolEnabled, parseServices } from "../src/tool-filter.js";
import { registerTools } from "../src/tools/index.js";

describe("parseServices", () => {
  it("accepts a comma-separated list", () => {
    expect([...parseServices("gmail,calendar")]).toEqual(["gmail", "calendar"]);
  });

  it("trims whitespace and ignores empty segments", () => {
    expect([...parseServices(" gmail , , calendar ")]).toEqual(["gmail", "calendar"]);
  });

  it("is case-insensitive", () => {
    expect([...parseServices("Gmail,CALENDAR")]).toEqual(["gmail", "calendar"]);
  });

  it("rejects an unknown service and names it", () => {
    expect(() => parseServices("gmail,mail")).toThrow(/Unknown service: mail/);
  });

  it("lists the valid services in the error", () => {
    expect(() => parseServices("nope")).toThrow(/gmail/);
  });

  it("rejects an empty list", () => {
    expect(() => parseServices("  ")).toThrow(/at least one/i);
  });
});

describe("isToolEnabled", () => {
  it("enables everything when no filter is given", () => {
    expect(isToolEnabled("google_gmail_send")).toBe(true);
    expect(isToolEnabled("google_youtube_search")).toBe(true);
  });

  it("matches on the domain segment", () => {
    const services = parseServices("gmail");
    expect(isToolEnabled("google_gmail_send", services)).toBe(true);
    expect(isToolEnabled("google_drive_get", services)).toBe(false);
  });

  it("treats account tools as their own domain", () => {
    const services = parseServices("account");
    expect(isToolEnabled("google_account_list", services)).toBe(true);
    expect(isToolEnabled("google_gmail_list", services)).toBe(false);
  });

  it("does not match a name that merely starts with a domain", () => {
    const services = parseServices("docs");
    expect(isToolEnabled("google_docs_get", services)).toBe(true);
    expect(isToolEnabled("google_document_get", services)).toBe(false);
  });
});

describe("registerTools with a service filter", () => {
  function collect(services?: Parameters<typeof registerTools>[1]): string[] {
    const names: string[] = [];
    const stub = {
      registerTool: (name: string) => {
        names.push(name);
        return {};
      },
    } as never;
    registerTools(stub, services);
    return names;
  }

  it("registers all 134 tools when no filter is given", () => {
    expect(collect()).toHaveLength(134);
  });

  it("registers only the requested domain", () => {
    const names = collect(parseServices("gmail"));
    expect(names.length).toBeGreaterThan(0);
    expect(names.every((name) => name.startsWith("google_gmail_"))).toBe(true);
  });

  it("registers a union of requested domains", () => {
    const names = collect(parseServices("gmail,calendar"));
    expect(names.some((name) => name.startsWith("google_gmail_"))).toBe(true);
    expect(names.some((name) => name.startsWith("google_calendar_"))).toBe(true);
    expect(names.some((name) => name.startsWith("google_drive_"))).toBe(false);
  });
});
