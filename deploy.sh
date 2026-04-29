#!/bin/bash
# SSL Production Deployment Script

set -e

echo "🚀 Starting SSL Production Deployment..."

# Check if .env.prod exists
if [ ! -f .env.prod ]; then
    echo "❌ Error: .env.prod file not found!"
    echo "Please create .env.prod from .env.example"
    exit 1
fi

# Load environment variables
export $(grep -v '^#' .env.prod | xargs)

# Step 1: Build all services
echo "📦 Building production Docker images..."
docker-compose -f docker-compose.prod.yml build --parallel

# Step 2: Start infrastructure
echo "🗄️ Starting infrastructure services..."
docker-compose -f docker-compose.prod.yml up -d postgres redis kafka clickhouse zookeeper

echo "⏳ Waiting for infrastructure to be ready..."
sleep 30

# Step 3: Run database migrations
echo "🔄 Running database migrations..."
pnpm --filter @mtk/database migrate

# Step 4: Start all services
echo "🎯 Starting all microservices..."
docker-compose -f docker-compose.prod.yml up -d

# Step 5: Health checks
echo "🏥 Running health checks..."
sleep 10

SERVICES=("api-gateway:3000" "scoring-service:4000" "web:3001")
for service in "${SERVICES[@]}"; do
    IFS=':' read -r name port <<< "$service"
    if curl -sf "http://localhost:$port/health" > /dev/null 2>&1; then
        echo "✅ $name is healthy"
    else
        echo "⚠️ $name health check failed"
    fi
done

echo ""
echo "🎉 Deployment Complete!"
echo ""
echo "📊 Service Status:"
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "🔗 Access Points:"
echo "  - Web App:      http://localhost:3001"
echo "  - API Gateway:  http://localhost:3000"
echo "  - Scoring WS:   ws://localhost:4001"
echo ""
echo "📋 Useful Commands:"
echo "  - View logs:    docker-compose -f docker-compose.prod.yml logs -f [service]"
echo "  - Stop all:     docker-compose -f docker-compose.prod.yml down"
echo "  - Restart:      docker-compose -f docker-compose.prod.yml restart [service]"
