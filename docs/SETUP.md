# 🚀 Setup Guide - Hur man startar AnnonsHjälpen

## 📦 Krav

- Node.js (v18+)
- Docker Desktop
- Git
- En terminal (PowerShell, CMD, eller Git Bash)

## 🔄 Starta alla services (Snabbstart)

### 1. Starta databas och MinIO
```bash
cd C:\Users\bga23\Desktop\ads-saas\ad-saas-db
docker-compose up -d
```

### 2. Starta API server
```bash
cd C:\Users\bga23\Desktop\ads-saas\apps\api
npm run dev
```
*Körs på port 3010*

### 3. Starta Next.js frontend
```bash
cd C:\Users\bga23\Desktop\ads-saas\apps\web
npm run dev
```
*Körs på port 3004*

### 4. Öppna landsida
```bash
cd C:\Users\bga23\Desktop\ads-saas\Htmlfrontend\Testsida
start index.html
```

## 🗄️ Databas Setup

### Första gången (efter Docker start):
```bash
cd C:\Users\bga23\Desktop\ads-saas\apps\api
npx prisma migrate deploy
npx prisma generate
```

### Återställ databas:
```bash
npx prisma migrate reset
```

## 🐳 Docker Commands

### Starta allt:
```bash
cd ad-saas-db
docker-compose up -d
```

### Stoppa allt:
```bash
docker-compose down
```

### Se loggar:
```bash
docker-compose logs -f
```

### Restart services:
```bash
docker-compose restart
```

## 🔧 Troubleshooting

### Port redan används:
```bash
# Hitta process på port
netstat -ano | findstr :3004
netstat -ano | findstr :3010

# Döda process
powershell "Stop-Process -Id [PID] -Force"
```

### Databas-problem:
```bash
# Återskapa databas
docker-compose down -v
docker-compose up -d
cd ../apps/api
npx prisma migrate deploy
```

### MinIO inte tillgängligt:
- Kolla att Docker körs
- Verifiera att port 9000 är ledig
- MinIO dashboard: http://localhost:9001

## 📋 Verifikation

Efter start, kontrollera:
- [ ] http://localhost:3004 (Next.js app)
- [ ] http://localhost:3010 (API health check)
- [ ] http://localhost:9001 (MinIO dashboard)
- [ ] Landsida öppnas korrekt
- [ ] Login/register-länkar fungerar

## 🔄 Restart Everything

```bash
# Stoppa allt
docker-compose -f ad-saas-db/docker-compose.yml down
powershell "Get-Process node | Stop-Process -Force"

# Starta allt
cd ad-saas-db && docker-compose up -d
cd ../apps/api && npm run dev &
cd ../apps/web && npm run dev &
```