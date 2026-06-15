# JWT — Luồng đăng nhập & Verify token

## Tóm tắt một câu

**JWT** = header.payload.signature (Base64URL). Server ký bằng **secret** (HS256) hoặc **private key** (RS256). Client gửi `Authorization: Bearer <token>`; server **verify chữ ký + claims** (`exp`, `iss`) — không cần query session DB mỗi request (stateless).

---

## Cấu trúc JWT

```
eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
│        HEADER        │.│      PAYLOAD       │.│     SIGNATURE      │
```

### Header (JSON → Base64URL)

```json
{ "alg": "HS256", "typ": "JWT" }
```

### Payload (claims)

| Claim | Ý nghĩa |
|-------|---------|
| `sub` | Subject — user ID |
| `exp` | Expiration (Unix time) |
| `iat` | Issued at |
| `iss` | Issuer |
| `aud` | Audience |
| Custom | `role`, `tenant_id` |

**Lưu ý:** Payload chỉ **encode**, không **encrypt** — ai cũng đọc được; không put password vào JWT.

### Signature

```
HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  secret
)
```

**RS256:** sign bằng RSA private key; verify bằng public key — phù hợp nhiều service verify chung (JWKS).

---

## Luồng đăng nhập

```mermaid
sequenceDiagram
    participant C as Client
    participant A as Auth API
    participant DB as User DB

    C->>A: POST /login (email, password)
    A->>DB: Verify credential (bcrypt)
    A->>A: Generate access_token + refresh_token
    A-->>C: tokens (access ngắn, refresh dài)
    C->>A: GET /api/orders Authorization Bearer access_token
    A->>A: Verify signature, exp, claims
    A-->>C: 200 + data
```

1. **Login** — verify password (`bcrypt.CompareHashAndPassword`).
2. **Issue** — access token TTL ngắn (15m–1h), refresh token TTL dài (7–30 ngày).
3. **Request** — middleware parse Bearer, verify JWT.
4. **Refresh** — client gửi refresh token → endpoint riêng → access token mới.
5. **Logout** — blacklist refresh token (Redis) hoặc rotate refresh family.

---

## Verify access_token (Go ý tưởng)

```go
token, err := jwt.Parse(tokenString, func(t *jwt.Token) (interface{}, error) {
    if t.Method != jwt.SigningMethodHS256 {
        return nil, fmt.Errorf("unexpected alg")
    }
    return []byte(secret), nil
})
if err != nil || !token.Valid {
    return unauthorized
}
claims := token.Claims.(jwt.MapClaims)
// check exp (library thường tự check), iss, aud
```

**Phải verify:**
- Chữ ký đúng (secret/public key).
- `exp` chưa hết hạn.
- `alg` whitelist — chống `alg: none` attack.
- `iss`, `aud` nếu dùng multi-tenant.

---

## Access vs Refresh

| | Access token | Refresh token |
|---|--------------|---------------|
| TTL | Ngắn | Dài |
| Gửi mỗi API call | Có | Không (chỉ `/refresh`) |
| Lưu client | Memory / short-lived | HttpOnly cookie hoặc secure storage |
| Revoke | Khó (stateless) — TTL ngắn bù | Lưu DB/Redis để revoke |

---

## Bảo mật

- HTTPS only.
- Không lưu JWT localStorage nếu tránh XSS khó — cân nhắc HttpOnly cookie.
- Secret đủ entropy; RS256 khi nhiều verifier.
- Không put sensitive data trong payload.

---

## Câu trả lời ngắn (phỏng vấn)

JWT = header.payload.signature. Login verify password → ký token bằng HMAC/RSA. Mỗi request verify **chữ ký + exp + alg**. Access ngắn, refresh dài để revoke. Payload không mã hóa — không chứa secret.
