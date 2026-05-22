# 🏥 AI Medical Chatbot (Khóa Luận Tốt Nghiệp)

Đây là kho lưu trữ chung (monorepo) bao gồm cả 3 thành phần chính của dự án AI Medical Chatbot: Frontend, Backend, và Voice AI.

## 📁 Cấu trúc Thư mục

```bash
.
├── backend/       # FastAPI Backend (Quản lý API, Database, RAG Pipeline)
├── frontend/      # React Frontend (Web UI, Chat Widget, Cổng tư vấn)
└── voice_ai/      # WebSocket Voice AI Server (STT & TTS)
```

---

## 💻 1. Frontend (React / TypeScript / Tailwind CSS)

**HealthAI Companion - AI Doctor Assistant** là giao diện người dùng chính được xây dựng bằng React và TypeScript.
* **Landing Page:** Thiết kế hiện đại với widget chat tự động nổi bật 24/7.
* **Cổng Tư vấn (Consultation Portal):** Cung cấp trải nghiệm chat toàn màn hình, ghi nhớ lịch sử tương tác và có sự hỗ trợ của persona AI (bác sĩ ảo Rebecca).
* **Giao diện:** Thiết kế tương thích mọi thiết bị (Responsive), hỗ trợ Dark Mode và các hiệu ứng thẩm mỹ cao.

---

## 🛠️ 2. Backend (FastAPI / PostgreSQL / RAG)

Hệ thống cung cấp API hiệu suất cao và quản lý luồng dữ liệu chính của AI.
* **Cơ sở dữ liệu:** Sử dụng PostgreSQL kết hợp `pgvector` để lưu trữ và truy vấn ngữ nghĩa (RAG) cho các tài liệu y tế.
* **RAG Engine:** Xử lý dữ liệu văn bản, chia nhỏ (Text Splitter) và truy xuất dữ liệu phù hợp làm ngữ cảnh cho LLM.
* **Bảo mật & Quản lý người dùng:** Dùng JWT Token cho xác thực, lưu trữ session với Redis và quản lý lịch sử hội thoại chi tiết.

---

## 🎙️ 3. Voice AI (WebSocket / STT & TTS)

Thành phần chịu trách nhiệm xử lý âm thanh thời gian thực.
* Nhận diện giọng nói (Speech-to-Text - STT).
* Tổng hợp giọng nói (Text-to-Speech - TTS).
* Tích hợp qua giao thức WebSocket giúp phản hồi âm thanh nhanh chóng.

---

# 🚀 Hướng dẫn Chạy Dự án (Run Instructions)

Để hệ thống hoạt động đầy đủ, bạn cần chạy 3 thành phần ở 3 terminal riêng biệt. Đảm bảo chạy Backend trước.

## 🗄️ Cài đặt Cơ sở Dữ liệu
Sử dụng PostgreSQL và tạo database `aibacsi`.
```bash
psql -h localhost -p 5432 -U postgres -d aibacsi
# Mật khẩu mặc định: 123456
```

*(Tùy chọn)* Chạy script embedding để load dữ liệu y tế vào DB:
```bash
# Trong thư mục backend
python scripts/embed_runner.py --path data/data.json
```

## 🚀 Chạy Backend
```bash
cd backend
uvicorn app.main:app --reload --host 127.0.1.8 --port 8000
```
*Tùy chọn expose qua Cloudflare:* `cloudflared tunnel --url http://127.0.1.8:8000`

## 🎙️ Chạy Voice AI
```bash
cd voice_ai
uvicorn run_ws_server:app --host 127.0.0.1 --port 8000
```
*Tùy chọn expose qua Cloudflare:* `cloudflared tunnel --url http://127.0.0.1:8000`

## 💻 Chạy Frontend
```bash
cd frontend
npm install
npm run dev
```

---
## 📌 Ghi chú
* **Luôn chạy Backend, Voice AI và Frontend ở 3 terminal riêng biệt.**
* Đảm bảo kiểm tra và đổi các cổng (`port`) nếu bị trùng lặp trên máy của bạn.
* Bạn có thể tùy chỉnh các biến môi trường (`.env`) tương ứng bên trong từng thư mục.
