# ORM

## 1. Ưu nhược điểm khi sử dụng ORM (TypeORM vs Prisma)

**ORM (Object-Relational Mapping)** — ánh xạ bảng DB sang object/class, cho phép thao tác DB bằng code thay vì SQL thuần.

### Ưu điểm chung của ORM

| Ưu điểm | Mô tả |
|---------|--------|
| **Productivity** | Viết query nhanh hơn, ít SQL lặp lại |
| **Type-safe** | Giảm lỗi runtime nhờ type/check (đặc biệt Prisma + TS) |
| **Migration** | Quản lý schema version qua migration |
| **Tách biệt DB** | Đổi DB engine dễ hơn (mức độ tùy ORM) |
| **Bảo mật** | Giảm SQL injection nếu dùng query builder/parameterized query đúng cách |
| **Quan hệ** | Map relation (1-n, n-n) trực tiếp trong code |

### Nhược điểm chung của ORM

| Nhược điểm | Mô tả |
|------------|--------|
| **Performance** | Query phức tạp có thể sinh SQL kém tối ưu (N+1 problem) |
| **Learning curve** | Phải học API ORM, không chỉ SQL |
| **Query phức tạp** | Report, aggregate phức tạp — raw SQL đôi khi dễ hơn |
| **Abstraction leak** | Vẫn cần hiểu SQL để debug và tối ưu |
| **Migration conflict** | Team lớn dễ conflict khi quản lý schema |

---

### TypeORM

**Đặc điểm:** ORM phổ biến trong **NestJS** — dùng **decorator**, **Active Record** hoặc **Data Mapper**, hỗ trợ nhiều DB.

```typescript
@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @OneToMany(() => Post, post => post.user)
  posts: Post[];
}

// Repository pattern
const users = await userRepo.find({ relations: ['posts'] });
```

| Ưu điểm | Nhược điểm |
|---------|------------|
| Tích hợp tốt **NestJS** (`@nestjs/typeorm`) | Type-safety **yếu hơn Prisma** |
| Linh hoạt — raw query, QueryBuilder | API phức tạp, nhiều cách làm một việc |
| Hỗ trợ **nhiều DB** (Postgres, MySQL, SQLite, MongoDB...) | Dễ gặp **N+1 query** nếu không cẩn thận |
| Decorator quen thuộc với dev Angular/Nest | Migration đôi khi **khó đồng bộ** team |
| Active Record + Data Mapper | Performance cần tune thủ công |

---

### Prisma

**Đặc điểm:** **Schema-first** (`schema.prisma`), generate **type-safe client**, DX tốt với TypeScript.

```prisma
model User {
  id    Int    @id @default(autoincrement())
  name  String
  posts Post[]
}
```

```typescript
const users = await prisma.user.findMany({
  include: { posts: true },
});
```

| Ưu điểm | Nhược điểm |
|---------|------------|
| **Type-safe mạnh** — autocomplete, compile-time check | Chủ yếu **SQL database** (Postgres, MySQL, SQLite...) |
| **DX tốt** — schema rõ ràng, Prisma Studio | Ít linh hoạt hơn TypeORM với query phức tạp |
| Migration + `prisma generate` workflow gọn | Phải **generate client** sau mỗi lần đổi schema |
| Query API đơn giản, dễ đọc | NestJS tích hợp qua wrapper (không official như TypeORM) |
| Ít boilerplate hơn TypeORM | Một số tính năng DB đặc thù cần **raw query** |

---

### So sánh nhanh TypeORM vs Prisma

| Tiêu chí | TypeORM | Prisma |
|----------|---------|--------|
| **Style** | Decorator / class-based | Schema-first / generated client |
| **Type safety** | Trung bình | Rất tốt |
| **NestJS** | Official integration | Community module / tự wrap |
| **Learning curve** | Cao hơn | Thấp hơn |
| **Raw SQL** | Dễ dùng | Hỗ trợ `$queryRaw` |
| **Phù hợp** | NestJS lâu năm, cần linh hoạt | Project TS mới, ưu tiên DX & type-safe |

### Khi nào dùng / không dùng ORM?

**Nên dùng:** CRUD, API thông thường, team cần tốc độ phát triển, schema thay đổi thường xuyên.

**Cân nhắc raw SQL / query builder:** Report phức tạp, query performance-critical, bulk operation lớn.

> **TypeORM** — linh hoạt, hợp **NestJS** truyền thống. **Prisma** — type-safe, DX tốt, phù hợp project **TypeScript hiện đại**. Cả hai đều cần hiểu SQL để tránh N+1 và tối ưu query.

---

## 2. Khi nào chọn TypeORM, khi nào chọn Prisma?

Không có câu trả lời “luôn luôn X” — chọn theo **stack, team, và yêu cầu dự án**. Dưới đây là các tình huống cụ thể.

### Chọn TypeORM khi

| Tình huống | Lý do |
|------------|-------|
| **NestJS** là framework chính | `@nestjs/typeorm` là tích hợp **official**, docs và ví dụ NestJS đều xoay quanh TypeORM |
| Cần hỗ trợ **nhiều loại DB** | Postgres, MySQL, SQLite, **MongoDB**, Oracle, MSSQL... — Prisma tập trung SQL |
| Team quen **decorator / class-based** | Entity dạng class với `@Entity()`, `@Column()` — giống style Angular/Nest |
| Query **phức tạp, động** | `QueryBuilder`, subquery, raw SQL linh hoạt hơn — ít bị “khóa” trong API Prisma |
| **Legacy project** đã dùng TypeORM | Chi phí migrate sang Prisma cao, ít lợi ích nếu hệ thống ổn định |
| Cần **Active Record** pattern | `user.save()`, `user.remove()` trực tiếp trên entity — Prisma không có pattern này |
| Tích hợp thư viện Nest cũ | Nhiều package (audit log, soft-delete, multi-tenant) viết sẵn cho TypeORM |

**Ví dụ project phù hợp TypeORM:**

- API NestJS doanh nghiệp, team đã quen decorator.
- Hệ thống đa DB hoặc có MongoDB.
- Microservice cần QueryBuilder cho report động, filter phức tạp.

---

### Chọn Prisma khi

| Tình huống | Lý do |
|------------|-------|
| **Project mới**, ưu tiên **TypeScript + type-safe** | Client generate từ schema — autocomplete, lỗi compile-time khi query sai field |
| Team **nhỏ / junior** cần onboard nhanh | API đơn giản (`findMany`, `create`, `include`) — learning curve thấp hơn TypeORM |
| **Schema-first** workflow | Một file `schema.prisma` là single source of truth — dễ review, dễ đọc quan hệ |
| CRUD/API **chuẩn**, ít query “dị” | 80% use case API — Prisma đủ và gọn |
| Cần **Prisma Studio** debug data | GUI xem/sửa DB nhanh — hữu ích khi dev và QA |
| Stack **không chỉ NestJS** | Express, Fastify, Next.js API routes — Prisma framework-agnostic |
| Muốn **ít boilerplate** | Không cần viết Entity class + Repository + Module wiring như TypeORM |

**Ví dụ project phù hợp Prisma:**

- Startup MVP, fullstack TypeScript (Next.js + API).
- SaaS CRUD với schema thay đổi thường xuyên, team 2–5 dev.
- BFF/API layer cần type-safe end-to-end với frontend.

---

### Decision tree — chọn nhanh

```
Bắt đầu project mới?
├── NestJS + team quen Nest/decorator + cần official integration
│   └── → TypeORM (hoặc Prisma nếu ưu tiên type-safe hơn convention Nest)
├── NestJS + ưu tiên DX, type-safe, CRUD chuẩn
│   └── → Prisma
├── Cần MongoDB hoặc DB ít phổ biến
│   └── → TypeORM
├── Query/report phức tạp, nhiều raw SQL
│   └── → TypeORM (linh hoạt hơn) — hoặc Prisma + $queryRaw
└── Fullstack TS, Express/Fastify/Next.js
    └── → Prisma
```

---

### Các yếu tố quyết định (chi tiết)

#### 1. NestJS integration

| | TypeORM | Prisma |
|---|---------|--------|
| Official | `@nestjs/typeorm` built-in | Community: `nestjs-prisma`, hoặc tự inject `PrismaService` |
| Boilerplate | `TypeOrmModule.forRoot()`, entity per module | `PrismaModule` + `schema.prisma` |
| Cảm giác “native” trong Nest | Cao | Trung bình — vẫn dùng tốt, chỉ không “mặc định” |

→ NestJS thuần, team theo docs Nest chính thống: **TypeORM** tự nhiên hơn.  
→ NestJS nhưng coi Prisma là data layer chính: **Prisma** hoàn toàn ổn.

#### 2. Type safety

- **Prisma**: mạnh nhất — `prisma.user.findMany({ where: { emial: '' } })` → **lỗi compile** (typo field).
- **TypeORM**: type từ entity class nhưng `find({ where: { ... } })` dễ **lỏng** hơn, một số query builder gần như `any`.

→ Ưu tiên **ít bug runtime do typo query** → **Prisma**.

#### 3. Độ linh hoạt query

- **TypeORM**: `QueryBuilder`, `getRawMany()`, relation phức tạp, dynamic filter dễ stack.
- **Prisma**: API declarative đẹp cho CRUD; query rất phức tạp đôi khi phải `$queryRaw` / `$executeRaw`.

→ Nhiều **report, aggregate, dynamic SQL** → **TypeORM** (hoặc hybrid: Prisma CRUD + raw SQL riêng).

#### 4. Migration & schema

| | TypeORM | Prisma |
|---|---------|--------|
| Định nghĩa schema | Entity class (code-first) hoặc sync | `schema.prisma` (schema-first) |
| Migration | `migration:generate` — đôi khi diff khó đọc | `prisma migrate dev` — workflow rõ ràng |
| Sau đổi schema | Rebuild entity | **`prisma generate`** bắt buộc |

→ Team thích **một file schema trung tâm**, review dễ → **Prisma**.  
→ Đã có entity class khắp codebase → **TypeORM**.

#### 5. Performance

Cả hai đều có thể **chậm** nếu dùng sai (N+1, load quá nhiều relation).

- TypeORM: cần chủ động `relations`, `QueryBuilder`, `select` — dễ quên.
- Prisma: `include`/`select` rõ ràng hơn — nhưng vẫn có thể N+1 nếu lạm dụng nested include.

→ Performance phụ thuộc **cách viết query** hơn là ORM. Cả hai đều cần hiểu SQL.

#### 6. Ecosystem & hiring

- **TypeORM**: nhiều job NestJS VN/international yêu cầu TypeORM.
- **Prisma**: phổ biến mạnh trong startup, fullstack TS, được recommend nhiều từ 2022+.

---

### Không nên chọn chỉ vì…

| Suy nghĩ | Thực tế |
|----------|---------|
| “Prisma nhanh hơn TypeORM” | Cùng một query tối ưu thì chênh lệch nhỏ — bottleneck thường là SQL/索引, không phải ORM |
| “TypeORM đã lỗi thời” | Vẫn maintain, vẫn dùng rộng trong NestJS enterprise |
| “Phải chọn 1 ORM cho mọi query” | Hybrid OK: Prisma cho CRUD + `pg`/`knex` raw cho report nặng |
| “ORM thay được SQL” | Query phức tạp, bulk, tuning — vẫn cần raw SQL |

---

### Gợi ý thực tế theo vai trò

| Vai trò / context | Gợi ý |
|-------------------|-------|
| Backend NestJS, enterprise, team senior | **TypeORM** |
| Backend NestJS, greenfield, ưu tiên DX | **Prisma** |
| Fullstack Next.js / Remix | **Prisma** |
| Cần MongoDB | **TypeORM** (hoặc Mongoose riêng cho Mongo) |
| Microservices đa ngôn ngữ (Go, Python…) | DB contract chung; từng service chọn ORM riêng — Prisma/TypeORM chỉ trong service Node |

---

### Tóm tắt một dòng

| Chọn | Khi |
|------|-----|
| **TypeORM** | NestJS truyền thống, đa DB, query phức tạp, decorator/class, legacy |
| **Prisma** | Project TS mới, type-safe, schema-first, CRUD chuẩn, onboard nhanh |

> Quy tắc thực dụng: **greenfield + TypeScript + CRUD API** → thử **Prisma** trước. **NestJS + team đã TypeORM + query nặng** → giữ **TypeORM**. Dù chọn gì, luôn nắm **SQL**, **migration**, và cách tránh **N+1**.