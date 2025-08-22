# 🐛 Kända Problem och Lösningar

**Uppdaterad:** 2025-08-22 21:07

## 🚨 Aktuella Problem

### 1. MinIO Connection Error (Port 9000)
**Status**: 🟡 Icke-kritiskt
**Beskrivning**: API kan inte ansluta till MinIO S3 storage
```
Fel vid kontroll av bucket: AggregateError [ECONNREFUSED]
connect ECONNREFUSED ::1:9000
```
**Lösning**:
```bash
cd ad-saas-db
docker-compose up -d
```
**Impact**: Filuppladdning fungerar inte förrän MinIO startas

### 2. Docker Containers inte startade
**Status**: 🔴 Kritiskt för full funktionalitet
**Beskrivning**: PostgreSQL och MinIO körs inte
**Lösning**:
```bash
cd C:\Users\bga23\Desktop\ads-saas\ad-saas-db
docker-compose up -d
```

### 3. Next.js Workspace Warning
**Status**: 🟡 Varning (fungerar ändå)
**Beskrivning**: 
```
Warning: Next.js inferred your workspace root, but it may not be correct.
```
**Lösning**: Lägg till `turbopack.root` i next.config.js
**Workaround**: Ignorera varningen - påverkar inte funktionaliteten

## ✅ Lösta Problem

### ~~Header täcker över innehåll~~ ✅
**Status**: Löst (2025-08-22)
**Lösning**: 
- Ökade top padding på hero-sektionen till 160px
- Lade till `scroll-margin-top: 80px` på sektioner
- Uppdaterade smooth scrolling offset till 100px

### ~~"Ny kampanj"-knapp fungerade inte~~ ✅
**Status**: Löst (2025-08-22)
**Lösning**: Tog bort modal-systemet, ersatte med direktlänkar till riktiga sidor

### ~~Inkonsistenta portkonfigurationer~~ ✅
**Status**: Löst (2025-08-22)
**Lösning**: Uppdaterade alla referenser från port 3000 till 3004

## 🔧 Troubleshooting Guide

### Port redan används
```bash
# Hitta vad som använder porten
netstat -ano | findstr :3004
netstat -ano | findstr :3010

# Döda processen
powershell "Stop-Process -Id [PID] -Force"
```

### API startar inte
1. Kontrollera att port 3010 är ledig
2. Kontrollera att .env filer existerar
3. Kör `npm install` i apps/api/

### Next.js startar inte
1. Kontrollera att port 3004 är ledig
2. Kör `npm install` i apps/web/
3. Kontrollera att alla dependencies är installerade

### Databas-anslutning misslyckas
1. Starta Docker: `docker-compose up -d`
2. Vänta 30 sekunder för PostgreSQL att starta
3. Kör migrations: `npx prisma migrate deploy`
4. Testa anslutning: `npx prisma db push`

### Login/Register fungerar inte
1. Kontrollera att API körs (port 3010)
2. Kontrollera att databas är startad
3. Kolla browser console för fel
4. Verifiera CORS-inställningar i API

### Filer kan inte laddas upp
1. Starta MinIO: `docker-compose up -d`
2. Kontrollera MinIO dashboard: http://localhost:9001
3. Verifiera bucket-konfiguration

## 📊 Performance Issues

### Långsam sida-laddning
- **Orsak**: Stora bilder, ej optimerade assets
- **Lösning**: Implementera bildoptimering med Next.js Image

### Minnesproblem
- **Orsak**: Docker containers använder mycket RAM
- **Lösning**: Justera memory limits i docker-compose.yml

## 🔍 Debug Commands

### API Debug:
```bash
# API logs
cd apps/api && npm run dev

# Database status  
npx prisma studio
```

### Frontend Debug:
```bash
# Next.js logs
cd apps/web && npm run dev

# Build check
npm run build
```

### Docker Debug:
```bash
# Container status
docker-compose ps

# Logs
docker-compose logs -f postgres
docker-compose logs -f minio
```

## 📝 När du stöter på nya problem

1. **Dokumentera** problemet här
2. **Kategorisera** efter prioritet (🔴🟡🟢)
3. **Beskriv** symptom och felmeddelanden
4. **Dokumentera** lösningen när den hittas
5. **Uppdatera** STATUS.md

## 🔄 Vanliga restart-kommandon

```bash
# Full restart
powershell "Get-Process node | Stop-Process -Force"
docker-compose -f ad-saas-db/docker-compose.yml down
docker-compose -f ad-saas-db/docker-compose.yml up -d
cd apps/api && npm run dev &
cd apps/web && npm run dev &
```