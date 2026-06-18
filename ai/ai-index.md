# AI Index — Cách chúng tôi dùng AI trên tầng điều phối APA

Đây là điểm vào cho công việc hỗ trợ bởi AI trên repo này. Tài liệu giải thích cách cấu hình trợ lý lập trình AI, quy trình feature end-to-end, nơi lưu artifact do AI tạo ra, và các quy tắc mọi trợ lý phải tuân theo.

Nếu chỉ đọc một phần: **Công việc AI ở đây là pipeline có cấu trúc, không phải prompt tự do.** Một feature đi theo luồng `start → execute → complete`, mỗi bước để lại một artifact đã commit (spec, plan, PR, Jira), và skill ghi đè hành vi mặc định của model trong khi hướng dẫn trực tiếp từ developer ghi đè skill.

→ Tiết kiệm chi phí model: [model-routing-cost.md](./model-routing-cost.md) · [claude-workflow-model-switch.md](./claude-workflow-model-switch.md) (playbook chuyển model từng phase)

---

## 1. Context cố định mỗi phiên làm việc đều nạp

| File | Vai trò |
| ---- | ------- |
| [`CLAUDE.md`](../CLAUDE.md) | Context dự án, cấu trúc repo, vòng lặp dev, quy ước code, invariant nghiệp vụ (currency `BUY/SELL`, phân loại deal). Tự động nạp mỗi phiên Claude Code. |
| [`docs/TECHNICAL-SPEC.md`](TECHNICAL-SPEC.md) | Technical spec nguồn sự thật mà trợ lý suy luận từ đó. |
| [`docs/FXO Feature requests.md`](FXO%20Feature%20requests.md) | Hợp đồng FXO phía vendor (DataSoft). |
| `.claude/settings.json` | Quyền được phê duyệt sẵn (vd. `pnpm *`, `git *`, `npx vitest *`). |
| `.claude/feature-state.json` | Trạng thái bàn giao theo feature (Jira ID, PR URL, branch, đường dẫn spec/plan). Tạm thời — tạo lúc `start`, xóa lúc `complete`. |

Hướng dẫn trong `CLAUDE.md` **ghi đè** hành vi mặc định của trợ lý và mặc định của skill. Chỉ có hướng dẫn trực tiếp từ developer mới ghi đè `CLAUDE.md`.

---

## 2. Quy trình feature (xương sống của mọi công việc AI)

Một feature được điều khiển bởi ba skill cục bộ trong `.claude/skills/`, xếp chồng lên skill `superpowers` generic. Chúng chạy tuần tự:

```
start-feature  ──►  execute-feature-tasks  ──►  complete-feature
   (kickoff)            (implementation)            (close-out)
```

### Giai đoạn 1 — `start-feature` (kickoff)

1. **Xác định Jira story** (vd. `AOL-123`); lấy title + description để làm context.
2. **Mở GitHub draft PR** trên feature branch `<story-id>-<short-slug>`.
3. **Brainstorm** qua `superpowers:brainstorming` → tạo design spec trong [`docs/superpowers/specs/`](superpowers/specs/).
4. **Đồng bộ Jira**: thêm mục "Technical Design spec" ngắn gọn vào description story, và đăng full design doc dưới dạng comment.
5. **Viết plan** qua `superpowers:writing-plans` → tạo implementation plan trong [`docs/superpowers/plans/`](superpowers/plans/), mỗi batch được gắn nhãn rõ `[parallel]` hoặc `[sequential]`. Đăng full plan dưới dạng Jira comment.
6. **Lưu `.claude/feature-state.json`** để các giai đoạn sau tiếp tục mà không hỏi lại.

### Giai đoạn 2 — `execute-feature-tasks` (implementation)

- Đọc nhãn `[parallel]` / `[sequential]` trong plan và **tuân theo đúng nghĩa đen** — không tự quyết lại song song hay tuần tự.
- Trước khi viết code cho task nào, tạo **Jira sub-task** và chuyển sang IN PROGRESS.
- Batch `[sequential]` chạy từng task qua `superpowers:executing-plans`.
- Batch `[parallel]` phân một agent mỗi task (mỗi agent trong git worktree riêng) qua `superpowers:dispatching-parallel-agents`, rồi merge worktree về branch.
- Một batch phải hoàn thành hết trước khi batch tiếp theo bắt đầu.

### Giai đoạn 3 — `complete-feature` (close-out)

1. Lấy context từ `.claude/feature-state.json` (hoặc khôi phục từ Jira + `gh pr list`).
2. **Xác nhận với developer** trước khi đụng Jira hay GitHub.
3. Đánh dấu tất cả Jira sub-task **DONE**.
4. `gh pr ready` để chuyển draft PR sang ready-for-review; comment trên PR và Jira story.
5. Xóa `.claude/feature-state.json`.

---

## 3. Quy tắc quyết định song song (parallelism)

Song song là cổng cost/benefit, quyết một lần trong `start-feature` / `writing-plans` — không mặc định bật. Một batch là `[parallel]` **chỉ khi tất cả** điều kiện sau đúng:

- Các task thực sự độc lập (module/file khác nhau, không shared state)
- Mỗi task đủ lớn (rule of thumb: > 30 phút công việc)
- Có từ 2 task trở lên như vậy trong batch

Ngược lại batch là `[sequential]`. `execute-feature-tasks` đọc các nhãn này theo nghĩa đen.

---

## 4. Tầng skill `superpowers`

Skill dự án ủy thác phần suy nghĩ thực tế cho skill generic, tái sử dụng được. Những skill quan trọng nhất ở đây:

| Skill | Khi nào chạy |
| ----- | ------------ |
| `superpowers:brainstorming` | Trước mọi công việc sáng tạo/thiết kế — khám phá intent trước khi code. |
| `superpowers:writing-plans` | Biến spec thành implementation plan theo batch. |
| `superpowers:executing-plans` | Thực thi plan đã viết, có checkpoint review. |
| `superpowers:test-driven-development` | Trước khi viết code feature/bugfix — test trước. |
| `superpowers:systematic-debugging` | Khi có bug hoặc hành vi lạ, trước khi đề xuất fix. |
| `superpowers:dispatching-parallel-agents` | Fan-out cho batch `[parallel]`. |
| `superpowers:requesting-code-review` / `receiving-code-review` | Quanh thời điểm sẵn sàng merge. |
| `superpowers:verification-before-completion` | Trước khi tuyên bố xong — bằng chứng trước, khẳng định sau. |

Rule of thumb: **skill quy trình trước** (brainstorming, debugging) quyết *cách* tiếp cận; **skill implementation sau** hướng dẫn thực thi.

---

## 5. Nơi lưu artifact AI (và được commit)

| Vị trí | Nội dung |
| ------ | -------- |
| [`docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`](superpowers/specs/) | Design spec từ brainstorming. |
| [`docs/superpowers/plans/YYYY-MM-DD-<topic>-implementation.md`](superpowers/plans/) | Implementation plan (plan nhiều phase có subfolder riêng với `phase-*.md` + `reports/`). |
| [`docs/journals/`](journals/) | Journal làm việc ghi lại điều tra/quyết định cho task cụ thể. |
| `.claude/skills/` | Ba skill quy trình dự án (`start-` / `execute-` / `complete-feature`). |

Spec và plan là hồ sơ vĩnh viễn của repo — được commit vào git, và spec/plan tương ứng được mirror sang Jira story dưới dạng comment.

---

## 6. Quy tắc mọi trợ lý AI phải tuân theo

- **Ngôn ngữ tài liệu là tiếng Anh.** Mọi `.md` do brainstorming, planning hoặc skill khác tạo ra đều bằng tiếng Anh, không ngoại lệ. Trả lời chat có thể bằng tiếng Việt, nhưng code, comment, log message, spec và plan giữ tiếng Anh.
- **Tin code hơn comment.** Marker `TODO`/`TEMP`/`HACK` cũ dễ lệch; kiểm tra hành vi theo control flow thực tế và sửa comment lỗi thời.
- **Tôn trọng invariant nghiệp vụ** trong `CLAUDE.md` — đặc biệt quy ước currency `BUY/SELL` (nói to mapping trước khi đụng logic chain-bank / split / rule) và ranh giới shared-types (chỉ contract frontend↔backend mới đặt trong `packages/shared-types`).
- **Không tự commit.** Không commit bất cứ thứ gì (kể cả spec/plan) trừ khi developer yêu cầu rõ ràng.
- **Conventional Commits** cho mọi commit message; Husky hook local là quality gate duy nhất.
- **Bằng chứng trước khi hoàn thành.** Chạy lệnh verify (`pnpm lint`, `pnpm type-check`, `pnpm test`) và xác nhận output trước khi tuyên bố xong việc.

---

## 7. Quick start cho feature mới

```text
1. "Start feature AOL-XXX"           → start-feature  (Jira + draft PR + spec + plan)
2. "Execute the plan"                → execute-feature-tasks  (sub-task + code, từng batch)
3. (verify: pnpm lint / type-check / test)
4. "Complete the feature"            → complete-feature  (Jira DONE + PR ready for review)
```

Mọi thứ ở giữa được ghi lại dưới dạng spec đã commit, plan đã commit, Jira comment và PR — để lý do đằng sau mỗi thay đổi hỗ trợ bởi AI đều có thể audit được.

---

## 8. Tài liệu liên quan

| File | Nội dung |
| ---- | -------- |
| [verify-unfamiliar-knowledge.md](./verify-unfamiliar-knowledge.md) | Cách xác minh câu trả lời AI khi bạn ít biết chủ đề — quy trình 5 bước, falsification, mức tin cậy |
