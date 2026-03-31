# Corgi Disaster Recovery Backup Service
FROM python:3.13-slim

WORKDIR /app

# Install PostgreSQL client tools (pg_dump, psql) and basic utilities
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       postgresql-client \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir poetry \
    && poetry config virtualenvs.create false

COPY pyproject.toml poetry.lock* ./
RUN poetry install --no-root --no-interaction

COPY backup.py ./

# Default: run on cron schedule
ENTRYPOINT ["python", "backup.py"]
CMD ["cron"]
