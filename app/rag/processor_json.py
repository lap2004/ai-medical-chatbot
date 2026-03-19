import json
from typing import Iterable, Dict

REQUIRED = ("title", "question", "answer")
FIELDS = ("id", "title", "question", "answer", "symptoms", "treatment")

def load_records(path: str) -> Iterable[Dict]:
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    if not isinstance(data, list):
        raise ValueError("JSON root phải là list các bản ghi.")

    for i, rec in enumerate(data):
        if not isinstance(rec, dict):
            continue
        item = {k: rec.get(k) for k in FIELDS}
        for k in REQUIRED:
            if not item.get(k):
                raise ValueError(f"Bản ghi index {i} thiếu trường bắt buộc '{k}'")
        yield item
