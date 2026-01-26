"""
app/rag/text_splitter.py
Chia nhỏ văn bản theo độ dài ký tự, có overlap nhẹ để giữ ngữ cảnh.
"""

from typing import List, Dict


def split_text(doc_text: str, chunk_chars: int = 900, overlap: int = 120) -> List[Dict]:
    chunks: List[Dict] = []
    if not doc_text:
        return chunks

    start = 0
    n = len(doc_text)

    while start < n:
        end = min(start + chunk_chars, n)
        chunk = doc_text[start:end]
        chunks.append({"text": chunk})
        if end == n:
            break
        start = max(0, end - overlap)

    return chunks
