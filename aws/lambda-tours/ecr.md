# Lambda Container Image (ECR)

> Deploy Lambda bằng **Docker image** từ **Amazon ECR** thay vì zip — phù hợp dependency nặng, binary native, team đã có pipeline Docker.

Khác ECR cho ECS/EC2 deploy: [`../index.md`](../index.md) §4.1.

---

## 1. Zip vs Container image

| | **Zip package** | **Container image** |
|---|-----------------|---------------------|
| Giới hạn size | 250 MB unzipped | **10 GB** image |
| Dependency | Layer hoặc bundle trong zip | Full filesystem trong image |
| Native binary | Khó (phải build đúng arch) | Dockerfile `RUN apt-get` / copy binary |
| CI/CD | `sam build`, zip | `docker build` → `docker push` ECR |
| Cold start | Thường nhanh hơn (nhỏ) | Có thể chậm hơn (pull layer) |

**Khi dùng image:**
- Image > 250 MB, ML model, Chromium/Puppeteer, ImageMagick
- Cần OS package không có trong Lambda runtime
- Chuẩn hóa cùng image local / ECS / Lambda

**Khi dùng zip:**
- API Node.js nhẹ, SAM nhanh, cold start thấp

---

## 2. Kiến trúc

```
Dockerfile ──build──► docker push ──► ECR Repository
                                         │
                                         ▼
                              Lambda (PackageType: Image)
                                         │
                              aws lambda update-function-code
                              (ImageUri)
```

Lambda pull image từ ECR trong cùng account/region (hoặc cross-account với policy).

---

## 3. Dockerfile (Node.js)

AWS cung cấp **base image** — bắt buộc implement **Lambda Runtime Interface Client (RIC)**.

```dockerfile
# Dockerfile
FROM public.ecr.aws/lambda/nodejs:20

# Copy dependency manifest trước — cache layer
COPY package*.json ${LAMBDA_TASK_ROOT}/
RUN npm ci --omit=dev

COPY src/ ${LAMBDA_TASK_ROOT}/src/

# CMD = file.export — handler
CMD ["src/handler.handler"]
```

```javascript
// src/handler.js
export const handler = async (event) => {
  return {
    statusCode: 200,
    body: JSON.stringify({ ok: true, requestId: event.requestContext?.requestId }),
  };
};
```

**Base images:** `public.ecr.aws/lambda/nodejs:20`, `python:3.12`, `java:21`…

Custom runtime (non-AWS base): cài `aws-lambda-ric` — phức tạp hơn, ít dùng.

---

## 4. Build & push ECR

```bash
REGION=ap-southeast-1
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REPO=my-lambda-api
IMAGE_URI="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${REPO}:latest"

# Tạo repo (lần đầu)
aws ecr create-repository \
  --repository-name "$REPO" \
  --image-scanning-configuration scanOnPush=true \
  --region "$REGION"

# Login
aws ecr get-login-password --region "$REGION" \
  | docker login --username AWS --password-stdin "${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com"

# Build — bắt buộc platform linux/arm64 hoặc amd64 khớp Lambda arch
docker build --platform linux/arm64 -t "$REPO" .
docker tag "$REPO:latest" "$IMAGE_URI"
docker push "$IMAGE_URI"
```

---

## 5. Tạo / cập nhật Lambda function

```bash
ROLE_ARN=arn:aws:iam::123456789:role/my-lambda-exec-role

# Tạo mới
aws lambda create-function \
  --function-name my-api-container \
  --package-type Image \
  --code ImageUri="$IMAGE_URI" \
  --role "$ROLE_ARN" \
  --timeout 30 \
  --memory-size 512 \
  --architectures arm64 \
  --region "$REGION"

# Deploy version mới
aws lambda update-function-code \
  --function-name my-api-container \
  --image-uri "$IMAGE_URI" \
  --region "$REGION"
```

**Architecture:** Image build `arm64` → Lambda `--architectures arm64` (Graviton, rẻ hơn).

---

## 6. SAM template

```yaml
ApiFunction:
  Type: AWS::Serverless::Function
  Properties:
    PackageType: Image
    Architectures:
      - arm64
    Timeout: 30
    MemorySize: 512
    Events:
      Api:
        Type: HttpApi
        Properties:
          Path: /{proxy+}
          Method: ANY
    Metadata:
      DockerTag: latest
      DockerContext: .
      Dockerfile: Dockerfile

  # ImageUri build từ sam build (container)
```

```bash
sam build
sam deploy --guided
```

`sam build` build Docker image locally (hoặc `--use-container`).

---

## 7. CI/CD (GitHub Actions)

```yaml
- name: Configure AWS
  uses: aws-actions/configure-aws-credentials@v4
  with:
    role-to-assume: arn:aws:iam::123456789012:role/github-actions-lambda
    aws-region: ap-southeast-1

- name: Login ECR
  uses: aws-actions/amazon-ecr-login@v2

- name: Build and push
  env:
    IMAGE_URI: ${{ steps.login.outputs.registry }}/my-lambda-api:${{ github.sha }}
  run: |
    docker build --platform linux/arm64 -t "$IMAGE_URI" .
    docker push "$IMAGE_URI"
    echo "IMAGE_URI=$IMAGE_URI" >> "$GITHUB_ENV"

- name: Update Lambda
  run: |
    aws lambda update-function-code \
      --function-name my-api-container \
      --image-uri "$IMAGE_URI"
```

Pattern tương tự Release → ECR trong monorepo — khác ở bước cuối gọi `update-function-code` thay vì deploy EC2.

---

## 8. IAM

**Lambda execution role** — giống zip (CloudWatch, DynamoDB…).

**ECR pull:** Lambda service pull image — cần policy ECR trên **Lambda service** (AWS tự xử lý same-account). Cross-account: resource policy trên ECR repo.

CI role cần:

```json
{
  "Effect": "Allow",
  "Action": [
    "ecr:GetAuthorizationToken",
    "ecr:BatchCheckLayerAvailability",
    "ecr:PutImage",
    "ecr:InitiateLayerUpload",
    "ecr:UploadLayerPart",
    "ecr:CompleteLayerUpload"
  ],
  "Resource": "*"
}
```

---

## 9. Tối ưu image Lambda

```
□ Multi-stage build — bỏ build tools khỏi image cuối
□ .dockerignore — node_modules local, test, .git
□ npm ci --omit=dev
□ Một process — Lambda không chạy docker-compose
□ Platform build khớp Lambda arch (arm64)
□ Image scan (ECR scanOnPush) — CVE
□ Tag immutable (sha) — rollback dễ
```

Cold start image: xem [`cold-start-scale.md`](./cold-start-scale.md).

---

## 10. So sánh với Lambda Layer

| | **Layer** | **Container image** |
|---|-----------|---------------------|
| Size | Chung 250 MB với code | 10 GB |
| Share deps nhiều function | Có — publish layer | Copy trong mỗi image |
| Tooling | zip + attach layer | Docker ecosystem |

Layer phù hợp deps Node.js chia sẻ; image phù hợp OS-level dependency.

---

## 11. Checklist

```
□ Base image AWS official (nodejs/python…)
□ CMD đúng handler path
□ Platform linux/arm64 hoặc amd64 khớp config
□ ECR repo + scan on push
□ CI: build → push → update-function-code
□ Không chạy daemon trong container
□ Test local: docker run -p 9000:8080 image → curl POST event
```

**Test local với RIC:**

```bash
docker build -t my-lambda .
docker run -p 9000:8080 my-lambda

curl -XPOST "http://localhost:9000/2015-03-31/functions/function/invocations" \
  -d '{"rawPath":"/health","requestContext":{"http":{"method":"GET"}}}'
```

---

## Liên quan

| File | Nội dung |
|------|----------|
| [`lambda.md`](./lambda.md) | Deploy zip, SAM |
| [`cold-start-scale.md`](./cold-start-scale.md) | Cold start optimization |
| [`../index.md`](../index.md) | ECR push cho ECS deploy |
