# Testing Guide — Work Tracker App

Ten dokument zawiera szczegółowe instrukcje testowania aplikacji Work Tracker na wszystkich poziomach (jednostkowy, integracyjny, end-to-end).

---

## 1. Testy Ręczne — Backend API

### 1.1 Test Połączenia z Bazą

```bash
curl http://localhost:3001/db-test
```

**Oczekiwana odpowiedź:**
```json
{
  "message": "Database connection successful!",
  "data": {
    "now": "2026-08-16T10:30:45.123Z"
  }
}
```

**Status:** ✅ Połączenie z bazą danych działa

---

### 1.2 Test Logowania

**POST** `/api/auth/login`

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "adminpass"
  }'
```

**Oczekiwana odpowiedź:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "role": "admin"
  }
}
```

**Status:** ✅ Logowanie działa

**Przypadek negatywny** — błędne hasło:
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"wrongpassword"}'
```

**Oczekiwana odpowiedź:**
```json
{
  "error": "Invalid credentials"
}
```

---

### 1.3 Test Pobrania Pracowników (Admin)

1. **Zaloguj się** i skopiuj token z poprzedniego kroku
2. **Wykonaj żądanie:**

```bash
TOKEN="<wklej token tutaj>"
curl http://localhost:3001/api/admin/employees \
  -H "Authorization: Bearer $TOKEN"
```

**Oczekiwana odpowiedź:**
```json
[
  { "id": 2, "username": "employee1" },
  { "id": 3, "username": "employee2" },
  { "id": 4, "username": "employee3" }
]
```

**Status:** ✅ Pobieranie pracowników działa

---

### 1.4 Test Pobrania Statystyk

```bash
TOKEN="<twój token>"
curl http://localhost:3001/api/admin/stats \
  -H "Authorization: Bearer $TOKEN"
```

**Oczekiwana odpowiedź:**
```json
[
  {
    "employee_id": 2,
    "employee_name": "employee1",
    "total_time": 3600
  },
  {
    "employee_id": 3,
    "employee_name": "employee2",
    "total_time": 1800
  }
]
```

**Status:** ✅ Statystyki działają

---

### 1.5 Test Tworzenia Zadania

```bash
TOKEN="<twój token>"
curl -X POST http://localhost:3001/api/admin/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Test Task",
    "assignee_id": 2
  }'
```

**Oczekiwana odpowiedź:**
```json
{
  "id": 5,
  "title": "Test Task",
  "status": "pending",
  "total_time_spent": 0,
  "creator_id": 1,
  "assignee_id": 2,
  "created_at": "2026-08-16T10:35:00.000Z"
}
```

**Status:** ✅ Tworzenie zadań działa

---

### 1.6 Test Uruchomienia Timera

```bash
TOKEN="<token pracownika>"
curl -X POST http://localhost:3001/api/tasks/5/start \
  -H "Authorization: Bearer $TOKEN"
```

**Oczekiwana odpowiedź:**
```json
{
  "id": 5,
  "title": "Test Task",
  "status": "in_progress",
  "total_time_spent": 0,
  "creator_id": 1,
  "assignee_id": 2
}
```

**Status:** ✅ Uruchomienie timera działa

---

### 1.7 Test Zatrzymania Timera

Czekaj ~10 sekund, następnie:

```bash
TOKEN="<token pracownika>"
curl -X POST http://localhost:3001/api/tasks/5/stop \
  -H "Authorization: Bearer $TOKEN"
```

**Oczekiwana odpowiedź:**
```json
{
  "id": 5,
  "title": "Test Task",
  "status": "pending",
  "total_time_spent": 10,  // przybliżnie 10 sekund
  "creator_id": 1,
  "assignee_id": 2
}
```

**Status:** ✅ Zatrzymanie timera i zapis czasu działa

---

## 2. Testy UI — Aplikacja Mobilna (Expo)

### 2.1 Test Logowania

**Kroki:**
1. Otwórz aplikację w Expo Go na telefonie (skanuj QR code)
2. Wpisz login: `admin` i hasło: `adminpass`
3. Naciśnij "Login"

**Oczekiwany rezultat:**
- Ekran ładowania znika
- Wyświetla się dashboard dla admina
- W nagłówku pojawia się "Admin: admin"

**Status:** ✅ Logowanie UI działa

---

### 2.2 Test Dashboard Admina

**Kroki:**
1. Zaloguj się jako `admin`
2. Obserwuj sekcje:
   - "Employee Time Report" — lista pracowników z czasem pracy
   - "Task Management" — lista pracowników do zarządzania zadaniami

**Oczekiwany rezultat:**
- Wszystkie pracownicy widoczni
- Statystyki czasu pracy wyświetlane
- Brak błędów w konsoli

**Status:** ✅ Dashboard admina działa

---

### 2.3 Test Kontrastu — Wybór Pracownika

**Kroki:**
1. Zaloguj się jako `admin`
2. W sekcji "Task Management" kliknij na pracownika `employee1`

**Oczekiwany rezultat:**
- Wiersz zmienia kolor na **niebieski**
- Tekst zmienia kolor na **biały**
- Tekst jest wyraźnie widoczny (wysoki kontrast)
- Poprzednio wybrany pracownik wraca do normalnego koloru

**Status:** ✅ Kontrast i selekcja działa

---

### 2.4 Test Tworzenia Zadania

**Kroki:**
1. Zaloguj się jako `admin`
2. Wybierz pracownika z listy
3. Naciśnij przycisk **+ Add**
4. Wpisz tytuł: "Test Zadanie"
5. Naciśnij "Add Task for employee1"

**Oczekiwany rezultat:**
- Modal znika
- Nowe zadanie pojawia się na liście
- Status: "pending"
- Czas: "00:00:00"

**Status:** ✅ Tworzenie zadań UI działa

---

### 2.5 Test Śledzenia Czasu — Pracownik

**Kroki:**
1. Zaloguj się jako `employee1`
2. Obserwuj listę zadań
3. Kliknij **Start** przy zadaniu
4. Obserwuj jak licznik czasu zwiększa się co sekundę
5. Po ~30 sekundach kliknij **Stop**

**Oczekiwany rezultat:**
- Przycisk zmienia się na "Stop"
- Licznik czasu się zwiększa
- Po kliknięciu Stop przycisk wraca na "Start"
- Czas zapisany (~30 sekund)

**Status:** ✅ Timer pracownika działa

---

### 2.6 Test Edycji Zadań

**Kroki:**
1. Zaloguj się jako `admin`
2. Wybierz pracownika
3. Przy zadaniu naciśnij ikonę **trash** (🗑️)
4. Zadanie powinno zniknąć z listy

**Oczekiwany rezultat:**
- Zadanie zostaje usunięte
- Lista się odświeża bez błędów

**Status:** ✅ Usuwanie zadań działa

---

### 2.7 Test Wylogowania

**Kroki:**
1. Przebywaj w aplikacji zalogowany
2. W nagłówku naciśnij ikonę **logout** (→)

**Oczekiwany rezultat:**
- Ekran logowania pojawia się
- Wszystkie dane sesji czyszczone

**Status:** ✅ Wylogowanie działa

---

## 3. Testy Integracyjne End-to-End

### Scenariusz 1: Full Workflow Pracownika

**Opis:** Pracownik loguje się, pracuje nad zadaniem i zatrzymuje timer.

**Kroki:**

1. **Admin** loguje się i tworzy zadanie
   ```
   Login: admin / adminpass
   Utwórz: "Przygotować raport"
   Przypisz: employee1
   ```

2. **Pracownik** loguje się
   ```
   Login: employee1 / employeepass1
   Powinien zobaczyć: "Przygotować raport"
   ```

3. **Pracownik** uruchamia timer
   ```
   Kliknij Start
   Czekaj 2 minuty
   Obserwuj licznik
   ```

4. **Pracownik** zatrzymuje timer
   ```
   Kliknij Stop
   Oczekiwany czas: ~120 sekund
   ```

5. **Admin** sprawdza statystyki
   ```
   Login ponownie jako admin
   Przejdź do "Employee Time Report"
   Oczekiwany czas dla employee1: ≥ 120 sekund
   ```

**Status:** ✅ Pełny workflow działa

---

### Scenariusz 2: Wielokrotne Zadania

**Opis:** Pracownik pracuje nad kilkoma zadaniami naprzemiennie.

**Kroki:**

1. Admin tworzy 2 zadania:
   - "Zadanie A"
   - "Zadanie B"

2. Pracownik uruchamia "Zadanie A" (30 sekund)

3. Pracownik zatrzymuje "Zadanie A"

4. Pracownik uruchamia "Zadanie B" (20 sekund)

5. Pracownik zatrzymuje "Zadanie B"

6. Admin sprawdza:
   - "Zadanie A": ~30 sekund
   - "Zadanie B": ~20 sekund
   - Łącznie: ~50 sekund

**Oczekiwany rezultat:** Oba czasy są prawidłowo zliczone

**Status:** ✅ Wielokrotne zadania działają

---

### Scenariusz 3: Autoryzacja i Bezpieczeństwo

**Kroki:**

1. Pracownik 1 loguje się
2. Pracownik 1 próbuje dostać się do `/api/admin/employees`
   ```
   Token: pracownika 1
   ```

**Oczekiwany rezultat:**
```json
{
  "error": "Admin access required"
}
```

3. Admin loguje się
4. Admin próbuje usunąć zadanie pracownika 2
   - Powinno się powieść

**Status:** ✅ Autoryzacja działa prawidłowo

---

## 4. Checklist Testowania

Przed publikacją projektu, przejdź przez:

- [ ] Backend uruchamia się bez błędów
- [ ] Baza danych inicjalizuje się prawidłowo
- [ ] Logowanie działa dla admina i pracowników
- [ ] Admin widzi wszystkich pracowników
- [ ] Admin może tworzyć zadania
- [ ] Pracownik widzi tylko swoje zadania
- [ ] Timer uruchamia się i zatrzymuje
- [ ] Czas jest prawidłowo zapisywany
- [ ] Statystyki aktualizują się w real-time
- [ ] Kontrast tekstu jest wystarczający
- [ ] Brak błędów w konsoli przeglądarki
- [ ] Brak błędów w konsoli mobilnej
- [ ] Logout czyści sesję
- [ ] API wymaga tokenu JWT
- [ ] Admin nie ma dostępu do danych innych adminów
- [ ] Baza danych i backend restartują bez utraty danych

---

## 5. Narzędzia Testowania

### Postman / Insomnia
Do testowania API wygodnie jest używać Postman lub Insomnia:
- Import OpenAPI spec (jeśli dostępny)
- Pre-request Scripts do ustawienia tokenu
- Test scripts do walidacji odpowiedzi

### curl
Do szybkich testów z wiersza poleceń (jak pokazane powyżej).

### Chrome DevTools
Do debugowania aplikacji mobilnej:
- Otwórz DevTools (F12)
- Network tab — obserwuj żądania HTTP
- Console — sprawdź błędy JavaScript

---

## 6. Zgłaszanie Błędów

Jeśli test się nie powiedzie:

1. **Skopiuj** pełny błąd
2. **Opisz** kroki do reprodukcji
3. **Zanotuj** logów z konsoli
4. **Otwórz** issue na GitHub

Przykład:
```
**Tytuł:** Timer nie zatrzymuje się dla pracownika

**Kroki:**
1. Zaloguj się jako employee1
2. Kliknij Start
3. Po 5 sekundach kliknij Stop

**Oczekiwany rezultat:** Czas zapisany ~5 sekund

**Aktualny rezultat:** Przycisk nic nie robi

**Błąd z konsoli:**
POST http://localhost:3001/api/tasks/5/stop 401 Unauthorized
```

---

## 7. Continuous Integration (CI)

Do przyszłej automatyzacji testów (GitHub Actions, GitLab CI):

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_USER: tracker_user
          POSTGRES_PASSWORD: tracker_password
          POSTGRES_DB: work_tracker_db
    
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - run: npm install
      - run: npm --workspace backend run test
      - run: npm --workspace mobile-app run test
```

---

**Ostatnia aktualizacja:** Sierpień 2026  
**Status:** Testowanie manualne ✅  
**Testowanie automatyczne:** ⏳ Planowane
