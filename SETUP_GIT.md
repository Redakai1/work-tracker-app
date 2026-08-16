# Publikacja Projektu na GitHub

Ten plik zawiera kroki do zainicjalizowania Git repozytorium i publikacji projektu na GitHub.

---

## 1. Inicjalizacja Git Repozytorium Lokalnie

### Krok 1: Konfiguracja Git (jeśli nie robił(a)ś tego wcześniej)

```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### Krok 2: Inicjalizacja Repozytorium

Przejdź do folderu głównego projektu:

```bash
cd "c:\Users\yunik\Desktop\Projekt Inżynierski\work-tracker-app"
```

Inicjalizuj repozytorium Git:

```bash
git init
```

### Krok 3: Dodanie Plików

```bash
# Dodaj wszystkie pliki (będą zignorowane pliki z .gitignore)
git add .

# Sprawdź jakie pliki będą commitnięte
git status
```

### Krok 4: Pierwszy Commit

```bash
git commit -m "Initial commit: Work Tracker App setup with backend, mobile app, and documentation"
```

Alternatywnie (bardziej szczegółowy commit):

```bash
git commit -m "feat: Initial Work Tracker App setup

- Backend API (Node.js + Express + PostgreSQL)
- Mobile app (React Native + Expo)
- Database initialization and seeding
- Comprehensive documentation and testing guide"
```

---

## 2. Publikacja na GitHub

### Krok 1: Stwórz Repozytorium na GitHub

1. Przejdź na https://github.com/new
2. Zaloguj się (lub stwórz konto jeśli nie masz)
3. Wpisz nazwę repozytorium: `work-tracker-app`
4. Opis (opcjonalnie): `Work Tracker — aplikacja do śledzenia czasu pracy`
5. Ustaw `Public` (aby evaluatorzy mogli zobaczyć kod)
6. **Nie zaznaczaj** "Initialize this repository with a README" (mamy już README.md)
7. Kliknij "Create repository"

### Krok 2: Dodaj Zdalne Repozytorium

Po utworzeniu repozytorium na GitHub zobaczysz instrukcje. Wykonaj:

```bash
cd "c:\Users\yunik\Desktop\Projekt Inżynierski\work-tracker-app"

# Dodaj origin (zdalne repozytorium)
git remote add origin https://github.com/YOUR_USERNAME/work-tracker-app.git

# Zmień gałąź na 'main' (jeśli Git mówi o 'master')
git branch -M main

# Push'nij kod
git push -u origin main
```

**Ważne:** Zamień `YOUR_USERNAME` na swoją nazwę użytkownika GitHub!

### Krok 3: Weryfikacja

Przejdź na https://github.com/YOUR_USERNAME/work-tracker-app

Powinieneś zobaczyć:
- ✅ Cały kod projektu
- ✅ README.md z dokumentacją
- ✅ TESTING.md z instrukcjami testowania
- ✅ .gitignore chronując `.env` i `node_modules`
- ✅ `docker-compose.yml`
- ✅ Foldery `backend` i `mobile-app`

---

## 3. Alternatywa: SSH (Rekomendowane)

Jeśli masz skonfigurowany SSH klucz:

```bash
git remote add origin git@github.com:YOUR_USERNAME/work-tracker-app.git
git branch -M main
git push -u origin main
```

### Dodanie SSH Klucza (jeśli nie masz)

1. Wygeneruj klucz:
```bash
ssh-keygen -t ed25519 -C "your.email@example.com"
```

2. Dodaj klucz do ssh-agent:
```bash
# Windows (PowerShell, run as Administrator)
Get-Service ssh-agent | Set-Service -StartupType Manual
Start-Service ssh-agent
ssh-add $HOME\.ssh\id_ed25519

# Linux/macOS
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519
```

3. Skopiuj **publiczny** klucz:
```bash
# Wyświetl zawartość (skopiuj to)
cat ~/.ssh/id_ed25519.pub
```

4. Dodaj do GitHub:
   - Przejdź na https://github.com/settings/keys
   - Kliknij "New SSH key"
   - Wklej zawartość pliku publicznego

---

## 4. Wdrażanie Aktualizacji

Gdy dodasz nowy kod lub naprawy, pushuj aktualizacje:

```bash
# Sprawdź zmiany
git status

# Dodaj zmiany
git add .

# Commitnij
git commit -m "fix: kontrastowe tło dla wybranego pracownika"

# Push do GitHub
git push
```

---

## 5. Branche (Opcjonalnie)

Aby pracować nad nowymi features bez zaburzania `main`:

```bash
# Utwórz nowy branch
git checkout -b feature/timer-improvements

# Pracuj i commitnij
git add .
git commit -m "feat: add timer pause feature"

# Push nowy branch
git push -u origin feature/timer-improvements

# Utwórz Pull Request na GitHub
# (GitHub pokaże przycisk do PR)
```

---

## 6. Struktura Folderu do Publikacji

Przed pushem, upewnij się że masz:

```
work-tracker-app/
├── backend/
│   ├── index.js
│   ├── db-init.js
│   ├── db-seed.js
│   ├── package.json
│   ├── .env.example        ← NIE .env!
│   └── node_modules/       ← zignorowany (.gitignore)
│
├── mobile-app/
│   ├── App.js
│   ├── app.json
│   ├── package.json
│   ├── assets/
│   └── node_modules/       ← zignorowany
│
├── docker-compose.yml
├── package.json            ← workspace root
├── README.md               ✅
├── TESTING.md              ✅
├── .gitignore              ✅
├── .git/                   ← automatycznie przy git init
└── node_modules/           ← zignorowany
```

---

## 7. Checklist Przed Publikacją

- [ ] `.env` NIE jest w repozytorium (zawiera sekrety!)
- [ ] `.env.example` zawiera template
- [ ] `node_modules` jest w `.gitignore`
- [ ] `.git/` folder istnieje
- [ ] README.md zawiera instrukcje instalacji
- [ ] TESTING.md zawiera testy
- [ ] Wszystkie pliki są commitnięte
- [ ] `git log` pokazujeCommT historię
- [ ] GitHub repozytorium jest widoczne publicie

---

## 8. Link do Repozytorium — Format

Po publikacji, link do repozytorium będzie:

```
https://github.com/YOUR_USERNAME/work-tracker-app
```

**Przesyłając sprawozdanie, daj link w formacie:**

```
GitHub Repository: https://github.com/YOUR_USERNAME/work-tracker-app
```

Lub w markdown:

```markdown
[GitHub Repository](https://github.com/YOUR_USERNAME/work-tracker-app)
```

---

## 9. Troubleshooting

### Błąd: "fatal: remote origin already exists"

```bash
git remote remove origin
git remote add origin https://github.com/YOUR_USERNAME/work-tracker-app.git
```

### Błąd: "Authentication failed for HTTPS"

Użyj SSH zamiast HTTPS (patrz punkt 3) lub wygeneruj Personal Access Token:
- Przejdź na https://github.com/settings/tokens
- Kliknij "Generate new token"
- Zaznacz `repo` scope
- Skopiuj token i użyj go jako hasło zamiast hasła GitHub

### Błąd: "branch main not found"

```bash
git branch -M main
git push -u origin main
```

### Jak cofnąć ostatni commit?

```bash
# Cofnij, ale zachowaj pliki
git reset --soft HEAD~1

# Lub cofnij i usuń zmiany
git reset --hard HEAD~1
```

---

## 10. Współpraca (Opcjonalnie)

Jeśli chcesz dodać kolegów do projektu:

1. Przejdź na https://github.com/YOUR_USERNAME/work-tracker-app/settings/access
2. Kliknij "Invite a collaborator"
3. Wpisz username

Współpracownik będzie mogą:
- Pushować na `main`
- Tworzyć branches
- Mergować Pull Requests

---

## 11. GitHub Actions — Automatyczne Testy (Zaawansowane)

Aby uruchamiać testy automatycznie przy każdym pushu:

Utwórz `.github/workflows/ci.yml`:

```yaml
name: CI

on: [push, pull_request]

jobs:
  backend:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_USER: tracker_user
          POSTGRES_PASSWORD: tracker_password
          POSTGRES_DB: work_tracker_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Test database connection
        run: |
          DATABASE_URL="postgres://tracker_user:tracker_password@localhost:5432/work_tracker_db"
          npm --workspace backend run test
        env:
          DATABASE_URL: postgres://tracker_user:tracker_password@postgres:5432/work_tracker_db
```

---

**Powodzenia z publikacją! 🚀**

Jeśli masz pytania lub problemy, otwórz issue na GitHub.
