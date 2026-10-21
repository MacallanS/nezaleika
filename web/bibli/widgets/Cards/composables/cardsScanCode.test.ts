import { describe, expect, it } from "vitest";
import {
  duplicateCardScanMessage,
  normalizeScanCode,
  scanListHasCode,
} from "./cardsScanCode";

describe("cardsScanCode", () => {
  it("normalizes whitespace and case for duplicate check", () => {
    expect(normalizeScanCode("  ab-12 ")).toBe("AB-12");
    expect(scanListHasCode(["ab-12"], "AB-12")).toBe(true);
    expect(scanListHasCode(["ab-12"], "cd-99")).toBe(false);
  });

  it("builds russian duplicate message with code", () => {
    const msg = duplicateCardScanMessage("OTP123");
    expect(msg).toContain("OTP123");
    expect(msg).toContain("уже была отсканирована");
  });
});
