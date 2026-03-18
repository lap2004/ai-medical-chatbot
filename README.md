## cấu trúc json

"id": UUID, duy nhất cho mỗi bản ghi, tương ứng với id UUID PRIMARY KEY DEFAULT gen_random_uuid() trong SQL.
"title": Tên loại bệnh, tương ứng với cột title TEXT NOT NULL.
"question": Câu hỏi về bệnh, tương ứng với cột question TEXT NOT NULL.
"answer": Câu trả lời về bệnh, tương ứng với cột answer TEXT NOT NULL.
"symptoms": Triệu chứng hoặc dấu hiệu nhận biết bệnh, tương ứng với symptoms TEXT.
"treatment": Phương pháp điều trị, tương ứng với treatment TEXT.

## Cấu trúc dự án
.
├── app
│   ├── config.py                         # Biến môi trường (DB URL, GEMINI_API_KEY, TOP_K, ...)
│   ├── logger.py                         # Cấu hình loguru
│   ├── main.py                           # Entry FastAPI: mount router, CORS, middleware, mount /static
│   ├── middleware
│   │   └── log_request.py                # Log mọi request + thời gian xử lý
│   ├── routers
│   │   ├── chat.py                       # POST /chat: gọi service/pipeline, trả JSON schema
│   │   └── voice.py                      # NEW: /voice/tts, /voice/stt, /voice/voice_chat (RAG)
│   ├── services
│   │   ├── chat_service.py               # Orchestrator (tùy dự án; có thể mỏng vì pipeline đã đủ)
│   │   ├── stt_service.py                # NEW: STT free (faster-whisper + ffmpeg chuẩn hoá)
│   │   └── tts_service.py                # NEW: TTS free (gTTS) + tách đoạn dài
│   ├── utils
│   │   └── audio_io.py                   # NEW: Lưu UploadFile vào data/uploads
│   └── rag
│       ├── chat_pipeline.py              # retrieve → (rerank?) → prompt → Gemini → parse JSON
│       ├── llm_chain.py                  # Prompt template y tế + gọi Gemini
│       ├── retriever.py                  # Truy vấn pgvector Top-K
│       ├── embedder.py                   # Tạo embedding (BGE), upsert vào Postgres
│       ├── text_splitter.py              # Chia nhỏ văn bản theo ngữ nghĩa/ký tự
│       ├── processor_json.py             # Đọc/chuẩn hóa data.json → bản ghi
│       └── word_filter.py                # Lọc từ cấm trước khi gọi LLM
├── db
│   ├── database.py                       # Engine, SessionLocal, Base, register pgvector
│   ├── models
│   │   ├── chat_model.py                 # Lịch sử chat (id, user_id, question, answer, created_at)
│   │   └── vector_model.py               # DocChunk (text, metadata, embedding VECTOR)
│   └── schemas
│       └── chat_schema.py                # Pydantic I/O: ChatRequest/ChatResponse + Safety info
├── scripts
│   └── embed_runner.py                   # Chạy pipeline index: processor → splitter → embed → upsert
├── alembic/                              # (khuyến nghị) Migration cho bảng chat/doc_chunks, index ivfflat
│   ├── env.py
│   ├── script.py.mako
│   └── versions/
│       └── xxxx_init_tables.py
├── data
│   ├── audio/                            # NEW: Output mp3 từ TTS (được serve qua /static/audio)
│   ├── uploads/                          # NEW: Lưu file audio upload tạm để STT xử lý
│   ├── data.json                         # Kiến thức nền (hướng dẫn y tế, khuyến cáo, ... )
│   └── word_filter.json                  # Danh sách từ cấm (ví dụ: “kê toa”, “thuốc không cần toa”)
├── logs
│   └── app.log
├── requirements.txt                      # + gTTS, faster-whisper, python-multipart
├── .env.example                          # + STT_MODEL_SIZE, STT_DEVICE, STT_COMPUTE, AUDIO_TMP_DIR
├── README.md



## cơ sở dữ liệu
psql -h localhost -p 5432 -U postgres -d aibacsi
123456

## Run embedding
python scripts/embed_runner.py --path data/data.json
python scripts\embed_runner.py
python embedding_json.py --data-dir data

uvicorn app.main:app --reload --host 127.0.1.8 --port 8000
cloudflared tunnel --url http://127.0.1.8:8000
