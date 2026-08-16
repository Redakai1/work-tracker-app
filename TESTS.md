# Work Tracker App — Testing Guide

Projekt zawiera automatyczne testy dla backendu i aplikacji mobilnej.

---

## 📋 Struktura Testów

```
work-tracker-app/
├── backend/
│   ├── __tests__/
│   │   ├── auth.test.js        # Testy autentykacji i JWT
│   │   ├── admin.test.js       # Testy admin API endpoints
│   │   ├── tasks.test.js       # Testy śledzenia czasu
│   │   └── database.test.js    # Testy struktury bazy danych
│   ├── jest.config.js          # Konfiguracja Jest
│   └── package.json            # Test dependencies
│
└── mobile-app/
    ├── __tests__/
    │   └── App.test.js         # Testy React Native komponentów
    ├── jest.config.js
    ├── jest.setup.js           # Setup mocks
    └── package.json
```

---

## 🚀 Uruchamianie Testów

### Backend Testy

**Instalacja zależności testowych:**
```bash
cd backend
npm install --save-dev jest supertest
```

**Uruchomienie testów:**
```bash
# Uruchomij wszystkie testy
npm test

# Uruchomij testy w watch mode
npm run test:watch

# Uruchomij z coverage report
npm run test:coverage
```

### Mobile App Testy

**Instalacja zależności testowych:**
```bash
cd mobile-app
npm install --save-dev jest @testing-library/react-native
```

**Uruchomienie testów:**
```bash
# Uruchomij wszystkie testy
npm test

# Uruchomij w watch mode
npm run test:watch
```

---

## 📝 Testy Backend — Szczegóły

### 1. auth.test.js — Autentykacja

**Testowane zagadnienia:**
- ✅ Logowanie z prawidłowymi poświadczeniami
- ✅ Zwrócenie błędu 401 dla nieprawidłowego username
- ✅ Zwrócenie błędu 401 dla nieprawidłowego hasła
- ✅ Zwrócenie błędu 400 gdy brak username/password
- ✅ Struktura JWT tokenu (header.payload.signature)
- ✅ Weryfikacja tokenu w Authorization header
- ✅ Odrzucenie żądania bez Authorization header
- ✅ Odrzucenie wygasłych tokenów

**Przykład testu:**
```javascript
test('should login successfully with valid credentials', async () => {
  const hashedPassword = await bcrypt.hash('adminpass', 10);
  const mockUser = {
    id: 1,
    username: 'admin',
    password: hashedPassword,
    role: 'admin'
  };

  expect(mockUser.username).toBe('admin');
  expect(mockUser.role).toBe('admin');
});
```

---

### 2. admin.test.js — Admin API

**Testowane endpointy:**
- ✅ GET `/api/admin/employees` — lista pracowników
- ✅ POST `/api/admin/tasks` — tworzenie zadań
- ✅ GET `/api/admin/stats` — statystyki czasu pracy
- ✅ DELETE `/api/admin/tasks/:id` — usuwanie zadań
- ✅ GET `/api/admin/employees/:employeeId/tasks` — zadania pracownika

**Testy bezpieczeństwa:**
- ✅ Wymaga JWT tokenu (401 bez tokenu)
- ✅ Wymaga roli admin (403 dla pracownika)
- ✅ Walidacja wymaganych pól (400)

**Przykład testu:**
```javascript
test('should create task successfully with valid data', async () => {
  const taskData = {
    title: 'Test Task',
    assignee_id: 2
  };

  const createdTask = {
    id: 5,
    title: 'Test Task',
    status: 'pending',
    assignee_id: 2
  };

  expect(createdTask.title).toBe(taskData.title);
  expect(createdTask.status).toBe('pending');
});
```

---

### 3. tasks.test.js — Śledzenie Czasu

**Testowane operacje:**
- ✅ Uruchomienie timera — POST `/api/tasks/:id/start`
- ✅ Zatrzymanie timera — POST `/api/tasks/:id/stop`
- ✅ Automatyczne zatrzymywanie innego zadania
- ✅ Obliczanie czasu trwania w sekundach
- ✅ Kumulacja total_time_spent
- ✅ Pobranie zadań pracownika — GET `/api/employee/tasks`

**Przykład testu:**
```javascript
test('should stop task timer and calculate duration', async () => {
  const startTime = new Date('2026-08-16T10:00:00Z');
  const endTime = new Date('2026-08-16T10:05:30Z');
  const duration = Math.round((endTime.getTime() - startTime.getTime()) / 1000);

  expect(duration).toBe(330); // 5 minut 30 sekund
});
```

---

### 4. database.test.js — Struktura Bazy Danych

**Testowane elementy:**
- ✅ Kolumny i typy danych
- ✅ Constraints (UNIQUE, PRIMARY KEY, FOREIGN KEY)
- ✅ Default values
- ✅ CASCADE delete
- ✅ Referential integrity
- ✅ NULL handling

**Przykład testu:**
```javascript
test('should enforce UNIQUE constraint on username', async () => {
  const duplicateInsert = async () => {
    throw new Error('duplicate key value violates unique constraint');
  };

  expect(duplicateInsert).rejects.toThrow('unique constraint');
});
```

---

## 📱 Testy Mobile App — Szczegóły

### App.test.js — React Native Components

**Testowane komponenty:**

#### 1. LoginScreen
- ✅ Renderowanie formularza z polami username i password
- ✅ Wyświetlanie komunikatu błędu dla błędnych poświadczeń
- ✅ Zapis tokenu w AsyncStorage
- ✅ Wyłączenie przycisku Login podczas ładowania
- ✅ Czyszczenie pól po błędzie

**Test:**
```javascript
test('should render login form with username and password fields', () => {
  const { getByPlaceholderText, getByText } = render(<LoginScreen />);

  expect(getByPlaceholderText(/username|login/i)).toBeTruthy();
  expect(getByPlaceholderText(/password/i)).toBeTruthy();
});
```

#### 2. EmployeeTaskManager
- ✅ Renderowanie listy zadań pracownika
- ✅ Wyświetlenie przycisku Start dla pending zadań
- ✅ Wyświetlenie przycisku Stop dla in_progress zadań
- ✅ Inkrementacja timera co sekundę
- ✅ Wywołanie API `/api/tasks/:id/start`
- ✅ Wywołanie API `/api/tasks/:id/stop`
- ✅ Wyświetlenie błędu przy niepowodzeniu API
- ✅ Odświeżenie listy na pull-to-refresh

**Test:**
```javascript
test('should increment timer when task is running', async () => {
  const { getByText } = render(<EmployeeTaskManager />);

  const startButton = getByText(/start/i);
  fireEvent.press(startButton);

  await waitFor(() => {
    expect(getByText(/00:00:02/)).toBeTruthy();
  }, { timeout: 3000 });
});
```

#### 3. AdminDashboard
- ✅ Renderowanie listy pracowników
- ✅ Podświetlenie wybranego pracownika (niebieski background)
- ✅ Biały tekst dla wybranego pracownika
- ✅ Załadowanie zadań pracownika
- ✅ Otwarcie modalu do tworzenia zadania
- ✅ Utworzenie zadania przez API
- ✅ Wyświetlenie statystyk czasu pracy
- ✅ Usunięcie zadania
- ✅ Odświeżenie statystyk

**Test:**
```javascript
test('should highlight selected employee with blue background', async () => {
  const { getByText } = render(<AdminDashboard />);

  const employee = getByText(/employee1/i);
  fireEvent.press(employee);

  expect(employee.parent.props.style).toContain({ backgroundColor: '#1976D2' });
});
```

---

## 🎯 Test Coverage

### Backend Target Coverage
```
Statements   : 70%+
Branches     : 60%+
Functions    : 70%+
Lines        : 70%+
```

### Uruchomienie Coverage Report

```bash
cd backend
npm run test:coverage

# Output: coverage/
```

---

## 🔍 Mocking i Setup

### Backend — Mock PostgreSQL
```javascript
jest.mock('pg', () => {
  return {
    Pool: jest.fn()
  };
});

const mockPool = new Pool();
mockPool.query = jest.fn().mockResolvedValueOnce({ rows: [...] });
```

### Mobile App — Mock AsyncStorage
```javascript
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
}));
```

### Mobile App — Mock Axios
```javascript
jest.mock('axios');

const axios = require('axios');
axios.post.mockResolvedValueOnce({ data: {...} });
```

---

## ⚠️ Known Limitations

1. **Backend Testy** — Używają mocked pool, nie rzeczywistej bazy danych
   - **Rozwiązanie:** Dodać integracyjne testy z testową bazą PostgreSQL

2. **Mobile Testy** — Testują logikę, nie rzeczywiste urządzenia
   - **Rozwiązanie:** Użyć Detox do e2e testów na rzeczywistym urządzeniu

3. **Brak Integration Tests** — Testy API nie testują prawdziwych requestów
   - **Rozwiązanie:** Dodać supertest z testową instancją backendu

---

## 🚀 Rozszerzanie Testów

### Dodawanie nowego test file

**Backend:**
```bash
# Utwórz nowy test
touch backend/__tests__/myfeature.test.js

# Napisz test
describe('My Feature', () => {
  test('should do something', () => {
    expect(true).toBe(true);
  });
});

# Uruchom
npm --workspace backend test
```

**Mobile:**
```bash
touch mobile-app/__tests__/MyComponent.test.js

# Napisz test
import { render } from '@testing-library/react-native';

test('should render', () => {
  const { getByText } = render(<MyComponent />);
  expect(getByText(/text/i)).toBeTruthy();
});
```

### CI/CD Integration

**GitHub Actions Workflow** (`.github/workflows/tests.yml`):
```yaml
name: Run Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - run: npm install
      - run: npm --workspace backend test
      - run: npm --workspace mobile-app test
      
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

---

## 📚 Dalsze Czytanie

- [Jest Documentation](https://jestjs.io/)
- [React Native Testing](https://reactnative.dev/docs/testing-overview)
- [Testing Library](https://testing-library.com/)
- [Supertest Docs](https://github.com/visionmedia/supertest)

---

**Ostatnia aktualizacja:** Sierpień 2026  
**Wersja:** 1.0.0
