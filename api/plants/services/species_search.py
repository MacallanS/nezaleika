"""Flexible species search: ё→е normalize, substring, fuzzy (Damerau–Levenshtein)."""
from __future__ import annotations

def normalize(text: str) -> str:
    import unicodedata

    s = unicodedata.normalize('NFKC', text or '').casefold().replace('ё', 'е')
    out: list[str] = []
    prev_space = False
    for ch in s:
        if ch.isalnum() or ch in '+.-':
            out.append(ch)
            prev_space = False
        elif ch.isspace():
            if not prev_space and out:
                out.append(' ')
                prev_space = True
    return ''.join(out).strip()


def _damerau_levenshtein(a: str, b: str) -> int:
    if a == b:
        return 0
    n, m = len(a), len(b)
    if n == 0:
        return m
    if m == 0:
        return n
    # Cap for speed on long names
    if abs(n - m) > 4:
        return max(n, m)
    dp = [[0] * (m + 1) for _ in range(n + 1)]
    for i in range(n + 1):
        dp[i][0] = i
    for j in range(m + 1):
        dp[0][j] = j
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            cost = 0 if a[i - 1] == b[j - 1] else 1
            dp[i][j] = min(
                dp[i - 1][j] + 1,
                dp[i][j - 1] + 1,
                dp[i - 1][j - 1] + cost,
            )
            if i > 1 and j > 1 and a[i - 1] == b[j - 2] and a[i - 2] == b[j - 1]:
                dp[i][j] = min(dp[i][j], dp[i - 2][j - 2] + 1)
    return dp[n][m]


def _allowed_distance(token_len: int) -> int:
    if token_len <= 3:
        return 0
    if token_len <= 5:
        return 1
    return 2


def _token_fuzzy(hay: str, needle: str) -> bool:
    if not needle:
        return True
    if needle in hay:
        return True
    allowed = _allowed_distance(len(needle))
    if allowed == 0:
        return False
    for token in hay.split():
        if abs(len(token) - len(needle)) > allowed:
            continue
        if _damerau_levenshtein(token, needle) <= allowed:
            return True
    # Whole-string fuzzy for short queries against short names
    if len(hay) <= 24 and abs(len(hay) - len(needle)) <= allowed:
        return _damerau_levenshtein(hay, needle) <= allowed
    return False


def score_species(name_ru: str, name_lat: str, query: str) -> float | None:
    """Return rank (lower better) or None if no match."""
    needle = normalize(query)
    if len(needle) < 2:
        return None
    ru = normalize(name_ru)
    lat = normalize(name_lat)
    if not ru and not lat:
        return None

    best: float | None = None

    def consider(hay: str, base: float) -> None:
        nonlocal best
        if not hay:
            return
        if hay == needle:
            rank = base
        elif hay.startswith(needle):
            rank = base + 1
        elif needle in hay:
            rank = base + 2 + hay.find(needle) / max(len(hay), 1)
        elif all(_token_fuzzy(hay, t) for t in needle.split()):
            rank = base + 4
        elif _token_fuzzy(hay, needle):
            rank = base + 5
        else:
            return
        if best is None or rank < best:
            best = rank

    consider(ru, 0)
    consider(lat, 0.5)
    return best


def filter_species(species_list, query: str, *, limit: int = 30):
    scored = []
    for s in species_list:
        rank = score_species(s.name_ru, s.name_lat or '', query)
        if rank is None:
            continue
        scored.append((rank, s.name_ru, s.id, s))
    scored.sort(key=lambda t: (t[0], t[1], t[2]))
    return [t[3] for t in scored[:limit]]
