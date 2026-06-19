# Docker — Khái niệm, build, bảo mật, tối ưu & vận hành

> Tổng hợp kiến thức cần chú ý khi làm việc với Docker: từ khái niệm cơ bản, build image an toàn & tiết kiệm, tận dụng cache, scale workload, đến tối ưu sau khi image đã build và container đang chạy.

**Liên quan:** [go-interviews/docker.md](../go-interviews/docker.md) (tóm tắt phỏng vấn), [go-interviews/kubernetes.md](../go-interviews/kubernetes.md) (orchestration trên K8s), [go-interviews/cicd.md](../go-interviews/cicd.md) (pipeline CI/CD).

---

## 1. Tổng quan — Docker trong vòng đời ứng dụng

```
┌─────────────┐    docker build     ┌─────────────┐    docker push     ┌──────────────┐
│  Source +   │ ──────────────────► │    Image    │ ─────────────────► │   Registry   │
│ Dockerfile  │                     │  (layers)   │                    │ ECR/GCR/Harbor│
└─────────────┘                     └──────┬──────┘                    └──────┬───────┘
                                           │                                │
                                           │ docker run / compose / K8s     │
                                           ▼                                ▼
                                    ┌─────────────┐                  ┌──────────────┐
                                    │  Container  │ ◄── pull ────────│   Deploy     │
                                    │  (runtime)  │                  │ staging/prod │
                                    └─────────────┘                  └──────────────┘
```

**Nguyên tắc vận hành:**

| Nguyên tắc | Ý nghĩa |
|------------|---------|
| **Immutable image** | Mỗi version = một tag/digest cố định; không sửa container đang chạy |
| **Ephemeral container** | Container có thể chết bất cứ lúc nào — state lưu volume/DB, không trong filesystem container |
| **Config qua env/secret** | Không bake config môi trường vào image |
| **Least privilege** | Non-root, minimal base, drop capabilities |
| **Observable** | Log stdout/stderr, health check, metrics |

---

## 2. Khái niệm cơ bản

### 2.1 Image vs Container

| Khái niệm | Mô tả | Ví dụ |
|-----------|-------|-------|
| **Image** | Template read-only gồm các **layer** xếp chồng (filesystem snapshot) | `myapp:1.2.3@sha256:abc...` |
| **Container** | Process đang chạy được tạo từ image + writable layer mỏng | `docker run myapp:1.2.3` |
| **Layer** | Mỗi instruction trong Dockerfile tạo một layer — dùng chung giữa các image | `RUN apt install` → layer mới |
| **Tag** | Nhãn con người đọc được trỏ tới image | `latest`, `v1.2.3`, `main-abc123` |
| **Digest** | Hash SHA256 không đổi — định danh chính xác image | `sha256:3f9a...` |

```
Image (read-only layers)          Container
┌─────────────────┐               ┌─────────────────┐
│ Layer 4: CMD    │               │ Writable layer  │ ← log, temp file
├─────────────────┤      +      ├─────────────────┤
│ Layer 3: COPY   │  ────────►    │ Layer 4         │
├─────────────────┤               ├─────────────────┤
│ Layer 2: RUN    │               │ Layer 3         │
├─────────────────┤               ├─────────────────┤
│ Layer 1: FROM   │               │ Layer 2         │
└─────────────────┘               ├─────────────────┤
                                  │ Layer 1         │
                                  └─────────────────┘
```

### 2.2 Dockerfile, Build context, Registry

| Khái niệm | Mô tả |
|-----------|-------|
| **Dockerfile** | File mô tả cách build image (FROM, COPY, RUN, ...) |
| **Build context** | Thư mục gửi lên Docker daemon khi `docker build` — càng lớn càng chậm |
| **`.dockerignore`** | Loại file khỏi build context (như `.gitignore`) |
| **Registry** | Kho lưu image: Docker Hub, ECR, GCR, Harbor, GHCR |
| **Multi-stage build** | Nhiều `FROM` trong một Dockerfile — stage build tách khỏi stage runtime |

### 2.3 Storage & Network

| Khái niệm | Mô tả | Khi nào dùng |
|-----------|-------|--------------|
| **Volume** | Data do Docker quản lý, persist qua container lifecycle | DB data, upload file |
| **Bind mount** | Map thư mục host vào container | Dev hot-reload (không dùng prod) |
| **tmpfs mount** | RAM disk — mất khi container stop | Secret tạm, cache nhạy cảm |
| **Bridge network** | Network ảo mặc định — container giao tiếp qua IP nội bộ | Compose, dev |
| **Overlay network** | Multi-host (Swarm, overlay driver) | Cluster nhỏ |
| **Host network** | Container dùng network stack của host | Hiếm — bỏ isolation |

### 2.4 Container runtime stack

```
┌────────────────────────────────────────┐
│  docker CLI / compose / K8s kubelet    │
├────────────────────────────────────────┤
│  containerd (quản lý image & container)│
├────────────────────────────────────────┤
│  runc (OCI runtime — tạo namespace)    │
├────────────────────────────────────────┤
│  Linux kernel (cgroups, namespaces)    │
└────────────────────────────────────────┘
```

**Hiểu nhanh:** Docker/K8s gọi containerd → runc tạo process cô lập bằng **namespaces** (PID, network, mount...) và **cgroups** (giới hạn CPU/RAM).

---

## 3. Build image — Bảo mật

### 3.1 Base image an toàn

| Practice | Lý do |
|----------|-------|
| Dùng **distroless** / **alpine** / **slim** thay full OS | Giảm attack surface — không shell, curl, package manager thừa |
| **Pin tag cụ thể** (`node:20.11-alpine3.19`) | `latest` có thể đổi bất ngờ, khó reproduce |
| **Pin digest** (`FROM node@sha256:...`) | Đảm bảo byte-for-byte giống nhau mọi môi trường |
| Dùng image **official** hoặc **vendor** đáng tin | Giảm supply chain risk |
| Cập nhật base định kỳ + scan CVE | Patch lỗ hổng đã biết |

```dockerfile
# Tốt — pin version
FROM golang:1.22.5-alpine3.19 AS builder

# Tốt hơn — pin digest (production)
FROM golang:1.22.5-alpine3.19@sha256:abc123... AS builder
```

### 3.2 Không đưa secret vào image

| Sai | Đúng |
|-----|------|
| `ENV DB_PASSWORD=secret` trong Dockerfile | Inject lúc runtime: env, Docker Secret, Vault, K8s Secret |
| `COPY .env .` | `.dockerignore` loại `.env*` |
| `ARG TOKEN=xxx` rồi commit | `ARG` lưu trong image history — dùng BuildKit secret mount |
| Hardcode API key trong source rồi COPY | Secret manager + mount runtime |

```dockerfile
# BuildKit — secret không lưu trong layer
RUN --mount=type=secret,id=npmrc,target=/root/.npmrc \
    npm ci
```

```bash
# Build với secret
DOCKER_BUILDKIT=1 docker build \
  --secret id=npmrc,src=$HOME/.npmrc \
  -t myapp .
```

### 3.3 User & quyền trong image

```dockerfile
# Alpine
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Debian/Ubuntu
RUN groupadd -r appgroup && useradd -r -g appgroup appuser
USER appuser
```

| Practice | Lý do |
|----------|-------|
| `USER nonroot` trước `ENTRYPOINT` | Process trong container không chạy root |
| `COPY --chown=appuser:appgroup` | File app thuộc user không đặc quyền |
| Không `chmod 777` | Mở quyền ghi cho mọi user |

### 3.4 Scan & gate trong CI

```
Code push → docker build → scan (Trivy/Snyk/Grype) → gate CVE
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
              CRITICAL=0        HIGH ≤ N        report only
              block deploy      warn/approve     dev branch
```

**Công cụ phổ biến:** Trivy, Grype, Snyk, Docker Scout, ECR image scanning.

**Gate gợi ý production:**

- Block nếu CVE **CRITICAL** chưa có fix hoặc chưa có exception.
- Block nếu secret leak (Trivy secret scanner, gitleaks).
- Yêu cầu SBOM (Software Bill of Materials) cho compliance.

### 3.5 Supply chain

| Practice | Mô tả |
|----------|-------|
| **Sign image** (cosign, Notary) | Verify image do CI team build, không bị thay |
| **Private registry** | Kiểm soát ai pull/push |
| **Minimal RUN curl \| bash** | Tránh tải script không verify |
| **Verify checksum** khi download binary | `sha256sum` trước khi COPY |

---

## 4. Build image — Tiết kiệm & caching

### 4.1 Multi-stage build — image nhỏ = ít storage + pull nhanh

```dockerfile
# ── Stage 1: build ──
FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /server .

# ── Stage 2: runtime tối thiểu ──
FROM gcr.io/distroless/static-debian12:nonroot
COPY --from=builder /server /server
ENTRYPOINT ["/server"]
```

**Kết quả:** Image runtime chỉ chứa binary — không compiler, source, `node_modules` dev.

| Base image | Kích thước gợi ý | Ghi chú |
|------------|------------------|---------|
| `ubuntu:22.04` | ~77 MB | Nhiều package thừa |
| `node:20` | ~1 GB | Full Debian + npm |
| `node:20-alpine` | ~180 MB | Nhỏ hơn, musl libc |
| `distroless/nodejs20` | ~120 MB | Không shell |
| `scratch` + static binary | ~10–30 MB | Go static build |

### 4.2 Layer cache — thứ tự instruction quan trọng

Docker cache layer khi instruction **không đổi**. Thay đổi một layer → **invalidate tất cả layer phía sau**.

```dockerfile
# ✅ Tốt — dependency ít đổi, copy trước
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# ❌ Kém — mỗi lần đổi code phải npm ci lại
COPY . .
RUN npm ci && npm run build
```

**Quy tắc sắp xếp layer (ít đổi → hay đổi):**

1. `FROM`, cài system package
2. Copy file dependency lock (`go.mod`, `package-lock.json`, `requirements.txt`)
3. Download/install dependency
4. Copy source code
5. Build
6. Copy artifact sang stage runtime

### 4.3 `.dockerignore` — giảm context & tránh leak

```gitignore
# .dockerignore
.git
.gitignore
node_modules
dist
coverage
*.md
.env*
**/*_test.go
**/*.test.js
Dockerfile*
docker-compose*
```

**Lợi ích:** Build nhanh hơn, context nhỏ hơn, không vô tình COPY secret/test data.

### 4.4 BuildKit — cache nâng cao

```bash
# Bật BuildKit (mặc định Docker Desktop; Linux: export DOCKER_BUILDKIT=1)
export DOCKER_BUILDKIT=1
```

```dockerfile
# Cache mount — dependency cache giữa các lần build
RUN --mount=type=cache,target=/go/pkg/mod \
    go mod download

RUN --mount=type=cache,target=/root/.cache/go-build \
    CGO_ENABLED=0 go build -o /server .

# npm cache
RUN --mount=type=cache,target=/root/.npm \
    npm ci
```

```bash
# Registry cache — CI share cache giữa runner
docker buildx build \
  --cache-from type=registry,ref=myregistry/myapp:buildcache \
  --cache-to type=registry,ref=myregistry/myapp:buildcache,mode=max \
  -t myregistry/myapp:v1 .
```

### 4.5 Tiết kiệm chi phí registry & bandwidth

| Cách | Tiết kiệm |
|------|-----------|
| Image nhỏ (multi-stage, alpine/distroless) | Storage registry, pull time, egress |
| Tag theo `git sha` + semver, **dọn tag cũ** | Registry storage |
| **Deduplicate layer** — nhiều service dùng chung base | Pull một lần, layer share |
| **Lazy pull** (K8s eStargz, soci snapshotter) | Pod start nhanh, ít pull full image |
| Build trên CI gần registry (cùng region) | Egress + latency |
| Không push image trùng nội dung (rebuild cùng digest) | CI time + storage |

### 4.6 Dockerfile checklist (build-time)

```
□ Multi-stage build
□ Pin base image version (tag hoặc digest)
□ USER non-root
□ .dockerignore đầy đủ
□ Dependency copy trước source
□ Không secret trong Dockerfile/ARG/ENV
□ Scan CVE trong CI
□ HEALTHCHECK (nếu chưa có probe ở orchestrator)
□ LABEL version, maintainer, git commit (metadata)
```

---

## 5. Chạy container — Bảo mật runtime

### 5.1 Resource limits — tránh noisy neighbor

```bash
docker run \
  --memory="512m" \
  --memory-swap="512m" \
  --cpus="1.0" \
  --pids-limit=100 \
  myapp:1.2.3
```

```yaml
# docker-compose.yml
services:
  api:
    image: myapp:1.2.3
    deploy:
      resources:
        limits:
          cpus: "1.0"
          memory: 512M
        reservations:
          cpus: "0.25"
          memory: 128M
```

| Thiếu limit | Hậu quả |
|-------------|---------|
| Không giới hạn RAM | OOM kill cả host hoặc container khác |
| Không giới hạn CPU | Một container chiếm hết CPU |
| Không `pids-limit` | Fork bomb có thể làm cạn PID host |

### 5.2 Filesystem & capabilities

```bash
docker run \
  --read-only \
  --tmpfs /tmp:rw,noexec,nosuid,size=64m \
  --cap-drop=ALL \
  --security-opt=no-new-privileges:true \
  myapp:1.2.3
```

| Option | Mục đích |
|--------|----------|
| `--read-only` | Không ghi root filesystem — chặn malware persist |
| `--tmpfs /tmp` | Cho phép ghi thư mục cụ thể (log tạm, cache) |
| `--cap-drop=ALL` | Bỏ Linux capabilities — chỉ add lại nếu cần |
| `no-new-privileges` | Process con không leo quyền (setuid) |

### 5.3 Network isolation

```
                    Internet
                        │
                        ▼
                 ┌─────────────┐
                 │   Nginx     │  ← publish port 443
                 │  (reverse   │
                 │   proxy)    │
                 └──────┬──────┘
                        │ internal network
          ┌─────────────┼─────────────┐
          ▼             ▼             ▼
     ┌─────────┐   ┌─────────┐   ┌─────────┐
     │   API   │   │  Redis  │   │   DB    │
     │ :8080   │   │ :6379   │   │ :5432   │
     └─────────┘   └─────────┘   └─────────┘
     Không publish port DB/Redis ra host
```

| Practice | Lý do |
|----------|-------|
| Chỉ `-p` service cần expose ra ngoài | DB/Redis không lộ ra internet |
| Dùng user-defined network | DNS nội bộ (`db`, `redis`) |
| Tránh `--network host` | Mất network isolation |
| TLS nội bộ (service mesh / stunnel) | Encrypt traffic giữa service |

### 5.4 Secret & config lúc runtime

| Cách | Phù hợp |
|------|---------|
| Env var từ orchestrator | Config đơn giản, non-sensitive |
| File mount (Docker Secret, K8s Secret volume) | Password, cert, API key |
| Vault / AWS SM / GCP SM | Rotation, audit, central management |
| `.env` file (dev only) | Không commit, không dùng prod |

```yaml
# docker-compose — secret
secrets:
  db_password:
    file: ./secrets/db_password.txt

services:
  api:
    secrets:
      - db_password
    environment:
      DB_PASSWORD_FILE: /run/secrets/db_password
```

### 5.5 Bảo vệ Docker host

| Rủi ro | Cách phòng |
|--------|------------|
| Mount `/var/run/docker.sock` vào container | Container = root host — chỉ tool tin cậy (Traefik, Portainer) |
| Chạy Docker daemon as root | Cân nhắc **rootless Docker** |
| Container privileged (`--privileged`) | Tránh trừ driver đặc biệt — dùng capability cụ thể |
| Image không tin cậy từ internet | Scan + private registry |

---

## 6. Chạy container — Tối ưu runtime

### 6.1 Health check

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:8080/health || exit 1
```

```yaml
# compose
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
  interval: 30s
  timeout: 3s
  retries: 3
  start_period: 10s
```

| Loại | Mục đích |
|------|----------|
| **Liveness** | Container còn sống không — fail → restart |
| **Readiness** | Sẵn sàng nhận traffic chưa — fail → remove khỏi LB |
| **Startup** | App khởi động lâu — tránh kill sớm (K8s startupProbe) |

### 6.2 Logging

```bash
# Mặc định: json-file driver
docker logs -f <container>

# Production — giới hạn log, tránh đầy disk
docker run --log-driver=json-file \
  --log-opt max-size=10m \
  --log-opt max-file=3 \
  myapp
```

**Best practice:**

- App log ra **stdout/stderr** — không ghi file trong container.
- Ship log sang centralized (Loki, ELK, CloudWatch) qua agent.
- Structured log (JSON) — dễ query.

### 6.3 Graceful shutdown

```dockerfile
# Go, Node — nhận SIGTERM
STOPSIGNAL SIGTERM
```

```yaml
# compose — thời gian chờ trước SIGKILL
stop_grace_period: 30s
```

**Luồng shutdown đúng:**

```
SIGTERM → app stop nhận request mới → drain request đang chạy → đóng DB/queue → exit 0
   │                                                              │
   └── sau stop_grace_period ──────────────────────────────────► SIGKILL
```

### 6.4 Restart policy

| Policy | Khi nào |
|--------|---------|
| `no` | Job one-shot, dev |
| `on-failure` | Retry khi exit code ≠ 0 |
| `unless-stopped` | Prod single-host — tự restart trừ khi user stop |
| `always` | Luôn restart kể cả sau reboot host |

### 6.5 Volume & I/O

| Practice | Lý do |
|----------|-------|
| Data quan trọng → **named volume** | Persist qua container recreate |
| Bind mount chỉ cho dev | Performance & portability kém trên Mac/Win |
| Log không ghi vào volume | Dùng log driver / centralized logging |
| DB trong container (dev only) | Prod: managed DB hoặc StatefulSet + PVC |

---

## 7. Scale — từ single host đến cluster

### 7.1 Docker Compose — scale đơn giản

```bash
# Scale service (cần stateless app + LB)
docker compose up -d --scale api=3
```

```
                    ┌─────────────┐
         Request ──►│   Nginx     │
                    │  (LB/proxy) │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
         ┌─────────┐ ┌─────────┐ ┌─────────┐
         │ api-1   │ │ api-2   │ │ api-3   │
         └─────────┘ └─────────┘ └─────────┘
```

**Điều kiện scale horizontal:**

- App **stateless** — session lưu Redis/DB, không in-memory local.
- Shared nothing — upload file lên S3, không local disk.
- Health check + LB phân phối traffic.

### 7.2 Docker Swarm (tóm tắt)

| Khái niệm | Vai trò |
|-----------|---------|
| **Service** | Desired state — N replica |
| **Overlay network** | Multi-node communication |
| **Routing mesh** | LB ingress tới replica bất kỳ |

Phù hợp cluster nhỏ; production lớn thường chuyển **Kubernetes**.

### 7.3 Kubernetes — scale production

| Mechanism | Mô tả |
|-----------|-------|
| **Deployment replicas** | `kubectl scale deployment api --replicas=5` |
| **HPA** | Auto scale theo CPU/memory/custom metric |
| **VPA** | Điều chỉnh requests/limits (ít dùng trực tiếp cho stateless) |
| **Cluster Autoscaler** | Thêm/bớt node khi pod pending |
| **PDB** | Đảm bảo min available khi rolling update |

```
Traffic tăng → HPA thấy CPU > target → tăng replicas
                    │
                    ▼
         Pod pending (thiếu node) → Cluster Autoscaler add node
```

### 7.4 Scale checklist

```
□ App stateless hoặc session externalized
□ Health check (readiness) trước khi nhận traffic
□ Resource requests/limits đặt đúng — scheduler + HPA cần số liệu
□ DB/queue không scale cùng API — plan connection pool
□ Sticky session chỉ khi bắt buộc — ưu tiên stateless
□ Load test trước khi tin HPA config
```

---

## 8. Tối ưu sau deploy — vận hành liên tục

### 8.1 Image lifecycle

| Practice | Mô tả |
|----------|-------|
| Tag `semver` + `git-sha` | Trace được commit đang chạy |
| Retention policy registry | Xóa image cũ > N ngày, giữ major tags |
| Rollback nhanh | Deploy previous digest, không rebuild |
| Canary / blue-green | Giảm blast radius khi deploy image mới |

```bash
# Rollback — deploy lại digest cũ
docker pull myregistry/myapp@sha256:previous_digest
# hoặc K8s: kubectl rollout undo deployment/api
```

### 8.2 Monitoring container

| Metric | Cảnh báo khi |
|--------|--------------|
| CPU % / throttling | Gần limit — cần tăng limit hoặc scale |
| Memory usage / OOMKilled | Gần limit — leak hoặc thiếu RAM |
| Restart count | Liveness fail liên tục |
| Disk (overlay2, volume) | Log hoặc data đầy |
| Network I/O | Bottleneck egress |

**Công cụ:** cAdvisor, Prometheus + node_exporter, Datadog, CloudWatch Container Insights.

### 8.3 Prune & dọn tài nguyên host

```bash
# Xem dung lượng
docker system df

# Dọn an toàn — container stopped, network unused, dangling image
docker system prune

# Mạnh hơn — xóa cả image không dùng (cẩn thận)
docker system prune -a --volumes
```

| Vấn đề | Triệu chứng | Xử lý |
|--------|-------------|-------|
| Dangling images | Disk đầy | `docker image prune` |
| Build cache phình | Build chậm dần | `docker builder prune` |
| Zombie container | Nhiều `Exited` | `docker container prune` |
| Log json-file lớn | Disk host đầy | `max-size`, `max-file` hoặc log driver khác |

### 8.4 Performance tuning

| Tối ưu | Chi tiết |
|--------|----------|
| **CPU pinning** | `--cpuset-cpus` cho workload nhạy latency |
| **ulimit** | Tăng `nofile` cho high connection |
| **`init` process** | `--init` hoặc tini — reap zombie child process |
| **Connection pool** | DB pool size × replicas ≤ DB max connections |
| **Warm pool** | Giữ N container sẵn sàng — giảm cold start |

### 8.5 Update & patch workflow

```
1. Patch base image / dependency
2. Rebuild image trên CI (cache giúp nhanh)
3. Scan CVE — pass gate
4. Deploy staging — smoke + integration test
5. Canary 5% → 50% → 100%
6. Monitor error rate, latency, restart
7. Rollback nếu SLO vi phạm
```

---

## 9. Anti-pattern cần tránh

| Anti-pattern | Vấn đề | Thay bằng |
|--------------|--------|-----------|
| `latest` tag trên production | Không biết đang chạy version nào | Pin tag/digest |
| Một container nhiều process (sshd + app) | Khó scale, khó debug | Một process chính / sidecar pattern |
| SSH vào container để sửa | Mất immutable, không audit | Rebuild image + redeploy |
| Lưu state trong container filesystem | Mất data khi recreate | Volume / external store |
| `docker commit` tạo image | Không reproducible | Dockerfile + CI |
| Privileged container | Gần như root host | Capabilities tối thiểu |
| Không health check | Traffic vào container chưa sẵn sàng | Readiness probe |
| Build context khổng lồ | CI chậm | `.dockerignore` |

---

## 10. Tham chiếu nhanh — lệnh thường dùng

```bash
# Build & run
docker build -t myapp:v1 .
docker run -d --name api -p 8080:8080 --env-file .env.prod myapp:v1

# Inspect
docker ps -a
docker inspect <container>
docker history myapp:v1          # xem layers
docker image inspect myapp:v1 --format='{{.Size}}'

# Debug
docker logs -f <container>
docker exec -it <container> sh   # chỉ dev — prod image distroless không có sh
docker stats                     # CPU/RAM realtime

# Compose
docker compose up -d --build
docker compose ps
docker compose logs -f api

# Cleanup
docker system df
docker system prune -f
```

---

## 11. Tóm tắt theo giai đoạn

| Giai đoạn | Ưu tiên hàng đầu |
|-----------|------------------|
| **Thiết kế Dockerfile** | Multi-stage, non-root, pin base, .dockerignore, layer order |
| **CI build** | BuildKit cache, scan CVE, không secret trong image, tag sha |
| **Deploy** | Resource limits, read-only FS, network isolation, health check |
| **Scale** | Stateless, HPA/replicas, connection pool, LB |
| **Vận hành** | Monitor OOM/restart, log rotation, prune disk, rollback digest |

> **Một câu nhớ:** Image **nhỏ & sạch**, container **ephemeral & non-root**, config **runtime**, data **volume/DB**, deploy **immutable tag/digest**, scale **stateless + health check**.
