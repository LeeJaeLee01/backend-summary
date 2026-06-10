# Tại sao sử dụng kết hợp PostgreSQL và TimescaleDB?

<a id="why-postgres-timescale"></a>

Dựa trên việc phân tích mã nguồn trong thư mục `src/entities` và `src/database`, hệ thống sử dụng kết hợp cả hai loại database này để tối ưu hóa cho các mục đích khác nhau:

**en-sub**: Based on analysis source code in folder `src/entities` and `src/database`, the system uses both types of databases (the system used combine both two database) to optimize for different purpose

### 1. PostgreSQL (Relational Data & Metadata)
PostgreSQL được sử dụng để lưu trữ các dữ liệu quan hệ (relational data) và metadata của hệ thống.
- **Thực thể tiêu biểu:** `SolanaToken`, `SolanaMarket`, `SolanaTrader`, `SolanaPool`.
- **Đặc điểm:**
    - Dữ liệu này thường có cấu trúc phức tạp, nhiều mối quan hệ (Relations/Joins) như `OneToMany`, `ManyToOne`.
    - Tần suất cập nhật không quá cao so với dữ liệu giao dịch.
    - Cần tính toàn vẹn dữ liệu cao (ACID) để quản lý thông tin token, ví người dùng và trạng thái các pool.
- **Lý do không dùng TimescaleDB cho phần này:** Mặc dù TimescaleDB là một extension của Postgres, nhưng việc tách biệt giúp giữ cho database metadata nhẹ nhàng, dễ backup và quản lý các quan hệ phức tạp mà không bị ảnh hưởng bởi khối lượng dữ liệu khổng lồ từ lịch sử giao dịch.

**en-sub:** PostgreSQL is used to store **relational data** and system **metadata**.
- **Representative entities:** `SolanaToken`, `SolanaMarket`, `SolanaTrader`, `SolanaPool`.
- **Characteristics:**
    - This data usually has a **complex structure** with many **relationships (relations/joins)**, such as `OneToMany` and `ManyToOne`.
    - **Update frequency** is relatively low compared to transactional data.
    - It requires **strong data integrity (ACID)** to manage token information, user wallets, and pool state.
- **Why not use TimescaleDB for this part:** Although TimescaleDB is a PostgreSQL extension, separating it keeps the metadata database **lightweight**, easier to **backup**, and simpler to manage **complex relationships** without being affected by the huge volume of transaction history data.

### 2. TimescaleDB (Time-Series Data & Analytics)
TimescaleDB được sử dụng chuyên biệt cho dữ liệu dạng chuỗi thời gian (time-series), cụ thể là lịch sử giao dịch và dữ liệu biểu đồ.
- **Thực thể tiêu biểu:** `SolanaHistoryTransactionTimescale`.
- **Các tính năng "killer" được sử dụng:**
    - **Hypertables:** Tự động phân mảnh (partitioning) dữ liệu theo thời gian (cột `timestamp`). Điều này giúp duy trì hiệu năng query ổn định ngay cả khi bảng dữ liệu lên đến hàng tỷ dòng.
    - **Continuous Aggregates:** Đây là tính năng quan trọng nhất được thấy trong các migration (file `1736393445865-create-solana-ohlc-views.ts`). Hệ thống sử dụng nó để tự động tính toán và cập nhật các biểu đồ OHLC (1s, 5s, 1m, 1h...) một cách cực kỳ hiệu quả mà không cần tính toán lại từ đầu mỗi khi có request.
    - **Hàm chuyên dụng:** Sử dụng các hàm như `time_bucket`, `FIRST()`, `LAST()` để xử lý dữ liệu tài chính (giá mở cửa, đóng cửa, cao nhất, thấp nhất) nhanh hơn nhiều so với SQL thuần.

**en-sub:**

TimescaleDB is used specifically (cụ thể/chính xác) for **time-series data**, especially (đặc biệt) **transaction history** and **chart/analytics** workloads.

- **Representative entity:** `SolanaHistoryTransactionTimescale`.
- **Key features in use:**
    - **Hypertables:** Automatically **partition** data by time (the `timestamp` column). This keeps query performance stable even when a table grows to **billions of rows**.
    - **Continuous aggregates:** The most important feature in practice (see migration `1736393445865-create-solana-ohlc-views.ts`). The system uses it to **precompute and refresh OHLC charts** (1s, 5s, 1m, 1h, …) efficiently, without recalculating from raw data on every request.
    - **Specialized functions:** Functions such as `time_bucket`, `FIRST()`, and `LAST()` process financial metrics (open, close, high, low) **much faster** than plain SQL.

### 3. Tại sao không dùng một loại duy nhất?
- **Nếu chỉ dùng PostgreSQL thuần:** Khi dữ liệu giao dịch (History Transactions) tăng lên hàng trăm triệu hoặc hàng tỷ bản ghi, các câu lệnh query biểu đồ hoặc insert dữ liệu mới sẽ trở nên cực kỳ chậm do index bị phình to (index bloat) và không có cơ chế tự động phân mảnh theo thời gian hiệu quả.
- **Nếu chỉ dùng TimescaleDB:** Thực tế TimescaleDB *có thể* lưu được cả metadata. Tuy nhiên, trong kiến trúc hệ thống lớn (Enterprise), việc tách biệt (Separation of Concerns) giúp:
    - **Scalability:** Có thể scale storage và tài nguyên cho TimescaleDB (nơi chứa dữ liệu nặng) độc lập với Postgres (nơi chứa logic nghiệp vụ).
    - **Maintenance:** Việc bảo trì, migration hoặc backup các bảng metadata quan trọng sẽ nhanh chóng và an toàn hơn khi không bị trộn lẫn với hàng Terabyte dữ liệu lịch sử.

### Tóm tắt kiến trúc:
- **PostgreSQL:** Đóng vai trò là "Operational Database" (Quản lý thực thể, trạng thái hệ thống).
- **TimescaleDB:** Đóng vai trò là "Analytical/Time-series Database" (Phục vụ biểu đồ, thống kê, lịch sử giao dịch dung lượng lớn).

---

## Ưu điểm của TimescaleDB so với PostgreSQL thuần túy

### 1. Hypertables - Tự động phân mảnh dữ liệu theo thời gian
- **Vấn đề của PostgreSQL:** Khi bảng `solana_history_transaction_timescale` có hàng tỷ dòng, mọi thao tác INSERT, SELECT, và UPDATE đều phải quét hoặc cập nhật toàn bộ index → chậm dần theo thời gian.
- **Giải pháp của TimescaleDB:** Tự động chia bảng thành các **"chunks"** (phân mảnh) nhỏ theo thời gian (VD: mỗi chunk chứa dữ liệu của 1 ngày). Khi query dữ liệu trong 1 khoảng thời gian, DB chỉ scan đúng chunk cần thiết thay vì toàn bộ bảng.
- **Kết quả thực tế:** Hiệu năng query ổn định và không giảm dù bảng có 1 triệu hay 10 tỷ bản ghi.

```sql
-- TimescaleDB tự động convert bảng thường thành Hypertable
SELECT create_hypertable('solana_history_transaction_timescale', 'timestamp');
```

**en-sub**:
- **PostgreSQL's problem:** When the `solana_history_transaction_timescale` table reaches billions of rows, every INSERT, SELECT, and UPDATE must scan or update the full index → performance degrades over time.
- **TimescaleDB's solution:** Automatically splits the table into small time-based **chunks** (partitions) (e.g., one chunk per day). When querying a time range, the DB scans only the relevant chunks instead of the entire table.
- **Real-world result:** Query performance stays stable whether the table has 1 million or 10 billion rows.

### 2. Continuous Aggregates - Pre-compute dữ liệu biểu đồ tự động
- **Vấn đề của PostgreSQL:** Mỗi khi client request biểu đồ OHLC 1 giờ, DB phải tính toán `MAX`, `MIN`, `FIRST`, `LAST` trên toàn bộ hàng triệu giao dịch trong khoảng thời gian đó → Rất tốn tài nguyên, query có thể mất vài giây.
- **Giải pháp của TimescaleDB:** **Continuous Aggregates** là các Materialized View đặc biệt được cập nhật **tự động, tăng dần (incremental)** trong nền. Mỗi khi có dữ liệu mới insert, chỉ phần dữ liệu mới được tính toán lại, không phải toàn bộ.
- **Bằng chứng từ code:** File migration tạo ra **16 biểu đồ OHLC khác nhau** (1s → 1 tháng):

```sql
-- Mỗi view này được cập nhật tự động bởi TimescaleDB
CREATE MATERIALIZED VIEW solana_ohlc_1m
    WITH (timescaledb.continuous) AS
SELECT time_bucket('1 minutes', timestamp) AS time_1m,
       pair,
       FIRST(price_usd, timestamp) AS open_usd,
       MAX(price_usd)              AS high_usd,
       MIN(price_usd)              AS low_usd,
       LAST(price_usd, timestamp)  AS close_usd
FROM solana_history_transaction_timescale
GROUP BY time_1m, pair;
```

**en-sub**:
- **PostgreSQL's problem:** Every time a client requests a 1-hour OHLC chart, the DB must compute `MAX`, `MIN`, `FIRST`, and `LAST` over millions of transactions in that time range → very resource-intensive; queries can take several seconds.
- **TimescaleDB's solution:** **Continuous Aggregates** are special materialized views updated **automatically and incrementally** in the background. When new data is inserted, only the new portion is recalculated—not the entire dataset.
- **Evidence from code:** A migration file creates **16 different OHLC charts** (1s → 1 month).

### 3. Cascading Aggregates - Tái sử dụng kết quả đã tính
- **Ưu điểm độc đáo:** TimescaleDB cho phép các Materialized View cấp cao hơn **kế thừa** kết quả từ view cấp thấp hơn.
- **Bằng chứng từ code:**
    - `solana_ohlc_3m` được tính từ `solana_ohlc_1m` (không tính lại từ raw data).
    - `solana_ohlc_1d` được tính từ `solana_ohlc_12h`.
    - `solana_ohlc_1month` được tính từ `solana_ohlc_1d`.
- **Lợi ích:** Tiết kiệm tài nguyên CPU/RAM đáng kể khi cần cập nhật biểu đồ dài hạn.

```
Raw Transactions → 1m → 3m, 5m → 15m → 30m → 1h → 2h → 4h → 8h → 12h → 1d → 3d, 7d, 1month
```

**en-sub**:
- **Unique advantage:** TimescaleDB lets higher-level materialized views **inherit** results from lower-level views.
- **Evidence from code:**
    - `solana_ohlc_3m` is computed from `solana_ohlc_1m` (not recalculated from raw data).
    - `solana_ohlc_1d` is computed from `solana_ohlc_12h`.
    - `solana_ohlc_1month` is computed from `solana_ohlc_1d`.
- **Benefit:** Saves significant CPU/RAM when updating long-term charts.

### 4. Các hàm chuyên dụng cho dữ liệu tài chính
TimescaleDB cung cấp các hàm mà PostgreSQL thuần không có:

| Hàm | Chức năng | Ứng dụng trong code |
| :--- | :--- | :--- |
| `time_bucket('1 minutes', timestamp)` | Gom dữ liệu theo khoảng thời gian | Tạo nến OHLC các khung giờ |
| `FIRST(price_usd, timestamp)` | Lấy giá trị đầu tiên theo thứ tự thời gian | Giá mở cửa (Open) |
| `LAST(price_usd, timestamp)` | Lấy giá trị cuối cùng theo thứ tự thời gian | Giá đóng cửa (Close) |

> **Lưu ý:** Trong PostgreSQL thuần, để có được `FIRST` và `LAST` theo thứ tự thời gian, bạn phải dùng subquery phức tạp hoặc window function, vừa chậm vừa khó viết.

**en-sub**:
TimescaleDB provides functions that plain PostgreSQL does not:

| Function | Purpose | Use in code |
| :--- | :--- | :--- |
| `time_bucket('1 minutes', timestamp)` | Bucket data by time interval | Build OHLC candles for each timeframe |
| `FIRST(price_usd, timestamp)` | First value in time order | Open price |
| `LAST(price_usd, timestamp)` | Last value in time order | Close price |

> **Note:** In plain PostgreSQL, getting time-ordered `FIRST` and `LAST` requires complex subqueries or window functions—slower and harder to write.

### 5. Tự động xóa dữ liệu cũ (Data Retention Policy)
- TimescaleDB hỗ trợ **Retention Policy** để tự động xóa các chunk dữ liệu cũ hơn một ngưỡng nhất định mà không cần viết cronjob thủ công.
- **Bằng chứng từ code:** File migration `1736393513777-create-continuous-aggregate-policy.ts` thiết lập các policy này.
- **Lợi ích:** Giúp kiểm soát dung lượng storage tự động, đặc biệt quan trọng khi hệ thống nhận hàng nghìn giao dịch mỗi giây từ Helius WebSocket.

**en-sub**:
- TimescaleDB supports a **Retention Policy** to automatically drop chunks older than a set threshold—no manual cron jobs required.
- **Evidence from code:** The migration file `1736393513777-create-continuous-aggregate-policy.ts` configures these policies.
- **Benefit:** Automatically controls storage usage—especially important when the system ingests thousands of transactions per second from the Helius WebSocket.

### 6. So sánh nhanh

| Tính năng | PostgreSQL thuần | TimescaleDB |
| :--- | :---: | :---: |
| Phân mảnh tự động theo thời gian | ❌ (phải làm thủ công) | ✅ Hypertables |
| Pre-compute biểu đồ OHLC | ❌ (query chậm) | ✅ Continuous Aggregates |
| Hàm `FIRST`, `LAST`, `time_bucket` | ❌ | ✅ Built-in |
| Hiệu năng khi bảng có tỷ rows | ❌ Giảm dần | ✅ Ổn định |
| Tự động xóa data cũ | ❌ Cần cronjob | ✅ Retention Policy |
| Tương thích SQL chuẩn | ✅ Hoàn toàn | ✅ 100% (là extension của PG) |

---

## Tại sao Continuous Aggregates (CA) lại "bá đạo" hơn Materialized View (MV) thông thường?

Nếu bạn dùng PostgreSQL thuần, bạn vẫn có Materialized View, nhưng CA của TimescaleDB giải quyết được những "nỗi đau" kinh điển sau:

**en-sub**: ## Why are Continuous Aggregates (CA) more powerful than regular Materialized Views (MV)?

If you use plain PostgreSQL, you still have materialized views—but TimescaleDB's CA solves these classic pain points:

### 1. Refresh thông minh (Incremental Refresh)
- **Với MV thông thường:** Mỗi khi bạn chạy `REFRESH MATERIALIZED VIEW`, Postgres sẽ xóa sạch bảng cũ và tính toán lại từ đầu toàn bộ lịch sử (vài triệu dòng). Điều này cực kỳ tốn tài nguyên và gây khóa bảng (nếu không dùng `CONCURRENTLY`).
- **Với CA của Timescale:** Nó chỉ tính toán phần **dữ liệu mới thay đổi (Delta)** kể từ lần refresh trước. Nếu bạn có 10 năm dữ liệu và vừa có thêm 1 phút giao dịch mới, CA chỉ tốn vài miligiây để cập nhật thêm 1 phút đó vào.

**en-sub**:
- **Regular MV:** Every `REFRESH MATERIALIZED VIEW` drops the old table and recomputes the full history (millions of rows)—very expensive and can lock the table (unless you use `CONCURRENTLY`).
- **Timescale CA:** Recomputes only the **changed data (delta)** since the last refresh. With 10 years of history and one new minute of trades, CA updates that minute in milliseconds.

### 2. Dữ liệu thời gian thực (Real-time Aggregation)
Đây là tính năng "ăn tiền" nhất. Trong MV thường, dữ liệu bạn thấy luôn là dữ liệu cũ (stale) cho đến khi bạn refresh.
- **Với CA:** Khi bạn cấu hình `materialized_only = false`, TimescaleDB sẽ làm một việc kỳ diệu:
    - Nó lấy dữ liệu đã được tính sẵn trong View.
    - Nó tự động "soi" thêm các giao dịch mới nhất trong bảng thô (chưa kịp refresh).
    - Nó gộp cả hai lại để trả về kết quả **real-time 100%** cho bạn.

**en-sub**:
This is the highest-value feature. With a regular MV, what you see is always stale until you refresh.
- **With CA:** When you set `materialized_only = false`, TimescaleDB:
    - Reads precomputed data from the view.
    - Automatically includes the latest raw transactions (not yet refreshed).
    - Merges both to return **100% real-time** results.

### 3. Độc lập với dữ liệu gốc (Retention Independence)
- **Với MV thông thường:** Nếu bạn xóa dữ liệu ở bảng gốc (Source Table), MV có nguy cơ bị lỗi hoặc mất dữ liệu trong lần refresh tới.
- **Với CA:** Bạn có thể thiết lập Policy xóa bảng thô sau 1 ngày (`Retention 1 day`) nhưng vẫn giữ View trong 1 năm. View sẽ giữ chặt những gì nó đã tính toán được, ngay cả khi "cha đẻ" (bảng thô) của nó đã bị tiêu hủy.

**en-sub**:
- **Regular MV:** If you delete data from the source table, the MV may break or lose data on the next refresh.
- **With CA:** You can drop raw data after 1 day (`Retention 1 day`) while keeping the view for 1 year. The view keeps what it already computed—even after the raw table is gone.

### 4. Khả năng nén (Compression)
- CA hỗ trợ nén dữ liệu giống hệt như Hypertable. Bạn có thể nén các nến cũ để tiết kiệm diện tích ổ cứng mà vẫn có thể query biểu đồ bình thường. MV của Postgres không làm được việc này.

**en-sub**:
- CA supports compression like hypertables. You can compress old candles to save disk space while still querying charts normally. PostgreSQL MVs cannot do this.

### 5. Phân cấp tính toán (Cascading Aggregates)
- Timescale cho phép nến 1h lấy dữ liệu từ nến 5m, nến 5m lấy từ nến 1m. 
- **Lợi ích:** Tiết kiệm CPU khủng khiếp. Thay vì hàng triệu giao dịch, nến 1h chỉ cần đọc 12 dòng dữ liệu từ nến 5m. MV thông thường phải tính toán lại từ bảng gốc cho mọi khung giờ.

**en-sub**:
- Timescale lets 1h candles read from 5m candles, and 5m from 1m.
- **Benefit:** Massive CPU savings. Instead of millions of transactions, a 1h candle reads 12 rows from 5m candles. Regular MVs must recompute from the source table for every timeframe.

> **Tóm lại:** Nếu Materialized View là một bức ảnh chụp nhanh (snapshot), thì Continuous Aggregates là một **thước phim quay chậm liên tục**, tự cập nhật và cực kỳ tiết kiệm tài nguyên.

**en-sub**:
> **In short:** If a materialized view is a snapshot, a continuous aggregate is a **continuously updated time-lapse**—self-maintaining and far more resource-efficient.
