# English Grammar — Overview

> Danh mục ngữ pháp tiếng Anh (EN + VI). Dùng làm mục lục ôn — mỗi mục có thể mở rộng thành file riêng sau.

---

## 1. Parts of speech — Từ loại

> Chi tiết: [`parts-of-speech.md`](./parts-of-speech.md) · Bài tập: [`parts-of-speech-exercises.md`](./parts-of-speech-exercises.md)

| EN | VI | Ví dụ |
|----|-----|--------|
| Noun | Danh từ | `connection`, `server` |
| Pronoun | Đại từ | `it`, `they`, `that` |
| Verb | Động từ | `run`, `handle`, `block` |
| Adjective | Tính từ | `single-threaded`, `suitable` |
| Adverb | Trạng từ | `continuously`, `easily` |
| Preposition | Giới từ | `for`, `on`, `without`, `via` |
| Conjunction | Liên từ | `and`, `but`, `because`, `so` |
| Article | Mạo từ | `a` / `an` / `the` |
| Interjection | Thán từ | `oh`, `well` (ít dùng kỹ thuật) |

---

## 2. Nouns & determiners — Danh từ & từ hạn định

| EN | VI | Ghi chú nhanh |
|----|-----|----------------|
| Countable / uncountable | Đếm được / không đếm được | `request` vs `information` |
| Singular / plural | Số ít / số nhiều | `thread` → `threads` |
| Possessive | Sở hữu cách | `Node's Event Loop`, `server's time` |
| Articles (`a` / `an` / `the` / zero) | Mạo từ | `an open-source…`, `the main thread` |
| Quantifiers | Lượng từ | `many`, `much`, `most of`, `a few` |

---

## 3. Pronouns — Đại từ

| EN | VI | Ví dụ |
|----|-----|--------|
| Personal | Nhân xưng | `I`, `it`, `they` |
| Possessive | Sở hữu | `its`, `their` |
| Reflexive | Phản thân | `itself` |
| Demonstrative | Chỉ định | `this`, `that`, `these`, `those` |
| Relative | Quan hệ | `that`, `which`, `who`, `whose` |
| Indefinite | Bất định | `someone`, `anything`, `each` |

> Relative pronoun (`that` / `which`) — hay gặp khi bổ nghĩa danh từ: *a class **that** only prints images*.

---

## 4. Verbs — Động từ

| EN | VI | Ghi chú nhanh |
|----|-----|----------------|
| Base form | Nguyên mẫu | `run`, `handle` |
| Infinitive (`to` + V) | Động từ nguyên mẫu có `to` | `to run`, `allows you to run` |
| Gerund (`V-ing` làm danh từ) | Danh động từ | `waiting for I/O`, `handling requests` |
| Present participle (`V-ing`) | Hiện tại phân từ | `is running` |
| Past participle (`V3` / `-ed`) | Quá khứ phân từ | `is queued`, `time spent` |
| Modal verbs | Động từ khuyết thiếu | `can`, `must`, `should`, `may` |
| Phrasal verbs | Cụm động từ | `break down`, `set up`, `run into` |
| Transitive / intransitive | Ngoại / nội động từ | `handle requests` vs `wait` |

---

## 5. Tenses — Thì

### Present — Hiện tại

| EN | VI | Công thức | Ví dụ |
|----|-----|------------|--------|
| Simple present | Hiện tại đơn | V1 / Vs | Node.js **has** three components. |
| Present continuous | Hiện tại tiếp diễn | am/is/are + V-ing | The server **is waiting**. |
| Present perfect | Hiện tại hoàn thành | have/has + V3 | Node.js **has become** popular. |
| Present perfect continuous | HTHT tiếp diễn | have/has been + V-ing | It **has been running** for hours. |

### Past — Quá khứ

| EN | VI | Công thức |
|----|-----|------------|
| Simple past | Quá khứ đơn | V2 / -ed |
| Past continuous | Quá khứ tiếp diễn | was/were + V-ing |
| Past perfect | Quá khứ hoàn thành | had + V3 |
| Past perfect continuous | QKHT tiếp diễn | had been + V-ing |

### Future — Tương lai

| EN | VI | Công thức |
|----|-----|------------|
| Will / going to | Tương lai `will` / dự định | will + V / be going to + V |
| Future continuous | Tương lai tiếp diễn | will be + V-ing |
| Future perfect | Tương lai hoàn thành | will have + V3 |

> **Lưu ý:** `Node.js has three components` = **hiện tại đơn** (`has` = có), **không** phải hiện tại hoàn thành (`has` + V3).

---

## 6. Voice — Chủ động / bị động

| EN | VI | Công thức | Ví dụ |
|----|-----|------------|--------|
| Active voice | Chủ động | Subject + V | The Event Loop **queues** the callback. |
| Passive voice | Bị động | be + V3 | The callback **is queued**. |

> Bị động dùng khi không cần nhấn “ai làm”, chỉ cần “được làm gì”.

---

## 7. Sentence structure — Cấu trúc câu

| EN | VI | Ví dụ |
|----|-----|--------|
| Simple sentence | Câu đơn | Node.js is single-threaded. |
| Compound sentence | Câu ghép (đẳng lập) | It is single-threaded, **but** it handles many requests. |
| Complex sentence | Câu phức (phụ thuộc) | It handles many requests **because** I/O is non-blocking. |
| Compound-complex | Câu ghép-phức | … |
| Affirmative / negative | Khẳng định / phủ định | does not block… |
| Interrogative | Câu hỏi | Why **can** it handle…? (đảo trợ động từ) |
| Imperative | Câu mệnh lệnh | Use `const` by default. |
| Conditional (if) | Câu điều kiện | If I/O is slow, requests wait. |

---

## 8. Clauses — Mệnh đề

| EN | VI | Ví dụ |
|----|-----|--------|
| Independent clause | Mệnh đề độc lập | Node.js uses V8. |
| Dependent / subordinate | Mệnh đề phụ | **because** it waits for I/O |
| Relative clause | Mệnh đề quan hệ | a class **that only prints images** |
| Noun clause | Mệnh đề danh ngữ | I think **that** he is right. |
| Adverbial clause | Mệnh đề trạng ngữ | **when** I/O completes… |
| Defining vs non-defining | Xác định vs không xác định | `that` vs `, which` |

---

## 9. Comparison — So sánh

| EN | VI | Ví dụ |
|----|-----|--------|
| Comparative | So sánh hơn | faster, more suitable |
| Superlative | So sánh nhất | the fastest |
| Equality | So sánh bằng | as fast as |
| Other patterns | Khác | better than, rather than |

---

## 10. Prepositions & common patterns — Giới từ & cụm hay gặp

| Pattern | Nghĩa gần | Ví dụ |
|---------|-----------|--------|
| suitable **for** | phù hợp với | suitable for high concurrency |
| wait **for** | chờ | wait for I/O to complete |
| based **on** | dựa trên | based on events |
| depend **on** | phụ thuộc | depend on abstractions |
| apply **to** | áp dụng cho | only applies to the JS thread |
| without + V-ing | mà không… | without blocking the main thread |
| spend time + V-ing | dành thời gian làm | spends time waiting |
| time spent + V-ing | thời gian được dành để | time spent waiting for I/O |

---

## 11. Word formation — Cấu tạo từ

| EN | VI | Ví dụ |
|----|-----|--------|
| Adjective from noun (`-ed` / `-ing`) | Tính từ tạo từ danh từ | **single-threaded**, event-driven |
| Noun from verb | Danh từ từ động từ | **dependency**, connection |
| Adverb from adjective | Trạng từ từ tính từ | continuous → **continuously** |
| Compound adjectives | Tính từ ghép | open-source, non-blocking |

---

## 12. Subject–verb agreement — Hòa hợp chủ–vị

| Rule | Ví dụ |
|------|--------|
| Ngôi 3 số ít + Vs / is / has | Node.js **has**… / V8 **compiles**… |
| Số nhiều + V nguyên mẫu | Threads **handle**… |
| Uncountable + singular | Information **is**… |

---

## 13. Common interview / tech English pitfalls — Lỗi hay gặp khi dịch note kỹ thuật

| Sai thường gặp | Đúng hơn |
|----------------|----------|
| NodeJS | Node.js |
| a opensource | an open-source |
| It suitable for… | It **is** suitable for… |
| allows run | allows you **to** run / for running |
| why it handle | why **can** it handle |
| does not break the thread | does not **block** the thread |
| is don't | does not |
| In fact (khi muốn nói “thực tế khi code”) | **In practice** |
| pushed into queue | is pushed into **the** queue |

---

## Roadmap gợi ý (ôn theo thứ tự)

1. Từ loại + mạo từ (`a` / `an` / `the`)
2. Hiện tại đơn vs hiện tại hoàn thành (`has` + noun vs `has` + V3)
3. Bị động (`be` + V3)
4. Câu hỏi (`Why can…?`)
5. Relative clause (`that` / `which`)
6. `to V` vs `V-ing` (infinitive / gerund)
7. Giới từ cố định (`suitable for`, `wait for`, `depend on`)
8. Tính từ kỹ thuật (`single-threaded`, `non-blocking`)

---

## Files liên quan trong repo

Khi viết note phỏng vấn, các điểm trên hay xuất hiện ở:

- `language-framework/nodejs.md`
- `database/connection-pool-questions.md`
- `clean-code/solid-questions.md`
