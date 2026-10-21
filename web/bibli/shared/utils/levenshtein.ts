/**
 * Нечёткий поиск: Damerau–Levenshtein + правила для ФИО.
 */

/** Нормализация: NFKC, нижний регистр, ё→е, схлопывание пробелов. */
function normalizeString(str: string): string {
  return String(str ?? "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^\p{L}\p{N}\s+.-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function clampThreshold(threshold: number): number {
  if (Number.isNaN(threshold)) return 0.5;
  return Math.min(1, Math.max(0, threshold));
}

/**
 * Damerau–Levenshtein: вставки/удаления/замены + соседние перестановки.
 * Важно для опечаток вида «Иваовн» → «Иванов».
 */
function calculateDamerauLevenshteinDistance(str1: string, str2: string): number {
  const a = Array.from(str1);
  const b = Array.from(str2);
  const n = a.length;
  const m = b.length;

  if (n === 0) return m;
  if (m === 0) return n;

  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));

  for (let i = 0; i <= n; i++) dp[i][0] = i;
  for (let j = 0; j <= m; j++) dp[0][j] = j;

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let value = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      );

      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        value = Math.min(value, dp[i - 2][j - 2] + 1);
      }

      dp[i][j] = value;
    }
  }

  return dp[n][m];
}

function getNGrams(str: string, n: number = 2): string[] {
  if (!str) return [];
  if (str.length < n) return [str];

  const ngrams: string[] = [];
  for (let i = 0; i <= str.length - n; i++) {
    ngrams.push(str.slice(i, i + n));
  }
  return ngrams;
}

function ngramSimilarity(str1: string, str2: string, ngramSize: number = 2): number {
  const normalized1 = normalizeString(str1);
  const normalized2 = normalizeString(str2);

  if (!normalized1 || !normalized2) {
    return normalized1 === normalized2 ? 1 : 0;
  }

  if (normalized1 === normalized2) return 1;

  if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
    return (
      Math.min(normalized1.length, normalized2.length) /
      Math.max(normalized1.length, normalized2.length)
    );
  }

  const ngrams1 = new Set(getNGrams(normalized1, ngramSize));
  const ngrams2 = new Set(getNGrams(normalized2, ngramSize));

  let intersection = 0;
  for (const ngram of ngrams1) {
    if (ngrams2.has(ngram)) intersection++;
  }

  if (intersection === 0) return 0;

  const union = ngrams1.size + ngrams2.size - intersection;
  const jaccard = intersection / union;
  const lengthRatio =
    Math.min(normalized1.length, normalized2.length) /
    Math.max(normalized1.length, normalized2.length);

  return jaccard * 0.7 + lengthRatio * 0.3;
}

/** Сколько правок допускаем для токена данной длины. */
function getAllowedDistance(tokenLength: number): number {
  if (tokenLength <= 3) return 0;
  if (tokenLength <= 5) return 1;
  // от 6 букв — до 2 правок (перестановки, окончания -ич/-на)
  return 2;
}

function getEffectiveThreshold(queryLength: number, threshold: number): number {
  const normalizedThreshold = clampThreshold(threshold);

  if (queryLength <= 2) return 1;
  if (queryLength <= 4) return Math.max(normalizedThreshold, 0.72);
  if (queryLength <= 8) return Math.max(normalizedThreshold, 0.78);
  if (queryLength <= 14) return Math.max(normalizedThreshold, 0.85);
  return Math.max(normalizedThreshold, 0.9);
}

function lengthRatio(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return Math.min(a.length, b.length) / maxLen;
}

/** Части ФИО: пробелы и дефисы (двойные фамилии). */
function splitNameParts(text: string): string[] {
  return text.split(/[\s-]+/).filter(Boolean);
}

/**
 * Оценка совпадения одного токена с одной частью ФИО.
 * 0 — нет совпадения; выше — лучше.
 */
function scoreTokenAgainstPart(part: string, token: string): number {
  if (!part || !token) return 0;

  if (part === token) return 1;

  // префикс запроса: «богд» → «богданов»
  if (part.startsWith(token)) {
    return 0.92 + 0.08 * (token.length / part.length);
  }

  // короткие токены — только prefix/includes, без fuzzy
  if (token.length <= 2) {
    return part.startsWith(token) ? 0.85 : 0;
  }

  if (token.length === 3) {
    if (part.includes(token)) return 0.8;
    return 0;
  }

  // неполная запись в данных: «алекс» при запросе «александр»
  if (token.startsWith(part) && part.length >= 3 && lengthRatio(part, token) >= 0.5) {
    return 0.75 + 0.1 * (part.length / token.length);
  }

  if (part.includes(token) && token.length >= 4) {
    return 0.7 + 0.2 * (token.length / part.length);
  }

  const distance = calculateDamerauLevenshteinDistance(part, token);
  const allowed = getAllowedDistance(token.length);

  if (distance > allowed) return 0;
  if (lengthRatio(part, token) < 0.7) return 0;

  // опечатки почти никогда не в первой букве имени/фамилии
  if (distance > 0 && part[0] !== token[0]) return 0;

  const maxLen = Math.max(part.length, token.length);
  return Math.max(0, 1 - distance / maxLen);
}

/**
 * Все токены запроса должны найти разные части ФИО (жадное назначение по score).
 * Иначе «Иванов Иван» матчил бы «Ивановский Пётр» через один префикс.
 */
function matchTokensToParts(tokens: string[], parts: string[]): boolean {
  if (tokens.length === 0) return true;
  if (parts.length === 0) return false;

  if (tokens.length === 1) {
    return parts.some((part) => scoreTokenAgainstPart(part, tokens[0]) > 0);
  }

  if (tokens.length > parts.length) return false;

  const used = new Set<number>();

  // сначала более длинные/специфичные токены
  const ordered = tokens
    .map((token, index) => ({ token, index }))
    .sort((a, b) => b.token.length - a.token.length || a.index - b.index);

  for (const { token } of ordered) {
    let bestIdx = -1;
    let bestScore = 0;

    for (let i = 0; i < parts.length; i++) {
      if (used.has(i)) continue;
      const score = scoreTokenAgainstPart(parts[i], token);
      if (score > bestScore) {
        bestScore = score;
        bestIdx = i;
      }
    }

    if (bestIdx < 0 || bestScore <= 0) return false;
    used.add(bestIdx);
  }

  return true;
}

function getMatchScore(
  text: string,
  query: string,
  threshold: number,
  maxDistance?: number,
): { matched: boolean; score: number; distance: number } {
  const normalizedText = normalizeString(text);
  const normalizedQuery = normalizeString(query);

  if (!normalizedQuery) {
    return { matched: true, score: 1, distance: 0 };
  }
  if (!normalizedText) {
    return { matched: false, score: 0, distance: Infinity };
  }

  if (normalizedText === normalizedQuery) {
    return { matched: true, score: 1, distance: 0 };
  }

  if (normalizedText.includes(normalizedQuery)) {
    const score = Math.max(0.6, normalizedQuery.length / normalizedText.length);
    return { matched: true, score, distance: 0 };
  }

  const textParts = splitNameParts(normalizedText);
  const queryParts = splitNameParts(normalizedQuery);

  if (queryParts.length >= 1 && textParts.length >= 1) {
    if (matchTokensToParts(queryParts, textParts)) {
      let scoreSum = 0;
      let distanceSum = 0;
      const used = new Set<number>();
      const ordered = [...queryParts].sort((a, b) => b.length - a.length);

      for (const token of ordered) {
        let bestIdx = -1;
        let bestScore = 0;
        for (let i = 0; i < textParts.length; i++) {
          if (used.has(i)) continue;
          const score = scoreTokenAgainstPart(textParts[i], token);
          if (score > bestScore) {
            bestScore = score;
            bestIdx = i;
          }
        }
        if (bestIdx >= 0) {
          used.add(bestIdx);
          scoreSum += bestScore;
          distanceSum += calculateDamerauLevenshteinDistance(textParts[bestIdx], token);
        }
      }

      return {
        matched: true,
        score: scoreSum / queryParts.length,
        distance: distanceSum,
      };
    }
  }

  const distance = calculateDamerauLevenshteinDistance(normalizedText, normalizedQuery);
  const maxLength = Math.max(normalizedText.length, normalizedQuery.length);
  const levenshteinScore = 1 - distance / maxLength;

  if (maxDistance !== undefined) {
    const matched =
      distance <= maxDistance &&
      lengthRatio(normalizedText, normalizedQuery) >= 0.7 &&
      (distance === 0 || normalizedText[0] === normalizedQuery[0]);
    return { matched, score: matched ? levenshteinScore : 0, distance };
  }

  const allowed = getAllowedDistance(normalizedQuery.length);
  if (
    lengthRatio(normalizedText, normalizedQuery) >= 0.7 &&
    distance <= allowed &&
    (distance === 0 || normalizedText[0] === normalizedQuery[0]) &&
    levenshteinScore >= getEffectiveThreshold(normalizedQuery.length, threshold)
  ) {
    return { matched: true, score: levenshteinScore, distance };
  }

  const ngramScore = ngramSimilarity(normalizedText, normalizedQuery, 2);
  const combinedScore = ngramScore * 0.7 + levenshteinScore * 0.3;
  const score = Math.max(ngramScore, combinedScore);
  const matched = score >= getEffectiveThreshold(normalizedQuery.length, threshold);

  return { matched, score: matched ? score : 0, distance };
}

/** Расстояние Дамерау–Левенштейна между двумя строками. */
export function levenshteinDistance(str1: string, str2: string): number {
  return calculateDamerauLevenshteinDistance(normalizeString(str1), normalizeString(str2));
}

/** Нормализованное расстояние (0 = полное совпадение, 1 = полное несовпадение). */
export function normalizedLevenshteinDistance(str1: string, str2: string): number {
  const normalized1 = normalizeString(str1);
  const normalized2 = normalizeString(str2);
  const maxLen = Math.max(normalized1.length, normalized2.length);

  if (maxLen === 0) return 0;

  return calculateDamerauLevenshteinDistance(normalized1, normalized2) / maxLen;
}

/** Коэффициент схожести (1 = полное совпадение). */
export function similarity(str1: string, str2: string): number {
  const normalized1 = normalizeString(str1);
  const normalized2 = normalizeString(str2);

  if (!normalized1 || !normalized2) {
    return normalized1 === normalized2 ? 1 : 0;
  }

  const ngramScore = ngramSimilarity(normalized1, normalized2, 2);
  const levenshteinScore = 1 - normalizedLevenshteinDistance(normalized1, normalized2);

  return Math.max(0, Math.min(1, ngramScore * 0.7 + levenshteinScore * 0.3));
}

/** Соответствует ли строка запросу с учётом опечаток. */
export function fuzzyMatch(
  text: string,
  query: string,
  threshold: number = 0.5,
  maxDistance?: number,
): boolean {
  return getMatchScore(text, query, threshold, maxDistance).matched;
}

/** Более строгий режим для select/search UI. */
export function strictFuzzyMatch(
  text: string,
  query: string,
  threshold: number = 0.7,
): boolean {
  return getMatchScore(text, query, threshold).matched;
}

/**
 * Поиск по ФИО: все слова запроса должны найтись в разных частях имени
 * (порядок не важен), с допуском опечаток Дамерау–Левенштейна.
 */
export function matchFioQuery(
  text: string,
  query: string,
  _threshold: number = 0.55,
): boolean {
  const normalizedQuery = normalizeString(query);
  if (!normalizedQuery) return true;

  const normalizedText = normalizeString(text);
  if (!normalizedText) return false;

  if (normalizedText === normalizedQuery) return true;
  if (normalizedText.includes(normalizedQuery)) return true;

  const tokens = splitNameParts(normalizedQuery);
  const parts = splitNameParts(normalizedText);

  return matchTokensToParts(tokens, parts);
}

/** Фильтрует массив и сортирует по релевантности. */
export function fuzzySearch<T>(
  items: T[],
  query: string,
  getText: (item: T) => string | string[],
  threshold: number = 0.5,
  maxDistance?: number,
): T[] {
  if (!query.trim()) return items;

  const results: Array<{ item: T; score: number; distance: number }> = [];

  for (const item of items) {
    const rawTexts = getText(item);
    const texts = Array.isArray(rawTexts) ? rawTexts : [rawTexts];

    let bestScore = 0;
    let bestDistance = Infinity;

    for (const text of texts) {
      if (!text) continue;

      const result = getMatchScore(String(text), query, threshold, maxDistance);

      if (
        result.matched &&
        (result.score > bestScore ||
          (Math.abs(result.score - bestScore) < 0.001 && result.distance < bestDistance))
      ) {
        bestScore = result.score;
        bestDistance = result.distance;
      }
    }

    if (bestScore > 0) {
      results.push({ item, score: bestScore, distance: bestDistance });
    }
  }

  results.sort((a, b) => {
    if (Math.abs(a.score - b.score) < 0.001) {
      return a.distance - b.distance;
    }
    return b.score - a.score;
  });

  return results.map((result) => result.item);
}

/** Простая замена includes с учётом опечаток. */
export function fuzzyIncludes(text: string, query: string): boolean {
  return fuzzyMatch(text, query, 0.3);
}
