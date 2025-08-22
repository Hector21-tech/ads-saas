# Claude Code Instructions

## 📋 VIKTIGA INSTRUKTIONER - LÄS ALLTID FÖRST

När du startar Claude Code för detta projekt, följ denna ordning:

### 1. 🔍 Läs Status FÖRST
```
Läs ALLTID: docs/STATUS.md
```
Denna fil innehåller:
- Vad som fungerar just nu
- Vad som INTE fungerar  
- Nästa steg (prioritetsordning)
- Vilka services som körs

### 2. 📚 Förstå Projektet
```
Läs: docs/README.md
```
För projektöversikt och arkitektur.

### 3. 🚀 Starta Services (vid behov)
```
Läs: docs/SETUP.md
```
Snabbstartsguide för alla services.

### 4. 🐛 Kolla Problem
```
Läs: docs/ISSUES.md
```
Kända problem och lösningar.

## 🔄 Uppdatera Kontinuerligt

**VIKTIGT**: Uppdatera `docs/STATUS.md` varje gång du:
- Löser ett problem
- Startar/stoppar en service
- Implementerar ny funktionalitet
- Stöter på nya problem

## 🎯 Projektets Aktuella Tillstånd

**AnnonsHjälpen** är en SaaS för hantverkare att skapa annonser.

**Arkitektur**:
- Landsida (HTML) → länkar till Next.js app
- Next.js (port 3004) → login/register/dashboard  
- API (port 3010) → autentisering + databas
- PostgreSQL + MinIO (Docker)

**Portar**:
- 3004: Next.js frontend
- 3010: Express API
- 5432: PostgreSQL
- 9000: MinIO S3

## ⚡ Snabbkommandon

**Starta allt**:
```bash
cd ad-saas-db && docker-compose up -d
cd apps/api && npm run dev
cd apps/web && npm run dev
```

**Kolla status**:
```bash
netstat -ano | findstr :3004
netstat -ano | findstr :3010
```

**Döda processer**:
```bash
powershell "Get-Process node | Stop-Process -Force"
```

## 📝 Dokumentationsuppdatering

Uppdatera `docs/STATUS.md` så här:
1. Ändra "Uppdaterad:" datum
2. Uppdatera "🟢 Vad som fungerar"
3. Uppdatera "🔴 Vad som INTE fungerar"  
4. Uppdatera "📋 Nästa steg"
5. Uppdatera "🛠️ Services som körs"

**Exempel uppdatering**:
```markdown
**Uppdaterad:** 2025-08-22 21:15

## 🟢 Vad som fungerar just nu
- ✅ Databas startad och migrations körda
- ✅ Registrering fungerar
```

Följ dessa instruktioner varje gång för effektiv utveckling! 🚀