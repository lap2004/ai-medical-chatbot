# 🚀 Hướng dẫn chạy dự án (Run Instructions)

## 🗄️ Kết nối cơ sở dữ liệu (PostgreSQL)

Sử dụng lệnh sau để kết nối database:

```bash
psql -h localhost -p 5432 -U postgres -d aibacsi
```

**Mật khẩu:**

```
123456
```

---

## 📦 Chạy Embedding (RAG Data Processing)

Dùng để tạo vector embedding từ dữ liệu:

### Cách 1:

```bash
python scripts/embed_runner.py --path data/data.json
```

### Cách 2 (Windows):

```bash
python scripts\embed_runner.py
```

### Cách 3:

```bash
python embedding_json.py --data-dir data
```

---

# ⚙️ Chạy Backend & Frontend

## 🚀 Backend API (FastAPI)

### Khởi động server chính:

```bash
uvicorn app.main:app --reload --host 127.0.1.8 --port 8000
```

### Expose API ra internet (Cloudflare Tunnel):

```bash
cloudflared tunnel --url http://127.0.1.8:8000
```

---

## 🎙️ Voice AI (WebSocket Server)

### Khởi động server Voice AI:

```bash
uvicorn run_ws_server:app --host 127.0.0.1 --port 8000
```

### Expose Voice AI server:

```bash
cloudflared tunnel --url http://127.0.0.1:8000
```

---

## 💻 Frontend (React / Vite / Next.js)

### Cài đặt dependencies (nếu chưa có):

```bash
npm install
```

### Chạy frontend:

```bash
npm run dev
```

---

## 📌 Ghi chú

* Chạy **backend**, **voice AI**, và **frontend** ở **3 terminal riêng biệt**
* Đảm bảo backend chạy trước frontend để tránh lỗi API
* Nếu dùng Cloudflare Tunnel, frontend có thể gọi API qua URL public
* Kiểm tra port tránh bị trùng (đặc biệt khi chạy nhiều service cùng lúc)

---
