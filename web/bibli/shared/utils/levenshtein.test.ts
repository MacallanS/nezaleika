import { describe, expect, it } from "vitest";
import {
  fuzzyMatch,
  levenshteinDistance,
  matchFioQuery,
} from "./levenshtein";

describe("levenshteinDistance (Damerau)", () => {
  it("counts adjacent transposition as 1", () => {
    expect(levenshteinDistance("иванов", "иваонв")).toBe(1);
    expect(levenshteinDistance("александр", "алексаднр")).toBe(1);
  });

  it("counts substitution as 1", () => {
    expect(levenshteinDistance("петров", "петроф")).toBe(1);
  });
});

describe("matchFioQuery", () => {
  it("matches exact and substring FIO", () => {
    expect(matchFioQuery("Иванов Иван Иванович", "Иванов Иван Иванович")).toBe(true);
    expect(matchFioQuery("Иванов Иван Иванович", "Иванов")).toBe(true);
    expect(matchFioQuery("Иванов Иван Иванович", "ива")).toBe(true);
  });

  it("matches ё/е and case", () => {
    expect(matchFioQuery("Петров Пётр", "петров петр")).toBe(true);
  });

  it("matches single-char typos", () => {
    expect(matchFioQuery("Петров Пётр", "Петроф")).toBe(true);
    expect(matchFioQuery("Сидоров", "Сидорв")).toBe(true);
    expect(matchFioQuery("Козлов", "Козловв")).toBe(true);
  });

  it("matches letter transpositions (Damerau)", () => {
    expect(matchFioQuery("Иванов Иван Иванович", "Иваонв")).toBe(true);
    expect(matchFioQuery("Иванов Иван Иванович", "Иваовн")).toBe(true);
    expect(matchFioQuery("Александров", "Алексанрдов")).toBe(true);
  });

  it("matches patronymic gender ending (2 edits on long token)", () => {
    expect(
      matchFioQuery("Богданов Герман Романович", "Богданов Герман Романовна"),
    ).toBe(true);
  });

  it("matches tokens in any order", () => {
    expect(matchFioQuery("Богданов Герман Романович", "герман богданов")).toBe(true);
    expect(matchFioQuery("Иванов Иван Иванович", "Иван Иванов")).toBe(true);
  });

  it("requires all tokens and distinct name parts", () => {
    expect(matchFioQuery("Иванов Иван Иванович", "Иванов Пётр")).toBe(false);
    expect(matchFioQuery("Иванов Иван Иванович", "Иванов Иван")).toBe(true);
    // оба токена не должны цепляться к одной фамилии через префикс
    expect(matchFioQuery("Ивановский Пётр", "Иванов Иван")).toBe(false);
  });

  it("does not match unrelated full FIO", () => {
    expect(
      matchFioQuery("Сидоров Алексей Петрович", "Иванов Иван Иванович"),
    ).toBe(false);
    expect(
      matchFioQuery("Козлов Дмитрий Сергеевич", "Иванов Иван Иванович"),
    ).toBe(false);
  });

  it("rejects short false positives with different first letter", () => {
    expect(matchFioQuery("Анна", "Инна")).toBe(false);
  });

  it("rejects unrelated noise", () => {
    expect(matchFioQuery("Тестов Тест", "xyz")).toBe(false);
  });

  it("supports hyphenated surnames", () => {
    expect(matchFioQuery("Смирнова-Петрова Анна", "Смирнова")).toBe(true);
    expect(matchFioQuery("Смирнова-Петрова Анна", "Петрова")).toBe(true);
  });
});

describe("fuzzyMatch", () => {
  it("matches substring and light typos", () => {
    expect(fuzzyMatch("Москва", "моск", 0.3)).toBe(true);
    expect(fuzzyMatch("Москва", "Моксва", 0.3)).toBe(true);
  });
});
