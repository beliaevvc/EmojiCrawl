# Технический Контекст (Tech Context)

## Стек Технологий

### Core
*   **Язык:** TypeScript 5.x
*   **Фреймворк:** React 18
*   **Сборщик:** Vite 5
*   **Среда:** Node.js

### State & Data
*   **State Manager:** Zustand v5 (выбран за простоту и производительность без бойлерплейта Redux).
*   **Backend Services:** Supabase (PostgreSQL)
    *   Модуль `Auth`: Авторизация тестеров.
    *   Модуль `Database`: 
        *   `wallets`: Хранение баланса кристаллов пользователя.
        *   `notes`: Хранение заметок разработчика (в будущем).
        *   В планах — JSON-конфиги уровней.

### UI & UX
*   **Styling:** Tailwind CSS v3 (Utility-first подход).
*   **Icons:** Lucide React.
*   **Animation:** Framer Motion (критично для Game Feel в карточном пасьянсе).
*   **DnD:** React DnD + Touch Backend.

### Deployment
*   **Source:** GitHub
*   **CI/CD:** Vercel (автоматический деплой из ветки main).
*   **URL:** skazmor.app

## Рабочее Окружение
*   Корневая директория проекта является рабочей (`/`).
*   Папка `skazmor-app/` является устаревшей/артефактом и должна игнорироваться.
*   Разработка ведется с использованием AI (Cursor), с акцентом на сохранение контекста в `memory-bank`.

## Ограничения
*   Необходимо поддерживать работоспособность на мобильных браузерах (Safari iOS/Chrome Android) — критично для Drag-and-Drop.
*   Код должен быть готов к расширению без переписывания ядра (принцип Open-Closed).
