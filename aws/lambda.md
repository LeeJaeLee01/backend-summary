# AWS Lambda — Triển khai service Node.js (JavaScript)

Hướng dẫn viết và **deploy** một Lambda function bằng **JavaScript (Node.js)** trên AWS — từ code local tới production.

> Runtime khuyến nghị: **Node.js 20.x** (LTS). Ví dụ dùng **AWS SAM** (chính thức, IaC) và **AWS CLI** (nhanh, học thử).

---

## 1. Lambda là gì?

```
Client / API Gateway / SQS / S3 / EventBridge
                    │
                    ▼ event
            ┌───────────────┐
            │ Lambda        │  ← chạy code JS, scale tự động
            │ (Node.js 20)  │
            └───────┬───────┘
                    │
        ┌───────────┼───────────┐
        ▼           ▼           ▼
     RDS/API     DynamoDB     S3
```

| Đặc điểm | Giải thích |
|----------|------------|
| **Serverless** | Không quản lý EC2 — AWS lo scale |
| **Pay per use** | Tính theo số lần invoke + thời gian chạy (GB-second) |
| **Event-driven** | Trigger từ API Gateway, SQS, cron (EventBridge), S3 upload… |
| **Giới hạn** | Timeout tối đa 15 phút; package zip 50MB (direct), 250MB (S3) |

**Khi nào dùng Lambda:**

- API nhẹ / BFF, webhook, xử lý file upload, consumer queue
- Traffic không đều — scale 0 khi idle

**Khi nào không dùng:**

- WebSocket dài, connection pool DB nặng, process > 15 phút, latency cực thấp ổn định (cold start)

---

## 2. Cấu trúc project (JavaScript)

```
my-lambda-service/
├── src/
│   └── handler.js          # entry point
├── package.json
├── template.yaml           # AWS SAM (IaC)
├── samconfig.toml          # deploy config
└── .github/workflows/
    └── deploy-lambda.yml   # CI/CD (optional)
```

### `package.json`

```json
{
  "name": "my-lambda-service",
  "version": "1.0.0",
  "type": "module",
  "main": "src/handler.js",
  "engines": { "node": ">=20" },
  "scripts": {
    "test": "node --test",
    "build": "npm ci --omit=dev && cp -r src node_modules dist/ 2>/dev/null || true",
    "local": "sam local start-api"
  },
  "dependencies": {
    "@aws-sdk/client-dynamodb": "^3.700.0"
  }
}
```

> Lambda Node.js 20 hỗ trợ **ES modules** (`"type": "module"`). Handler export: `export const handler = async (event) => { ... }`.

---

## 3. Code handler — các pattern phổ biến

### 3.1. API Gateway (HTTP API)

```javascript
// src/handler.js

/**
 * @param {import('aws-lambda').APIGatewayProxyEventV2} event
 * @param {import('aws-lambda').Context} context
 */
export const handler = async (event, context) => {
  // Tắt chờ event loop — giảm bill khi dùng connection còn treo
  context.callbackWaitsForEmptyEventLoop = false;

  const method = event.requestContext?.http?.method ?? event.httpMethod;
  const path = event.rawPath ?? event.path;

  if (method === 'GET' && path === '/health') {
    return json(200, { status: 'ok', requestId: context.awsRequestId });
  }

  if (method === 'POST' && path === '/orders') {
    const body = JSON.parse(event.body ?? '{}');
    // business logic...
    return json(201, { id: 'ord_123', ...body });
  }

  return json(404, { message: 'Not Found' });
};

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify(body),
  };
}
```

### 3.2. SQS consumer (batch)

```javascript
// src/sqs-handler.js
export const handler = async (event) => {
  const failures = [];

  for (const record of event.Records) {
    try {
      const payload = JSON.parse(record.body);
      await processMessage(payload);
    } catch (err) {
      console.error('Failed message', record.messageId, err);
      failures.push({ itemIdentifier: record.messageId });
    }
  }

  // partial batch failure — chỉ retry message lỗi
  return { batchItemFailures: failures };
};

async function processMessage(payload) {
  // ...
}
```

### 3.3. Best practice trong handler

```
□ context.callbackWaitsForEmptyEventLoop = false khi không cần chờ I/O nền
□ Log có structure: console.log(JSON.stringify({ level, msg, requestId }))
□ Không lưu state trong biến global (trừ cache có TTL / connection reuse có kiểm soát)
□ Validate input — không tin event.body
□ Secret lấy từ env / SSM Parameter Store / Secrets Manager — không hardcode
□ Timeout handler < timeout Lambda (để còn thời gian cleanup)
```

---

## 4. Deploy — Cách 1: AWS SAM (khuyến nghị)

**SAM** = CloudFormation + syntax gọn cho Lambda, API Gateway, IAM.

### 4.1. Cài đặt

```bash
# AWS CLI
aws --version

# SAM CLI — https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html
sam --version
```

Cấu hình credential:

```bash
aws configure
# AWS Access Key ID, Secret, region (vd. ap-southeast-1)
```

### 4.2. `template.yaml`

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Description: my-lambda-service

Globals:
  Function:
    Runtime: nodejs20.x
    Timeout: 30
    MemorySize: 256
    Architectures:
      - arm64          # Graviton — rẻ hơn, đủ nhanh cho hầu hết API
    Environment:
      Variables:
        NODE_ENV: production
        TABLE_NAME: !Ref OrdersTable

Resources:
  HttpApi:
    Type: AWS::Serverless::HttpApi
    Properties:
      CorsConfiguration:
        AllowOrigins: ['*']
        AllowMethods: ['GET', 'POST', 'OPTIONS']
        AllowHeaders: ['Content-Type', 'Authorization']

  ApiFunction:
    Type: AWS::Serverless::Function
    Properties:
      Handler: src/handler.handler
      CodeUri: .
      Events:
        CatchAll:
          Type: HttpApi
          Properties:
            ApiId: !Ref HttpApi
            Path: /{proxy+}
            Method: ANY
        Health:
          Type: HttpApi
          Properties:
            ApiId: !Ref HttpApi
            Path: /health
            Method: GET
      Policies:
        - DynamoDBCrudPolicy:
            TableName: !Ref OrdersTable

  OrdersTable:
    Type: AWS::DynamoDB::Table
    Properties:
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: pk
          AttributeType: S
      KeySchema:
        - AttributeName: pk
          KeyType: HASH

Outputs:
  ApiUrl:
    Description: HTTP API endpoint
    Value: !Sub 'https://${HttpApi}.execute-api.${AWS::Region}.amazonaws.com'
  FunctionArn:
    Value: !GetAtt ApiFunction.Arn
```

### 4.3. Build & deploy

```bash
cd my-lambda-service

# Cài dependency production
npm ci --omit=dev

# Build (SAM tự zip CodeUri)
sam build

# Deploy lần đầu — guided (tạo S3 bucket deploy, stack name)
sam deploy --guided

# Lần sau
sam deploy
```

`sam deploy --guided` hỏi:

| Prompt | Gợi ý |
|--------|-------|
| Stack name | `my-lambda-service-dev` |
| Region | `ap-southeast-1` |
| Confirm changes | `y` |
| Allow IAM role creation | `y` |
| Save to samconfig.toml | `y` |

Sau deploy, lấy URL:

```bash
aws cloudformation describe-stacks \
  --stack-name my-lambda-service-dev \
  --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" \
  --output text
```

Test:

```bash
curl https://xxxx.execute-api.ap-southeast-1.amazonaws.com/health
```

### 4.4. Chạy local

```bash
sam local start-api
curl http://127.0.0.1:3000/health
```

---

## 5. Deploy — Cách 2: AWS CLI + zip (nhanh, học thử)

Phù hợp function đơn giản, chưa cần IaC.

### 5.1. Đóng gói

```bash
cd my-lambda-service
npm ci --omit=dev
zip -r function.zip src/ node_modules/ package.json
```

> Zip phải có `handler` đúng path: file `src/handler.js`, export `handler` → config `src/handler.handler`.

### 5.2. Tạo execution role (lần đầu)

```bash
# Trust policy — Lambda được assume role
cat > trust-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Service": "lambda.amazonaws.com" },
    "Action": "sts:AssumeRole"
  }]
}
EOF

aws iam create-role \
  --role-name my-lambda-exec-role \
  --assume-role-policy-document file://trust-policy.json

aws iam attach-role-policy \
  --role-name my-lambda-exec-role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

# Lấy ARN role
aws iam get-role --role-name my-lambda-exec-role --query Role.Arn --output text
```

### 5.3. Tạo / cập nhật function

```bash
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ROLE_ARN="arn:aws:iam::${ACCOUNT_ID}:role/my-lambda-exec-role"
REGION=ap-southeast-1

# Tạo mới
aws lambda create-function \
  --function-name my-api-handler \
  --runtime nodejs20.x \
  --role "$ROLE_ARN" \
  --handler src/handler.handler \
  --zip-file fileb://function.zip \
  --timeout 30 \
  --memory-size 256 \
  --architectures arm64 \
  --region "$REGION"

# Cập nhật code (lần sau)
aws lambda update-function-code \
  --function-name my-api-handler \
  --zip-file fileb://function.zip \
  --region "$REGION"
```

### 5.4. Gắn API Gateway (HTTP API)

```bash
# Tạo HTTP API
API_ID=$(aws apigatewayv2 create-api \
  --name my-lambda-api \
  --protocol-type HTTP \
  --query ApiId --output text)

# Lambda integration
INTEGRATION_ID=$(aws apigatewayv2 create-integration \
  --api-id "$API_ID" \
  --integration-type AWS_PROXY \
  --integration-uri "arn:aws:lambda:${REGION}:${ACCOUNT_ID}:function:my-api-handler" \
  --payload-format-version 2.0 \
  --query IntegrationId --output text)

aws apigatewayv2 create-route \
  --api-id "$API_ID" \
  --route-key 'ANY /{proxy+}' \
  --target "integrations/${INTEGRATION_ID}"

aws lambda add-permission \
  --function-name my-api-handler \
  --statement-id apigw-invoke \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --source-arn "arn:aws:execute-api:${REGION}:${ACCOUNT_ID}:${API_ID}/*/*"

aws apigatewayv2 create-stage \
  --api-id "$API_ID" \
  --stage-name '$default' \
  --auto-deploy

echo "https://${API_ID}.execute-api.${REGION}.amazonaws.com"
```

---

## 6. Deploy — Cách 3: CI/CD (GitHub Actions)

```yaml
# .github/workflows/deploy-lambda.yml
name: Deploy Lambda

on:
  push:
    branches: [main]
    paths: ['my-lambda-service/**']

permissions:
  id-token: write   # OIDC — không lưu long-lived access key
  contents: read

jobs:
  deploy:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: my-lambda-service

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: npm
          cache-dependency-path: my-lambda-service/package-lock.json

      - name: Configure AWS (OIDC)
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789012:role/github-actions-lambda-deploy
          aws-region: ap-southeast-1

      - run: npm ci --omit=dev

      - uses: aws-actions/setup-sam@v2

      - run: sam build
      - run: sam deploy --no-confirm-changeset --no-fail-on-empty-changeset
```

**OIDC role** trên AWS (tóm tắt): trust `token.actions.githubusercontent.com`, condition repo/branch — an toàn hơn access key trong GitHub Secrets.

---

## 7. Cấu hình quan trọng sau deploy

### 7.1. Environment variables

```bash
aws lambda update-function-configuration \
  --function-name my-api-handler \
  --environment "Variables={NODE_ENV=production,API_BASE=https://api.example.com}"
```

Secret nhạy cảm → **Secrets Manager** hoặc **SSM Parameter Store**:

```javascript
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const client = new SecretsManagerClient({});
let cachedDbUrl;

export async function getDbUrl() {
  if (!cachedDbUrl) {
    const res = await client.send(
      new GetSecretValueCommand({ SecretId: process.env.DB_SECRET_ARN }),
    );
    cachedDbUrl = JSON.parse(res.SecretString).url;
  }
  return cachedDbUrl;
}
```

### 7.2. IAM — least privilege

```yaml
# SAM — chỉ quyền cần thiết
Policies:
  - DynamoDBCrudPolicy:
      TableName: !Ref OrdersTable
  - S3ReadPolicy:
      BucketName: my-uploads-bucket
  # Không dùng AdministratorAccess
```

### 7.3. VPC (khi cần RDS private)

```
□ Lambda trong VPC subnet private
□ Security group: outbound tới RDS port 5432
□ Trade-off: cold start chậm hơn (ENI setup)
□ Dùng RDS Proxy giảm connection storm
```

### 7.4. Monitoring

| Tool | Dùng cho |
|------|----------|
| **CloudWatch Logs** | Log tự động từ `console.log` |
| **CloudWatch Metrics** | Invocations, Errors, Duration, Throttles |
| **X-Ray** | Trace distributed (bật `Tracing: Active` trong SAM) |
| **Alarm** | `Errors > 0` trong 5 phút → SNS alert |

```bash
aws logs tail /aws/lambda/my-api-handler --follow
```

---

## 8. Lambda Layer (dependency nặng)

Khi `node_modules` lớn, tách layer để deploy code nhanh hơn:

```bash
mkdir -p layer/nodejs
cp -r node_modules layer/nodejs/
cd layer && zip -r ../layer.zip .

aws lambda publish-layer-version \
  --layer-name my-deps \
  --zip-file fileb://layer.zip \
  --compatible-runtimes nodejs20.x

aws lambda update-function-configuration \
  --function-name my-api-handler \
  --layers arn:aws:lambda:ap-southeast-1:ACCOUNT:layer:my-deps:1
```

---

## 9. Checklist triển khai production

```
□ Runtime nodejs20.x, architecture arm64 (trừ khi cần x86 lib native)
□ Handler path đúng: file.exportName
□ IAM least privilege — không admin
□ Secret không nằm trong zip / env plain text repo
□ Timeout + memory tune (test với load thực)
□ API Gateway: auth (JWT authorizer / Cognito) nếu public
□ CORS cấu hình đúng origin production
□ Dead letter queue (DLQ) cho async Lambda (SQS trigger)
□ Reserved concurrency nếu cần giới hạn blast radius
□ IaC (SAM/CDK/Terraform) — không chỉnh tay Console
□ CI/CD deploy qua OIDC
```

---

## 10. So sánh cách deploy

| Cách | Ưu | Nhược | Khi dùng |
|------|-----|-------|----------|
| **SAM / CDK** | IaC, reproduce, review PR | Học curve ban đầu | Production, team |
| **AWS CLI + zip** | Nhanh, đơn giản | Khó maintain, drift | POC, học |
| **Console** | Click thử | Không version control | Demo 1 lần |
| **Serverless Framework** | DX tốt, plugin nhiều | Thêm abstraction | Team quen Serverless |

---

## 11. Luồng end-to-end (tóm tắt)

```
1. Viết handler.js + package.json
2. sam build / zip
3. sam deploy (tạo Lambda + API Gateway + IAM + DynamoDB...)
4. Test endpoint /health
5. Gắn CI/CD push main → auto deploy
6. Monitor CloudWatch + alarm
```

---

## Liên quan

| File | Nội dung |
|------|----------|
| [sqs.md](./sqs.md) | Queue trigger Lambda |
| [sns.md](./sns.md) | Fan-out event |
| [ecr.md](./ecr.md) | Container image Lambda (alternative to zip) |
| [design-sys/csrf-sso-oauth-state.md](../design-sys/csrf-sso-oauth-state.md) | Bảo mật API public |

---

*Tài liệu tham khảo: [AWS Lambda Node.js](https://docs.aws.amazon.com/lambda/latest/dg/lambda-nodejs.html), [AWS SAM](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/what-is-sam.html).*
