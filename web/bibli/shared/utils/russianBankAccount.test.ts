import { describe, expect, it } from "vitest";
import {
  getBankAccountValidationError,
  getCorrespondentAccountValidationError,
  isValidBik,
  validateKs,
  validateRs,
} from "./russianBankAccount";

describe("russianBankAccount", () => {
  it("accepts valid RS+BIK", () => {
    expect(validateRs("40817810100000000009", "044525225")).toBe(true);
    expect(getBankAccountValidationError("40817810100000000009", "044525225")).toBeNull();
  });

  it("rejects invalid control digit", () => {
    expect(validateRs("40817810123456789112", "044525225")).toBe(false);
    expect(getBankAccountValidationError("40817810123456789112", "044525225")).toMatch(
      /Контрольное число/
    );
  });

  it("accepts dotted and dashed masks", () => {
    expect(validateRs("408-17-810-1-0000-0000009", "044525225")).toBe(true);
    expect(validateRs("408.17.810.1.0000.0000009", "044525225")).toBe(true);
  });

  it("validates BIK length", () => {
    expect(isValidBik("044525225")).toBe(true);
    expect(isValidBik("44525225")).toBe(false);
  });

  it("accepts valid KS+BIK", () => {
    expect(validateKs("30101810400000000225", "044525225")).toBe(true);
    expect(
      getCorrespondentAccountValidationError("30101810400000000225", "044525225"),
    ).toBeNull();
  });

  it("rejects invalid KS control digit", () => {
    expect(validateKs("30101810400000000226", "044525225")).toBe(false);
    expect(
      getCorrespondentAccountValidationError("30101810400000000226", "044525225"),
    ).toMatch(/Контрольное число/);
  });
});
