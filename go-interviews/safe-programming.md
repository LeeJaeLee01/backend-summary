# Các nguyên tắc lập trình an toàn

## Tóm tắt một câu

Lập trình an toàn = **giảm surface tấn công và lỗi runtime**: validate input, least privilege, không tin client, secret ngoài code, timeout mọi I/O, log không lộ PII, dependency cập nhật.

---

## Input & output

| Nguyên tắc | Thực hành |
|------------|-----------|
| **Validate mọi input** | Schema (JSON), length, range, whitelist enum |
| **Parameterized query** | Không nối string SQL — chống SQL injection |
| **Escape output** | HTML/template escape chống XSS |
| **Giới hạn kích thước** | `MaxBytesReader`, limit upload, pagination cap |

---

## Authentication & authorization

- **AuthN** (ai?) tách **AuthZ** (được làm gì?).
- Check permission **server-side** — không tin role từ client.
- JWT: verify signature, `exp`, `iss`, `aud`; refresh token rotation.
- Session: HttpOnly, Secure, SameSite cookie.

---

## Secret & config

- Không hardcode password/API key trong code/git.
- Dùng env, vault, K8s Secret — inject lúc runtime.
- `.env` trong `.gitignore`; rotate key định kỳ.

---

## Network & I/O

- **TLS** mọi traffic production.
- **Timeout** mọi HTTP/DB/gRPC (`context.WithTimeout`).
- Rate limit, circuit breaker chống abuse và cascade fail.
- CORS cấu hình chặt — không `*` khi có credential.

---

## Concurrency & resource

- Tránh race — `go test -race`, mutex/atomic đúng chỗ.
- Giới hạn goroutine/worker pool, connection pool max.
- `defer` close body, rows, file descriptor.

---

## Error handling

- Không leak stack trace / internal path ra client production.
- Log đủ context (request ID) nhưng **không log** password, token, full PAN.
- Fail closed: lỗi auth → deny, không fallback open.

---

## Dependency & supply chain

- `go mod verify`, scan CVE (Dependabot, Snyk).
- Pin version image Docker; multi-stage build, non-root user.

---

## Câu trả lời ngắn (phỏng vấn)

Validate input, parameterized SQL, secret ngoài repo, TLS + timeout, auth server-side, rate limit, không log sensitive data, `go test -race`, least privilege container, cập nhật dependency.
