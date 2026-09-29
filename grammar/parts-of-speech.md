# 1. Parts of Speech — Từ loại

> Mục lục: `[index.md](./index.md)` · Bài tập: `[parts-of-speech-exercises.md](./parts-of-speech-exercises.md)`

**Parts of speech** = cách phân loại từ theo **vai trò trong câu**. Cùng một từ có thể thuộc nhiều loại tùy ngữ cảnh (`block` = danh từ / động từ).

Mỗi mục dưới đây có:

1. **Là gì** — định nghĩa
2. **Triển khai trong câu** — vị trí + mẫu câu
3. **Loại câu hay dùng** — affirmative / negative / question / complex…

---

## Các loại câu (nhắc nhanh)

Trước khi gắn từ loại, nhớ 4 nhóm câu cơ bản:


| Loại câu (EN)     | VI         | Dấu hiệu             | Ví dụ                                  |
| ----------------- | ---------- | -------------------- | -------------------------------------- |
| **Affirmative**   | Khẳng định | S + V …              | Node.js **handles** many requests.     |
| **Negative**      | Phủ định   | do/does/is + **not** | It **does not block** the main thread. |
| **Interrogative** | Câu hỏi    | Đảo trợ động từ      | **Why can** it handle many requests?   |
| **Imperative**    | Mệnh lệnh  | (You) + V1           | **Use** `const` by default.            |



| Cấu trúc câu | VI       | Dấu hiệu                                  | Ví dụ                                          |
| ------------ | -------- | ----------------------------------------- | ---------------------------------------------- |
| **Simple**   | Đơn      | 1 mệnh đề độc lập                         | Node.js uses V8.                               |
| **Compound** | Ghép     | `and` / `but` / `so` nối 2 mệnh đề        | It is single-threaded, **but** it scales well. |
| **Complex**  | Phức     | `because` / `when` / `that` + mệnh đề phụ | It works **because** I/O is non-blocking.      |
| **Active**   | Chủ động | Subject làm hành động                     | The Event Loop **queues** the callback.        |
| **Passive**  | Bị động  | be + V3                                   | The callback **is queued**.                    |


**Câu mẫu (đánh dấu từ loại):**

```
Node.js  uses   the   V8 engine   continuously.
  Noun    Verb  Art.    Noun         Adverb
```

```
It  is  suitable  for  high-concurrency  workloads.
Pro. V.  Adj.     Prep.     Adj.           Noun
```

---

## Tổng quan nhanh


| #   | EN           | VI       | Vai trò chính                | Câu hỏi nhận biết        |
| --- | ------------ | -------- | ---------------------------- | ------------------------ |
| 1   | Noun         | Danh từ  | Người / vật / khái niệm      | Cái gì? Ai?              |
| 2   | Pronoun      | Đại từ   | Thay danh từ                 | Thay cho danh từ nào?    |
| 3   | Verb         | Động từ  | Hành động / trạng thái       | Làm gì? Là gì?           |
| 4   | Adjective    | Tính từ  | Bổ nghĩa danh từ             | Như thế nào? (cho noun)  |
| 5   | Adverb       | Trạng từ | Bổ nghĩa verb / adj / cả câu | Như thế nào? Khi nào?    |
| 6   | Preposition  | Giới từ  | Quan hệ với danh từ          | in / on / for / without… |
| 7   | Conjunction  | Liên từ  | Nối từ / mệnh đề             | and / but / because…     |
| 8   | Article      | Mạo từ   | Đi trước danh từ             | a / an / the             |
| 9   | Interjection | Thán từ  | Cảm thán                     | oh / wow (ít dùng tech)  |


---

## 1. Noun — Danh từ

**Là gì:** tên người, vật, nơi chốn, khái niệm trừu tượng.


| Loại        | EN                       | Ví dụ tech                             |
| ----------- | ------------------------ | -------------------------------------- |
| Common noun | Danh từ chung            | `server`, `request`, `thread`          |
| Proper noun | Danh từ riêng (viết hoa) | `Node.js`, `PostgreSQL`, `Chrome`      |
| Concrete    | Cụ thể                   | `file`, `database`                     |
| Abstract    | Trừu tượng               | `latency`, `concurrency`, `dependency` |
| Countable   | Đếm được                 | `a connection`, `two requests`         |
| Uncountable | Không đếm được           | `information`, `traffic`, `RAM`        |


### Triển khai trong câu


| Vị trí / mẫu                    | Pattern               | Ví dụ                                  |
| ------------------------------- | --------------------- | -------------------------------------- |
| Chủ ngữ                         | **N** + V             | **Node.js** handles many requests.     |
| Tân ngữ trực tiếp               | S + V + **N**         | It uses the **Event Loop**.            |
| Tân ngữ gián tiếp / sau giới từ | Prep + **N**          | without blocking the main **thread**   |
| Bổ ngữ sau `be`                 | S + be + **N**        | Node.js is a **runtime**.              |
| Sở hữu                          | **N**'s + N           | the **server**'s time                  |
| Danh từ ghép / noun phrase      | (Art) + (Adj) + **N** | an open-source **runtime environment** |


**Công thức noun phrase phổ biến:**

```text
(article) + (adjective) + NOUN
the        main           thread
a          single-threaded process
```

### Loại câu hay dùng


| Loại câu            | Vai trò noun                          | Ví dụ                                   |
| ------------------- | ------------------------------------- | --------------------------------------- |
| Affirmative         | subject / object                      | **Connections** cost RAM.               |
| Negative            | vẫn giữ noun, phủ định ở verb         | The **pool** does not grow forever.     |
| Question            | hỏi về noun / dùng noun trong câu hỏi | What is a **connection pool**?          |
| Definition (simple) | N = N                                 | A **pool** is a set of **connections**. |
| Passive             | noun làm subject bị động              | The **callback** is queued.             |
| Complex             | noun + relative clause                | A **class that** only prints images…    |


**Số nhiều thường gặp:** request→requests · thread→threads · process→processes

**Lỗi hay gặp:** many informations → much **information** · a NodeJS → **Node.js**

---

## 2. Pronoun — Đại từ

**Là gì:** thay cho danh từ để khỏi lặp.


| Loại          | EN        | Ví dụ                                |
| ------------- | --------- | ------------------------------------ |
| Personal      | Nhân xưng | `I`, `you`, `it`, `they`             |
| Possessive    | Sở hữu    | `its`, `their`, `our`                |
| Reflexive     | Phản thân | `itself`, `themselves`               |
| Demonstrative | Chỉ định  | `this`, `that`, `these`, `those`     |
| Relative      | Quan hệ   | `that`, `which`, `who`, `whose`      |
| Indefinite    | Bất định  | `someone`, `anything`, `each`, `one` |


### Triển khai trong câu


| Mẫu                      | Pattern                     | Ví dụ                               |
| ------------------------ | --------------------------- | ----------------------------------- |
| Thay subject             | **Pronoun** + V             | **It** handles many requests.       |
| Thay object              | S + V + **pronoun**         | The pool reuses **them**.           |
| Sở hữu                   | **its/their** + N           | most of **its** time                |
| Relative (bổ nghĩa noun) | N + **that/which** + clause | a class **that** only prints images |
| Demonstrative            | **This/That** + (N) + V     | **This** approach avoids leaks.     |
| Dummy `it`               | **It** + be + adj           | **It** is suitable for…             |


```text
Node.js is single-threaded. It handles many requests.
                         ↑ personal pronoun

A class that only prints images…
        ↑ relative pronoun — bắt buộc khi nối mệnh đề
```

### Loại câu hay dùng


| Loại câu                  | Cách dùng pronoun          | Ví dụ                                   |
| ------------------------- | -------------------------- | --------------------------------------- |
| Affirmative (2 câu nối ý) | `it` / `they` tránh lặp    | Node.js uses V8. **It** compiles JS.    |
| Question                  | đảo: Aux + **pronoun**     | Why can **it** handle many requests?    |
| Complex (relative)        | `that` / `which`           | modules **that** depend on abstractions |
| Passive                   | pronoun / noun làm subject | **It** is often combined with DI.       |
| Negative                  | pronoun + does not         | **It** does not block the main thread.  |



| Từ    | Loại   | Ví dụ                   |
| ----- | ------ | ----------------------- |
| `it`  | đại từ | **It** is suitable for… |
| `its` | sở hữu | most of **its** time    |


**Lỗi:** why it handle → why **can it** handle · thiếu `that` trong relative clause

---

## 3. Verb — Động từ

**Là gì:** nói hành động hoặc trạng thái. **Mọi câu hoàn chỉnh gần như luôn cần verb.**


| Loại         | EN                | Ví dụ                                  |
| ------------ | ----------------- | -------------------------------------- |
| Action verb  | Động từ hành động | `run`, `handle`, `compile`, `block`    |
| Linking verb | Động từ nối       | `is`, `are`, `become`, `seem`          |
| Auxiliary    | Trợ động từ       | `is` (is queued), `does`, `has`        |
| Modal        | Khuyết thiếu      | `can`, `must`, `should`, `may`, `will` |



| Dạng  | Tên                 | Ví dụ             |
| ----- | ------------------- | ----------------- |
| V1    | Base                | handle, queue     |
| Vs    | Ngôi 3 hiện tại     | handles, queues   |
| V2    | Quá khứ             | handled, queued   |
| V3    | Past participle     | **is queued**     |
| V-ing | Gerund / participle | handling, waiting |


### Triển khai trong câu


| Mẫu                           | Pattern                     | Ví dụ                                           |
| ----------------------------- | --------------------------- | ----------------------------------------------- |
| Hiện tại đơn (action)         | S + **V1/Vs** + O           | V8 **compiles** JavaScript.                     |
| Linking                       | S + **be** + Adj/N          | It **is** suitable. / Node.js **is** a runtime. |
| Phủ định                      | S + **do/does not** + V1    | It **does not block** the thread.               |
| Câu hỏi Yes/No                | **Do/Does/Is/Can** + S + …? | **Does** it block the thread?                   |
| Câu hỏi Wh-                   | Wh- + **aux** + S + V1…?    | **Why can** it handle many requests?            |
| Modal                         | S + **modal** + V1          | Node.js **can handle** many requests.           |
| Bị động                       | S + **be** + V3             | The callback **is queued**.                     |
| Continuouse / trạng thái đang | S + be + V-ing              | The server **is waiting**.                      |
| `to` + V (infinitive)         | allow/need/want + **to** V  | allows you **to run** JS                        |
| Verb + prep                   | V + prep + N                | depends **on** abstractions                     |


```text
V8 compiles JavaScript.           ← action (Vs)
The callback is queued.           ← passive (be + V3)
It does not block the thread.     ← negative (does + not + V1)
Node.js can handle many requests. ← modal + V1
```

**Sau modal / does / to → nguyên mẫu (không +s, không -ed):**


| Đúng                  | Sai                 |
| --------------------- | ------------------- |
| must **depend**       | ~~must depends~~    |
| does not **block**    | ~~does not blocks~~ |
| allows you **to run** | ~~allows run~~      |


### Loại câu hay dùng


| Loại câu      | Verb đóng vai trò gì           | Ví dụ                                               |
| ------------- | ------------------------------ | --------------------------------------------------- |
| Affirmative   | động từ chính                  | Node.js **has** three components.                   |
| Negative      | `do/does/is not` + V           | It **does not** wait for I/O.                       |
| Interrogative | đảo aux/modal                  | **Can** one thread manage thousands of connections? |
| Imperative    | V1 đầu câu                     | **Borrow**, use, then **release** the connection.   |
| Active        | S làm việc                     | The Event Loop **queues** the callback.             |
| Passive       | S bị tác động                  | The callback **is queued**.                         |
| Complex       | verb trong mệnh đề chính + phụ | When I/O **completes**, the callback **is queued**. |


**Lỗi:** It suitable → It **is** suitable · break thread → **block** · Node.js have → **has**

---

## 4. Adjective — Tính từ

**Là gì:** bổ nghĩa **danh từ** / đại từ — “như thế nào?”.

### Triển khai trong câu


| Vị trí                           | Pattern               | Ví dụ                                        |
| -------------------------------- | --------------------- | -------------------------------------------- |
| Trước noun (attributive)         | (Art) + **Adj** + N   | a **single-threaded** process                |
| Sau `be` / linking (predicative) | S + be + **Adj**      | It is **suitable**.                          |
| Sau `become` / `seem` / `remain` | S + linking + **Adj** | Connections remain **idle**.                 |
| Nhiều adj                        | Art + Adj + Adj + N   | a **small idle** pool                        |
| Compound adj                     | **Adj-Adj** + N       | **open-source** runtime, **CPU-heavy** tasks |
| So sánh                          | Adj-er / more Adj     | **faster** than blocking I/O                 |


**Công thức hay dùng khi trả lời phỏng vấn:**

```text
S + be + adjective + (preposition + noun)
It  is   suitable      for         high-concurrency workloads.

Art + adjective + noun
an    open-source   runtime
```


| Adj tech        | Nghĩa        |
| --------------- | ------------ |
| single-threaded | đơn luồng    |
| non-blocking    | không chặn   |
| asynchronous    | bất đồng bộ  |
| concurrent      | đồng thời    |
| scalable        | mở rộng được |
| suitable        | phù hợp      |
| idle            | nhàn rỗi     |


`**-ed` tạo tính từ:** single-**threaded**, event-**driven** (không phải thì quá khứ)


| Tính từ (cho noun)     | Trạng từ (cho verb)     |
| ---------------------- | ----------------------- |
| a **continuous** check | checks **continuously** |
| an **easy** bug        | causes bugs **easily**  |


### Loại câu hay dùng


| Loại câu                         | Cách đặt adj             | Ví dụ                                                 |
| -------------------------------- | ------------------------ | ----------------------------------------------------- |
| Affirmative (định nghĩa / mô tả) | be + adj                 | Node.js is **single-threaded**.                       |
| Negative                         | be + not + adj           | This approach is **not suitable** for CPU-heavy work. |
| Question                         | be + S + adj?            | Is it **thread-safe**?                                |
| Noun phrase trong mọi loại câu   | Adj + N                  | **idle** connections, **non-blocking** I/O            |
| Complex                          | adj + prep + clause/noun | suitable for workloads **that** have many requests    |
| Comparison                       | more / -er               | V8 is **faster** for this workload.                   |


**Lỗi:** single-thread → **single-threaded** · a opensource → an **open-source**

---

## 5. Adverb — Trạng từ

**Là gì:** bổ nghĩa **động từ**, **tính từ**, hoặc **cả câu**.


| Loại            | Hỏi gì         | Ví dụ                                      |
| --------------- | -------------- | ------------------------------------------ |
| Manner          | Như thế nào?   | **continuously**, **easily**, **directly** |
| Time            | Khi nào?       | **often**, **already**, **still**          |
| Degree          | Mức độ         | **very**, **almost**, **especially**       |
| Sentence adverb | Thái độ cả câu | **In practice**, **In short**              |


### Triển khai trong câu


| Vị trí                 | Pattern                  | Ví dụ                                                     |
| ---------------------- | ------------------------ | --------------------------------------------------------- |
| Trước động từ thường   | S + **Adv** + V          | The Event Loop **continuously** checks…                   |
| Sau be / aux           | S + be/aux + **Adv** + … | Tasks **still** block the thread. / It does **not** wait. |
| Cuối câu               | S + V + O + **Adv**      | It handles requests **efficiently**.                      |
| Trước tính từ          | **Adv** + Adj            | **especially** dangerous, **very** slow                   |
| Đầu câu (sentence adv) | **Adv**, + clause        | **In practice**, use `const` by default.                  |
| Phủ định               | do/does + **not**        | It does **not** block… (`not` = adverb)                   |


```text
The Event Loop continuously checks the queue.
                     ↑ manner — bổ nghĩa "checks"

In short, Node.js uses async I/O + the Event Loop.
↑ sentence adverb — bổ nghĩa cả câu tóm tắt
```

Adj + `-ly` → Adv: continuous→**continuously**, easy→**easily**  
Không phải lúc nào cũng `-ly`: `fast`, `hard`, `often`, `well`, `still`.

### Loại câu hay dùng


| Loại câu             | Adv dùng để                                       | Ví dụ                                      |
| -------------------- | ------------------------------------------------- | ------------------------------------------ |
| Affirmative          | mô tả cách / tần suất                             | It **often** reuses connections.           |
| Negative             | `not` / `never` / `hardly`                        | It does **not** wait for I/O.              |
| Question             | how / when / how often                            | **How** does the Event Loop work?          |
| Summary / interview  | In short / In practice                            | **In short**, async + Event Loop.          |
| Complex              | when / while *(cũng là conjunction; adv of time)* | **When** I/O completes, …                  |
| Softening / emphasis | still / especially                                | CPU work **still** blocks the main thread. |


---

## 6. Preposition — Giới từ

**Là gì:** đứng trước danh từ / đại từ / V-ing để chỉ quan hệ.


| Prep          | Nghĩa gần         | Ví dụ                              |
| ------------- | ----------------- | ---------------------------------- |
| for           | cho / phù hợp với | suitable **for** workloads         |
| on            | trên / dựa trên   | based **on** events; depend **on** |
| to            | tới / cho         | apply **to** the JS thread         |
| via / through | qua               | via the Event Loop                 |
| without       | mà không          | **without** blocking…              |
| with          | với               | combined **with** DI               |
| in            | trong             | **in** the queue                   |
| of            | của               | most **of** its time               |
| by            | bằng cách         | **by** using a pool                |


### Triển khai trong câu


| Mẫu                             | Pattern                  | Ví dụ                                         |
| ------------------------------- | ------------------------ | --------------------------------------------- |
| Prep + noun phrase              | Prep + (Art) + (Adj) + N | **in the** queue · **on the** main thread     |
| Adj + prep + N                  | Adj + Prep + N           | suitable **for** workloads                    |
| Verb + prep + N                 | V + Prep + N             | depend **on** abstractions · wait **for** I/O |
| Prep + V-ing                    | Prep + **V-ing**         | **without blocking** · **by using** a pool    |
| Cuối cụm (prepositional phrase) | … + Prep + N             | executed **on the main thread**               |


```text
suitable for high-concurrency workloads
         ↑ prep gắn với adjective

without blocking the main thread
↑ prep + gerund (V-ing), không dùng "without to block"
```

**Cụm cố định:** suitable **for** · wait **for** · depend **on** · apply **to** · based **on**

### Loại câu hay dùng


| Loại câu                 | Prepositional phrase            | Ví dụ                                                            |
| ------------------------ | ------------------------------- | ---------------------------------------------------------------- |
| Affirmative              | bổ nghĩa nơi / cách / đối tượng | Callbacks run **on the main thread**.                            |
| Negative                 | vẫn giữ cụm prep                | Do not call HTTP **inside a transaction**.                       |
| Question                 | hỏi kèm prep                    | What does single-threaded apply **to**?                          |
| Passive                  | thường kèm `by` / `with` / `on` | It is often combined **with** DI.                                |
| Complex / definition     | adj + prep                      | suitable **for** workloads that…                                 |
| Instruction (imperative) | by / without + V-ing            | Scale **by** adding replicas, **without** raising `max` blindly. |


**Lỗi:** suitable with → suitable **for** · into queue → into **the** queue

---

## 7. Conjunction — Liên từ

**Là gì:** nối từ, cụm từ, hoặc mệnh đề.


| Loại          | EN         | Ví dụ                                        |
| ------------- | ---------- | -------------------------------------------- |
| Coordinating  | Đẳng lập   | `and`, `but`, `or`, `so`                     |
| Subordinating | Phụ thuộc  | `because`, `when`, `if`, `while`, `although` |
| Correlative   | Tương quan | `both…and`, `either…or`, `not only…but also` |


### Triển khai trong câu


| Mẫu                   | Pattern                         | Ví dụ                                                    |
| --------------------- | ------------------------------- | -------------------------------------------------------- |
| Nối 2 noun / adj      | A **and** B                     | V8 **and** libuv                                         |
| Compound sentence     | Clause1, **but/so/and** Clause2 | It is single-threaded, **but** it handles many requests. |
| Complex — nguyên nhân | Clause **because** Clause       | … **because** I/O is non-blocking.                       |
| Complex — thời gian   | **When** Clause, Clause         | **When** I/O completes, the callback is queued.          |
| Complex — điều kiện   | **If** Clause, Clause           | **If** the pool is full, requests wait.                  |
| Contrast              | **Although** / **but**          | **Although** it is single-threaded, …                    |
| Kết quả               | …, **so** …                     | I/O is slow, **so** the server waits.                    |


```text
Node.js is single-threaded, but it handles many requests.
                            ↑ coordinating → compound sentence

It can handle many requests because I/O is non-blocking.
                            ↑ subordinating → complex sentence
```


| Từ                     | Quan hệ     |
| ---------------------- | ----------- |
| **because**            | nguyên nhân |
| **so**                 | kết quả     |
| **but** / **although** | đối lập     |
| **when** / **while**   | thời gian   |
| **if**                 | điều kiện   |
| **and**                | thêm ý      |


### Loại câu hay dùng


| Loại câu               | Conjunction tạo ra         | Ví dụ                                                        |
| ---------------------- | -------------------------- | ------------------------------------------------------------ |
| **Compound**           | and / but / or / so        | Use a pool, **or** each request opens a new connection.      |
| **Complex**            | because / when / if / that | Failures happen **when** connections leak.                   |
| Affirmative / Negative | nối ý đúng–sai             | It reuses connections **but** does **not** remove DB limits. |
| Question (ít hơn)      | thường hỏi mệnh đề chính   | Why does it work **if** it is single-threaded?               |
| Interview summary      | so / because               | … **so** one thread can serve many requests.                 |


> Muốn câu dài khi trả lời phỏng vấn: **1 ý chính (simple)** + **because/when/but** (complex/compound).

---

## 8. Article — Mạo từ

**Là gì:** đứng trước danh từ — `a` / `an` / `the` / (zero article).


| Article | Khi nào                                | Ví dụ                      |
| ------- | -------------------------------------- | -------------------------- |
| **a**   | số ít, đếm được, chưa xác định; phụ âm | **a** connection           |
| **an**  | số ít; nguyên âm (âm)                  | **an** open-source runtime |
| **the** | đã biết / duy nhất / xác định          | **the** main thread        |
| (zero)  | chung chung / uncountable / proper     | Node.js uses JavaScript.   |


### Triển khai trong câu


| Mẫu                           | Pattern               | Ví dụ                                            |
| ----------------------------- | --------------------- | ------------------------------------------------ |
| Giới thiệu lần đầu            | **a/an** + N          | **A** connection pool keeps N connections ready. |
| Nhắc lại / xác định           | **the** + N           | **The** pool reuses them.                        |
| Duy nhất trong ngữ cảnh       | **the** + N           | **the** Event Loop, **the** main thread          |
| Định nghĩa nghề nghiệp / loại | S + be + **a/an** + N | Node.js is **an** open-source runtime.           |
| Zero + proper / uncountable   | — + N                 | **Node.js** uses **JavaScript**.                 |
| Prep + article + N            | Prep + **the/a** + N  | into **the** queue · outside **the** browser     |


```text
Node.js is an open-source runtime environment.
           ↑ an (nguyên âm /əʊ/ ở "open")

It uses the V8 engine.
         ↑ the — engine cụ thể đã biết trong ngữ cảnh
```


| Viết        | Đọc           | Article            |
| ----------- | ------------- | ------------------ |
| open-source | /ˈəʊ…/        | **an** open-source |
| university  | /juː…/        | **a** university   |
| hour        | /aʊə/ (h câm) | **an** hour        |


### Loại câu hay dùng


| Loại câu                   | Article            | Ví dụ                                                         |
| -------------------------- | ------------------ | ------------------------------------------------------------- |
| Definition                 | a/an               | A pool is a set of reusable connections.                      |
| Affirmative mô tả hệ thống | the                | **The** main thread runs JavaScript.                          |
| Question                   | a/an/the           | What is **a** connection pool? / Where is **the** bottleneck? |
| Passive / process          | the                | **The** callback is pushed into **the** queue.                |
| General truth              | zero hoặc a        | **Connections** cost RAM. / **A** connection costs RAM.       |
| Imperative                 | a/the tùy ngữ cảnh | Release **the** connection in `finally`.                      |


**Lỗi:** a opensource → **an open-source** · into queue → into **the** queue · outside browser → outside **the** browser

---

## 9. Interjection — Thán từ

**Là gì:** biểu cảm đột ngột — `oh`, `wow`, `well`, `hey`.

### Triển khai trong câu


| Mẫu                | Ví dụ                                      |
| ------------------ | ------------------------------------------ |
| Đứng một mình      | Oh! / Well…                                |
| Đầu câu + dấu phẩy | **Well,** Node.js is single-threaded, but… |
| Làm mềm lời nói    | **Actually,** the Event Loop…              |


Ít dùng trong tài liệu kỹ thuật / câu trả lời phỏng vấn formal.

### Loại câu hay dùng


| Ngữ cảnh                | Có dùng?      | Ví dụ                          |
| ----------------------- | ------------- | ------------------------------ |
| Spoken interview (nói)  | đôi khi       | **Well,** the short answer is… |
| Written note / PR / doc | hầu như không | —                              |
| Affirmative formal      | tránh         | bắt đầu thẳng bằng nội dung    |


---

## Bản đồ: Từ loại × Loại câu


| Từ loại          | Affirmative          | Negative      | Question     | Compound/Complex                  | Passive         |
| ---------------- | -------------------- | ------------- | ------------ | --------------------------------- | --------------- |
| **Noun**         | subject/object       | giữ noun      | What is a …? | noun + that…                      | subject bị động |
| **Pronoun**      | It / They…           | It does not…  | Why can it…? | that / which                      | It is + V3      |
| **Verb**         | V / is               | does not + V1 | Do/Can + S…? | verb mỗi mệnh đề                  | be + V3         |
| **Adjective**    | is + adj             | is not + adj  | Is it + adj? | adj + for + clause                | —               |
| **Adverb**       | continuously / still | not / never   | How…?        | When…, …                          | —               |
| **Preposition**  | in/on/for…           | giữ cụm       | … apply to?  | for + N that…                     | combined with   |
| **Conjunction**  | and                  | but + not     | if / why…if  | **chính** để tạo compound/complex | —               |
| **Article**      | a/an/the + N         | the + N       | What is a…?  | the + N that…                     | the + N is V3   |
| **Interjection** | Well,…               | —             | —            | —                                 | —               |


---

## Cùng một từ — nhiều từ loại


| Từ          | Noun               | Verb                     | Adj                    |
| ----------- | ------------------ | ------------------------ | ---------------------- |
| **block**   | a memory **block** | does not **block**       | —                      |
| **request** | many **requests**  | **request** a connection | —                      |
| **queue**   | into the **queue** | **queue** the callback   | —                      |
| **idle**    | —                  | —                        | an **idle** connection |
| **open**    | —                  | **open** a connection    | **open**-source        |


```text
The callback is queued.     ← V3 trong bị động
time spent waiting          ← V3 bổ nghĩa noun
a single-threaded process   ← adjective
```

---

## Checklist nhận diện nhanh

1. **Tên người/vật/khái niệm?** → Noun / Pronoun
2. **Hành động / “là”?** → Verb
3. **Bổ nghĩa danh từ?** → Adjective / Article
4. **Bổ nghĩa động từ / cả câu?** → Adverb
5. **Đứng trước noun chỉ quan hệ?** → Preposition
6. **Nối hai phần?** → Conjunction

**Khi viết câu:** khoanh **loại câu** (affirmative / question / complex…) trước, rồi chọn **từ loại** đúng vị trí.

---

## Bài tập ngắn (tự check)

**A. Gắn nhãn từ loại**

1. **Node.js** **is** **an** **open-source** **runtime**.
2. It **does** **not** **block** the **main** **thread**.
3. A class **that** only prints images **is** forced to implement `scan()`.
4. The callback **is** **queued** **and** **executed** on the main thread.
5. It is **suitable** **for** high-concurrency **workloads**.

**Đáp án A:**  

1. Noun · Verb · Article · Adjective · Noun
2. Aux · Adv · Verb · Adj · Noun
3. Relative pronoun · Verb
4. Aux · V3 · Conjunction · V3
5. Adj · Prep · Noun

**B. Nhận loại câu + từ khóa**


| Câu                                         | Loại câu              | Từ loại then chốt           |
| ------------------------------------------- | --------------------- | --------------------------- |
| Why can it handle many requests?            | Interrogative         | modal `can` + pronoun `it`  |
| The callback is queued.                     | Affirmative + Passive | be + V3                     |
| It is single-threaded, but it scales.       | Compound              | conjunction `but`           |
| Use a pool without opening new connections. | Imperative            | V1 + prep `without` + V-ing |


---

## Đuôi từ (suffixes) — nhận biết Noun / Verb / Adjective

> **Gợi ý thôi, không tuyệt đối 100%.** Cùng gốc đổi đuôi → đổi từ loại: `depend` (V) → `dependent` (Adj) → `dependency` (N).

### Bảng tổng — đuôi hay gặp

| Từ loại | Đuôi thường gặp | Ví dụ (tech · đời thường) |
|---------|-----------------|---------------------------|
| **Noun** | **-tion/-sion**, **-ment**, **-ness**, **-ity/-ty**, **-ance/-ence**, **-er/-or**, **-ing**, **-ure**, **-age**, **-ism**, **-ship**, **-hood**, **-dom**, **-logy/-ics**, **-itude** | **Tech:** connection, authentication, deployment, environment, scalability, availability, latency, performance, concurrency, persistence, server, compiler, container, logging, caching, architecture, failure, package, storage, outage, parallelism, ownership, cryptography, analytics · **Khác:** education, decision, information, development, happiness, ability, importance, teacher, driver, meeting, culture, message, freedom, biology, attitude |
| **Verb** | **-ize/-ise**, **-ify**, **-ate**, **-en**, **en-** *(prefix)*, **-ect** *(gốc Latin hay gặp)* | **Tech:** serialize, optimize, initialize, sanitize, notify, verify, classify, authenticate, allocate, validate, replicate, migrate, enable, encrypt, connect, detect, inject · **Khác:** realize, organize, beautify, create, celebrate, strengthen, darken, enjoy, expect, collect |
| **Adjective** | **-able/-ible**, **-al/-ial**, **-ive**, **-ous/-ious**, **-ful**, **-less**, **-ic/-ical**, **-ed**, **-ing**, **-y**, **-ary/-ory**, **-ant/-ent** | **Tech:** scalable, reliable, available, transactional, horizontal, reactive, asynchronous, synchronous, serverless, stateless, atomic, dynamic, single-threaded, event-driven, distributed, blocking, pending, temporary, primary, concurrent, persistent, consistent · **Khác:** readable, possible, national, active, dangerous, beautiful, careless, medical, tired, interesting, happy, necessary, important |
| **Adverb** | **-ly** *(chính)*; một số không `-ly`: **fast, hard, often, still, well** | **Tech:** continuously, asynchronously, horizontally, eventually, correctly, concurrently · **Khác:** quickly, easily, carefully, finally, usually, often, still |

> Đọc bảng: **cột 1** = từ loại → **cột 2** quét đuôi → **cột 3** đối chiếu ví dụ.  
> Từ chuyển được giữa V/N/Adj → mục **[Từ chuyển được giữa Verb ↔ Noun ↔ Adjective](#từ-chuyển-được-giữa-verb--noun--adjective-đổi-đuôi)** ngay bên dưới.

---

### Từ chuyển được giữa Verb ↔ Noun ↔ Adjective (đổi đuôi)

> **Chỗ học thuộc khi dịch note:** cùng một ý, đổi đuôi là đổi từ loại — không cần học 3 từ “lạ” riêng.

**Công thức đuôi hay dùng:**

| Chiều đổi | Đuôi / cách làm | Ví dụ nhanh |
|-----------|-----------------|-------------|
| Verb → Noun | `-tion/-sion`, `-ment`, `-ance/-ence`, `-ure`, `-er` | connect → **connection** · fail → **failure** · perform → **performance** |
| Verb → Adjective | `-able/-ible`, `-ive`, `-ant/-ent`, `-ed`, `-ing` | scale → **scalable** · act → **active** · block → **blocked/blocking** |
| Noun → Adjective | `-al`, `-ous`, `-ful`, `-ic` | success → **successful** · danger → **dangerous** |
| Adjective → Noun | `-ness`, `-ity` | available → **availability** · ready → **readiness** |
| Adjective → Adverb | thường thêm `-ly` | consistent → **consistently** · successful → **successfully** |

#### Bảng 3 cột bắt buộc (V · N · Adj)

Chỉ liệt kê bộ **đủ 3 loại**. Cột Adverb = bonus (thêm `-ly` khi có).

| Verb | Noun | Adjective | Đổi đuôi (nhìn nhanh) | Adverb |
|------|------|-----------|------------------------|--------|
| **connect** | connection | connected / connective | `-ect` → `-ection` → `-ed` | — |
| **depend** | dependency / dependence | dependent | `-ence/-ency` · `-ent` | dependently |
| **differ** | difference | different | `-ence` · `-ent` | differently |
| **exist** | existence | existent / existing | `-ence` · `-ent/-ing` | — |
| **persist** | persistence | persistent | `-ence` · `-ent` | persistently |
| **consist** | consistency | consistent | `-ency` · `-ent` | consistently |
| **concur** | concurrency | concurrent | `-ency` · `-ent` | concurrently |
| **resist** | resistance | resistant | `-ance` · `-ant` | — |
| **perform** | performance | performant *(tech, informal)* | `-ance` · `-ant` | — |
| **appear** | appearance | apparent | `-ance` · `-ent` *(hơi lệch gốc)* | apparently |
| **apply** | application | applicable | `-ication` · `-icable` | — |
| **imply** | implication | implicit | `-ication` · `-icit` | implicitly |
| **comply** | compliance | compliant | `-iance` · `-iant` | — |
| **rely** | reliance / reliability | reliable / reliant | `-iance/-ability` · `-able/-ant` | reliably |
| **deny** | denial | deniable | `-al` · `-able` | — |
| **define** | definition | definite / defined | `-ition` · `-ite/-ed` | definitely |
| **decide** | decision | decisive | `-sion` · `-sive` | decisively |
| **divide** | division | divisible / divided | `-sion` · `-ible/-ed` | — |
| **conclude** | conclusion | conclusive | `-sion` · `-sive` | conclusively |
| **include** | inclusion | inclusive / included | `-sion` · `-sive/-ed` | — |
| **exclude** | exclusion | exclusive / excluded | `-sion` · `-sive/-ed` | exclusively |
| **act** | action / activity / actor | active | `-ion/-ivity` · `-ive` | actively |
| **create** | creation / creativity / creator | creative | `-ion/-ivity` · `-ive` | creatively |
| **produce** | production / product | productive | `-tion` · `-tive` | productively |
| **protect** | protection | protective / protected | `-tion` · `-tive/-ed` | — |
| **detect** | detection | detectable / detected | `-tion` · `-able/-ed` | — |
| **select** | selection | selective / selected | `-tion` · `-tive/-ed` | selectively |
| **inject** | injection | injectable / injected | `-tion` · `-able/-ed` | — |
| **reject** | rejection | rejected | `-tion` · `-ed` | — |
| **collect** | collection | collective / collected | `-tion` · `-tive/-ed` | collectively |
| **correct** | correction | correct / corrective | `-tion` · *(adj = gốc)* | correctly |
| **inform** | information | informative / informed | `-ation` · `-ative/-ed` | informatively |
| **transform** | transformation | transformative / transformed | `-ation` · `-ative/-ed` | — |
| **confirm** | confirmation | confirmed | `-ation` · `-ed` | — |
| **observe** | observation | observable / observant | `-ation` · `-able/-ant` | — |
| **reserve** | reservation | reserved | `-ation` · `-ed` | — |
| **preserve** | preservation | preservable / preserved | `-ation` · `-able/-ed` | — |
| **serve** | service / server | serviceable | `-ice/-er` · `-able` | — |
| **use** | use / usage / user | usable / useful / used | `-age/-er` · `-able/-ful/-ed` | usefully |
| **move** | movement / motion | movable / mobile | `-ment/-ion` · `-able/-ile` | — |
| **pay** | payment | payable / paid | `-ment` · `-able/-ed` | — |
| **employ** | employment / employer / employee | employed / employable | `-ment/-er` · `-ed/-able` | — |
| **develop** | development / developer | developed / developing | `-ment/-er` · `-ed/-ing` | — |
| **manage** | management / manager | manageable / managed | `-ment/-er` · `-able/-ed` | — |
| **measure** | measurement | measurable / measured | `-ment` · `-able/-ed` | — |
| **fail** | failure | failed / fallible | `-ure` · `-ed/-ible` | — |
| **press** | pressure | pressured / pressing | `-ure` · `-ed/-ing` | — |
| **succeed** | success | successful | *(N đổi gốc nhẹ)* · `-ful` | successfully |
| **secure** | security | secure / secured | `-ity` · *(adj = gốc / -ed)* | securely |
| **scale** | scale / scalability | scalable | `-ability` · `-able` | — |
| **avail** *(hiếm)* | availability | available | `-ability` · `-able` | — |
| **read** | reading / reader | readable / read | `-ing/-er` · `-able` | — |
| **access** | access | accessible / accessed | *(N≈V)* · `-ible/-ed` | — |
| **accept** | acceptance | acceptable / accepted | `-ance` · `-able/-ed` | acceptably |
| **predict** | prediction | predictable / predictive | `-ion` · `-able/-ive` | predictably |
| **describe** | description | descriptive / described | `-tion` · `-tive/-ed` | — |
| **respond** | response | responsive | *(N lệch đuôi)* · `-ive` | responsively |
| **explode** | explosion | explosive / exploded | `-sion` · `-sive/-ed` | — |
| **extend** | extension | extensive / extended | `-sion` · `-sive/-ed` | extensively |
| **intend** | intention | intentional / intended | `-tion` · `-tional/-ed` | intentionally |
| **attend** | attention | attentive / attended | `-tion` · `-tive/-ed` | attentively |
| **prevent** | prevention | preventable / preventive | `-tion` · `-able/-ive` | — |
| **invent** | invention / inventor | inventive / invented | `-tion/-or` · `-ive/-ed` | inventively |
| **compete** | competition / competitor | competitive | `-tion/-or` · `-tive` | competitively |
| **operate** | operation / operator | operable / operational | `-tion/-or` · `-able/-al` | operationally |
| **generate** | generation / generator | generative / generated | `-tion/-or` · `-ive/-ed` | — |
| **migrate** | migration | migratable / migrated | `-tion` · `-able/-ed` | — |
| **replicate** | replication | replicated | `-tion` · `-ed` | — |
| **validate** | validation | valid / validated | `-tion` · *(valid)* / `-ed` | — |
| **authenticate** | authentication | authenticated | `-tion` · `-ed` | — |
| **authorize** | authorization | authorized | `-tion` · `-ed` | — |
| **optimize** | optimization | optimized / optimal | `-tion` · `-ed` / optimal | optimally |
| **organize** | organization | organized / organizational | `-tion` · `-ed/-al` | organizationally |
| **serialize** | serialization | serializable / serialized | `-tion` · `-able/-ed` | — |
| **normalize** | normalization | normalized / normal | `-tion` · `-ed` / normal | normally |
| **visualize** | visualization | visual / visualized | `-tion` · visual / `-ed` | visually |
| **simplify** | simplification | simple / simplified | `-ication` · simple / `-ed` | simply |
| **classify** | classification | classified | `-ication` · `-ed` | — |
| **identify** | identification / identity | identifiable / identified | `-ication/-ity` · `-able/-ed` | — |
| **notify** | notification | notified | `-ication` · `-ed` | — |
| **verify** | verification | verifiable / verified | `-ication` · `-able/-ed` | — |
| **justify** | justification | justifiable / justified | `-ication` · `-able/-ed` | justifiably |
| **beautify** | beauty | beautiful | *(N lệch)* · `-ful` | beautifully |
| **danger** *(N gốc)* / endanger (V) | danger | dangerous | V `endanger` · Adj `-ous` | dangerously |
| **care** | care | careful / careless | *(N≈V)* · `-ful/-less` | carefully |
| **help** | help / helper | helpful / helpless | *(N≈V)* · `-ful/-less` | helpfully |
| **success** *(N)* / succeed (V) | success | successful | xem succeed ở trên | successfully |
| **value** | value | valuable / valued | *(N≈V)* · `-able/-ed` | — |
| **power** | power | powerful / powerless | *(N≈V)* · `-ful/-less` | powerfully |
| **risk** | risk | risky | *(N≈V)* · `-y` | — |
| **block** | block / blocking | blocked / blocking | *(N≈V)* · `-ed/-ing` | — |
| **queue** | queue | queued | *(N≈V)* · `-ed` | — |
| **cache** | cache | cached | *(N≈V)* · `-ed` | — |
| **lock** | lock | locked / lockable | *(N≈V)* · `-ed/-able` | — |
| **hash** | hash | hashed | *(N≈V)* · `-ed` | — |
| **index** | index / indexing | indexed | *(N≈V)* · `-ed` | — |
| **log** | log / logging | logged | *(N≈V)* · `-ed` | — |
| **deploy** | deployment | deployed | `-ment` · `-ed` | — |
| **assign** | assignment | assigned | `-ment` · `-ed` | — |
| **require** | requirement | required | `-ment` · `-ed` | — |
| **agree** | agreement | agreeable / agreed | `-ment` · `-able/-ed` | agreeably |
| **argue** | argument | arguable / argumentative | `-ment` · `-able/-ative` | arguably |
| **govern** | government | governing / governmental | `-ment` · `-ing/-al` | — |

#### Ví dụ câu — cùng ý, đổi đuôi

```text
V:  We must scale the service.
N:  Scalability is a requirement.
Adj: The service must be scalable.

V:  Connections depend on the pool size.
N:  There is a dependency on the pool size.
Adj: Pool size is a dependent factor. / The service is dependent on Redis.

V:  Authenticate the user.
N:  Authentication failed.
Adj: The user is authenticated.

V:  Do not block the main thread.
N:  Blocking hurts latency. / a block in the pipeline
Adj: a blocking call / a blocked thread
```

#### Mẹo nhớ nhanh

| Muốn viết… | Thường lấy đuôi | Tránh |
|------------|-----------------|--------|
| “sự / quá trình …” | Noun `-tion/-ment/-ence` | dùng nhầm Adj: ~~a scalable~~ khi cần “scalability” |
| “có thể … / mang tính …” | Adj `-able/-ive/-ent` | ~~can scalable~~ → **is scalable** / **can scale** |
| “làm hành động …” | Verb gốc / `-ize/-ate` | ~~do a connect~~ → **connect** / **make a connection** |

> Bảng dài ở trên = **cheat sheet dịch Việt→Anh**: thấy “khả năng mở rộng” → nghĩ Adj **scalable** hoặc N **scalability**, không dịch word-by-word.

### Nhóm đuôi dễ nhầm (đọc kỹ)

| Đuôi | Thường là | Nhưng đôi khi | Ví dụ |
|------|-----------|---------------|--------|
| **-ing** | Noun (logging) **hoặc** Adj (blocking call) **hoặc** Verb (is running) | nhìn vị trí câu | **Logging** helps. / a **blocking** call / is **logging** |
| **-ed** | Adj (distributed system) **hoặc** V2/V3 (we deployed) | sau `be/have` thường là verb form | a **distributed** system / we **deployed** |
| **-er** | Noun (server, compiler) | Adj so sánh hơn (faster) | the **server** / a **faster** API |
| **-ly** | Adverb (easily) | Adj hiếm (friendly, likely) | run **easily** / a **friendly** API · **likely** timeout |
| **-al** | Adjective (horizontal) | Noun đôi khi (proposal → proposal; signal) | **horizontal** scale / a **signal** |
| **-ate** | Verb (validate) | Adj/Noun (immediate; candidate) | **validate** input / **immediate** response / a **candidate** |

---

### Mini drill — đoán từ loại từ đuôi

Ghi **N / V / Adj / Adv** (không cần mở đáp án trước):

1. scalability  
2. sanitize  
3. reversible  
4. horizontally  
5. deployment  
6. event-driven  
7. persistence  
8. notify  
9. concurrent  
10. authentication  

**Đáp án nhanh:** 1 N · 2 V · 3 Adj · 4 Adv · 5 N · 6 Adj · 7 N · 8 V · 9 Adj · 10 N  

---

## Tóm lại


| Cần nhớ      | Ý chính                                                                                                                            |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| 9 từ loại    | mỗi loại có **vị trí / pattern** riêng trong câu                                                                                   |
| Đuôi từ      | `-tion/-ment/-ity` → N · `-ize/-ify/-ate` → V · `-able/-al/-ous/-ed` → Adj · `-ly` → Adv — xem bảng suffixes ở trên              |
| Triển khai   | Noun/Pronoun = S/O · Verb = xương sống · Adj/Art = trước N hoặc sau be · Adv = quanh V · Prep = trước N/V-ing · Conj = nối mệnh đề |
| Loại câu     | Affirmative / Negative / Question / Imperative + Simple / Compound / Complex + Active / Passive                                    |
| Tech English | hay lệch article, adj (`single-threaded`), verb (`is` / `block`), prep (`for` / `on`), thiếu `that`                                |
| Học tiếp     | `[index.md](./index.md)` mục 2, 4, 6, 7                                                                                            |


> Mẹo phỏng vấn: (1) chọn **loại câu**, (2) đặt **verb**, (3) gắn **noun phrase** (article + adj + noun), (4) nối bằng **because/but/when** nếu cần giải thích.

