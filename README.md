## Ссылка на презентацию и видеозащиту

Презентация к проекту и видеозащита находятся по ссылке: https://drive.google.com/drive/folders/1TIz4ot1CWiz4Iea5hy1qXHponeCWmX1X?usp=drive_link

# Воздушный Шар

Браузерная crash-игра на бонусные баллы. Игрок выбирает тему и ставку, наблюдает за полётом шара и забирает выигрыш до crash. Точка разрушения, коэффициенты, сундуки, выплаты и очки рассчитываются на backend.

## Ссылка на презентацию и видеозащиту

Презентация к проекту и видеозащита находятся в [папке Google Drive](https://drive.google.com/drive/folders/1TIz4ot1CWiz4Iea5hy1qXHponeCWmX1X?usp=drive_link).

## Ссылка на хостинг

**[Открыть игру: https://95.81.82.159](https://95.81.82.159)**

Доступные адреса: [health-check](https://95.81.82.159/api/health), [OpenAPI JSON](https://95.81.82.159/api/docs), [админ-панель](https://95.81.82.159/admin).

## Математическая модель

Подробное описание находится в [math-model.md](math-model.md).

До начала раунда backend создаёт секретный seed и вычисляет crash по SHA-256:

```text
hash = SHA-256(serverSeed + ":" + roundId)
u = first52Bits(hash) / 2^52
crash = floor(100 * clamp((1 - houseEdge) / (1 - u), minCrash, themeMax)) / 100
```

При стандартном `houseEdge = 0.03` теоретический RTP базовой модели составляет около 97%. Коэффициент во время полёта растёт по экспоненте `baseMultiplier(t) = exp(growthRate * t)`, а уровни распределены логарифмически.

| Тема | Уровни | Максимум базового коэффициента |
| --- | ---: | ---: |
| Зелёный шар | 9 | 10x |
| Красный шар | 12 | 25x |

Предел применяется к базовой кривой и crash. После открытия сундука итоговый коэффициент умножается на booster multiplier и может быть выше предела темы. Выплата: `win = betAmount * multiplierAtCashout`. Результат можно проверить после завершения через `GET /api/game/rounds/{id}/fairness`.

## Игровая логика

1. Пользователь входит, выбирает зелёный или красный шар и одну из четырёх ставок.
2. При старте сервер проверяет баланс, списывает ставку, заранее определяет crash и линию сундука.
3. На каждом тике коэффициент растёт. Пройденные линии дают очки, достижение сундука включает бустер.
4. Cashout до crash фиксирует `bet * currentMultiplier`. Если cashout не сделан, ставка теряется.
5. На странице результата «Играть снова» открывает выбор ставки, а «Повторить» запускает новую ставку с теми же параметрами.

Cashout и crash обрабатываются атомарно. История, баланс, награды и журнал операций сохраняются в PostgreSQL.

## Архитектура

```text
Браузер (React) -- HTTPS / WSS --> Nginx
                                      |-- статический frontend
                                      |-- /api и /ws -> Spring Boot backend
                                                               |-- JPA / Flyway
                                                               '-- PostgreSQL
```

Frontend общается с backend по REST и WebSocket. Backend является единственным источником игрового результата. Админские настройки сохраняются в `game_settings`, валидируются и применяются без перезапуска.

## Стек

| Слой | Технологии |
| --- | --- |
| Frontend | React 19, TypeScript, React Router, Vite 7, CSS |
| Backend | Java 21, Spring Boot 3.4.4, Spring Web, WebSocket, Spring Data JPA, Validation |
| Авторизация | Bearer-токены, серверные сессии, Spring Security Crypto |
| База данных | PostgreSQL 16, Flyway |
| API | SpringDoc OpenAPI / Swagger UI |
| Развёртывание | Docker Compose, Nginx, Let's Encrypt |

## Конфигурация

Администратор редактирует настройки на странице `/admin` или через `GET/PUT /api/admin/settings`. После сохранения кэш backend обновляется без перезапуска.

| Группа | Параметры | Ограничения |
| --- | --- | --- |
| Базовые | `gameId`, `gameName`, `gameType`, `active` | ID до 50, название до 100 символов, тип `CRASH` |
| Crash | `crashDistribution`, `houseEdge`, `minCrashMultiplier` | `INVERSE_RTP`, edge 0–0.25, минимум 1.00–2.00x |
| Пределы | `greenMaxMultiplier`, `redMaxMultiplier` | 1.01–100x, не ниже min crash |
| Динамика | `multiplierGrowthRate`, `fps` | 0.03–0.50, 1–60 FPS |
| Сундук | 9 GREEN и 12 RED вероятностей | каждое значение 0–1, сумма больше нуля |
| Бустеры | `multiplierTier1Value` … `multiplierTier4Value` | 1.00–10.00x |
| Ставки | `betTier1Amount` … `betTier4Amount` | 1–1 000 000 бонусов |
| Очки | `pointsPerLine`, `pointsCashoutBonus`, `pointsXnBonus` | целые 0–100 000 |

Публичная конфигурация: `GET /api/game/config`. Переменные окружения: `DB_URL`, `DB_USER`, `DB_PASSWORD`, `ALLOWED_ORIGIN_PATTERNS`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`.

## Запуск

### Docker Compose на сервере

Нужны Docker Compose, порты 80/443 и сертификаты:

```text
/etc/letsencrypt/live/95.81.82.159/fullchain.pem
/etc/letsencrypt/live/95.81.82.159/privkey.pem
```

Из корня проекта:

```sh
docker compose up -d --build
docker compose ps
```

Порт 80 перенаправляется на 443. Backend доступен через Nginx-прокси. После изменения frontend: `docker compose up -d --build frontend`.

### Локальная разработка

```sh
cd backend
docker compose up -d --build
cd ../frontend
npm ci
npm run dev
```

Frontend работает на `http://localhost:5173`, backend на `http://localhost:8080`. Vite проксирует `/api` и `/ws`. Для запуска backend без Docker нужны JDK 21, Maven 3.9+ и PostgreSQL: `cd backend && mvn spring-boot:run`.

## Демо-пользователь

| Роль | Email | Пароль | Начальный баланс |
| --- | --- | --- | ---: |
| Игрок | `test@test.com` | `test123` | 10 000 бонусов |
| Администратор | `admin@admin.com` | `admin123` | 10 000 бонусов |

На странице входа можно нажать на карточку аккаунта, чтобы заполнить поля автоматически. Новый пользователь получает 1 000 бонусов при регистрации. Администратор имеет доступ к `/admin`; email и пароль можно задать через `ADMIN_EMAIL` и `ADMIN_PASSWORD` до первого запуска.

## API / Swagger

Локальный Swagger UI: [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html). На хостинге доступен [OpenAPI JSON](https://95.81.82.159/api/docs); интерактивный Swagger используйте локально.

Для защищённых запросов сначала вызовите `POST /api/auth/login`, затем передавайте `Authorization: Bearer <token>`.

| Метод | Назначение |
| --- | --- |
| `POST /api/auth/register`, `/api/auth/login`, `/api/auth/logout` | регистрация, вход, выход |
| `GET /api/users/me`, `/api/users/me/rewards` | профиль, баланс и награды |
| `GET /api/game/config` | публичные настройки |
| `POST /api/game/rounds` | старт раунда; тело `{"theme":"GREEN","bet":"x1"}` |
| `GET /api/game/rounds/{id}`, `/active` | состояние раунда |
| `POST /api/game/rounds/{id}/cashout` | cashout |
| `GET /api/game/history` | история пользователя |
| `GET /api/game/operations` | журнал операций пользователя |
| `GET /api/game/rounds/{id}/operations` | операции раунда |
| `GET /api/game/rounds/{id}/fairness` | проверка seed и crash после завершения |
| `GET/PUT /api/admin/settings` | настройки администратора |
| `GET /api/admin/operations` | административный журнал |

WebSocket: `ws://localhost:8080/ws/game/{roundId}?token=<token>` локально и `wss://95.81.82.159/ws/game/{roundId}?token=<token>` на хостинге. События: `MULTIPLIER_UPDATE`, `LEVEL_REACHED`, `BOOSTER_ACTIVATED`, `CASHOUT`, `CRASH`.

## Как проверить 5 обязательных сценариев

### 1. Старт и списание ставки

Войдите игроком, выберите шар и ставку, нажмите «Начать» или вызовите `POST /api/game/rounds`. Убедитесь, что баланс уменьшился на размер ставки, статус стал `FLYING`, а журнал содержит `ROUND_START`.

### 2. Cashout и проигрыш после crash

Во время полёта нажмите «Забрать выигрыш» или вызовите `POST /api/game/rounds/{id}/cashout`. Проверьте возврат `bet * currentMultiplier`, увеличение баланса и операцию `CASHOUT`. В отдельном раунде дождитесь crash без cashout: ставка не возвращается, поздний cashout отклоняется.

### 3. Очки, сундук и награда

Пройдите несколько линий и завершите раунд. Проверьте очки в результате, `GET /api/users/me`, награды и операции `ACCRUAL`/ `ROUND_FINISH`. Для ставки с бустером выше 1x дождитесь открытия сундука и убедитесь в начислении бонуса xN.

### 4. История и fairness

Откройте историю или вызовите `GET /api/game/history`, найдите завершённый раунд и сравните ставку, crash, cashout и очки. Затем вызовите `GET /api/game/rounds/{id}/fairness`: SHA-256 раскрытого `serverSeed` должен совпасть с `serverSeedHash`. До завершения seed не раскрывается.

### 5. Изменение настроек администратором

Войдите администратором, сохраните исходный `pointsPerLine`, измените его, например на 25, и сохраните полный объект через `PUT /api/admin/settings`. Проверьте новое значение в `GET /api/game/config`, запись `CONFIG_APPLY` в админском журнале и начисление 25 очков за линию в новом раунде. Некорректные значения (например, отрицательные очки или максимум ниже min crash) должны отклоняться. После проверки восстановите исходное значение.

## Структура проекта

```text
.
├── README.md
├── math-model.md
├── docker-compose.yml
├── frontend/
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── vite.config.ts
│   ├── package.json
│   ├── tests/
│   └── src/
│       ├── api/          # HTTP и WebSocket клиент
│       ├── pages/        # вход, лобби, игра, результат, админка
│       ├── components/
│       ├── assets/
│       └── styles/
└── backend/
    ├── Dockerfile
    ├── docker-compose.yml
    ├── pom.xml
    └── src/main/
        ├── java/com/airballoon/
        │   ├── auth/
        │   ├── config/
        │   ├── domain/
        │   ├── game/
        │   ├── web/
        │   └── ws/
        └── resources/
            ├── application.yml
            └── db/migration/
```
