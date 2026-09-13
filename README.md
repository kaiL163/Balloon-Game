# Воздушный Шар

Игра в жанре crash: игрок выбирает тему и ставку, шар летит с растущим
коэффициентом, cashout фиксирует выплату `win = bet × multiplier`.

## Стек

| Слой | Технологии |
| --- | --- |
| Frontend | React 19, TypeScript, Vite |
| Backend | Java 21, Spring Boot 3.4, Spring Web / WebSocket, Spring Data JPA, Validation |
| БД | PostgreSQL 16, Flyway-миграции |
| Документация API | SpringDoc OpenAPI / Swagger UI |
| Тесты | JUnit 5, Spring MockMvc, H2 (MODE=PostgreSQL) |
| Запуск | Docker Compose |

## Структура проекта

```text
Balloon-Game/
├── README.md                 # этот файл
├── docker-compose.yml        # postgres + backend + frontend
├── frontend/                 # React-клиент
│   ├── src/api/              # HTTP/WebSocket клиент к backend
│   ├── src/components/       # UI игры и админки
│   └── package.json
└── backend/
    ├── docs/math-model.md    # модель расчётов и ограничения настроек
    ├── pom.xml
    ├── Dockerfile
    ├── docker-compose.yml    # только postgres + backend (для разработки)
    └── src/
        ├── main/java/com/airballoon/
        │   ├── auth/         # сессии, демо- и admin-аккаунты
        │   ├── config/       # свойства, OpenAPI
        │   ├── domain/       # сущности JPA
        │   ├── game/         # движок, crash, настройки, журнал операций
        │   ├── web/          # REST-контроллеры
        │   └── ws/           # WebSocket тиков полёта
        ├── main/resources/db/migration/
        └── test/java/        # проверка серверных операций
```

## Зависимости

**Backend** (`backend/pom.xml`): `spring-boot-starter-web`, `websocket`, `data-jpa`,
`validation`, `spring-security-crypto`, `flyway-core`, `postgresql`,
`springdoc-openapi-starter-webmvc-ui`, `h2` + `spring-boot-starter-test` (tests).

**Frontend** (`frontend/package.json`): `react`, `react-dom`, `react-router`, Vite.

**Инфраструктура**: Docker, Docker Compose; для локальной разработки без Docker —
JDK 21, Maven 3.9+, Node.js 20+, PostgreSQL 16.

## Демо-пользователи и бонусный баланс

| Роль | Email | Пароль | Стартовый бонусный баланс |
| --- | --- | --- | ---: |
| Демо-игрок | `test@test.com` | `test123` | **10 000** |
| Администратор | `admin@admin.com` | `admin123` | **10 000** |

Как получить бонусный баланс:

1. Войти демо-аккаунтом `test@test.com` / `test123` (уже есть 10 000).
2. Зарегистрировать нового пользователя через UI или `POST /api/auth/register` —
   начисляется **1 000** бонусов.
3. Увеличить баланс игрой: успешный cashout возвращает `bet × multiplier` на
   `bonusBalance` (см. модель ниже).

Начальный логин админа можно переопределить переменными `ADMIN_EMAIL` и
`ADMIN_PASSWORD` **до первого запуска** backend.

## Запуск целиком

```sh
docker compose up --build
```

После запуска:

| Сервис | URL |
| --- | --- |
| Игра (frontend) | http://localhost:5173 |
| Backend API | http://localhost:8080 |
| Health-check | http://localhost:8080/api/health |
| Swagger UI | http://localhost:8080/swagger-ui.html |
| OpenAPI JSON | http://localhost:8080/api/docs |

Админ-панель: войти как `admin@admin.com` и открыть http://localhost:5173/admin.

## Запуск для разработки

PostgreSQL + backend:

```sh
cd backend
docker compose up --build
```

Backend будет на `http://localhost:8080`, PostgreSQL на `localhost:5432`
(`airballoon` / `postgres` / `postgres`).

Либо без Docker-образа backend (нужен локальный PostgreSQL и JDK 21):

```sh
cd backend
mvn spring-boot:run
```

Frontend:

```sh
cd frontend
npm install
npm run dev
```

Vite проксирует `/api` и `/ws` на `http://localhost:8080`.

## Модель расчётов

Полное описание: [`backend/docs/math-model.md`](backend/docs/math-model.md).

Кратко:

1. **Crash point** до старта раунда:
   `hash = SHA-256(serverSeed + ":" + roundId)`,
   `u = first52Bits(hash) / 2^52`,
   `crash = floor(100 × clamp((1 - houseEdge) / (1 - u), min, max)) / 100`.
   При `houseEdge = 0.03` теоретический RTP ≈ 97%.
2. **Рост коэффициента** во время полёта: `multiplier(t) = exp(growthRate × t)`.
3. **Выплата**: `win = betAmount × multiplierAtCashout`.
4. **Очки**: линии × `points_per_line`, плюс `points_cashout_bonus` при cashout,
   плюс `points_xn_bonus × boosterMultiplier` при активации бустера.
5. После завершения раунда seed и crash раскрываются в
   `GET /api/game/rounds/{id}/fairness`.

## Настройки и ограничения

Конфигурация хранится в `game_settings`, редактируется админом (`/admin` или
`PUT /api/admin/settings`) и применяется **без перезапуска**.

| Группа | Параметры | Допустимые значения |
| --- | --- | --- |
| Базовые | `gameId`, `gameName`, `gameType`, `active` | непустые ID/название; тип только `CRASH`; `active=false` блокирует новые раунды |
| Crash | `crashDistribution`, `houseEdge`, `minCrashMultiplier` | только `INVERSE_RTP`; edge **0–0.25**; min crash **1.00–2.00x** |
| Лимиты тем | `greenMaxMultiplier`, `redMaxMultiplier` | **1.01–100x**, не ниже min crash |
| Динамика | `multiplierGrowthRate`, `fps` | рост **0.03–0.50**; FPS **1–60** (`delta = 1/fps`) |
| Бустер | 9 весов GREEN и 12 RED; `multiplierTier1..4` | веса **0–1** (хотя бы один > 0); tier **1.00–10.00x** |
| Ставки | `betTier1..4Amount` | **1.00–1 000 000** бонусов |
| Очки | `pointsPerLine`, `pointsCashoutBonus`, `pointsXnBonus` | целые **0–100 000** |

Публичная часть настроек: `GET /api/game/config`.

## Независимая проверка серверных операций

Оцениваемые сценарии можно пройти **без UI** через Swagger, curl или тесты.

### Инструменты

1. **Swagger UI** — http://localhost:8080/swagger-ui.html  
   Authorize → `Bearer <token>` после login.
2. **Журнал операций** — `GET /api/game/operations`, `GET /api/game/rounds/{id}/operations`,
   для админа `GET /api/admin/operations`.  
   Типы: `ROUND_START`, `CASHOUT`, `ACCRUAL`, `ROUND_FINISH`, `CONFIG_APPLY`.
3. **Автотесты** (обязательные сценарии):

```sh
cd backend
mvn test
```

Ключевые тесты: `ServerOperationsVerificationTest`, `CrashGeneratorTest`.

4. **Health-check** `GET /api/health` — дополняет проверку, но не заменяет игровые операции.

### Пример: логин → старт → cashout → начисления → история → конфиг

```sh
# 1) Логин демо-пользователя
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@test.com\",\"password\":\"test123\"}" | jq -r .token)

# 2) Баланс до ставки
curl -s http://localhost:8080/api/users/me -H "Authorization: Bearer $TOKEN" | jq

# 3) Публичная конфигурация (ставки и лимиты)
curl -s http://localhost:8080/api/game/config | jq

# 4) Старт раунда
ROUND=$(curl -s -X POST http://localhost:8080/api/game/rounds \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"theme\":\"GREEN\",\"bet\":\"x1\"}")
echo "$ROUND" | jq
ROUND_ID=$(echo "$ROUND" | jq -r .id)

# 5) Cashout (win = betAmount * currentMultiplier)
curl -s -X POST "http://localhost:8080/api/game/rounds/$ROUND_ID/cashout" \
  -H "Authorization: Bearer $TOKEN" | jq

# 6) Начисления и журнал операций раунда
curl -s "http://localhost:8080/api/game/rounds/$ROUND_ID/operations" \
  -H "Authorization: Bearer $TOKEN" | jq
curl -s http://localhost:8080/api/users/me -H "Authorization: Bearer $TOKEN" | jq

# 7) История
curl -s http://localhost:8080/api/game/history -H "Authorization: Bearer $TOKEN" | jq

# 8) Применение конфигурации (admin)
ADMIN_TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@admin.com\",\"password\":\"admin123\"}" | jq -r .token)

# Сначала GET /api/admin/settings, измените нужные поля в пределах таблицы выше,
# затем PUT /api/admin/settings с полным телом. Проверка:
curl -s http://localhost:8080/api/admin/operations \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.[] | select(.operation=="CONFIG_APPLY")'
curl -s http://localhost:8080/api/game/config | jq
```

После завершения раунда (crash или финализация после cashout) сверьте формулу:

```sh
curl -s "http://localhost:8080/api/game/rounds/$ROUND_ID/fairness" \
  -H "Authorization: Bearer $TOKEN" | jq
```

Ожидание: `SHA-256(serverSeed)` равен `serverSeedHash`, а crash воспроизводится
формулой из `backend/docs/math-model.md`.

### WebSocket (опционально)

Тики полёта: `ws://localhost:8080/ws/game/{roundId}?token=<token>`.  
События `MULTIPLIER_UPDATE`, `LEVEL_REACHED`, `CASHOUT`, `CRASH` дублируют
серверную модель в реальном времени; канонический журнал для проверки —
`/api/game/.../operations`.
