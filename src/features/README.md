# Features Layer

Содержит функциональные блоки (Bounded Contexts) приложения.
Каждая фича (например, `game`, `deckbuilder`, `auth`) должна быть изолирована.

Внутри фичи:
- `domain/`: Чистая бизнес-логика. ЗАПРЕЩЕНО импортировать React, UI-компоненты, Supabase, LocalStorage.
- `application/`: Use-cases и сервисы. Оркестрирует домен, но не зависит от UI.
- `ui/`: React-компоненты, экраны.

