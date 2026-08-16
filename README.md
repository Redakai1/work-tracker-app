# Work Tracker App — Aplikacja do Śledzenia Czasu Pracy

Aplikacja do śledzenia czasu pracy dla administratorów i pracowników.

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
node -v # powinno być v18+
npm -v # powinno być 8+
docker -v # powinno być 20+
docker compose version
