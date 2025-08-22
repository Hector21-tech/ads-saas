# 🏗️ Arkitektur - AnnonsHjälpen

## 📐 System Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Landsida      │    │   Next.js App   │    │   API Server    │
│   (Static HTML) │───▶│   (port 3004)   │───▶│   (port 3010)   │
│                 │    │                 │    │                 │
│ - Presentation  │    │ - Login/Reg     │    │ - JWT Auth      │
│ - Marketing     │    │ - Dashboard     │    │ - Business Logic│
│ - SEO           │    │ - Campaign UI   │    │ - Database      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                 │                        │
                                 │                        ▼
                                 │              ┌─────────────────┐
                                 │              │   PostgreSQL    │
                                 │              │   (port 5432)   │
                                 │              │                 │
                                 │              │ - Users         │
                                 │              │ - Campaigns     │
                                 │              │ - Assets        │
                                 │              └─────────────────┘
                                 │                        │
                                 ▼                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │     Browser     │    │     MinIO       │
                       │                 │    │   (port 9000)   │
                       │ - Cookies       │    │                 │
                       │ - LocalStorage  │    │ - File Storage  │
                       │ - JWT Tokens    │    │ - Images/PDFs   │
                       └─────────────────┘    └─────────────────┘
```

## 🔧 Tech Stack

### Frontend (Next.js)
- **Framework**: Next.js 15.5.0 (App Router)
- **Styling**: Tailwind CSS + Custom CSS
- **State Management**: React Context (AuthContext)
- **HTTP Client**: Axios
- **Forms**: React Hook Form
- **Cookies**: js-cookie

### Backend (API)
- **Runtime**: Node.js + Express
- **Database ORM**: Prisma
- **Authentication**: JWT (jsonwebtoken)
- **File Upload**: Multer + MinIO
- **CORS**: Configured for frontend origin
- **Environment**: Development with tsx watch

### Database
- **Primary DB**: PostgreSQL (via Docker)
- **File Storage**: MinIO S3-compatible (via Docker)
- **Migrations**: Prisma migrations
- **Schema**: Users, Campaigns, Assets, Sessions

## 📊 Database Schema

```sql
-- Users table
Users {
  id: String (UUID)
  email: String (unique)
  password: String (hashed)
  name: String (optional)
  role: String (default: "USER")
  createdAt: DateTime
  updatedAt: DateTime
}

-- Campaigns table  
Campaigns {
  id: String (UUID)
  userId: String (FK to Users)
  name: String
  city: String
  radiusKm: Int
  budgetKr: Int
  startDate: DateTime
  endDate: DateTime
  status: String
  createdAt: DateTime
}

-- Assets table
Assets {
  id: String (UUID)
  userId: String (FK to Users)
  key: String (MinIO key)
  originalName: String
  mime: String
  size: Int
  bucket: String
  createdAt: DateTime
}
```

## 🔐 Authentication Flow

1. **Registration**: POST `/users` → Hash password → Store in DB
2. **Login**: POST `/auth/login` → Verify password → Generate JWT
3. **Token Storage**: Frontend stores JWT in httpOnly cookie
4. **Protected Routes**: API validates JWT on each request
5. **Frontend Protection**: AuthContext checks authentication state

## 📁 File Structure

```
ads-saas/
├── docs/                          # Dokumentation
│   ├── README.md                  # Projektöversikt
│   ├── STATUS.md                  # Daglig status
│   ├── SETUP.md                   # Setup guide
│   ├── ARCHITECTURE.md            # Denna fil
│   └── ISSUES.md                  # Kända problem
├── Htmlfrontend/Testsida/         # Landsida
│   ├── index.html                 # Huvudsida
│   ├── style.css                  # Styling
│   └── script.js                  # Interaktivitet
├── apps/web/                      # Next.js Frontend
│   ├── src/app/                   # App Router struktur
│   │   ├── login/page.tsx         # Login sida
│   │   ├── register/page.tsx      # Registrering
│   │   └── dashboard/page.tsx     # Dashboard
│   ├── src/contexts/AuthContext.tsx
│   └── src/lib/api.ts             # API client
├── apps/api/                      # Express API
│   ├── src/index.ts               # Huvudserver
│   ├── src/auth.ts                # Auth middleware
│   ├── src/db.ts                  # Databas config
│   └── prisma/schema.prisma       # DB schema
└── ad-saas-db/
    └── docker-compose.yml         # Databas services
```

## 🌐 API Endpoints

### Authentication
- `POST /auth/login` - Login med email/password
- `POST /auth/logout` - Logout (clear cookie)
- `GET /auth/me` - Få nuvarande användarinfo

### Users  
- `POST /users` - Skapa ny användare
- `GET /users/:id` - Hämta användarinfo

### Campaigns
- `POST /campaigns` - Skapa ny kampanj
- `GET /campaigns?userId=...` - Hämta användarens kampanjer
- `PUT /campaigns/:id` - Uppdatera kampanj
- `DELETE /campaigns/:id` - Ta bort kampanj

### Assets (Filer)
- `POST /upload-file` - Ladda upp fil till MinIO
- `GET /assets` - Lista alla filer
- `GET /assets/:id/url` - Få presigned URL för fil
- `DELETE /assets/:id` - Ta bort fil

## 🔄 Data Flow

1. **User Registration**:
   Landsida → "Skapa konto" → Next.js `/register` → API `/users` → PostgreSQL

2. **User Login**:
   Landsida → "Logga in" → Next.js `/login` → API `/auth/login` → JWT Cookie

3. **Campaign Creation**:
   Dashboard → Campaign Modal → API `/campaigns` → PostgreSQL

4. **File Upload**:
   Dashboard → File Upload → API `/upload-file` → MinIO → Metadata i PostgreSQL

## 🔒 Security Considerations

- **Passwords**: Bcrypt hashing
- **JWT**: HttpOnly cookies (XSS protection)
- **CORS**: Restricted to frontend origin
- **File Upload**: Type validation, size limits
- **SQL Injection**: Prisma ORM protection
- **Environment Variables**: Sensitive config separated