# SSL Production Deployment Guide

Complete step-by-step guide to deploy Shakir Super League (SSL) to production.

**Estimated Time:** 30-45 minutes  
**Difficulty:** Intermediate  
**Prerequisites:** Docker, Docker Compose, PowerShell/Terminal

---

## Table of Contents

1. [Pre-Deployment Checklist](#step-1-pre-deployment-checklist)
2. [Choose Your Database](#step-2-choose-your-database)
3. [Configure Environment](#step-3-configure-environment)
4. [Build Production Images](#step-4-build-production-images)
5. [Deploy Infrastructure](#step-5-deploy-infrastructure)
6. [Run Database Migrations](#step-6-run-database-migrations)
7. [Start All Services](#step-7-start-all-services)
8. [Verify Deployment](#step-8-verify-deployment)
9. [Configure Domain & SSL](#step-9-configure-domain--ssl-optional)
10. [Post-Deployment Tasks](#step-10-post-deployment-tasks)
11. [Troubleshooting](#troubleshooting)

---

## Step 1: Pre-Deployment Checklist

Before you begin, ensure you have:

- [ ] **Docker Desktop** installed and running
  ```powershell
  docker --version  # Should show 24.x or higher
  docker-compose --version  # Should show 2.x or higher
  ```

- [ ] **pnpm** installed
  ```powershell
  pnpm --version  # Should show 9.x
  ```

- [ ] **Git repository cloned**
  ```powershell
  cd d:\MalikTech\mtk-ssl
  git status  # Should show clean working tree
  ```

- [ ] **Minimum 4GB RAM free** (check in Task Manager)

- [ ] **Ports available:** 3000, 3001, 4000, 4001, 5432, 6379, 9092
  ```powershell
  # Check if ports are in use
  Get-NetTCPConnection -LocalPort 3000,3001,4000,5432,6379 -ErrorAction SilentlyContinue
  ```

---

## Step 2: Choose Your Database

### Option A: Supabase (Recommended for Production)

**Best for:** Most users, zero maintenance, scales automatically

```powershell
# 1. Sign up at https://supabase.com
# 2. Create new project
# 3. Choose region (Mumbai for Pakistan users, East US for global)
# 4. Copy these values from Project Settings:

SUPABASE_URL=https://xxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...
DATABASE_URL=postgresql://postgres.xxxxxxx:[password]@aws-0-xxxxx.pooler.supabase.com:5432/postgres
```

**Pros:** Managed, backups, free tier (500MB), connection pooling  
**Cons:** 60 connection limit on free tier

---

### Option B: Self-Hosted PostgreSQL (Docker)

**Best for:** Full control, high connection counts

**Pros:** Unlimited connections, no bandwidth limits  
**Cons:** You manage backups and maintenance

**We'll configure this in Step 3.**

---

## Step 3: Configure Environment

### 3.1 Create Production Environment File

```powershell
cd d:\MalikTech\mtk-ssl

# Copy example to production file
copy .env.example .env.prod

# Edit with your values
notepad .env.prod
```

### 3.2 Minimum Required Variables (MVP)

Fill in these **required** variables in `.env.prod`:

```env
# ============================================
# REQUIRED: Database
# ============================================

# Option A: Supabase (RECOMMENDED)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
DATABASE_URL=postgresql://postgres.[ref]:[pass]@aws-0-xxxxx.pooler.supabase.com:5432/postgres

# Option B: Self-hosted (fill if NOT using Supabase)
POSTGRES_USER=ssl
POSTGRES_PASSWORD=your_secure_password_here  # Generate: openssl rand -base64 32
POSTGRES_DB=ssl_prod
DATABASE_URL=postgresql://ssl:${POSTGRES_PASSWORD}@postgres:5432/ssl_prod

# ============================================
# REQUIRED: Authentication (Clerk)
# Get from https://dashboard.clerk.com
# ============================================
CLERK_SECRET_KEY=sk_live_your_key_here
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_your_key_here

# ============================================
# REQUIRED: Payments (Stripe)
# Get from https://dashboard.stripe.com/apikeys
# ============================================
STRIPE_SECRET_KEY=sk_live_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# ============================================
# REQUIRED: Redis
# ============================================
REDIS_URL=redis://redis:6379

# ============================================
# REQUIRED: Kafka
# ============================================
KAFKA_BROKERS=kafka:29092
```

### 3.3 Optional but Recommended Variables

```env
# AI Commentary (OpenAI) - https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-your_key_here

# Analytics (ClickHouse)
CLICKHOUSE_USER=ssl
CLICKHOUSE_PASSWORD=your_password_here

# Push Notifications (Firebase) - https://console.firebase.google.com
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Error Tracking (Sentry) - https://sentry.io
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx

# Frontend URLs
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_WS_URL=wss://ws.yourdomain.com
```

### 3.4 Save and Close

Save `.env.prod` and close the editor.

---

## Step 4: Build Production Images

### 4.1 Install Dependencies

```powershell
cd d:\MalikTech\mtk-ssl
pnpm install
```

### 4.2 Build All Docker Images

```powershell
# Build all services (this takes 5-10 minutes)
docker-compose -f docker-compose.prod.yml build

# Or build specific services only
# docker-compose -f docker-compose.prod.yml build api-gateway scoring-service web
```

**Expected Output:**
```
[+] Building 156.3s (25/25) FINISHED
 => [api-gateway builder 7/7] RUN pnpm build
 => [scoring-service builder 7/7] RUN pnpm build
 => [web builder 8/8] RUN pnpm build
```

---

## Step 5: Deploy Infrastructure

### 5.1 Start Infrastructure Services

```powershell
# Start databases, cache, and message broker
docker-compose -f docker-compose.prod.yml up -d postgres redis kafka clickhouse zookeeper

# If using Supabase, skip postgres:
# docker-compose -f docker-compose.prod.yml up -d redis kafka clickhouse zookeeper
```

### 5.2 Wait for Services to Be Ready

```powershell
# Check status (wait until all show "healthy")
docker-compose -f docker-compose.prod.yml ps

# Should see:
# ssl-prod-postgres    healthy
# ssl-prod-redis       healthy
# ssl-prod-kafka       healthy
```

Wait approximately **30 seconds** for all services to initialize.

### 5.3 Verify Database Connectivity

```powershell
# Test PostgreSQL connection (skip if using Supabase)
docker exec ssl-prod-postgres pg_isready -U ssl

# Should return: /var/run/postgresql:5432 - accepting connections
```

---

## Step 6: Run Database Migrations

### 6.1 Push Schema to Database

```powershell
# Run Drizzle migrations
pnpm --filter @mtk/database migrate

# OR if using Supabase CLI
supabase db push
```

### 6.2 Verify Tables Created

```powershell
# Check tables exist (for self-hosted)
docker exec ssl-prod-postgres psql -U ssl -d ssl_prod -c "\dt"

# Should show tables: users, teams, matches, players, ball_events, etc.
```

---

## Step 7: Start All Services

### 7.1 Deploy Microservices

```powershell
# Start all services in detached mode
docker-compose -f docker-compose.prod.yml up -d

# This starts: api-gateway, scoring-service, tournament-service, 
# payment-service, auth-service, notification-service, web, nginx
```

### 7.2 Check Service Status

```powershell
# View all running containers
docker-compose -f docker-compose.prod.yml ps

# Expected output - all should show "Up":
# ssl-prod-api-gateway        Up 10 seconds   0.0.0.0:3000->3000
# ssl-prod-scoring-service    Up 10 seconds   0.0.0.0:4000->4000, 0.0.0.0:4001->4001
# ssl-prod-web                Up 10 seconds   0.0.0.0:3001->3000
# etc.
```

---

## Step 8: Verify Deployment

### 8.1 Health Check - API Gateway

```powershell
# Test API health
curl http://localhost:3000/api/v1/health

# Expected: {"status":"ok","timestamp":"2024-..."}
```

### 8.2 Health Check - Scoring Service

```powershell
# Test scoring service
curl http://localhost:4000/health

# Expected: {"status":"healthy","service":"scoring-service"}
```

### 8.3 Health Check - Web App

```powershell
# Test web app
curl -I http://localhost:3001

# Expected: HTTP/1.1 200 OK
```

### 8.4 Test WebSocket Connection

```powershell
# Test WebSocket (install wscat if needed: npm install -g wscat)
wscat -c ws://localhost:4001

# Should connect successfully
```

### 8.5 Open in Browser

Navigate to:
- **Web App:** http://localhost:3001
- **API Docs:** http://localhost:3000/api/v1/docs (if available)
- **API Gateway:** http://localhost:3000

---

## Step 9: Configure Domain & SSL (Optional)

If you have a domain name, configure Nginx reverse proxy:

### 9.1 Get SSL Certificates

```powershell
# Using Let's Encrypt (Certbot)
# Install certbot first, then:
certbot certonly --standalone -d yourdomain.com -d api.yourdomain.com -d ws.yourdomain.com

# Copy certificates to nginx folder
mkdir -p d:\MalikTech\mtk-ssl\nginx\ssl
copy C:\Certbot\live\yourdomain.com\fullchain.pem d:\MalikTech\mtk-ssl\nginx\ssl\cert.pem
copy C:\Certbot\live\yourdomain.com\privkey.pem d:\MalikTech\mtk-ssl\nginx\ssl\key.pem
```

### 9.2 Update Nginx Configuration

Edit `nginx/nginx.conf`:

```nginx
server_name yourdomain.com;  # Change from localhost

ssl_certificate /etc/nginx/ssl/cert.pem;
ssl_certificate_key /etc/nginx/ssl/key.pem;
```

### 9.3 Restart Nginx

```powershell
docker-compose -f docker-compose.prod.yml restart nginx
```

---

## Step 10: Post-Deployment Tasks

### 10.1 Create Admin User

```powershell
# Access auth service
docker exec -it ssl-prod-auth-service sh

# Or use API to create first admin
curl -X POST http://localhost:3000/api/v1/auth/setup \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@yourdomain.com","password":"securepassword"}'
```

### 10.2 Configure Stripe Webhook

1. Go to https://dashboard.stripe.com/webhooks
2. Add endpoint: `https://api.yourdomain.com/payments/webhook`
3. Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
4. Copy webhook secret to `.env.prod`: `STRIPE_WEBHOOK_SECRET`
5. Restart payment service:
   ```powershell
   docker-compose -f docker-compose.prod.yml restart payment-service
   ```

### 10.3 Set Up Backups (Self-Hosted Only)

```powershell
# Create backup script
mkdir -p d:\MalikTech\mtk-ssl\backups

# Add to Windows Task Scheduler or cron
docker exec ssl-prod-postgres pg_dump -U ssl ssl_prod > d:\MalikTech\mtk-ssl\backups\backup_%date:~-4,4%%date:~-10,2%%date:~-7,2%.sql
```

### 10.4 Enable Monitoring

```powershell
# View logs
docker-compose -f docker-compose.prod.yml logs -f api-gateway
docker-compose -f docker-compose.prod.yml logs -f scoring-service

# Monitor resource usage
docker stats
```

---

## Troubleshooting

### Issue: "Port already in use"

```powershell
# Find process using port
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess

# Stop the process or change port in docker-compose.prod.yml
```

### Issue: "Database connection refused"

```powershell
# Check if Postgres is running
docker-compose -f docker-compose.prod.yml ps postgres

# View Postgres logs
docker-compose -f docker-compose.prod.yml logs postgres

# Restart Postgres
docker-compose -f docker-compose.prod.yml restart postgres
```

### Issue: "Service unhealthy"

```powershell
# Check specific service logs
docker-compose -f docker-compose.prod.yml logs scoring-service

# Restart service
docker-compose -f docker-compose.prod.yml restart scoring-service
```

### Issue: "Build failed"

```powershell
# Clean build cache
docker-compose -f docker-compose.prod.yml build --no-cache

# Or rebuild specific service
docker-compose -f docker-compose.prod.yml build --no-cache scoring-service
```

### Issue: "Out of memory"

```powershell
# Increase Docker Desktop memory limit
# Open Docker Desktop → Settings → Resources → Memory → Increase to 8GB

# Or scale down services
docker-compose -f docker-compose.prod.yml stop analytics-service ai-commentary-service
```

### Issue: "Migration failed"

```powershell
# Check database connection
$env:DATABASE_URL = "your-connection-string"
pnpm --filter @mtk/database db:check

# Run migrations manually with verbose output
pnpm --filter @mtk/database db:migrate --verbose
```

---

## Useful Commands

```powershell
# Start all services
docker-compose -f docker-compose.prod.yml up -d

# Stop all services
docker-compose -f docker-compose.prod.yml down

# Restart specific service
docker-compose -f docker-compose.prod.yml restart scoring-service

# View logs
docker-compose -f docker-compose.prod.yml logs -f [service-name]

# Scale a service (if configured)
docker-compose -f docker-compose.prod.yml up -d --scale api-gateway=3

# Update deployment after code changes
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d

# Clean up unused images
docker image prune -a

# Access container shell
docker exec -it ssl-prod-scoring-service sh
```

---

## Next Steps

After successful deployment:

1. **Configure DNS** - Point your domain to server IP
2. **Set up CI/CD** - Automate deployments with GitHub Actions
3. **Add monitoring** - Integrate DataDog, New Relic, or Prometheus
4. **Configure CDN** - Use Cloudflare for static assets
5. **Set up backups** - Automate database backups to S3

---

## Support

If you encounter issues:

1. Check logs: `docker-compose -f docker-compose.prod.yml logs`
2. Review: `DEPLOYMENT.md` for architecture details
3. Review: `SUPABASE_SETUP.md` for database help
4. Review: `ENV_SETUP_GUIDE.md` for credentials help

**Deployment complete!** Your SSL application should now be running at http://localhost:3001
