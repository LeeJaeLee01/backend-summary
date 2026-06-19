# Mạng (Networking) — Khái niệm cần biết

> Tổng hợp các khái niệm mạng liên quan khi thiết kế, triển khai và vận hành hệ thống backend — từ tầng vật lý/logic đến HTTP, bảo mật và cloud.

**Liên quan:** [ops/index.md](../ops/index.md) (Docker network, isolation), [go-interviews/kubernetes.md](../go-interviews/kubernetes.md) (Service, Ingress, NetworkPolicy), [go-interviews/rest-vs-grpc.md](../go-interviews/rest-vs-grpc.md) (REST vs gRPC), [aws/tours/index.md](../aws/tours/index.md) (Nginx reverse proxy), [design-sys/csrf-sso-oauth-state.md](../design-sys/csrf-sso-oauth-state.md) (OAuth, cookie cross-domain).

---

## 1. Mô hình tham chiếu

### 1.1 OSI Model (7 tầng)

| Tầng | Tên | Vai trò | Ví dụ protocol / thành phần |
|------|-----|---------|-------------------------------|
| 7 | **Application** | Giao tiếp ứng dụng | HTTP, gRPC, DNS, SMTP |
| 6 | **Presentation** | Mã hóa, nén, serialize | TLS (thực tế gắn với tầng 5–6), JSON, Protobuf |
| 5 | **Session** | Quản lý phiên | Cookie session, TLS session resumption |
| 4 | **Transport** | End-to-end, port, độ tin cậy | TCP, UDP |
| 3 | **Network** | Định tuyến giữa mạng | IP, ICMP, routing table |
| 2 | **Data Link** | Frame trên một hop LAN | Ethernet, MAC address, switch |
| 1 | **Physical** | Tín hiệu vật lý | Cáp, Wi‑Fi, fiber |

### 1.2 TCP/IP Model (4 tầng — thực tế hay dùng)

```
┌─────────────────────────────────────────┐
│  Application  │ HTTP, DNS, gRPC, SSH    │
├───────────────┼─────────────────────────┤
│  Transport    │ TCP, UDP                │
├───────────────┼─────────────────────────┤
│  Internet     │ IP (v4/v6), ICMP        │
├───────────────┼─────────────────────────┤
│  Link         │ Ethernet, Wi‑Fi         │
└─────────────────────────────────────────┘
```

| Khái niệm | Mô tả |
|----------|-------|
| **Encapsulation** | Mỗi tầng bọc header vào payload tầng trên (HTTP → TCP → IP → Ethernet) |
| **MTU** | Maximum Transmission Unit — kích thước frame IP tối đa (thường 1500 byte Ethernet) |
| **MSS** | Maximum Segment Size — payload TCP tối đa trong một segment |

---

## 2. Địa chỉ & định tuyến (Layer 3)

### 2.1 IP, subnet, CIDR

| Khái niệm | Mô tả | Ví dụ |
|-----------|-------|-------|
| **IPv4** | Địa chỉ 32-bit | `192.168.1.10` |
| **IPv6** | Địa chỉ 128-bit | `2001:db8::1` |
| **Subnet mask** | Phân biệt phần network vs host | `255.255.255.0` (/24) |
| **CIDR** | Ký hiệu prefix | `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16` (private) |
| **Private IP** | Dải không route internet (RFC 1918) | `10.x`, `172.16–31.x`, `192.168.x` |
| **Public IP** | Địa chỉ reachable từ internet | Elastic IP, NAT gateway |
| **Loopback** | Giao tiếp nội bộ máy | `127.0.0.1` (`localhost`) |
| **Link-local** | Tự cấu hình trong LAN | `169.254.x.x` |

### 2.2 NAT, gateway, routing

| Khái niệm | Mô tả |
|----------|-------|
| **Default gateway** | Router ra mạng khác (thường `.1` trong subnet) |
| **Routing table** | Bảng quyết định gói tin đi interface/hop nào |
| **NAT** (Network Address Translation) | Map private IP ↔ public IP — nhiều máy trong LAN dùng chung một public IP |
| **SNAT** | Source NAT — outbound từ private ra internet |
| **DNAT** | Destination NAT — port forward, load balancer |
| **Port forwarding** | Map `public:443` → `private:8080` |
| **ICMP** | Ping, traceroute — diagnostic (không phải TCP/UDP) |

```
LAN (10.0.1.0/24)                    Internet
┌──────────┐    NAT / Router    ┌──────────────┐
│ App      │ ─────────────────► │ Public IP    │
│ 10.0.1.5 │                    │ 203.0.113.1  │
└──────────┘                    └──────────────┘
```

---

## 3. Tầng vận chuyển (Layer 4)

### 3.1 TCP vs UDP

| | **TCP** | **UDP** |
|---|---------|---------|
| Kết nối | Connection-oriented (3-way handshake) | Connectionless |
| Độ tin cậy | Đảm bảo thứ tự, retransmit mất gói | Không đảm bảo |
| Overhead | Cao hơn (ACK, window) | Thấp |
| Use case | HTTP, gRPC, DB, API | DNS query, video stream, gaming, QUIC base |

### 3.2 Khái niệm TCP quan trọng

| Khái niệm | Mô tả |
|----------|-------|
| **Three-way handshake** | SYN → SYN-ACK → ACK — thiết lập kết nối |
| **Four-way teardown** | FIN/ACK — đóng kết nối |
| **Port** | Số 0–65535 — multiplex service trên một IP |
| **Well-known ports** | 80 HTTP, 443 HTTPS, 5432 PostgreSQL, 6379 Redis, 3306 MySQL |
| **Ephemeral port** | Port client tạm khi outbound |
| **Socket** | `(IP, port)` local + `(IP, port)` remote — endpoint giao tiếp |
| **Listen backlog** | Hàng đợi kết nối chờ `accept()` |
| **Nagle algorithm** | Gộp segment nhỏ — có thể tăng latency (tắt `TCP_NODELAY` khi cần) |
| **Keep-alive** | TCP probe giữ connection sống qua NAT/firewall |
| **TIME_WAIT** | Trạng thái sau đóng kết nối — tránh port exhaustion khi churn cao |

### 3.3 Socket programming (khái niệm)

| Khái niệm | Mô tả |
|----------|-------|
| **Blocking I/O** | `read()`/`write()` chờ đến khi có data |
| **Non-blocking I/O** | Trả về ngay nếu chưa sẵn sàng |
| **I/O multiplexing** | `select` / `poll` / `epoll` — một thread quản nhiều socket |
| **Reactor pattern** | Event loop + epoll — Node, Nginx, Netty |

---

## 4. DNS (Domain Name System)

| Khái niệm | Mô tả |
|----------|-------|
| **Domain / FQDN** | Tên đầy đủ: `api.example.com` |
| **A record** | Domain → IPv4 |
| **AAAA record** | Domain → IPv6 |
| **CNAME** | Alias trỏ tới domain khác |
| **MX** | Mail server |
| **TXT** | SPF, DKIM, verification |
| **SRV** | Service discovery (host + port) |
| **NS** | Name server authoritative |
| **TTL** | Thời gian cache DNS — thấp = failover nhanh, cao = ít query |
| **Resolver** | Client/OS hỏi DNS (8.8.8.8, 1.1.1.1, corporate DNS) |
| **Authoritative DNS** | Server chứa record chính thức của zone |
| **DNS propagation** | Thời gian TTL cũ hết hạn sau khi đổi record |
| **Split-horizon DNS** | Cùng domain, IP khác nhau internal vs external |
| **Wildcard DNS** | `*.example.com` |

**Luồng resolve:**

```
App → OS resolver → Recursive resolver → Root → TLD (.com) → Authoritative → IP
```

---

## 5. HTTP / HTTPS

### 5.1 HTTP cơ bản

| Khái niệm | Mô tả |
|----------|-------|
| **Request / Response** | Client gửi request; server trả response |
| **Method** | GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS |
| **Status code** | 1xx info, 2xx success, 3xx redirect, 4xx client error, 5xx server error |
| **Header** | Metadata: `Content-Type`, `Authorization`, `Cache-Control`, ... |
| **Body** | Payload (JSON, form, binary) |
| **Stateless** | Mỗi request độc lập — state qua cookie/token/session server |
| **Idempotent** | Gọi nhiều lần cùng kết quả: GET, PUT, DELETE (lý tưởng) |
| **Safe method** | Không đổi resource: GET, HEAD |

### 5.2 Phiên bản HTTP

| Version | Đặc điểm |
|---------|----------|
| **HTTP/1.0** | Một request/response mỗi connection |
| **HTTP/1.1** | Keep-alive, chunked transfer, host header — **head-of-line blocking** trên một connection |
| **HTTP/2** | Binary framing, **multiplexing** nhiều stream trên một TCP, HPACK header compression |
| **HTTP/3** | Chạy trên **QUIC** (UDP) — giảm latency handshake, không HOL blocking tầng transport |

### 5.3 HTTPS & TLS

| Khái niệm | Mô tả |
|----------|-------|
| **TLS / SSL** | Mã hóa + xác thực tầng transport (thực tế dùng TLS 1.2/1.3) |
| **Certificate (X.509)** | Chứng nhận domain + public key — ký bởi CA |
| **CA** | Certificate Authority — Let's Encrypt, DigiCert, ... |
| **TLS handshake** | Negotiate cipher, verify cert, trao đổi key session |
| **SNI** | Server Name Indication — nhiều cert trên một IP |
| **mTLS** | Mutual TLS — client cũng có cert, xác thực hai chiều |
| **Perfect Forward Secrecy** | Session key không suy ra từ long-term key nếu bị lộ |
| **Certificate pinning** | Client chỉ tin một cert/public key cố định |
| **HSTS** | Browser chỉ dùng HTTPS cho domain |
| **OCSP / CRL** | Kiểm tra cert còn hiệu lực / bị revoke |

```
Client                          Server
   │──── ClientHello ────────────►│
   │◄─── ServerHello + Cert ──────│
   │──── Verify cert (CA chain) ─│
   │◄─── Encrypted application ──►│  HTTP trên TLS
```

### 5.4 Caching & conditional request

| Khái niệm | Mô tả |
|----------|-------|
| **Cache-Control** | `max-age`, `no-cache`, `no-store`, `private`, `public` |
| **ETag** | Hash version resource — `If-None-Match` → 304 |
| **Last-Modified** | `If-Modified-Since` → 304 |
| **CDN cache** | Edge cache theo URL + header |
| **Vary** | Cache key phụ thuộc header (e.g. `Accept-Encoding`) |

---

## 6. Web & API — khái niệm ứng dụng

### 6.1 Origin, CORS, cookie

| Khái niệm | Mô tả |
|----------|-------|
| **Origin** | Scheme + host + port: `https://api.example.com:443` |
| **Same-origin** | Cùng origin — không cần CORS |
| **Cross-origin** | Khác origin — browser chặn JS đọc response trừ khi CORS cho phép |
| **CORS** | Server trả `Access-Control-Allow-Origin`, preflight OPTIONS |
| **Preflight** | OPTIONS trước request “phức tạp” (custom header, PUT, ...) |
| **Cookie** | `Set-Cookie`, `HttpOnly`, `Secure`, `SameSite` (Strict/Lax/None) |
| **Domain cookie** | `.example.com` — share giữa subdomain |
| **CSRF** | Request giả mạo từ site khác lợi dụng cookie session |

### 6.2 Real-time & streaming

| Khái niệm | Mô tả |
|----------|-------|
| **Long polling** | Client giữ request mở đến khi có data |
| **SSE** (Server-Sent Events) | Server push text/event-stream một chiều qua HTTP |
| **WebSocket** | Full-duplex trên TCP — upgrade từ HTTP |
| **gRPC streaming** | Unary, server stream, client stream, bidirectional |
| **Webhook** | Server gọi HTTP callback tới URL đã đăng ký |

### 6.3 REST, RPC, GraphQL (góc nhìn mạng)

| Khái niệm | Mô tả |
|----------|-------|
| **REST** | Resource-oriented, HTTP verb + JSON — stateless |
| **gRPC** | RPC trên HTTP/2 + Protobuf — nội bộ service |
| **GraphQL** | Một endpoint, client chọn field — giảm over-fetch |
| **API Gateway** | Entry point tập trung: auth, rate limit, routing |
| **BFF** | Backend for Frontend — API riêng cho từng client |

---

## 7. Proxy & load balancing

### 7.1 Forward vs Reverse proxy

| | **Forward proxy** | **Reverse proxy** |
|---|-------------------|-------------------|
| Đứng trước | Client | Server |
| Client biết | Có (cấu hình proxy) | Không (chỉ thấy proxy) |
| Mục đích | Ẩn client, bypass firewall, cache outbound | SSL termination, LB, cache, WAF |
| Ví dụ | Corporate proxy, Squid | Nginx, HAProxy, ALB, Cloudflare |

```
Forward:  Client → Proxy → Internet → Server
Reverse:  Client → Internet → Reverse Proxy → App servers
```

### 7.2 Load balancer

| Khái niệm | Mô tả |
|----------|-------|
| **L4 LB** | Balance theo IP + port (TCP/UDP) — nhanh, không parse HTTP |
| **L7 LB** | Balance theo HTTP path, header, cookie — routing thông minh |
| **Round robin** | Luân phiên server |
| **Least connections** | Gửi tới server ít connection nhất |
| **Weighted** | Tỷ lệ theo capacity |
| **IP hash / sticky session** | Cùng client → cùng backend |
| **Health check** | LB loại server fail (HTTP `/health`, TCP probe) |
| **Connection draining** | Ngừng gửi traffic mới trước khi tắt node |

### 7.3 Nginx / reverse proxy (hay gặp)

| Khái niệm | Mô tả |
|----------|-------|
| **Upstream** | Nhóm backend server |
| **Host-based routing** | Route theo `Host` header (subdomain) |
| **Path-based routing** | Route theo URL prefix (`/api` → BE) |
| **SSL termination** | TLS giải tại proxy — backend HTTP nội bộ |
| **Pass-through (SSL)** | TLS end-to-end tới backend |
| **gzip / brotli** | Nén response |
| **Rate limiting** | `limit_req` — chống abuse |
| **X-Forwarded-For** | Header ghi IP client gốc qua proxy |
| **X-Forwarded-Proto** | `http` vs `https` phía client |

---

## 8. CDN & edge

| Khái niệm | Mô tả |
|----------|-------|
| **CDN** | Mạng edge server cache static/dynamic gần user |
| **PoP** | Point of Presence — edge location |
| **Cache hit / miss** | Có/không có content tại edge |
| **Origin pull** | Edge lấy từ origin khi miss |
| **Purge / invalidation** | Xóa cache CDN sau deploy |
| **DDoS mitigation** | Absorb traffic tại edge (Cloudflare, AWS Shield) |
| **WAF** | Web Application Firewall — rule chặn SQLi, XSS tại edge |
| **Anycast** | Cùng IP announce từ nhiều PoP — route tới gần nhất |

---

## 9. Cloud networking (AWS / GCP / Azure — khái niệm chung)

| Khái niệm | Mô tả |
|----------|-------|
| **VPC** | Virtual Private Cloud — mạng ảo riêng trong cloud |
| **Subnet** | Subdivision VPC — public vs private |
| **Public subnet** | Route ra internet qua IGW |
| **Private subnet** | Không internet trực tiếp — ra qua NAT |
| **Internet Gateway (IGW)** | VPC ↔ internet |
| **NAT Gateway / NAT Instance** | Outbound internet cho private subnet |
| **Security Group** | Firewall stateful theo instance/ENI (allow rules) |
| **NACL** | Firewall stateless theo subnet |
| **Route table** | Định tuyến subnet tới IGW, NAT, peering |
| **VPC Peering** | Nối hai VPC private |
| **Transit Gateway** | Hub nối nhiều VPC/on-prem |
| **VPN / Direct Connect** | Kết nối on-prem ↔ cloud |
| **Elastic IP / Static IP** | Public IP cố định |
| **ENI** | Elastic Network Interface — card mạng ảo |
| **ALB / NLB** | Application (L7) vs Network (L4) Load Balancer |
| **PrivateLink** | Truy cập service AWS không qua public internet |

```
                    Internet
                        │
                   ┌────▼────┐
                   │   IGW   │
                   └────┬────┘
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
    Public subnet   Public subnet   ...
    (ALB, Bastion)       │
          │              │
          └──────┬───────┘
                 ▼
          Private subnet
          (App, DB — no public IP)
                 │
            NAT Gateway → outbound only
```

---

## 10. Container & Kubernetes networking

| Khái niệm | Mô tả |
|----------|-------|
| **Container network namespace** | Mỗi container có stack IP riêng (Linux namespace) |
| **Bridge network** | Docker default — container trên virtual bridge |
| **Overlay network** | Multi-host container (Swarm, CNI overlay) |
| **Host network** | Container dùng network host — mất isolation |
| **CNI** | Container Network Interface — plugin gắn IP cho pod (Calico, Cilium, Flannel) |
| **Pod network** | Mỗi pod một IP — container trong pod share network |
| **Service (ClusterIP)** | Stable virtual IP + DNS → load balance tới pod |
| **NodePort** | Expose service qua port trên mọi node |
| **LoadBalancer** | Cloud LB provision cho service |
| **Ingress** | HTTP/S routing vào cluster (host/path, TLS) |
| **NetworkPolicy** | Firewall pod-to-pod (allow/deny label) |
| **kube-proxy** | iptables/IPVS — implement Service VIP |
| **Service mesh** | Sidecar proxy (Istio, Linkerd) — mTLS, observability, traffic policy |
| **DNS trong cluster** | `service.namespace.svc.cluster.local` |

---

## 11. Bảo mật mạng

| Khái niệm | Mô tả |
|----------|-------|
| **Firewall** | Lọc traffic theo IP, port, protocol |
| **Stateful vs stateless** | Stateful nhớ connection (SG); stateless rule từng gói (NACL) |
| **DMZ** | Vùng đệm giữa internet và mạng nội bộ |
| **Bastion / jump host** | Điểm vào SSH duy nhất vào private network |
| **Zero Trust** | Không tin mặc định mạng nội bộ — verify mọi request |
| **mTLS** | Xác thực service-to-service bằng certificate |
| **IP allowlist / denylist** | Chỉ cho phép IP tin cậy |
| **DDoS** | Tấn công làm cạn băng thông/tài nguyên — mitigation tại edge/LB |
| **Rate limiting** | Giới hạn request/IP/API key |
| **WAF** | Lọc HTTP attack pattern |
| **IDS / IPS** | Phát hiện / chặn xâm nhập |
| **VPN** | Tunnel mã hóa — remote access hoặc site-to-site |
| **WireGuard / IPsec** | Giao thức VPN phổ biến |

---

## 12. Hiệu năng & độ tin cậy

| Khái niệm | Mô tả |
|----------|-------|
| **Latency** | Thời gian một chiều / round-trip (RTT) |
| **Bandwidth** | Lượng data truyền được trên đơn vị thời gian |
| **Throughput** | Request/byte xử lý thực tế |
| **Packet loss** | % gói mất — TCP retransmit tăng latency |
| **Jitter** | Biến động latency — quan trọng voice/video |
| **Connection pool** | Tái sử dụng TCP connection tới DB/API — tránh handshake lặp |
| **DNS lookup latency** | Cache DNS, dùng IP nội bộ service discovery |
| **Keep-alive (HTTP)** | Tái sử dụng connection HTTP/1.1 |
| **Timeout** | Connect, read, write — tránh treo vô hạn |
| **Circuit breaker** | Ngắt gọi service lỗi — tránh cascade failure |
| **Retry + backoff** | Thử lại có exponential backoff + jitter |
| **Head-of-line blocking** | Request sau chờ request trước (HTTP/1.1 trên một connection) |

---

## 13. Service discovery & naming

| Khái niệm | Mô tả |
|----------|-------|
| **Static config** | IP/hostname hardcode hoặc env — đơn giản, kém linh hoạt |
| **DNS-based discovery** | `db.internal`, K8s service DNS |
| **Service registry** | Consul, Eureka, etcd — register/health/discover |
| **Client-side LB** | Client đọc danh sách instance và chọn (gRPC, Ribbon) |
| **Server-side LB** | LB/VIP phía trước pool instance |
| **Health check** | Registry/LB loại instance unhealthy |

---

## 14. Giao thức & công cụ hay gặp (tham chiếu nhanh)

| Giao thức / công cụ | Tầng | Ghi chú |
|---------------------|------|---------|
| **HTTP/HTTPS** | Application | API, web |
| **WebSocket** | Application | Real-time bidirectional |
| **gRPC** | Application | RPC, HTTP/2 + Protobuf |
| **AMQP / MQTT** | Application | Message queue IoT/pub-sub |
| **SMTP / IMAP** | Application | Email |
| **SSH** | Application | Remote shell, tunnel |
| **TCP / UDP** | Transport | |
| **TLS** | Session/Presentation | Mã hóa trên TCP |
| **QUIC** | Transport | HTTP/3, UDP-based |
| **IP** | Network | |
| **ARP** | Link | Resolve IP → MAC trong LAN |
| **curl / wget** | Tool | Test HTTP |
| **dig / nslookup** | Tool | Test DNS |
| **ping / traceroute** | Tool | ICMP path diagnostic |
| **tcpdump / Wireshark** | Tool | Capture & phân tích packet |
| **netstat / ss** | Tool | Socket, connection state |
| **iptables / nftables** | Tool | Linux firewall/NAT |

---

## 15. Trạng thái kết nối TCP (debug)

| State | Ý nghĩa |
|-------|---------|
| **LISTEN** | Server chờ connection |
| **SYN_SENT** | Client đã gửi SYN |
| **SYN_RECEIVED** | Server nhận SYN |
| **ESTABLISHED** | Kết nối đang hoạt động |
| **FIN_WAIT / CLOSE_WAIT** | Đang đóng |
| **TIME_WAIT** | Đã đóng, chờ 2MSL — nhiều connection ngắn → cạn port |

---

## 16. Checklist khi thiết kế / review mạng

```
□ Service nào cần public? Chỉ LB/API gateway — DB/Redis private
□ TLS terminate ở đâu? Cert renewal (Let's Encrypt, ACM)
□ DNS TTL & failover plan
□ CORS / cookie SameSite nếu FE-BE khác origin
□ Timeout & retry cho mọi outbound call
□ Connection pool size × replicas ≤ backend limit
□ Health check từ LB tới app thật (không chỉ TCP port mở)
□ Security group / NetworkPolicy least privilege
□ Log X-Forwarded-For / trace ID qua proxy
□ Rate limit & WAF cho endpoint public
```

---

## 17. Tóm tắt một câu

**Mạng backend** = client gọi qua **DNS → LB/reverse proxy (TLS) → app (HTTP/gRPC/WebSocket)** trên **TCP/IP**, trong **VPC/subnet** có **firewall**, data đi **private** giữa service, **pool connection** và **timeout/retry** cho outbound — scale và bảo mật bằng **L7 routing**, **mTLS/service mesh**, và **không expose** datastore ra internet.
