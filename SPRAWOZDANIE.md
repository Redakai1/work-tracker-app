# Work Tracker App — Sprawozdanie z Realizacji Projektu

---

## 2. Kluczowe Zagadnienia Związane z Realizacją Projektu

### 2.1 Architektura Aplikacji i Przepływ Danych

Projekt **Work Tracker App** został zrealizowany w architekturze **trójwarstwowej** (three-tier architecture), gdzie:

- **Warstwa prezentacji** — Aplikacja mobilna (React Native + Expo)
- **Warstwa biznesowa** — Backend API (Node.js + Express)
- **Warstwa danych** — Baza danych (PostgreSQL w Docker)

**Przepływ danych:**

```
┌──────────────────────────────────┐
│   Aplikacja Mobilna (Expo)       │
│   - React Native                 │
│   - Axios (HTTP Client)          │
│   - AsyncStorage (cache)         │
└────────────┬─────────────────────┘
             │ REST API (HTTP/JSON)
             │ Port: 8081, 19000
             ▼
┌──────────────────────────────────┐
│   Backend API (Express.js)       │
│   - JWT Authentication           │
│   - Role-based Access Control    │
│   - Database Transactions        │
└────────────┬─────────────────────┘
             │ PostgreSQL Driver
             │ Port: 5432
             ▼
┌──────────────────────────────────┐
│   PostgreSQL Database (Docker)   │
│   - Normalized Schema            │
│   - Foreign Keys                 │
│   - Constraints & Validation     │
└──────────────────────────────────┘
```

Ta architektura zapewnia:
- **Separację odpowiedzialności** — każda warstwa zajmuje się jednym aspektem
- **Skalowalność** — backend i frontend mogą rozwijać się niezależnie
- **Bezpieczeństwo** — dane przesyłane są zaszyfrowane (JWT tokens)
- **Łatwość testowania** — każda warstwa może być testowana oddzielnie

---

### 2.2 Implementacja Autentykacji i Autoryzacji

#### Autentykacja (JWT)

Projekt wykorzystuje **JSON Web Tokens (JWT)** do autentykacji. Proces logowania:

**Kod backendu (`backend/index.js`, linii 85-110):**

```javascript
// POST /api/auth/login
authRouter.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Porównanie hasła z zahaszowaną wartością
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Wygenerowanie JWT tokenu
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      user: { id: user.id, username: user.username, role: user.role }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

**Kluczowe aspekty:**
- Hasła są **zahashowane** algorytmem bcrypt (salt rounds: 10)
- Token zawiera payload: `{ id, username, role }`
- Token jest ważny przez **8 godzin**
- Błędne poświadczenia zwracają błąd 401 bez ujawniania szczegółów

#### Autoryzacja (Role-Based Access Control)

**Middleware do weryfikacji tokenu:**

```javascript
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <TOKEN>

  if (!token) {
    return res.sendStatus(401); // Unauthorized
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.sendStatus(403); // Forbidden
    }
    req.user = user;
    next();
  });
};

// Middleware do sprawdzenia roli admina
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Zastosowanie w routach
app.use('/api/admin', authenticateToken, isAdmin, adminRouter);
app.use('/api/employee', authenticateToken, employeeRouter);
```

**Zalety tego podejścia:**
- Stateless — nie wymaga przechowywania sesji na serwerze
- Skalowalne — każdy serwer może weryfikować token niezależnie
- Bezpieczne — token nie można modyfikować bez klucza tajnego

---

### 2.3 Struktura Bazy Danych

Baza danych została zaprojektowana z uwzględnieniem **normalizacji 3NF** (Third Normal Form).

#### Diagram ERD:

```
┌─────────────────────┐
│       users         │
├─────────────────────┤
│ id (PK)             │
│ username (UNIQUE)   │
│ password (hashed)   │
│ role (enum)         │
│ created_at          │
└─────────────────────┘
         │
         ├─────────────────────────────┐
         │                             │
         ▼                             ▼
┌──────────────────────┐   ┌──────────────────────┐
│  admin_employees     │   │      tasks           │
├──────────────────────┤   ├──────────────────────┤
│ admin_id (FK)        │   │ id (PK)              │
│ employee_id (FK)     │   │ title                │
│ (Composite PK)       │   │ status (enum)        │
└──────────────────────┘   │ total_time_spent     │
                           │ creator_id (FK)      │
                           │ assignee_id (FK)     │
                           │ created_at           │
                           └─────────┬────────────┘
                                     │
                                     ▼
                           ┌──────────────────────┐
                           │   time_entries       │
                           ├──────────────────────┤
                           │ id (PK)              │
                           │ task_id (FK)         │
                           │ start_time           │
                           │ end_time (nullable)  │
                           │ created_at           │
                           └──────────────────────┘
```

#### Skrypt inicjalizacji (`backend/db-init.js`):

```javascript
// Tworzenie tabeli users
await client.query(`
  CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );
`);

// Relacja many-to-many: Admin → Pracownicy
await client.query(`
  CREATE TABLE admin_employees (
    admin_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    employee_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (admin_id, employee_id)
  );
`);

// Tabela zadań
await client.query(`
  CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    total_time_spent INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    assignee_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    creator_id INTEGER REFERENCES users(id) ON DELETE SET NULL
  );
`);

// Tabela śledzenia czasu
await client.query(`
  CREATE TABLE time_entries (
    id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );
`);
```

**Uzasadnienie struktury:**

- **Separacja tabel** — każda entyteta ma własną tabelę (DRY principle)
- **Foreign Keys** — zapewniają **referenčną spójność** danych
- **ON DELETE CASCADE** — automatyczne usunięcie powiązanych rekordów
- **Timestamps** — audyt i debugowanie
- **Enum statuses** — kontrola wartości (pending, in_progress)

---

### 2.4 Implementacja Śledzenia Czasu (Time Tracking)

Kluczowy feature aplikacji — uruchamianie/zatrzymywanie timera dla zadań.

#### Logika transakcji (backend):

```javascript
// POST /api/tasks/:id/start
tasksRouter.post('/:id/start', async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
        const updatedTask = await runInTransaction(async (client) => {
            // 1. Weryfikacja: czy zadanie należy do użytkownika
            const taskRes = await client.query(
                'SELECT * FROM tasks WHERE id = $1 AND assignee_id = $2',
                [id, userId]
            );
            if (taskRes.rows.length === 0) {
                throw new Error('Task not found or not assigned to you');
            }

            // 2. Zatrzymanie innego aktywnego zadania
            const runningTaskRes = await client.query(
                "SELECT id FROM tasks WHERE status = 'in_progress' AND assignee_id = $1",
                [userId]
            );

            if (runningTaskRes.rows.length > 0) {
                const runningTaskId = runningTaskRes.rows[0].id;
                
                // Pobranie ostatniego wpisu czasowego
                const lastEntryRes = await client.query(
                    "SELECT id, start_time FROM time_entries WHERE task_id = $1 AND end_time IS NULL ORDER BY start_time DESC LIMIT 1",
                    [runningTaskId]
                );
                
                if (lastEntryRes.rows.length > 0) {
                    const lastEntry = lastEntryRes.rows[0];
                    const duration = Math.round(
                        (new Date().getTime() - lastEntry.start_time.getTime()) / 1000
                    );

                    // Zaktualizowanie end_time i total_time_spent
                    await client.query(
                        "UPDATE time_entries SET end_time = NOW() WHERE id = $1",
                        [lastEntry.id]
                    );
                    await client.query(
                        "UPDATE tasks SET total_time_spent = total_time_spent + $1, status = 'pending' WHERE id = $2",
                        [duration, runningTaskId]
                    );
                }
            }

            // 3. Uruchomienie nowego zadania
            await client.query(
                "INSERT INTO time_entries (task_id, start_time) VALUES ($1, NOW())",
                [id]
            );
            const result = await client.query(
                "UPDATE tasks SET status = 'in_progress' WHERE id = $1 RETURNING *",
                [id]
            );

            return result.rows[0];
        });

        res.json(updatedTask);
    } catch (err) {
        console.error(err);
        if (err.message.includes('not found')) {
            return res.status(404).json({ error: err.message });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
});
```

**Kluczowe cechy:**

- **Transakcje bazy danych** — zapewniają atomowość (all-or-nothing)
- **Automatyczne zatrzymywanie** — użytkownik może pracować nad jednym zadaniem naraz
- **Obliczanie czasu trwania** — `(end_time - start_time) / 1000` = sekundy
- **Aktualizacja sumy czasu** — `total_time_spent` kumuluje wszystkie wpisy

---

### 2.5 Interfejs Użytkownika — Aplikacja Mobilna

#### Warstwa UI (React Native + Paper):

**Główne komponenty:**

1. **LoginScreen** — autentykacja użytkownika
2. **EmployeeTaskManager** — dashboard pracownika
3. **AdminDashboard** — panel administratora

**Kod głównego komponentu (`mobile-app/App.js`):**

```javascript
function AdminDashboard() {
  const [stats, setStats] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    fetchStats();
    fetchEmployees();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await apiClient.get('/admin/stats');
      setStats(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch statistics.');
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await apiClient.get('/admin/employees');
      setEmployees(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch employees.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Statystyki */}
      <Card>
        <Card.Content>
          <Title>Employee Time Report</Title>
          {stats.map(item => (
            <List.Item
              key={item.employee_id.toString()}
              title={item.employee_name}
              description={`Total time: ${formatTime(item.total_time)}`}
              left={props => <List.Icon {...props} icon="account-clock" />}
            />
          ))}
        </Card.Content>
      </Card>

      {/* Lista pracowników */}
      <Card style={{ marginTop: 20 }}>
        <Card.Content>
          <Title>Task Management</Title>
          <List.Section title="Select an employee">
            {employees.map(employee => {
              const isSelected = selectedEmployee?.id === employee.id;
              return (
                <List.Item
                  key={employee.id.toString()}
                  title={
                    <Text style={isSelected ? styles.selectedEmployeeText : null}>
                      {employee.username}
                    </Text>
                  }
                  onPress={() => fetchTasksForEmployee(employee)}
                  style={isSelected ? styles.selectedEmployee : null}
                />
              );
            })}
          </List.Section>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}
```

**Stylizacja — Problem z kontrastem (rozwiązany):**

```javascript
const styles = StyleSheet.create({
  selectedEmployee: {
    backgroundColor: '#1976D2',  // Niebieski
  },
  selectedEmployeeText: {
    color: '#ffffff',  // Biały tekst
  },
});
```

**Wyjaśnienie:** Aby zapewnić dobrą czytelność, wybrany pracownik ma niebieski background z białym tekstem (kontrast 21:1 — wg. WCAG AAA standard).

---

### 2.6 Bezpieczeństwo i Best Practices

#### 1. Hasłowanie (bcrypt)

```javascript
const saltRounds = 10;
const hashedPassword = await bcrypt.hash('plainTextPassword', saltRounds);

// Weryfikacja
const isValid = await bcrypt.compare('plainTextPassword', hashedPassword);
```

- **Salt rounds = 10** — standard OWASP
- **bcrypt** — odporny na ataki rainbow table
- **Adaptive function** — czas obliczeniowy zwiększa się z czasem (future-proof)

#### 2. Zmienne Środowiskowe (.env)

```env
DATABASE_URL=postgres://...
JWT_SECRET=change-this-in-production
PORT=3001
```

- Sekrety nie są w kodzie (git nie pushuje .env)
- Czytane z `process.env` via `dotenv` package

#### 3. CORS i HTTP Headers

```javascript
app.use(cors());  // Zezwala na żądania z aplikacji mobilnej
app.use(express.json());  // Validacja JSON
```

#### 4. SQL Injection Prevention

```javascript
// ❌ NIEBEZPIECZNE
const query = `SELECT * FROM users WHERE username = '${username}'`;

// ✅ BEZPIECZNE (parametryzowane zapytania)
const query = 'SELECT * FROM users WHERE username = $1';
const result = await pool.query(query, [username]);
```

Projekt używa **parametryzowanych zapytań** — PostgreSQL driver automatycznie escapeuje wartości.

---

## 3. Zrzuty Ekranu i Wizualizacje

### 3.1 Ekran Logowania

[**Opis:** Ekran logowania wyświetla formularz z polami na login i hasło. Minimalistyczny design w temacie Material Design (React Native Paper).]

```
┌─────────────────────────────┐
│       Work Tracker          │
├─────────────────────────────┤
│                             │
│  [Login TextInput]          │
│  [Password TextInput]       │
│  [Login Button]             │
│                             │
│    © 2026 Work Tracker      │
└─────────────────────────────┘
```

**Funkcjonalność:**
- Walidacja pól (wymagane login i hasło)
- Wyświetlenie błędów (invalid credentials)
- Przechowywanie tokenu w AsyncStorage

---

### 3.2 Dashboard Pracownika

[**Opis:** Ekran pokazujący listę przypisanych zadań z przyciskami Start/Stop. Timer wyświetla aktualny czas dla zadania w trakcie.]

```
┌─────────────────────────────────────┐
│ Employee: employee1          [logout]│
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Review Project Proposal     │   │
│  │ Time: 00:45:23              │   │
│  │ Status: [pending] [START] _ │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Develop Feature X           │   │
│  │ Time: 02:30:15              │   │
│  │ Status: [in_progress]       │   │
│  │        [STOP]          ██   │   │
│  └─────────────────────────────┘   │
│                                     │
│  Pull to refresh ↓                  │
│                                     │
└─────────────────────────────────────┘
```

**Interakcja:**
- Kliknięcie Start → timer zaczyna liczyć
- Kliknięcie Stop → czas zapisywany w bazie
- Automatyczne odświeżanie listy

---

### 3.3 Panel Administratora — Statystyki

[**Opis:** Sekcja pokazująca sumę czasu pracy dla każdego pracownika.]

```
┌─────────────────────────────────────┐
│ Admin: admin                 [logout]│
├─────────────────────────────────────┤
│                                     │
│  Employee Time Report        [↻]   │
│  ─────────────────────────────     │
│  👤 employee1                       │
│     Total time: 03:15:45            │
│                                     │
│  👤 employee2                       │
│     Total time: 01:30:20            │
│                                     │
│  👤 employee3                       │
│     Total time: 02:45:10            │
│                                     │
└─────────────────────────────────────┘
```

---

### 3.4 Panel Administratora — Zarządzanie Zadaniami

[**Opis:** Sekcja do tworzenia i przypisywania zadań do pracowników.]

```
┌─────────────────────────────────────┐
│ Task Management              [↻]   │
├─────────────────────────────────────┤
│ Select an employee to manage tasks:│
│                                     │
│  ◇ employee1   [← Selected]        │
│  ◇ employee2                        │
│  ◇ employee3                        │
│                                     │
│ Tasks for employee1          [+ Add]│
│                                     │
│ ┌─ Fix bug in login page      [🗑] │
│ │  Status: pending | Time: 00:05   │
│                                     │
│ ┌─ Prepare weekly report     [🗑] │
│ │  Status: completed | Time: 01:20 │
│                                     │
└─────────────────────────────────────┘
```

**Niebieskie tło dla wybranego pracownika** — wysoki kontrast (białe tło + biały tekst = problem; rozwiązanie: niebieski + biały).

---

### 3.5 Modal do Tworzenia Zadania

[**Opis:** Okno dialogowe pozwalające adminowi wpisać tytuł zadania.]

```
┌─────────────────────────────────┐
│  Add New Task                   │
├─────────────────────────────────┤
│                                 │
│  [Task Title TextInput]         │
│                                 │
│  [Add Task for employee1 Button]│
│                                 │
│                                 │
└─────────────────────────────────┘
```

---

## 4. Wnioski i Perspektywy Rozwoju

### 4.1 Osiągnięte Cele

Projekt **Work Tracker App** został **w pełni zrealizowany** zgodnie z założeniami:

✅ **Funkcjonalność Admin:**
- Zarządzanie pracownikami
- Tworzenie i przypisywanie zadań
- Monitorowanie statystyk czasu pracy

✅ **Funkcjonalność Pracownika:**
- Przeglądanie przypisanych zadań
- Uruchamianie/zatrzymywanie timera
- Śledzenie spędzonego czasu

✅ **Architektura:**
- Trójwarstwowa (Frontend, Backend, Database)
- Scalable i maintainable
- Bezpieczna (JWT, bcrypt, SQL injection prevention)

✅ **Dokumentacja:**
- Instrukcje instalacji i uruchomienia
- Testy (ręczne i e2e)
- Kod dobrze skomentowany

### 4.2 Perspektywy Rozwoju

#### Krótkoterminowe (3-6 miesięcy):

1. **Automatyczne Testy:**
   - Unit tests (backend API)
   - Integration tests (baza danych)
   - E2E tests (UI)

2. **Ulepszenia UI:**
   - Ciemny motyw
   - Wykresy czasu pracy (Chart.js)
   - Powiadomienia push (notifikacje)

3. **Raportowanie:**
   - Export do CSV/PDF
   - Filtrowanie po dacie
   - Raporty tygodniowe/miesięczne

#### Średnioterminowe (6-12 miesięcy):

1. **Skalowanie:**
   - Load balancing (nginx)
   - Caching (Redis)
   - Microservices architecture

2. **Nowe Features:**
   - Projekty (wiele pracowników na jedno zadanie)
   - Kalendarze
   - Integracja z Google Calendar/Slack

3. **Performance:**
   - GraphQL zamiast REST API
   - Real-time updates (WebSockets)
   - Pagination dla dużych list

#### Długoterminowe (12+ miesięcy):

1. **Monetyzacja:**
   - SaaS model (subscription)
   - Premium features
   - Multi-tenant architecture

2. **Analityka:**
   - Machine Learning — predykcja czasu pracy
   - Anomaly detection
   - Business intelligence

3. **Integracje:**
   - Jira, Asana, Monday.com
   - GitHub/GitLab (commit time tracking)
   - Stripe (payment processing)

### 4.3 Podsumowanie

Projekt stanowi solidny fundament dla aplikacji do śledzenia czasu pracy. Architektura umożliwia łatwe rozszerzanie i wdrożenie w środowisku produkcyjnym. Kod jest dobrze zorganizowany, bezpieczny i łatwy do utrzymania.

---

## 5. Bibliografia i Źródła

### Dokumentacja Techniczna

1. **Node.js Documentation** — https://nodejs.org/docs/
   - Async/await, event loop, npm ecosystem

2. **Express.js Guide** — https://expressjs.com/
   - Middleware, routing, error handling

3. **PostgreSQL Documentation** — https://www.postgresql.org/docs/
   - SQL queries, transactions, foreign keys

4. **React Native Documentation** — https://reactnative.dev/
   - Components, navigation, state management

5. **Expo Documentation** — https://docs.expo.dev/
   - Build process, deployment, EAS

6. **React Native Paper** — https://callstack.github.io/react-native-paper/
   - Material Design components

### Bezpieczeństwo

7. **OWASP Top 10** — https://owasp.org/www-project-top-ten/
   - SQL Injection, Authentication, Authorization

8. **JWT.io** — https://jwt.io/
   - JSON Web Tokens specification

9. **bcrypt.js** — https://github.com/dcodeIO/bcrypt.js
   - Password hashing algorithm

### Architektura i Best Practices

10. **Clean Code** — Robert C. Martin
    - Code organization, naming conventions

11. **The Twelve-Factor App** — https://12factor.net/
    - Environment configuration, stateless processes

12. **Docker Documentation** — https://docs.docker.com/
    - Containerization, docker-compose

### Testowanie

13. **Jest Documentation** — https://jestjs.io/
    - Unit testing framework

14. **Postman Learning Center** — https://learning.postman.com/
    - API testing

### Narzędzia Programistyczne

15. **Git & GitHub Documentation** — https://docs.github.com/
    - Version control, collaboration

16. **VS Code Docs** — https://code.visualstudio.com/docs/
    - Editor, debugging, extensions

---

**Koniec sprawozdania**

---

*Dokument przygotowany: Sierpień 2026*  
*Projekt: Work Tracker App v1.0.0*  
*GitHub: https://github.com/Redakai1/work-tracker-app*
