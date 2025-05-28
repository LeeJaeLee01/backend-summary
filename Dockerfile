# ===== Stage 1: Build (node_modules + build app) =====
FROM node:20-alpine AS builder

# Tạo thư mục làm việc
WORKDIR /app

# Copy package file trước để tối ưu cache
COPY package*.json ./

# Cài dependencies production-only (không dev)
RUN npm ci --omit=dev

# Copy toàn bộ source code
COPY . .

# Build app nếu dùng TypeScript hoặc Webpack
# RUN npm run build

# ===== Stage 2: Runtime - chỉ copy những gì cần =====
FROM node:20-alpine AS runner

# Tạo user không phải root vì bảo mật
RUN addgroup -S app && adduser -S app -G app

WORKDIR /app

# Copy node_modules và build từ stage trước
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Chạy với user thường
USER app

# Default command
CMD ["node", "dist/main.js"]
