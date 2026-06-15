# REST vs gRPC — Tại sao gRPC nhanh hơn?

## Tóm tắt một câu

gRPC nhanh hơn REST/JSON chủ yếu vì **HTTP/2 multiplexing**, payload **Protobuf nhị phân** (nhỏ, parse nhanh), và **contract cứng** (.proto). REST vẫn phù hợp public API, browser, debug dễ.

---

## So sánh

| | **REST (JSON)** | **gRPC (Protobuf)** |
|---|-----------------|---------------------|
| Protocol | HTTP/1.1 thường (HTTP/2 được) | HTTP/2 mặc định |
| Format | JSON text | Protobuf binary |
| Contract | OpenAPI (optional) | `.proto` bắt buộc |
| Streaming | Hạn chế (SSE, chunk) | Unary, server/client/bidi stream |
| Browser | Native | Cần grpc-web + proxy |
| Debug | `curl`, readable | Cần tool (grpcurl, BloomRPC) |

---

## Vì sao gRPC nhanh hơn?

### 1. Protobuf vs JSON

- **Kích thước nhỏ hơn** — field tag số, không lặp tên key `"user_id"`.
- **Parse nhanh** — decode binary, không lexical scan string JSON.
- Không có overhead format số/float/string JSON.

### 2. HTTP/2

- **Multiplexing** — nhiều RPC trên **một TCP connection**, không head-of-line blocking như HTTP/1.1.
- **Header compression** (HPACK) — giảm metadata lặp.
- Connection reuse tốt hơn — ít handshake TLS hơn khi nhiều request.

### 3. Code generation

- Stub client/server generate sẵn — ít reflection runtime hơn JSON binding.

### 4. Streaming

- Server stream large data không cần buffer hết vào một response JSON khổng lồ.

---

## Khi dùng gì?

| Chọn REST | Chọn gRPC |
|-----------|-----------|
| Public API, third-party | Internal service-to-service |
| Frontend browser trực tiếp | Backend mesh, microservice |
| CRUD đơn giản, human debug | High throughput, low latency |
| Team chưa quen Protobuf | Cần streaming, strong contract |

**Thực tế:** API gateway REST ra ngoài, nội bộ gRPC.

---

## Câu trả lời ngắn (phỏng vấn)

gRPC nhanh hơn vì **Protobuf** (nhỏ, parse nhanh) + **HTTP/2** (multiplex, header compress, ít connection). REST JSON dễ tích hợp và debug hơn — dùng cho boundary ngoài; gRPC cho internal high-performance.
