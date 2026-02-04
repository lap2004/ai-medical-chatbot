import json
from pathlib import Path
from typing import Tuple


_cached: set | None = None


def _load_wordlist(path: str) -> set:
    p = Path(path)
    if not p.exists():
        raise FileNotFoundError(path)
    data = json.loads(p.read_text("utf-8"))
    return set(w.strip().lower() for w in data if isinstance(w, str))


def has_banned_terms(text: str, path: str) -> Tuple[bool, list]:
    global _cached
    if _cached is None:
        _cached = _load_wordlist(path)
    words = {w.strip(".,!?():;\"'").lower() for w in text.split()}
    bad = sorted(list(words.intersection(_cached)))
    return (len(bad) > 0, bad)
