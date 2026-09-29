# Bài tập — Parts of Speech (Từ loại)

> Lý thuyết: `[parts-of-speech.md](./parts-of-speech.md)` · Mục lục: `[index.md](./index.md)`

**Cách làm:** làm hết phần A→D trước, rồi mới mở **Đáp án** ở cuối file.

---

## A. Chia từ vào đúng cột (Parts of speech)

**Yêu cầu:** Xếp mỗi từ vào **một** cột phù hợp nhất (theo nghĩa tech thông dụng). Nếu từ có thể nhiều loại, chọn loại **phổ biến nhất trong câu kỹ thuật**, ghi chú nếu cần.

**Từ cho sẵn:**

```
connection · handle · suitable · continuously · without · because · the · it
server · block · idle · often · on · but · an · that
queue · compile · single-threaded · still · for · when · a · they
request · wait · non-blocking · easily · via · so · well · Node.js
```

**Cách nhìn bảng:** file `.md` đang mở **source** nên bạn thấy dấu `|` — đó là cách Markdown **vẽ bảng**. Bấm **Preview** (icon kính lúp / Open Preview) để xem dạng lưới thật.

**Cách làm (chọn 1):**

1. **Preview** rồi nhìn bảng, hoặc
2. Điền thẳng vào list bên dưới (dễ hơn khi edit source).

### Phiếu làm bài (điền từ vào từng nhóm)

```text
Noun:         connection, server, queue, request, Node.js
              (ghi chú: handle / block / request cũng có thể là Verb — ở đây xếp loại phổ biến hơn trong tech)

Verb:         handle, block, compile, wait
              (ghi chú: queue / request cũng có thể là Verb)

Adjective:    suitable, idle, single-threaded, non-blocking

Adverb:       continuously, often, still, easily, well

Preposition:  without, on, for, via

Conjunction:  because, but, when, so

Article:      the, an, a

Pronoun:      it, that, they
```

### Bảng Markdown (sau khi Preview sẽ ra lưới)


| Noun                                        | Verb                         | Adjective                                     | Adverb                                   |
| ------------------------------------------- | ---------------------------- | --------------------------------------------- | ---------------------------------------- |
| connection, server, queue, request, Node.js | handle, block, compile, wait | suitable, idle, single-threaded, non-blocking | continuously, often, still, easily, well |



| Preposition           | Conjunction            | Article    | Pronoun        |
| --------------------- | ---------------------- | ---------- | -------------- |
| without, on, for, via | because, but, when, so | the, an, a | it, that, they |


> Tip: `that` trong relative clause = **pronoun**; `well` đầu câu nói chuyện = interjection (ở đây xếp **adverb** nếu mang nghĩa “tốt / rõ”). `Node.js` = proper **noun**.

---

## B. Phân loại: Noun / Verb / Adjective

**Yêu cầu:** Với mỗi từ, đánh dấu **N** / **V** / **Adj**. Một số từ có thể đúng **2 cột** — đánh cả hai và viết 1 ví dụ ngắn cho mỗi loại.


| #   | Từ              | N   | V   | Adj | Ví dụ (nếu 2 loại)                                                    |
| --- | --------------- | --- | --- | --- | --------------------------------------------------------------------- |
| 1   | request         | ✅   | ✅   |     | N: an HTTP **request** · V: **request** a token                       |
| 2   | block           | ✅   | ✅   |     | N: a memory **block** · V: **block** the thread                       |
| 3   | queue           | ✅   | ✅   |     | N: into the **queue** · V: **queue** the job                          |
| 4   | open            |     | ✅   | ✅   | V: **open** a connection · Adj: **open**-source / **open** ports      |
| 5   | idle            |     |     | ✅   | an **idle** connection *(không phải verb)*                            |
| 6   | scale           | ✅   | ✅   |     | N: horizontal **scale** · V: **scale** the service *(Adj = scalable)* |
| 7   | pool            | ✅   | ✅   |     | N: connection **pool** · V: **pool** connections *(ít hơn)*           |
| 8   | leak            | ✅   | ✅   |     | N: a connection **leak** · V: connections **leak**                    |
| 9   | single-threaded |     |     | ✅   | a **single-threaded** process *(Adj, không phải Noun)*                |
| 10  | update          | ✅   | ✅   |     | N: an **update** · V: **update** the row                              |
| 11  | load            | ✅   | ✅   |     | N: heavy **load** · V: **load** the data                              |
| 12  | cache           | ✅   | ✅   |     | N: a **cache** · V: **cache** the result                              |
| 13  | timeout         | ✅   | ✅   |     | N: a **timeout** · V: the request **timed out** / **timeout**         |
| 14  | concurrent      |     |     | ✅   | **concurrent** requests *(Adj, không phải Noun)*                      |
| 15  | process         | ✅   | ✅   |     | N: a Node **process** · V: **process** the job                        |


**Chỗ bạn làm sai (đã sửa):**


| Từ                  | Bạn chọn | Đúng        | Ghi nhớ                   |
| ------------------- | -------- | ----------- | ------------------------- |
| queue               | chỉ V    | **N + V**   | the queue / queue the job |
| open                | chỉ V    | **V + Adj** | open a file / open-source |
| idle                | V ❌      | **chỉ Adj** | idle = nhàn rỗi           |
| scale               | Adj ❌    | **N + V**   | scalable mới là Adj       |
| pool / leak / cache | chỉ N    | **N + V**   | cả hai đều dùng           |
| single-threaded     | N ❌      | **chỉ Adj** | đuôi `-ed` tính từ        |
| update / load       | chỉ V    | **N + V**   | an update / a load        |
| concurrent          | N ❌      | **chỉ Adj** | concurrency mới là Noun   |
| timeout / process   | trống    | **N + V**   |                           |


**Câu tự kiểm (khoanh từ và ghi loại):**

1. The **pool** (N) can **scale** (V) under heavy **load** (N).
2. Do not **block** (V) the **main** (Adj) thread (N).
3. An **idle** (Adj) connection (N) still holds a **slot** (N).
4. **Open** (V) a connection, then **release** (V) it.
5. A **cache** (N) can **cache** (V) hot **requests** (N).

---

## C. Hoàn thiện câu — chọn từ đúng + ghi lý do

**Yêu cầu:** Chọn **một** đáp án. Viết **Lý do** (1–2 câu tiếng Việt hoặc Anh): vì sao đúng, vì sao các lựa chọn kia sai (nếu cần).

### C1

Node.js is _____ open-source runtime environment.

- (a) a  
- (b) an  
- (c) the  
- (d) (no article)

**Đáp án của bạn:** ____  
**Lý do:**  

---

---

### C2

It _____ suitable for workloads with many concurrent requests.

- (a) suitable  
- (b) is suitable  
- (c) suitably  
- (d) suitability

**Đáp án của bạn:** ____  
**Lý do:**  

---

---

### C3

CPU-heavy tasks still _____ the main thread.

- (a) break  
- (b) break down  
- (c) block  
- (d) blocking

**Đáp án của bạn:** ____  
**Lý do:**  

---

---

### C4

A class _____ only prints images is forced to implement `scan()`.

- (a) (nothing)  
- (b) which it  
- (c) that  
- (d) what

**Đáp án của bạn:** ____  
**Lý do:**  

---

---

### C5

The callback _____ into the queue and then executed on the main thread.

- (a) pushed  
- (b) is pushed  
- (c) pushes  
- (d) pushing

**Đáp án của bạn:** ____  
**Lý do:**  

---

---

### C6

Single-threaded only _____ the thread that runs JavaScript.

- (a) uses for  
- (b) applies for  
- (c) applies to  
- (d) application to

**Đáp án của bạn:** ____  
**Lý do:**  

---

---

### C7

Why _____ Node.js handle many requests if it is single-threaded?

- (a) it can  
- (b) can it  
- (c) does can it  
- (d) it does

**Đáp án của bạn:** ____  
**Lý do:**  

---

---

### C8

libuv handles async I/O via a thread pool _____ blocking the main thread.

- (a) without  
- (b) with  
- (c) unless  
- (d) instead

**Đáp án của bạn:** ____  
**Lý do:**  

---

---

### C9

The server spends most of its time _____ for I/O.

- (a) wait  
- (b) waits  
- (c) waiting  
- (d) to waiting

**Đáp án của bạn:** ____  
**Lý do:**  

---

---

### C10

Use `const` by default; use `let` when you need _____.

- (a) reassignment  
- (b) reassign  
- (c) reassessment  
- (d) suitable

**Đáp án của bạn:** ____  
**Lý do:**  

---

---

## D. Viết dài — dịch Việt → Anh (tự nghĩ từ, bám mẫu câu)

### Đề bài

Dưới đây là **một đoạn tiếng Việt dài** về chủ đề: **Connection pool trong backend (PostgreSQL + Node.js)**.

1. Đọc đoạn Việt.
2. Dịch sang tiếng Anh **theo từng ý / từng câu**.
3. **Không cần** copy từ gợi ý — bạn **tự chọn từ vựng**.
4. Với mỗi ý, xem cột **Mẫu câu / công thức** rồi viết câu Anh đúng cấu trúc đó.
5. Sau khi dịch xong, tự rà: có đủ **verb**? article đúng? bị động chỗ nào cần `be + V3`?

---

### Đoạn tiếng Việt (nguồn để dịch)

Trong hệ thống backend hiện đại, mỗi request HTTP thường cần nói chuyện với database. Nếu mỗi lần request đều mở một kết nối mới rồi đóng ngay sau khi xong, ứng dụng sẽ chậm vì bắt tay TCP, SSL và xác thực rất tốn thời gian. Database cũng giới hạn số kết nối đồng thời; mỗi kết nối còn chiếm bộ nhớ trên máy chủ. Vì vậy người ta dùng connection pool: giữ sẵn một nhóm kết nối, ứng dụng chỉ mượn khi cần, chạy truy vấn, rồi trả kết nối về pool thay vì đóng hẳn.

In modern backend system, each HTTP request ussually needs to talk to the database. If every request opens a new connection and closes it immediately after it is done, the app is slow because TCP handshake, SSL and authentication take a lot of time (*are very time-consuming*). Database also limits connection concurrent; each connection also uses memory on the server. That is why people use a connection pool: *it keeps a **group of connections** ready*; the application only borrows when it is needed, runs the query, **then returns** (ngôi 3: application returns) connection to the pool **instead of fully closing** (`instead of` + **V-ing**)

Pool hoạt động theo vài trạng thái đơn giản. Kết nối rảnh nằm sẵn để cấp phát. Kết nối đang chạy truy vấn được gọi là đang bận. Khi pool đã đầy mà vẫn còn request mới, các request đó phải chờ — nếu chờ quá lâu sẽ hết thời gian và báo lỗi. Cấu hình sai rất dễ gặp. Pool quá nhỏ làm request xếp hàng. Pool quá lớn khiến nhiều instance cộng dồn vượt giới hạn của PostgreSQL. Quên trả kết nối về pool tạo ra rò rỉ: lúc đầu ổn, sau đó dần bị timeout. Nguy hiểm hơn nữa là trạng thái idle in transaction: transaction đã bắt đầu nhưng chưa commit hay rollback, trong khi ứng dụng lại đi gọi HTTP bên ngoài. Kết nối bị giữ, khóa có thể không được nhả, và slot trong pool bị chiếm.

A pool works with a few simple states. Idle connections sit ready to be allocated. Connections that are runnung queries are called active (busy). When the pool is full and new requests still arrive, those requests must wait - if they wait too long, they time out and return an error. Incorrect configuration is very common. A pool that is too small makes requests queue up. A pool that too large causes many instances connections to add up and exceed PostgreSQL's max_connections limit.

Khi nhiều service cùng một database, mỗi service và mỗi bản sao đều có pool riêng, nên tổng số kết nối bị cộng dồn. Cách làm an toàn là lập ngân sách kết nối theo từng service, gắn application_name để truy vết, và cân nhắc PgBouncer hoặc RDS Proxy khi số service hoặc số instance tăng. Với Lambda, nguy cơ lớn hơn vì concurrent cao có thể tạo bão kết nối; production nên đi qua proxy và giữ pool tối đa rất nhỏ trên mỗi container ấm.

When many services share one database, each service and each replica has its own pool (riêng của nó), so total connections add up. A safe *approach* is to set a connection budget per service, set application_name for tracing and consider PgBouncer or RDS Proxy when the number of services or instances grows. For Lambda, the risk is greater because high concurrent can create a connection storm, in production you should go through a proxy and keep *the pool* maximum very small on each warm container

Tóm lại, connection pool không phải thứ “set max càng lớn càng tốt”. Nó là công cụ tái sử dụng kết nối và kiểm soát áp lực lên database. Hiểu rõ vì sao cần pool, cấu hình thế nào, và những lỗi nào thường gặp sẽ giúp hệ thống ổn định hơn khi traffic tăng.

**To sum up**, a connection pool is not “the bigger the max, the better”. **It is a tool for reusing connections** and **controlling pressure on the database**. Understanding why you need a pool, how to configure it, and which mistakes are common helps the system stay more stable when traffic grows

---

### Bảng gợi ý cấu trúc (bạn tự điền từ)

Dịch **theo từng hàng**. Cột phải chỉ cho **công thức / loại câu** — không cho sẵn từ vựng đầy đủ.


| #   | Ý tiếng Việt (tóm)                                                         | Mẫu câu / công thức gợi ý                                                                              | Câu Anh của bạn |
| --- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | --------------- |
| 1   | Mỗi request thường cần nói chuyện với DB                                   | **Simple affirmative:** `S + V + O` · noun phrase: `(Art) + (Adj) + N`                                 |                 |
| 2   | Nếu mỗi request mở–đóng connection → chậm                                  | **Complex (điều kiện):** `If + S + V, S + V` / `When…, …`                                              |                 |
| 3   | Vì TCP/SSL/auth tốn thời gian                                              | **Complex (nguyên nhân):** `S + V + because + clause` · hoặc `because of + N`                          |                 |
| 4   | DB giới hạn số connection; mỗi connection tốn RAM                          | **Compound:** `Clause, and clause` · số liệu có thể dùng `~` / `about`                                 |                 |
| 5   | Định nghĩa pool: giữ sẵn N connection                                      | **Definition:** `S + be + a/an + N` · `S + V + O`                                                      |                 |
| 6   | Mượn → query → trả về (không đóng)                                         | **Simple / sequence:** `S + V, V, and then V` · hoặc `instead of + V-ing`                              |                 |
| 7   | Idle / active / pending là gì                                              | **Be + adjective** hoặc `S + be + called + N` · liệt kê: `A, B, and C`                                 |                 |
| 8   | Pool full → request chờ → có thể timeout                                   | **Complex (thời gian/điều kiện):** `When…, …` · modal: `S + may/can + V1`                              |                 |
| 9   | Pool quá nhỏ / quá lớn → hậu quả                                           | **Contrast compound:** `…, but …` · hoặc hai câu simple                                                |                 |
| 10  | Quên release → leak (lúc đầu ổn, sau timeout)                              | **Complex:** `If S + V, S + V` · time adverbs: `at first` / `later` / `gradually`                      |                 |
| 11  | Idle in transaction: BEGIN nhưng chưa COMMIT; lại gọi HTTP                 | **Definition + relative:** `N + that/which + V` · **without + V-ing`** hoặc` while + S + V`            |                 |
| 12  | Hậu quả: giữ connection, giữ lock, chiếm slot                              | **Listing:** `S + V + N, N, and N` · hoặc ba short sentences                                           |                 |
| 13  | Nhiều service × instance → cộng dồn connection                             | **Simple + math idea:** `S + V` · `each … has …` · `so + clause`                                       |                 |
| 14  | Giải pháp: budget, application_name, PgBouncer/RDS Proxy                   | **Imperative** hoặc `S + should + V1` · `by + V-ing`                                                   |                 |
| 15  | Lambda: concurrent cao → connection storm; cần proxy + max nhỏ             | **Complex:** `Because/When…, …` · modal `should` · adj: `warm` container                               |                 |
| 16  | Tóm lại: pool ≠ max càng lớn càng tốt                                      | **Sentence adverb + negative:** `In short, …` · `S + be + not + N/Adj` · `S + do/does not + V`         |                 |
| 17  | Pool = tái sử dụng + kiểm soát áp lực DB                                   | **Definition:** `S + be + a tool that + V` · `both A and B`                                            |                 |
| 18  | Hiểu vì sao / cấu hình / lỗi thường gặp → hệ thống ổn hơn khi traffic tăng | **Complex kết quả:** `Understanding X helps S + V` · hoặc `If you understand…, …` · `when traffic + V` |                 |


**Gợi ý thêm (không bắt buộc từ cụ thể):**

- Article: `a` / `an` / `the` trước noun đếm được xác định  
- Passive khi nhấn “bị giữ / được cấp”: `be + V3` (`is held`, `is released`)  
- Prep cố định: `suitable for`, `wait for`, `depend on`, `without + V-ing`  
- Tránh: `break the thread` → dùng ý **block**; `why it can` → **why can it**

**Chỗ viết bản dịch liền mạch (sau khi làm bảng):**

```text
(Paste your full English paragraph here)




```

---

# Đáp án

A. Đáp án cột từ loại

| Noun | Verb | Adjective | Adverb | Preposition | Conjunction | Article | Pronoun |
|------|------|-----------|--------|-------------|#|---------|---------|
| connection | handle | suitable | continuously | without | because | the | it |
| server | block | idle | often | on | but | an | that |
| queue | compile | single-threaded | still | for | when | a | they |
| request | wait | non-blocking | easily | via | so | | |
| Node.js | | | well* | | | | |

 `well` = adverb (hoặc interjection trong nói chuyện).  
`that` = relative **pronoun** (cũng có thể là conjunction/determiner tùy câu — ở bài này xếp pronoun).

B. Đáp án N / V / Adj


| #   | Từ              | N   | V   | Adj | Ghi chú                                                                |
| --- | --------------- | --- | --- | --- | ---------------------------------------------------------------------- |
| 1   | request         | ✅   | ✅   |     | N: a request · V: request a token                                      |
| 2   | block           | ✅   | ✅   |     | N: a block · V: block the thread                                       |
| 3   | queue           | ✅   | ✅   |     | N: the queue · V: queue the job                                        |
| 4   | open            |     | ✅   | ✅   | V: open a connection · Adj: open-source / open ports                   |
| 5   | idle            |     |     | ✅   | an idle connection                                                     |
| 6   | scale           | ✅   | ✅   |     | N: horizontal scale · V: scale the service                             |
| 7   | pool            | ✅   | ✅   |     | N: connection pool · V: pool connections (ít hơn)                      |
| 8   | leak            | ✅   | ✅   |     | N: a leak · V: connections leak                                        |
| 9   | single-threaded |     |     | ✅   |                                                                        |
| 10  | update          | ✅   | ✅   |     |                                                                        |
| 11  | load            | ✅   | ✅   |     | N: load · V: load data                                                 |
| 12  | cache           | ✅   | ✅   |     | N: a cache · V: cache the result                                       |
| 13  | timeout         | ✅   | ✅   |     | N: a timeout · V: the request timed out *(verb form timeout/time out)* |
| 14  | concurrent      |     |     | ✅   |                                                                        |
| 15  | process         | ✅   | ✅   |     | N: a process · V: process the job                                      |


**Câu tự kiểm:**  

1. pool=N · scale=V · load=N
2. block=V · main=Adj · thread=N
3. idle=Adj · slot=N
4. Open=V · release=V
5. cache=N · cache=V · requests=N

C. Đáp án + lý do mẫu


| #   | Đáp án               | Lý do ngắn                                                                                                                                             |
| --- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| C1  | **(b) an**           | `open-source` bắt đầu bằng nguyên âm `/əʊ/`. `a` sai âm; `the` quá xác định khi mới giới thiệu loại; zero article không tự nhiên với “is ___ runtime”. |
| C2  | **(b) is suitable**  | Sau chủ ngữ cần **linking verb** `is` + tính từ `suitable`. (a) thiếu verb; (c) adverb; (d) noun.                                                      |
| C3  | **(c) block**        | Nghĩa “chặn luồng”. `break` / `break down` = hỏng/phân rã — sai nghĩa tech. `blocking` thiếu auxiliary nếu muốn tiếp diễn.                             |
| C4  | **(c) that**         | Relative pronoun nối mệnh đề bổ nghĩa `class`. Bỏ trống → hai động từ lệch; `what` không dùng như relative này.                                        |
| C5  | **(b) is pushed**    | Bị động: callback **được** đẩy vào queue → `be + V3`. `pushed` một mình thiếu `is`; `pushes` chủ động sai chủ ngữ.                                     |
| C6  | **(c) applies to**   | “áp dụng cho” = **apply to**. `uses for` / `applies for` sai collocation (`apply for` = xin việc/apply đơn).                                           |
| C7  | **(b) can it**       | Câu hỏi: đảo **modal + subject** → `Why can it…?`. Không `Why it can`.                                                                                 |
| C8  | **(a) without**      | “mà không chặn” = **without + V-ing** (`without blocking`).                                                                                            |
| C9  | **(c) waiting**      | Cấu trúc `spend + time + V-ing`. Không `spend time wait/waits`.                                                                                        |
| C10 | **(a) reassignment** | Sau `need` cần **noun** (hoặc `to` + V). `reassign` là verb thiếu `to`; `reassessment` sai nghĩa.                                                      |


D. Bản dịch mẫu (chỉ để đối chiếu — không phải đáp án duy nhất)

In modern backend systems, each HTTP request usually needs to talk to the database. If every request opens a new connection and closes it right after, the app becomes slow because the TCP handshake, SSL, and authentication are expensive. The database also limits concurrent connections, and each connection uses memory on the server. That is why we use a connection pool: it keeps a set of connections ready; the app only borrows one when needed, runs the query, then returns it to the pool instead of fully closing it.

A pool has a few simple states. Idle connections are ready to be given out. Connections that are running queries are active (busy). When the pool is full and new requests still arrive, those requests must wait — if they wait too long, they time out and fail. Misconfiguration is common. A pool that is too small makes requests queue up. A pool that is too large lets many instances add up past PostgreSQL’s limit. Forgetting to release a connection causes a leak: things look fine at first, then timeouts appear gradually. Even more dangerous is `idle in transaction`: a transaction has begun but has not committed or rolled back, while the app calls an external HTTP API. The connection is held, locks may not be released, and a pool slot stays occupied.

When many services share one database, each service and each replica has its own pool, so total connections add up. A safe approach is to set a connection budget per service, set `application_name` for tracing, and consider PgBouncer or RDS Proxy when the number of services or instances grows. With Lambda, the risk is higher because high concurrency can cause a connection storm; in production you should go through a proxy and keep `max` very small on each warm container.

In short, a connection pool is not “the bigger the max, the better.” It is a tool for reusing connections and controlling pressure on the database. Understanding why you need a pool, how to configure it, and which mistakes are common helps the system stay stable when traffic grows.

---

## Checklist nộp bài (tự chấm)

- A: mỗi từ một cột, không bỏ sót  
- B: từ đa loại có ví dụ  
- C: đủ 10 lý do (không chỉ khoanh đáp án)  
- D: đủ ~16–18 câu/ý theo bảng mẫu; có đoạn English liền mạch  
- D: đã rà article / verb / passive / `without + V-ing` / câu hỏi đảo ngữ (nếu có)

