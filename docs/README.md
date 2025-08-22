# AnnonsHjälpen - Ads SaaS Project

## 📋 Projektöversikt

AnnonsHjälpen är en SaaS-plattform för hantverkare att enkelt skapa och hantera reklamannonser för Facebook, Google och Instagram. Projektet består av en landsida, en Next.js webapp med autentisering och en API med databasintegration.

## 🏗️ Arkitektur

```
ads-saas/
├── docs/                     # Projektdokumentation (denna mapp)
├── Htmlfrontend/Testsida/    # Statisk hemsida/landsida
├── apps/
│   ├── web/                  # Next.js frontend app (port 3004)
│   └── api/                  # Express API server (port 3010)
├── ad-saas-db/              # Docker Compose för databas
└── infra/                   # Infrastruktur konfiguration
```

## 🌐 Portar och Services

- **3004**: Next.js frontend webapp med login/register/dashboard
- **3010**: Express API server med JWT autentisering
- **9000**: MinIO S3-kompatibel fillagring (via Docker)
- **5432**: PostgreSQL databas (via Docker)

## 🚀 Senaste status (2025-08-22)

✅ **Genomfört**:
- Fixat header-problem på landsidan (täckte över innehåll)
- Tagit bort "Ny kampanj"-modal från landsidan
- Lagt till länkar till riktiga login/register-sidor
- Uppdaterat alla portreferenser till 3004
- Startat API (port 3010) och Next.js app (port 3004)

🟡 **Aktuell situation**:
- Landsida fungerar med korrekta länkar
- Next.js app körs på port 3004 med login/register
- API körs på port 3010 (MinIO connection error men fungerar)
- Databas behöver startas via Docker

## 📁 Viktiga filer att läsa

För att förstå projektets aktuella tillstånd, läs alltid:
1. `docs/STATUS.md` - Daglig status och aktuella uppgifter
2. `docs/SETUP.md` - Hur man startar alla services
3. `docs/ARCHITECTURE.md` - Teknisk arkitektur och dataflöde
4. `docs/ISSUES.md` - Kända problem och lösningar