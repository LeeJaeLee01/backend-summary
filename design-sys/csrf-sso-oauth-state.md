# CSRF & SSO — OAuth `state` + Redis

Bảo vệ luồng đăng nhập SSO (OAuth 2.0 / OIDC) khỏi request giả, và phân biệt với CSRF classic trên API sau login.

> Liên quan: [database/security.md](../database/security.md) (least privilege, session), [database/multi-tenant/index.md](../database/multi-tenant/index.md) (JWT `tid`, tenant SSO).

---

## 1. CSRF là gì?

**CSRF (Cross-Site Request Forgery)** = lừa **trình duyệt** của user **đã đăng nhập** gửi request **thật** tới **domain đúng**, trong khi user **không chủ đích** thực hiện hành động đó.

```
1. Alice login bank.com → browser lưu cookie session
2. Alice mở evil.com
3. evil.com gửi ngầm POST /transfer tới bank.com
4. Browser TỰ ĐỘNG gửi kèm cookie bank.com
5. bank.com tin đây là Alice → thực hiện chuyển tiền
```

| Đặc điểm | Giải thích |
|----------|------------|
| Request tới domain | **Đúng** (site thật) |
| Cookie/session | **Thật** của nạn nhân |
| Ý định user | **Giả** — do attacker khởi tạo |

**Không phải:** fake domain (đó là phishing) hay fake thông tin khi “truy cập domain đúng”.

### So sánh nhanh

| Loại | Mô tả |
|------|-------|
| **CSRF** | Dùng session có sẵn, gửi request không mong muốn |
| **Phishing** | Fake trang/domain (`bankk.com`) lừa nhập password |
| **XSS** | Inject script trên domain nạn nhân, đọc DOM/token |
| **Session hijacking** | Đánh cắp token rồi dùng trực tiếp |

---

## 2. SSO + Redis `state` — chống CSRF callback

Khi triển khai **login SSO**, pattern phổ biến và **đúng** là lưu **`state`** (và thường **PKCE**) trong **Redis** trước khi redirect sang IdP, rồi verify khi callback.

Đây **không** thay thế hoàn toàn CSRF classic, nhưng chống được **CSRF trên bước OAuth callback** — attacker không thể gắn `code` của nạn nhân vào phiên của họ nếu không có `state` hợp lệ.

### Luồng chuẩn

```
User click "Login SSO"
        │
        ▼
┌───────────────────────────────────────┐
│ 1. Server tạo state ngẫu nhiên        │
│    SET oauth:state:{uuid} → metadata  │  ← Redis, TTL 5–10 phút
│    (optional) lưu code_verifier PKCE  │
└───────────────────┬───────────────────┘
                    │
                    ▼
┌───────────────────────────────────────┐
│ 2. Redirect IdP                       │
│    ?client_id=...&state={uuid}        │
│    &code_challenge=... (PKCE)         │
└───────────────────┬───────────────────┘
                    │
                    ▼
         IdP xác thực user
                    │
                    ▼
┌───────────────────────────────────────┐
│ 3. Callback                           │
│    GET /callback?code=...&state=...   │
└───────────────────┬───────────────────┘
                    │
                    ▼
┌───────────────────────────────────────┐
│ 4. Verify                             │
│    - state tồn tại trong Redis?       │
│    - DEL state (one-time)             │
│    - PKCE code_verifier khớp?         │
│    - redirect_uri trong whitelist?    │
│    → đổi code lấy token               │
└───────────────────┬───────────────────┘
                    │
                    ▼
         Tạo session/JWT mới → response
```

**“Login từ chỗ khác là sai”** = callback không có `state` mà server đã phát hành ở bước 1 → **reject**.

### Redis nên lưu gì?

Tách key — **không** gộp `state` với session login dài hạn:

| Key Redis | Mục đích | TTL |
|-----------|----------|-----|
| `oauth:state:{random}` | Chống CSRF callback | 5–10 phút, **one-time** |
| `oauth:pkce:{state}` | `code_verifier` (PKCE) | Cùng TTL với state |
| `session:{sessionId}` | Session sau login thành công | Theo policy session |

Payload gợi ý cho `oauth:state:{uuid}`:

```json
{
  "tenantSlug": "acme",
  "redirectAfterLogin": "/dashboard",
  "createdAt": 1718123456
}
```

---

## 3. CSRF classic vs CSRF OAuth callback

| | CSRF classic (form/API) | CSRF OAuth callback |
|--|-------------------------|---------------------|
| **Khi nào** | Sau login, gọi API state-changing | Lúc IdP redirect về `/callback` |
| **Vector** | Cookie tự gửi kèm `POST /transfer` | Gắn `code` authorization vào session attacker |
| **Giải pháp** | SameSite cookie, CSRF token, Origin check | **`state` + Redis**, PKCE |
| **Bearer JWT API** | Ít rủi ro CSRF cookie | N/A (callback vẫn cần `state`) |

Làm SSO với Redis `state` **không** miễn nhiễm CSRF cho API dùng **cookie session** sau login.

---

## 4. Checklist triển khai

### OAuth / SSO (bắt buộc)

```
□ state: crypto.randomBytes(32) — entropy đủ, không predictable
□ state: lưu server-side (Redis), verify khi callback
□ state: one-time — GET + DEL atomic (hoặc Lua script)
□ state: TTL ngắn (5–10 phút)
□ PKCE: code_challenge (S256) + code_verifier — bắt buộc SPA/mobile
□ redirect_uri: whitelist chính xác trên IdP
□ Multi-tenant: state bind tenant_slug — token tenant A không dùng cho tenant B
□ Sau login: rotate session / issue JWT mới — tránh session fixation
```

### API sau login

```
□ Cookie session: HttpOnly, Secure, SameSite=Lax hoặc Strict
□ POST/PUT/DELETE: CSRF token hoặc SameSite=Strict
□ SPA + JWT header: ít CSRF cookie — nhưng phải chống XSS (token trong memory/localStorage)
□ Kiểm tra Origin / Referer cho cookie-based API
```

### Redis ops

```
□ Namespace key: oauth:state: — tránh collision
□ Fail closed: Redis down → từ chối initiate SSO hoặc callback (không skip verify)
□ Không log state/code_verifier ra plain text
```

---

## 5. Ví dụ code (NestJS — pseudo)

### 5.1. Bắt đầu SSO — lưu state

```typescript
// GET /auth/sso/login?tenant=acme
async initiateSso(tenantSlug: string, res: Response) {
  const state = randomBytes(32).toString('hex');
  const codeVerifier = randomBytes(32).toString('base64url');
  const codeChallenge = createHash('sha256')
    .update(codeVerifier)
    .digest('base64url');

  // Bước 1: lưu Redis — chống CSRF callback
  await this.redis.setex(
    `oauth:state:${state}`,
    600,
    JSON.stringify({ tenantSlug }),
  );
  await this.redis.setex(`oauth:pkce:${state}`, 600, codeVerifier);

  const url = this.idp.getAuthorizeUrl({
    state,
    codeChallenge,
    redirectUri: this.config.redirectUri,
  });
  return res.redirect(url);
}
```

### 5.2. Callback — verify state

```typescript
// GET /auth/sso/callback?code=...&state=...
async handleCallback(code: string, state: string) {
  // Bước 4: verify — login "từ chỗ khác" không có state hợp lệ → reject
  const key = `oauth:state:${state}`;
  const raw = await this.redis.get(key);
  if (!raw) {
    throw new UnauthorizedException('Invalid or expired OAuth state');
  }
  await this.redis.del(key); // one-time

  const codeVerifier = await this.redis.get(`oauth:pkce:${state}`);
  await this.redis.del(`oauth:pkce:${state}`);
  if (!codeVerifier) {
    throw new UnauthorizedException('Missing PKCE verifier');
  }

  const meta = JSON.parse(raw) as { tenantSlug: string };
  const tokens = await this.idp.exchangeCode(code, {
    codeVerifier,
    redirectUri: this.config.redirectUri,
  });

  // Issue JWT/session — bind tenant (doc multi-tenant: tid, tslug)
  return this.authService.issueSession(tokens, meta.tenantSlug);
}
```

### 5.3. Multi-tenant — JWT `tid` khớp subdomain

```typescript
// Sau SSO + mỗi API request (xem demo/multi-tenant)
if (jwt.tslug !== resolvedTenant.slug) {
  throw new UnauthorizedException('JWT tenant mismatch');
}
```

---

## 6. Lỗi thường gặp

| Lỗi | Hậu quả |
|-----|---------|
| `state` chỉ lưu client (localStorage) không verify server | CSRF callback vẫn khả thi |
| `state` tái sử dụng được | Replay attack |
| `state` ngắn / sequential | Brute-force |
| Không PKCE trên public client | Intercept `code` |
| `redirect_uri` lỏng (`*` hoặc prefix match sai) | Code redirection |
| Redis lưu “đang login” nhưng không verify `state` | Tưởng an toàn nhưng chưa chống CSRF SSO |
| Chỉ làm SSO `state`, API cookie không SameSite/CSRF token | CSRF classic sau login |

---

## 7. Tóm tắt

| Câu hỏi | Trả lời |
|---------|---------|
| CSRF có phải fake khi truy cập domain đúng? | **Không** — request **thật**, session **thật**, **ý định** giả |
| Redis `state` trong SSO để làm gì? | Verify callback **do app khởi tạo** — chống CSRF OAuth |
| Đủ chưa? | Cần thêm **PKCE**, **redirect_uri whitelist**, bảo vệ API sau login |
| Bearer JWT thay cookie? | Giảm CSRF classic; vẫn cần `state` cho SSO callback + chống XSS |

---

*Tham chiếu: [RFC 6749 OAuth 2.0](https://datatracker.ietf.org/doc/html/rfc6749), [RFC 7636 PKCE](https://datatracker.ietf.org/doc/html/rfc7636), [OWASP CSRF](https://owasp.org/www-community/attacks/csrf).*
