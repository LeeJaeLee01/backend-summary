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

## Câu trả lời ngắn (phỏng vấn)

Multi-stage → image nhỏ. Cache layer dependency trước source. Non-root, distroless/alpine, không secret trong image. `.dockerignore`, scan CVE. Container ephemeral — config qua env, state qua volume/DB.
