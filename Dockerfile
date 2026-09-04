# Stage 1: Build frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Python runtime with built frontend
FROM python:3.11-slim
WORKDIR /app

COPY backend_fastapi/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend_fastapi/ ./backend_fastapi/
COPY --from=frontend-build /app/dist ./dist

ENV PYTHONPATH=/app/backend_fastapi
ENV PORT=8000
EXPOSE 8000

CMD ["sh", "-c", "uvicorn backend_fastapi.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
