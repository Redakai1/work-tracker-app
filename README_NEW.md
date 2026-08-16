# Work Tracker App

Aplikacja do śledzenia czasu pracy dla administratorów i pracowników.

---

## 🚀 Quick Start

### 1. Zainstaluj wymagania
```bash
# Node.js v18+
# Docker Desktop
# Git (opcjonalnie)
```

### 2. Klonuj i konfiguruj
```bash
git clone https://github.com/Redakai1/work-tracker-app.git
cd work-tracker-app
npm install
```

### 3. Utwórz `.env` w folderze `backend`
```env
DATABASE_URL=postgres://tracker_user:tracker_password@localhost:5432/work_tracker_db
JWT_SECRET=your-secret-key
PORT=3001
```

### 4. Poднять bazę i uruchomić projekt
```bash
# Terminal 1: Baza danych
docker compose up -d
sleep 5
node backend/db-init.js
node backend/db-seed.js

# Terminal 2: Backend
npm --workspace backend run start

# Terminal 3: Aplikacja mobilna
npm --workspace mobile-app run start
```

### 5. Zaloguj się
- **Admin**: login: `admin`, hasło: `adminpass`
- **Pracownik**: login: `employee1`, hasło: `employeepass1`

---

## 📋 Spis treści

1. [Opis Projektu](#opis-projektu)
2. [Wymagania](#wymagania)
3. [Instalacja](#instalacja)
4. [Uruchomienie](#uruchomienie)
5. [Domyślni Użytkownicy](#domyślni-użytkownicy)
6. [API Endpoints](#api-endpoints)
7. [Testowanie](#testowanie)
8. [Struktura Projektu](#struktura-projektu)
9. [Stack Technologiczny](#stack-technologiczny)
10. [Troubleshooting](#troubleshooting)

---

## Opis Projektu

**Work Tracker App** to aplikacja do śledzenia czasu pracy z dwoma rolami:

**Admin:**
- Zarządzanie pracownikami
- Tworzenie i przypisywanie zadań
- Monitorowanie statystyk czasu pracy

**Pracownik:**
- Przeglądanie przypisanych zadań
- Uruchamianie/zatrzymywanie timera
- Śledzenie spędzonego czasu

---

## Wymagania

- **Node.js** v18+
- **npm** v8+
- **Docker** v20+
- **Docker Compose**
- **Git** (opcjonalnie)

Sprawdzenie:
```bash
node -v
npm -v
docker --version
docker compose version
```

---

## Instalacja

### 1. Klonowanie Repozytorium
```bash
git clone https://github.com/Redakai1/work-tracker-app.git
cd work-tracker-app
```

### 2. Instalacja Zależności
```bash
npm install
```

Zainstaluje zależności dla `backend` i `mobile-app` (workspace).

### 3. Konfiguracja `.env`

W folderze `backend` utwórz `.env`:

```bash
cd backend
cat > .env << EOF
DATABASE_URL=postgres://tracker_user:tracker_password@localhost:5432/work_tracker_db
JWT_SECRET=your-secret-key-change-in-production
PORT=3001
EOF
cd ..
```

Lub ręcznie — utwórz plik `backend/.env` z zawartością:
```
DATABASE_URL=postgres://tracker_user:tracker_password@localhost:5432/work_tracker_db
JWT_SECRET=your-secret-key-change-in-production
PORT=3001
```

---

## Uruchomienie

### Krok 1: Poднять PostgreSQL
```bash
docker compose up -d
```

Sprawdzenie:
```bash
docker ps
docker logs work_tracker_db
```

### Krok 2: Inicjalizacja Bazy Danych

**Windows (PowerShell):**
```powershell
$env:DATABASE_URL="postgres://tracker_user:tracker_password@localhost:5432/work_tracker_db"
node backend/db-init.js
node backend/db-seed.js
```

**Linux/macOS:**
```bash
export DATABASE_URL="postgres://tracker_user:tracker_password@localhost:5432/work_tracker_db"
node backend/db-init.js
node backend/db-seed.js
```

### Krok 3: Uruchomienie Backendu

**Terminal 1:**
```bash
npm --workspace backend run start
# lub z auto-reload:
npm --workspace backend run dev
```

Backend będzie na `http://localhost:3001`

### Krok 4: Uruchomienie Aplikacji Mobilnej

**Terminal 2:**
```bash
npm --workspace mobile-app run start
```

Expo pokaże QR code. Skanuj z **Expo Go** (phone) lub naciśnij `w` (web).

---

## Zmienne Środowiskowe

### Backend `.env`

| Zmienna | Opis | Przykład | Obowiązkowa |
|---------|------|---------|-------------|
| `DATABASE_URL` | PostgreSQL connection string | `postgres://tracker_user:tracker_password@localhost:5432/work_tracker_db` | ✅ |
| `JWT_SECRET` | Secret for JWT signing | `super-secret-key` | ✅ |
| `PORT` | Server port | `3001` | ❌ (default: 3001) |

### Mobile App

W `mobile-app/App.js` zmień IP:
```javascript
const API_BASE_URL = 'http://192.168.0.17:3001/api'; // ← Twoje IP
```

Sprawdzenie IP:
- Windows: `ipconfig` (IPv4 Address)
- Linux/macOS: `ifconfig`

---

## Domyślni Użytkownicy

| Login | Hasło | Rola |
|-------|-------|------|
| `admin` | `adminpass` | Administrator |
| `employee1` | `employeepass1` | Pracownik |
| `employee2` | `employeepass2` | Pracownik |
| `employee3` | `employeepass3` | Pracownik |

---

## API Endpoints

### Autentykacja

**POST** `/api/auth/login`
```json
{
  "username": "admin",
  "password": "adminpass"
}
```

Odpowiedź:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { "id": 1, "username": "admin", "role": "admin" }
}
```

### Admin Routes

- **GET** `/api/admin/employees` — Lista pracowników
- **GET** `/api/admin/stats` — Statystyki czasu pracy
- **GET** `/api/admin/employees/:id/tasks` — Zadania pracownika
- **POST** `/api/admin/tasks` — Utwórz zadanie
- **DELETE** `/api/admin/tasks/:id` — Usuń zadanie

### Employee Routes

- **GET** `/api/employee/tasks` — Moje zadania

### Task Routes

- **POST** `/api/tasks/:id/start` — Uruchom timer
- **POST** `/api/tasks/:id/stop` — Zatrzymaj timer

---

## Testowanie

### Test Połączenia z Bazą
```bash
curl http://localhost:3001/db-test
```

### Test Logowania
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"adminpass"}'
```

### Test Pracownika UI

1. Zaloguj się jako `employee1`
2. Kliknij **Start** przy zadaniu
3. Obserwuj licznik (zwiększa się co sekundę)
4. Kliknij **Stop**
5. Czas powinien być zapisany

### Test Admina UI

1. Zaloguj się jako `admin`
2. Wybierz pracownika — powinien być widoczny (kontrast ✅)
3. Kliknij **+ Add** — utwórz zadanie
4. Sprawdź statystyki

---

## Struktura Projektu

```
work-tracker-app/
├── backend/                  # Node.js + Express API
│   ├── index.js             # Main server
│   ├── db-init.js           # DB initialization
│   ├── db-seed.js           # Test data
│   ├── package.json
│   └── .env                 # (create this)
│
├── mobile-app/              # React Native + Expo
│   ├── App.js               # Main component
│   ├── app.json             # Expo config
│   └── package.json
│
├── docker-compose.yml       # PostgreSQL
├── package.json             # Workspace root
├── README.md                # This file
├── TESTING.md               # Testing guide
└── SETUP_GIT.md             # GitHub setup
```

---

## Stack Technologiczny

**Backend:**
- Node.js 18+
- Express.js 5.2
- PostgreSQL 13
- JWT (jsonwebtoken)
- Bcrypt

**Frontend (Mobile):**
- React Native 0.81
- Expo 54
- React Native Paper
- Axios
- AsyncStorage

**Database:**
- PostgreSQL 13 (Docker)

---

## Troubleshooting

### Błąd: "password authentication failed"
```bash
# Sprawdź Docker
docker ps
docker logs work_tracker_db

# Sprawdź .env w backend/
cat backend/.env
```

Muszą się zgadzać: `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` w `docker-compose.yml`.

### Błąd: "Cannot connect to API"
```bash
# Sprawdź czy backend działa
curl http://localhost:3001

# Sprawdź IP w mobile-app/App.js
# Musi być IP komputera, nie localhost!
```

### Aplikacja nie przeładowuje się
Naciśnij `r` w terminalu Expo lub `shift+m` → clear cache

### Port 3001 już zajęty
```bash
# Zmień PORT w backend/.env
PORT=3002

# Albo zabij proces
# Windows: netstat -ano | findstr :3001
# Kill process
```

---

## Wdrażanie (Production)

### Checklist
- [ ] Zmień `JWT_SECRET` na silny klucz
- [ ] Zmień hasła użytkowników
- [ ] Skonfiguruj CORS
- [ ] Włącz HTTPS
- [ ] Regularnie backupuj bazę
- [ ] Monitoruj logi

---

## Licencja

MIT License

---

## Kontakt

GitHub: [Redakai1/work-tracker-app](https://github.com/Redakai1/work-tracker-app)

Pytania? Otwórz issue na GitHub.

---

**Ostatnia aktualizacja:** Sierpień 2026  
**Wersja:** 1.0.0
