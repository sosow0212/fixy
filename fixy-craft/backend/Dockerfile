# Python
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# 시스템 의존성 (pandas/neo4j wheel 헤더 등)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 의존성 먼저 복사 → 레이어 캐시 활용
COPY pyproject.toml ./
RUN pip install --upgrade pip && \
    pip install \
    "fastapi>=0.115" \
    "uvicorn[standard]>=0.32" \
    "pydantic>=2.9" \
    "pydantic-settings>=2.6" \
    "motor>=3.6" \
    "beanie>=1.27" \
    "neo4j>=5.25" \
    "python-multipart>=0.0.12" \
    "httpx>=0.27" \
    && pip install -e .

COPY app ./app
RUN mkdir -p /data/uploads

EXPOSE 8000

# uvicorn 직접 기동 (lifespan에서 Beanie + Neo4j 제약 초기화)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
