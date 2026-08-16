# Work Tracker App — Aplikacja do Śledzenia Czasu Pracy

## 📋 Spis treści
1. [Opis Projektu](#opis-projektu)
2. [Wymagania](#wymagania)
3. [Instalacja i Konfiguracja](#instalacja-i-konfiguracja)
4. [Uruchomienie](#uruchomienie)
5. [Zmienne Środowiskowe](#zmienne-środowiskowe)
6. [Domyślni Użytkownicy](#domyślni-użytkownicy)
7. [API Endpoints](#api-endpoints)
8. [Testowanie](#testowanie)
9. [Architektura](#architektura)
10. [Licencja](#licencja)

---

## Opis Projektu

**Work Tracker App** to aplikacja webowa i mobilna do śledzenia czasu pracy. Umożliwia:

- **Administratorom** zarządzanie pracownikami, tworzenie i przypisywanie zadań oraz monitorowanie statystyk czasu pracy
- **Pracownikom** przeglądanie przypisanych zadań, uruchamianie/zatrzymywanie timera i śledzenie spędzonego czasu

Projekt składa się z trzech części:
- **Backend** (Node.js + Express + PostgreSQL)
- **Aplikacja Mobilna** (React Native + Expo)
- **Baza Danych** (PostgreSQL w Docker)

---

## Wymagania

### Minimalne
- **Node.js** v18+ (z npm)
- **Docker** i **Docker Compose**
- **Git** (opcjonalnie, do klonowania repozytorium)

### Opcjonalne
- **Expo Go** (do testowania aplikacji mobilnej na telefonie)
- **Android Studio** lub **Xcode** (do emulacji)
- **PostgreSQL CLI** (psql) — do ręcznych operacji na bazie

### Weryfikacja instalacji
```bash
node -v        # powinno być v18+
npm -v         # powinno być 8+
docker -v      # powinno być 20+
docker compose version
```

---

## Instalacja i Konfiguracja

### Krok 1: Klonowanie Repozytorium
```bash
git clone https://github.com/YOUR_USERNAME/work-tracker-app.git
cd work-tracker-app
```

### Krok 2: Konfiguracja Zmiennych Środowiskowych

W głównym folderze `backend` utwórz plik `.env`:

```bash
cd backend
```

Utwórz plik `.env` z zawartością:
```env
DATABASE_URL=postgres://tracker_user:tracker_password@localhost:5432/work_tracker_db
JWT_SECRET=your-secret-key-change-this-in-production
PORT=3001
```

**Dla produkcji zmień wartości na bezpieczne!**

### Krok 3: Instalacja Zależności
```bash
cd ..
npm install
```

Polecenie zainstaluje zależności dla wszystkich pakietów w workspace (`backend` i `mobile-app`).

### Krok 4: Poднятие Bazy Danych
```bash
docker compose up -d
```

Sprawdzenie statusu:
```bash
docker ps
docker logs work_tracker_db
```

### Krok 5: Inicjalizacja Bazy Danych

Ustaw zmienną środowiskową i uruchom skrypty inicjujące:

**Windows (PowerShell):**
```powershell
$env:DATABASE_URL="postgres://tracker_user:tracker_password@localhost:5432/work_tracker_db"
node backend/db-init.js
node backend/db-seed.js
```

**Linux/macOS (Bash):**
```bash
export DATABASE_URL="postgres://tracker_user:tracker_password@localhost:5432/work_tracker_db"
node backend/db-init.js
node backend/db-seed.js
```

Oczekiwany output:
```
Connected to the database.
Existing tables dropped.
Table "users" is ready.
...
Database setup completed successfully.
```

---

## Uruchomienie

### Backend (Node.js Server)

```bash
npm --workspace backend run start
```

Alternatywnie (z nodemon — auto-reload):
```bash
npm --workspace backend run dev
```

Server uruchomi się na `http://localhost:3001`.

Sprawdzenie:
```bash
curl http://localhost:3001
# Powinno zwrócić: "Hello from the Work Tracker API! V2"

curl http://localhost:3001/db-test
# Powinno zwrócić: Database connection successful!
```

### Aplikacja Mobilna (Expo)

W **nowej sesji terminala**:

```bash
npm --workspace mobile-app run start
```

Expo pokaże QR code i menu:
```
› Press a │ open Android
› Press w │ open web
› Press i │ open iOS
```

**Na telefonie:**
- Pobierz **Expo Go** z App Store lub Google Play
- Skanuj wyświetlony QR code

**W przeglądarce:**
- Naciśnij `w` w terminalu Expo

---

## Zmienne Środowiskowe

### Backend — `.env`

| Zmienna | Opis | Przykład | Obowiązkowa |
|---------|------|---------|-------------|
| `DATABASE_URL` | Connection string PostgreSQL | `postgres://tracker_user:tracker_password@localhost:5432/work_tracker_db` | ✅ Tak |
| `JWT_SECRET` | Secret do podpisywania JWT tokenów | `super-secret-key` | ✅ Tak |
| `PORT` | Port na którym uruchomi się serwer | `3001` | ❌ Nie (domyślnie 3001) |

### Mobile App — konfiguracja IP (App.js)

W pliku `mobile-app/App.js` na linii ~32:

```javascript
const API_BASE_URL = 'http://192.168.0.17:3001/api'; // <--- ZMIEŃ NA SWÓJ IP
```

**Ważne:** Aby aplikacja mobilna mogła się połączyć z backendem, zamień `192.168.0.17` na IP adres komputera w lokalnej sieci.

Sprawdzenie IP:
- **Windows**: `ipconfig` (szukaj IPv4 Address)
- **Linux/macOS**: `ifconfig` lub `ip addr`

---

## Domyślni Użytkownicy

Po uruchomieniu `db-seed.js` dostępni są poniżej użytkownicy:

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
Odpowiedź: `{ token, user: { id, username, role } }`

### Admin — Pracownicy

**GET** `/api/admin/employees`
- Lista pracowników zarządzanych przez admina
- Wymaga: Token JWT w header `Authorization: Bearer <token>`

**GET** `/api/admin/stats`
- Statystyki czasu pracy dla każdego pracownika
- Wymaga: Token JWT

**GET** `/api/admin/employees/:employeeId/tasks`
- Zadania przypisane do konkretnego pracownika

**POST** `/api/admin/tasks`
- Utworzenie nowego zadania
```json
{
  "title": "Nazwa zadania",
  "assignee_id": 2
}
```

**DELETE** `/api/admin/tasks/:id`
- Usunięcie zadania

### Pracownik — Zadania

**GET** `/api/employee/tasks`
- Zadania przypisane do zalogowanego pracownika

### Śledzenie Czasu

**POST** `/api/tasks/:id/start`
- Uruchomienie timera dla zadania

**POST** `/api/tasks/:id/stop`
- Zatrzymanie timera dla zadania

---

## Testowanie

### Testy Ręczne (Manualne)

#### Test 1: Logowanie
1. Otwórz aplikację
2. Zaloguj się jako `admin` / `adminpass`
3. Oczekiwany rezultat: Dashboard admina z listą pracowników

#### Test 2: Tworzenie Zadania
1. Zaloguj się jako admin
2. Wybierz pracownika z listy
3. Kliknij "+ Add", wpisz nazwę zadania
4. Oczekiwany rezultat: Zadanie pojawia się na liście

#### Test 3: Śledzenie Czasu (Pracownik)
1. Zaloguj się jako `employee1` / `employeepass1`
2. Kliknij "Start" przy zadaniu
3. Obserwuj jak czas się zwiększa
4. Kliknij "Stop"
5. Oczekiwany rezultat: Czas zostaje zapisany w bazie

#### Test 4: Statystyki (Admin)
1. Zaloguj się jako admin
2. Przejdź do sekcji "Employee Time Report"
3. Oczekiwany rezultat: Wyświetlają się sumaryczne czasy pracy dla każdego pracownika

#### Test 5: Responsywność UI
1. Zaloguj się i wybierz pracownika
2. Tekst powinien być wyraźnie widoczny (białe tło → niebieski background + biały tekst)
3. Oczekiwany rezultat: Brak problemów z kontrastem

### Testy Automatyczne (Integracyjne)

**Polecenia do wykonania:**

```bash
# Test połączenia z bazą
curl http://localhost:3001/db-test

# Test logowania
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"adminpass"}'

# Test pobrania pracowników (wymaga tokenu)
# 1. Skopiuj token z poprzedniego żądania
# 2. Uruchom:
curl http://localhost:3001/api/admin/employees \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Scenariusze End-to-End

**Scenariusz 1: Workflow pracownika**
1. Pracownik loguje się
2. Widzi przypisane zadania
3. Uruchamia timer
4. Pracuje przez 5 minut
5. Zatrzymuje timer
6. Oczekiwany rezultat: Czas zapisany w bazie, widoczny w statystykach admina

**Scenariusz 2: Zarządzanie zadaniami**
1. Admin loguje się
2. Wybiera pracownika
3. Tworzy nowe zadanie
4. Przypisuje pracownikowi
5. Pracownik loguje się i widzi nowe zadanie
6. Oczekiwany rezultat: Synchronizacja danych w real-time

---

## Architektura

### Struktura Projektu
```
work-tracker-app/
├── backend/                    # Node.js + Express
│   ├── index.js               # Główny serwer
│   ├── db-init.js             # Inicjalizacja bazy danych
│   ├── db-seed.js             # Załadowanie testowych danych
│   ├── package.json
│   ├── .env                   # Zmienne środowiskowe (nie pushować!)
│   └── .env.example           # Template zmiennych
│
├── mobile-app/                # React Native + Expo
│   ├── App.js                 # Główny komponent
│   ├── app.json               # Konfiguracja Expo
│   ├── package.json
│   └── assets/
│
├── docker-compose.yml         # Konfiguracja bazy danych
├── package.json               # Root workspace
└── README.md                  # Ta dokumentacja
```

### Stack Technologiczny

**Backend:**
- Node.js 18+
- Express.js 5.2
- PostgreSQL 13
- JWT (jsonwebtoken)
- Bcrypt (hasłowanie)

**Frontend (Mobilny):**
- React Native 0.81
- Expo 54
- React Native Paper (UI Components)
- Axios (HTTP Client)
- AsyncStorage (Local Storage)
- JWT Decode

**Baza Danych:**
- PostgreSQL 13
- Docker (konteneryzacja)

### Przepływ Danych

```
┌─────────────────┐
│   Mobile App    │ (Expo + React Native)
│   (8081, 19000) │
└────────┬────────┘
         │ HTTP/REST
         ▼
┌─────────────────┐
│   Backend API   │ (Node.js + Express)
│    (Port 3001)  │
└────────┬────────┘
         │ TCP/IP (pg driver)
         ▼
┌─────────────────┐
│   PostgreSQL    │ (Docker)
│   (Port 5432)   │
└─────────────────┘
```

---

## Rozwiązywanie Problemów

### Błąd: "password authentication failed"
- Sprawdzić czy Docker container jest uruchomiony: `docker ps`
- Sprawdzić `.env` — czy wartości zgadzają się z `docker-compose.yml`
- Sprawdzić logi bazy: `docker logs work_tracker_db`

### Błąd: "Cannot connect to API"
- Zmienić IP w `mobile-app/App.js` — musisz użyć IP komputera, nie `localhost`
- Sprawdzić czy backend jest uruchomiony: `curl http://localhost:3001`
- Sprawdzić czy firewall zezwala na port 3001

### Błąd: "Metro bundler failed"
- Wyczyść cache: `cd mobile-app && npm start -- --clear`
- Restartuj Expo: Wciśnij `r` w terminalu Expo

### Aplikacja nie przeładowuje się po zmianach kodu
- Wciśnij `r` w terminalu Expo (reload)
- Lub wciśnij `shift+m` i wybierz "Clear project cache"

---

## Wdrażanie do Produkcji

### Checklist
- [ ] Zmienić `JWT_SECRET` na bezpieczny klucz
- [ ] Zmienić hasła użytkowników w bazie
- [ ] Skonfigurować CORS dla domen produkcyjnych
- [ ] Włączyć HTTPS dla API
- [ ] Backupować bazę danych regularnie
- [ ] Monitorować logi serwera
- [ ] Dodać rate limiting do API endpoints
- [ ] Przetestować na środowisku staging

### Wdrażanie Backend
```bash
# Użyć usługi jak Heroku, Railway, DigitalOcean, AWS EC2
# 1. Skonfigurować zmienne środowiskowe
# 2. Zainstalować zależności
# 3. Uruchomić migracje bazy danych
# 4. Uruchomić serwer
npm install
node backend/db-init.js
node backend/db-seed.js
npm --workspace backend run start
```

### Wdrażanie Aplikacji Mobilnej
```bash
# Build do produkcji
cd mobile-app
eas build --platform android  # lub ios
eas submit --platform android # Submit do Google Play
```

---

## Licencja

MIT License — wolno użyć, modyfikować i rozpowszechniać.

---

## Kontakt i Support

W razie problemów lub pytań, otwórz issue w repozytorium GitHub.

**Autor:** [Twoje Imię]  
**Data Utworzenia:** Sierpień 2026  
**Wersja:** 1.0.0
#   w o r k - t r a c k e r - a p p  
 #   w o r k - t r a c k e r - a p p  
 