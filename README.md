# LemoGuide MVP

LemoGuide là nền tảng định hướng nghề nghiệp có hỗ trợ AI: người dùng xây dựng hồ sơ năng lực, tạo và tối ưu CV, khám phá bản thân, lập lộ trình nghề nghiệp, luyện phỏng vấn, tìm việc làm và khóa học, kết nối cộng đồng (LemoNetwork). Quản trị viên quản lý người dùng, dữ liệu danh mục, mô hình AI, gói dịch vụ và báo cáo.

## Cấu trúc dự án

```
lemoguide-mvp/
├── backend/          # REST API — Spring Boot 4, Java 21, MySQL, Flyway
├── frontend-user/    # Ứng dụng người dùng — React 19 + Vite
└── frontend-admin/   # Trang quản trị — React 19 + Vite
```

## Tính năng chính

**Người dùng (`frontend-user`)**
- Đăng ký / đăng nhập (JWT)
- Hồ sơ nghề nghiệp: học vấn, kinh nghiệm, dự án, kỹ năng, chứng chỉ, giải thưởng; nhập hồ sơ từ CV PDF
- CV: tạo theo mẫu, quản lý phiên bản, chia sẻ công khai, xuất file, tối ưu CV và viết thư xin việc bằng AI
- Khám phá bản thân (Holland), lộ trình nghề nghiệp cá nhân hóa
- Việc làm, phân tích độ phù hợp hồ sơ – việc làm, khóa học
- Luyện phỏng vấn với AI, AI coach chat
- Weekly workspace, LemoNetwork (kết nối, nhắn tin, cộng đồng)

**Quản trị (`frontend-admin`)**
- Quản lý tài khoản người dùng / admin, vai trò và phân quyền
- Dữ liệu danh mục (ngành, kỹ năng, công nghệ, mẫu CV, …)
- Quản lý mô hình AI & API key (Anthropic, OpenAI, Google, Groq…), prompt template, gói dịch vụ
- Kiểm duyệt LemoNetwork, báo cáo, cài đặt hệ thống, nhật ký hoạt động

## Yêu cầu

- Java 21
- Node.js 20+ và npm
- MySQL 8

## Cài đặt & chạy

### 1. Backend

```bash
cd backend
cp .env.example .env   # chỉnh DB_USERNAME, DB_PASSWORD, JWT_SECRET...
./mvnw spring-boot:run # Windows: mvnw.cmd spring-boot:run
```

- API chạy tại `http://localhost:8080`.
- Database `lemoguide_mvp` được tự tạo; Flyway tự chạy các migration trong `src/main/resources/db/migration` (bao gồm dữ liệu mẫu).
- Các biến môi trường được ánh xạ vào `application.yaml` (xem `backend/.env.example`). Nạp chúng qua run configuration của IDE hoặc export trong shell.
- API key của các nhà cung cấp AI **không** đặt trong `.env` — cấu hình trực tiếp trên trang quản trị *Model AI & API Key*.

Chạy test:

```bash
./mvnw test
```

### 2. Frontend người dùng

```bash
cd frontend-user
npm install
npm run dev     # http://localhost:5173
```

### 3. Frontend quản trị

```bash
cd frontend-admin
npm install
npm run dev     # cổng mặc định của Vite; chạy song song với frontend-user sẽ là http://localhost:5174
```

Các lệnh khác cho frontend: `npm run build`, `npm run lint`, `npm run preview`.

## Biến môi trường chính (backend)

| Biến | Mô tả | Mặc định |
|------|-------|----------|
| `DB_URL` | JDBC URL MySQL | `jdbc:mysql://localhost:3306/lemoguide_mvp?...` |
| `DB_USERNAME` / `DB_PASSWORD` | Tài khoản MySQL | `root` / `root` |
| `JWT_SECRET` | Khóa ký JWT (≥ 32 byte) | giá trị dev — **phải đổi khi triển khai** |
| `JWT_EXPIRATION_MS` | Thời hạn token | `86400000` (24h) |
| `SERVER_PORT` | Cổng backend | `8080` |
| `CORS_ALLOWED_ORIGINS` | Origin được phép gọi API | các cổng Vite local |
