# Воздушный Шар

Единый проект игры:

- `frontend` — React + TypeScript + Vite;
- `backend` — Spring Boot + PostgreSQL + WebSocket.

## Запуск целиком

```sh
docker compose up --build
```

После запуска приложение доступно на `http://localhost:5173`.

Демо-аккаунт: `test@test.com`, пароль: `test123`.

Администратор: `admin@admin.com`, начальный пароль: `admin123`. После входа ему
доступна страница `/admin`, где управляются версия игры, состояние активности,
математическая модель, FPS, ограничения коэффициентов, вероятности всех линий
бустера, четыре tier-множителя, размеры ставок и начисление очков. Изменения сохраняются в
PostgreSQL и применяются без перезапуска backend. Для другого начального логина задайте переменные `ADMIN_EMAIL` и
`ADMIN_PASSWORD` перед первым запуском backend.

## Запуск для разработки

Сначала запустите PostgreSQL и backend из `backend`, затем frontend:

```sh
cd frontend
npm install
npm run dev
```

Vite перенаправляет `/api` и `/ws` на backend по адресу `http://localhost:8080`.
