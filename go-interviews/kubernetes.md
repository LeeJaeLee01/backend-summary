# Kubernetes — Resource cơ bản

## Tóm tắt một câu

K8s orchestrate container — **Pod** chạy app, **Deployment** quản lý replica, **Service** expose network, **Ingress** HTTP routing, **ConfigMap/Secret** config, **HPA** auto scale.

---

## Kiến trúc tóm tắt

| Thành phần | Vai trò |
|------------|---------|
| **Control plane** | API server, scheduler, controller manager |
| **Node** | Worker chạy kubelet + container runtime |
| **etcd** | State cluster |

---

## Resource hay gặp

### Workload

| Resource | Mục đích |
|----------|----------|
| **Pod** | Đơn vị nhỏ nhất — 1+ container share network |
| **Deployment** | Declarative replica, rolling update, rollback |
| **StatefulSet** | Pod có identity ổn định (DB, Kafka) |
| **DaemonSet** | 1 pod mỗi node (agent, log collector) |
| **Job / CronJob** | Task chạy xong / theo lịch |

### Network

| Resource | Mục đích |
|----------|----------|
| **Service** | Stable IP/DNS tới pod (ClusterIP, NodePort, LoadBalancer) |
| **Ingress** | HTTP/S routing, TLS termination |
| **NetworkPolicy** | Firewall pod-to-pod |

### Config & storage

| Resource | Mục đích |
|----------|----------|
| **ConfigMap** | Config non-sensitive |
| **Secret** | Password, token (base64, encrypt at rest) |
| **PersistentVolumeClaim** | Disk gắn pod (stateful data) |

### Scale & resilience

| Resource | Mục đích |
|----------|----------|
| **HPA** | Scale replica theo CPU/memory/custom metric |
| **Resource requests/limits** | CPU/memory per container — scheduler + OOM kill |
| **Liveness / Readiness probe** | Restart unhealthy / không nhận traffic khi chưa sẵn sàng |

---

## Luồng request vào app

```
Internet → LoadBalancer/Ingress → Service → Pod (container :8080)
```

---

## Lệnh thường dùng

```bash
kubectl get pods,deploy,svc,ingress
kubectl describe pod <name>
kubectl logs <pod> -f
kubectl apply -f deployment.yaml
kubectl rollout undo deployment/myapp
```

---

## Câu trả lời ngắn (phỏng vấn)

Deployment quản lý Pod replica + rolling update. Service stable endpoint. Ingress route HTTP. ConfigMap/Secret inject env. HPA scale theo load. requests/limits + probes bắt buộc production. StatefulSet cho stateful workload.
