#!/bin/sh

# CRYONEL API Startup Script
# This script runs database migrations and then starts the API server

set -e

echo "🚀 Starting CRYONEL API..."

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
until pg_isready -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB"; do
  echo "Database is not ready yet. Waiting..."
  sleep 2
done
echo "✅ Database is ready!"

# Wait for Redis to be ready
echo "⏳ Waiting for Redis to be ready..."
if [ -n "$REDIS_PASSWORD" ]; then
  until redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" -a "$REDIS_PASSWORD" ping > /dev/null 2>&1; do
    echo "Redis is not ready yet. Waiting..."
    sleep 2
  done
else
  until redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" ping > /dev/null 2>&1; do
    echo "Redis is not ready yet. Waiting..."
    sleep 2
  done
fi
echo "✅ Redis is ready!"

# Skip migrations for now - just start the server
echo "⚠️  Skipping database migrations for now..."

# Start the API server
echo "🚀 Starting API server..."
exec node dist/server.js
