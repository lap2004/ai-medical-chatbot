# # """
# # db/models/vector_model.py
# # Model DocChunk (tham khảo/tuỳ chọn) nếu bạn muốn lưu kho ngữ liệu dạng chunk.
# # Với dự án AI Bác sĩ, bạn đang dùng bảng 'medical' (embedding vector(1024)).
# # File này hữu ích nếu bạn có thêm kho tài liệu khác (docs/articles) song song 'medical'.
# # """

# # from sqlalchemy import Column, Integer, String, Text, JSON
# # from pgvector.sqlalchemy import Vector
# # from db.database import Base
# # from app.config import settings

# # EMBED_DIM = settings.embedding_dim  # ví dụ: 1024 cho BAAI/bge-m3

# # class DocChunk(Base):
# #     __tablename__ = "doc_chunks"  # bảng tham khảo (khác với 'medical')

# #     id = Column(Integer, primary_key=True)
# #     doc_id = Column(String(128), index=True)       # id tài liệu gốc
# #     chunk_id = Column(String(128), index=True)     # id đoạn
# #     text = Column(Text, nullable=False)
# #     metadata = Column(JSON, nullable=True)
# #     embedding = Column(Vector(EMBED_DIM))          # vector(dim)

# # # Gợi ý SQL index (tạo bằng Alembic/migration):
# # # CREATE INDEX IF NOT EXISTS doc_chunks_embedding_idx
# # #   ON doc_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
# # # ANALYZE doc_chunks;

# """
# db/models/vector_model.py
# Model DocChunk
# """

# from sqlalchemy import Column, Integer, String, Text, JSON
# from pgvector.sqlalchemy import Vector
# from db.database import Base
# from app.config import settings

# EMBED_DIM = settings.embedding_dim  # ví dụ: 1024 cho BAAI/bge-m3


# class DocChunk(Base):
#     __tablename__ = "doc_chunks"

#     id = Column(Integer, primary_key=True)
#     doc_id = Column(String(128), index=True)       # id tài liệu gốc
#     chunk_id = Column(String(128), index=True)     # id đoạn
#     text = Column(Text, nullable=False)

#     # ⚠️ KHÔNG dùng attribute tên "metadata"
#     meta = Column("metadata", JSON, nullable=True)   # ✅ OK

#     embedding = Column(Vector(EMBED_DIM))          # vector(dim)
