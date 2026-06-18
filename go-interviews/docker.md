# Docker & Dockerfile — Tối ưu & bảo mật

## Tóm tắt một câu

Docker đóng gói app + dependency vào **image** chạy **container** cô lập. Dockerfile tối ưu: **multi-stage build** (image nhỏ), **layer cache**, **non-root user**, không secret trong image, `.dockerignore`, scan CVE.

---

## Khái niệm

| Khái niệm | Ý nghĩa |
|-----------|---------|
| **Image** | Template read-only (layers) |
| **Container** | Instance chạy của image |
| **Dockerfile** | Recipe build image |
| **Volume** | Data persist ngoài container lifecycle |
| **Registry** | ECR, GCR, Docker Hub — lưu image |

---

## Dockerfile tối ưu

### 1. Multi-stage build

```dockerfile
FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o /server .

FROM alpine:3.19
RUN apk --no-cache add ca-certificates
COPY --from=builder /server /server
USER nonroot
ENTRYPOINT ["/server"]
```

- Image runtime **chỉ binary** — không compiler, source → nhỏ, ít attack surface.

### 2. Layer cache

- Copy `go.mod` / `package.json` **trước** source → dependency layer cache khi code đổi.
- Gộp `RUN` liên quan giảm số layer.

### 3. Image nhỏ

- Base `alpine` / `distroless` thay `ubuntu`.
- `CGO_ENABLED=0` static binary Go.

### 4. Thời gian build

- `.dockerignore` — loại `node_modules`, `.git`, test.
- BuildKit cache mount: `RUN --mount=type=cache`.

---

## Bảo mật

| Practice | Lý do |
|----------|-------|
| **Non-root USER** | Container escape hạn chế quyền |
| Không COPY `.env` / secret | Image push lên registry = lộ |
| Pin base image digest/tag | Tránh supply chain surprise |
| `readOnlyRootFilesystem` (K8s) | Chống ghi filesystem |
| Scan image (Trivy, Snyk) | CVE trong base/packages |
| Minimal packages | Ít CVE surface |

---

## Quy trình DevOps (tóm tắt)

1. Dev push code → CI build & test.
2. CI build Docker image → tag version + `git sha`.
3. Push image registry.
4. Deploy staging → smoke test.
5. Promote production (blue/green, rolling).

---

1. Bảo mật ở tầng Image (Build-time)
Đây là bước bạn viết Dockerfile. Image càng nhẹ, "bề mặt tấn công" (attack surface) càng nhỏ.

Sử dụng Base Image tối giản và đáng tin cậy: Thay vì dùng FROM ubuntu hay FROM node:latest (chứa rất nhiều công cụ thừa như bash, curl, wget - thứ hacker rất thích), hãy dùng các bản alpine (như node:alpine) hoặc tốt nhất là Distroless image (chỉ chứa duy nhất ứng dụng của bạn và môi trường chạy, không có cả shell).

Không bao giờ lưu Hardcode Secret: Tuyệt đối không viết ENV DB_PASSWORD=123456 vào Dockerfile. Bất kỳ ai có image của bạn (thông qua lệnh docker inspect) đều có thể đọc được nó. Hãy truyền secret vào lúc chạy (thông qua file .env, Docker Secrets, hoặc HashiCorp Vault).

Quét lỗ hổng bảo mật Image: Tích hợp các công cụ quét lỗ hổng (như Trivy, Clair, hoặc docker scout) vào quá trình CI/CD. Đừng deploy một image có chứa thư viện dính lỗi CVE nghiêm trọng.

2. Bảo mật ở tầng Container (Runtime)
Đây là lúc bạn gọi lệnh docker run hoặc cấu hình file docker-compose.yml.

Không chạy Container dưới quyền Root: Mặc định, tiến trình trong Docker chạy bằng user root. Hãy tạo một user không có đặc quyền trong Dockerfile và sử dụng nó.

Dockerfile
# Tạo user và group
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
# Chuyển sang user đó
USER appuser
Giới hạn tài nguyên (Resource Limits): Nếu ứng dụng của bạn bị lỗi hoặc bị tấn công DDoS (Tấn công từ chối dịch vụ), nó có thể ăn hết CPU và RAM, làm chết cả máy Host và các container khác. Luôn luôn set limit:

Bash
docker run --memory="512m" --cpus="1.0" my-app
Hệ thống file Chỉ đọc (Read-only Root Filesystem): Ép container không được ghi bất cứ thứ gì lên ổ đĩa của chính nó (trừ những thư mục được bạn cho phép qua volume). Điều này chặn hacker tải mã độc hoặc sửa file hệ thống.

Bash
docker run --read-only my-app
Tước bỏ Quyền hạn (Drop Capabilities): Mặc định Linux cấp một số quyền hạn sâu cho root. Nếu ứng dụng của bạn chỉ là web server, nó không cần các quyền này. Hãy loại bỏ tất cả và chỉ thêm lại những gì cần thiết.

Bash
docker run --cap-drop=ALL my-app
3. Bảo mật Mạng (Network)
Không Expose (Mở) cổng bừa bãi: Chỉ dùng tham số -p (publish) cho những dịch vụ thực sự cần giao tiếp với bên ngoài (như Nginx, API). Các dịch vụ như Database, Redis, Message Queue chỉ nên giao tiếp nội bộ thông qua Docker Network (--network my-network), tuyệt đối không mở port ra ngoài Host (không dùng -p 3306:3306 trên môi trường Production).

Tuyệt đối không dùng --network host: Trừ phi có lý do bất khả kháng, việc dùng network host sẽ gỡ bỏ lớp màng bọc mạng của Docker, khiến container tiếp xúc trực tiếp với card mạng của máy chủ.

4. Bảo mật Docker Daemon (Máy Host)
Bảo vệ Docker Socket: File /var/run/docker.sock là trái tim của Docker. Nếu bạn mount (gắn) file này vào bên trong một container (Ví dụ: docker run -v /var/run/docker.sock:/var/run/docker.sock), container đó có quyền tạo, xóa, điều khiển mọi container khác trên máy chủ, và về cơ bản là có quyền root của máy Host. Chỉ cấp quyền này cho các tool quản trị đáng tin cậy (như Portainer, Traefik).

Chạy Docker dạng Rootless (Rootless mode): Từ bản cập nhật mới, bạn có thể cài đặt toàn bộ Docker engine chạy dưới quyền một user bình thường trên Linux thay vì user root. Điều này tăng cường bảo mật lên một mức rất cao.

## Câu trả lời ngắn (phỏng vấn)

Multi-stage → image nhỏ. Cache layer dependency trước source. Non-root, distroless/alpine, không secret trong image. `.dockerignore`, scan CVE. Container ephemeral — config qua env, state qua volume/DB.
