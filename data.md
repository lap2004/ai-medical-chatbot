# 🏥 Medical AI Chatbot Database Schema (v012026)

Hệ thống cơ sở dữ liệu PostgreSQL được thiết kế chuyên biệt cho ứng dụng **AI Medical Chatbot** tích hợp kỹ thuật **RAG (Retrieval-Augmented Generation)**. Schema này tập trung vào việc lưu trữ hội thoại, quản lý tri thức y tế dạng Vector và hệ thống kiểm duyệt nội dung.

---

## 🏗️ Kiến trúc Cơ sở dữ liệu

Hệ thống được xây dựng dựa trên các chuẩn công nghệ hiện đại:
* **Định danh**: Sử dụng kết hợp `INTEGER IDENTITY` cho User và `UUID` cho các thực thể hội thoại để đảm bảo tính bảo mật và khả năng mở rộng.
* **Tìm kiếm Vector**: Sử dụng kiểu dữ liệu `vector(1024)` cho cột `embedding` để thực hiện tìm kiếm ngữ nghĩa.
* **Quản lý trạng thái**: Sử dụng các kiểu dữ liệu `ENUM` tùy chỉnh (`message_role`, `feedback_value`, `report_status`) để đảm bảo tính toàn vẹn dữ liệu.

---

## 🗂️ Chi tiết các Bảng (Tables)

### 1. Quản lý Người dùng (`users_012026`)
Lưu trữ thông tin định danh và phân quyền.
* **`id`**: Khóa chính tự tăng.
* **`email`**: Duy nhất, dùng để đăng nhập.
* **`is_admin`**: Xác định quyền quản trị viên.
* **`force_password_change`**: Ép buộc người dùng đổi mật khẩu khi cần thiết.

### 2. Kho Tri thức Y tế (`medical_012026`)
Lưu trữ dữ liệu nguồn cho công cụ RAG.
* **`embedding`**: Lưu trữ vector đặc trưng của văn bản y tế để so khớp.
* **`symptoms` & `treatment`**: Các trường dữ liệu chi tiết về triệu chứng và điều trị.

### 3. Hội thoại & Tin nhắn (`conversations_012026` & `messages_012026`)
Quản lý luồng tương tác giữa người dùng và AI.
* **`conversations_012026`**:
    * Hỗ trợ "Xóa mềm" qua trường `deleted_at`.
    * `last_message_at`: Tối ưu sắp xếp danh sách chat.
* **`messages_012026`**:
    * `role`: Phân định giữa `system`, `user` và `assistant`.
    * `rag_context`: Lưu trữ ngữ cảnh JSON mà AI đã sử dụng.
    * `token` tracking: Theo dõi số lượng token tiêu thụ (`prompt`, `completion`, `total`).

### 4. Đánh giá & Trích dẫn
* **`message_feedback_012026`**: Lưu trữ đánh giá Like/Dislike kèm lý do từ người dùng.
* **`message_reports_012026`**: Hệ thống báo cáo nội dung y tế sai lệch.
* **`message_citations_012026`**: Liên kết trực tiếp tin nhắn AI với tài liệu gốc trong kho tri thức kèm theo điểm số tương đồng (`score`).

---

## ⚡ Chỉ mục & Tối ưu hóa (Indexes)

Hệ thống bao gồm các chỉ mục được thiết kế để xử lý truy vấn nhanh:
* **`idx_conversations_user_active_012026`**: Tối ưu lấy các hội thoại đang hoạt động của người dùng, sắp xếp theo thời gian mới nhất.
* **`idx_messages_conversation_012026`**: Tăng tốc độ tải lịch sử chat theo trình tự thời gian.
* **`uq_message_feedback_012026`**: Ràng buộc duy nhất đảm bảo mỗi người dùng chỉ feedback một lần trên mỗi tin nhắn.

---

## 🛠️ Cài đặt yêu cầu
1. **PostgreSQL**: Phiên bản 12 trở lên.
2. **Extensions**: 
   * `pgvector`: Xử lý vector.
   * `pgcrypto`: Để sử dụng `gen_random_uuid()`.

---
*Tài liệu được cập nhật dựa trên phiên bản Schema tháng 01/2026.*