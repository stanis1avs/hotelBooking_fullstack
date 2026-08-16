# Hotel Booking Fullstack

Новые фичи приложения [тут](https://github.com/users/stanis1avs/projects/3)

[Функционал работы приложения](https://github.com/stanis1avs/hotelBooking_fullstack/blob/main/FUNCTIONAL.md)

## О проекте

**Hotel Booking** — приложение для поиска и бронирования отелей.

### Основная функциональность:
- Поиск отелей с фильтрацией по датам и названию
- Просмотр номеров отеля с фотографиями
- Бронирование номеров с выбором дат
- Управление бронированиями (просмотр, удаление)
- Система ролей: **клиент / менеджер / администратор**
- Менеджер управляет всеми бронированиями
- Администратор управляет отелями и номерами через CRUD-интерфейс
- Служба поддержки с перепиской в реальном времени (WebSocket)

---

## Технический стек

### Backend
1. **NestJS** — основной фреймворк
2. **MongoDB** + **Mongoose** — база данных
3. **JWT + Passport.js** — аутентификация (access + refresh токены)
4. **Socket.IO** — реалтайм чат поддержки
5. **Apollo Server**

### В разработке
- **Whisper AI + Web Speech API** - общение с техподдержкой
- **Hyperledger Fabric** — проверка бронирования через блокчейн
- **Hugging Face** — фильтр сообщений
- **Python аддон** — Time-series ML - анализ загруженности отелей

### Frontend (Angular — актуальный)
1. **Angular 21** 
2. **NgRx**
3. **Angular Material**
4. **Tailwind CSS**
5. **RxJS**
6. **Apollo Client**

### В разработке
- **Socket.IO client**
- **Three.js** — 3D визуализация отелей

### Frontend (React — legacy)
> Первоначальная реализация, заменена на Angular.

1. **React** + **TypeScript**
2. **Redux Toolkit** + **Redux Saga**
3. **Tailwind CSS**
4. **Socket.IO**

---

## Архитектура ролей

| Роль | Доступ |
|------|--------|
| **client** | Поиск отелей, бронирование, свои брони, поддержка |
| **manager** | Все бронирования (просмотр + удаление), поддержка (закрытие обращений) |
| **admin** | Управление отелями и номерами (CRUD + загрузка фото) |


---

## Запуск

Скопируйте `.env.example` в `.env` (в корне) и заполните значения.
Для локального запуска бэкенда те же ключи нужны в `hotelBooking_nest_back/.env`.

### Вариант 1: всё в Docker

```bash
docker compose up -d --build
```

Приложение — http://localhost:4200. Внутри поднимаются MongoDB, бэкенд и nginx,
который отдаёт фронтенд и проксирует `/api`, `/graphql` и WebSocket на бэкенд.

### Вариант 2: локально (для разработки)

```bash
# терминал 1 — база
#   Windows: служба MongoDB уже запущена, ничего делать не нужно

# терминал 2 — бэкенд
cd hotelBooking_nest_back && npm run start:dev

# терминал 3 — фронтенд
cd hotelBooking_angular_front && npm start
```

Фронтенд — http://localhost:4200, бэкенд — http://localhost:7000.

**Для активной разработки используйте вариант 2.** В Docker нет горячей
перезагрузки: каждое изменение кода требует пересборки образа, это долго.

---

## Перезапуск после изменений

Docker не подхватывает изменения кода сам — нужна пересборка образа.

| Что поменяли | Команда |
|---|---|
| Код фронтенда | `docker compose up -d --build frontend` |
| Код бэкенда | `docker compose up -d --build backend` |
| И то и другое | `docker compose up -d --build` |
| Только переменные в `.env` | `docker compose up -d --force-recreate` |
| Ничего, просто перезапустить | `docker compose restart backend` |

После пересборки фронтенда **обновите вкладку через Ctrl+Shift+R**: имя
CSS-бандла меняется, но браузер может отдать старый файл из кэша.

Полезное:

```bash
docker compose logs -f backend     # логи бэкенда в реальном времени
docker compose ps                  # что запущено и на каких портах
docker compose down                # остановить (данные в томе сохранятся)
docker compose down -v             # остановить И УДАЛИТЬ базу — необратимо
```

### Данные

База в Docker и локальная MongoDB — **разные и не синхронизируются**.
Контейнерная живёт в томе `hotelbooking_fullstack_mongo-data` и переживает
`docker compose down`. Перенести локальную базу в контейнер:

```bash
docker run --rm --network hotelbooking_fullstack_default \
  -e SRC="mongodb://host.docker.internal:27017/nest" \
  -e DST="mongodb://ЛОГИН:ПАРОЛЬ@mongodb:27017/?authSource=admin" \
  mongo:7 sh -c 'mongodump --uri="$SRC" --archive | mongorestore --uri="$DST" --archive --nsInclude="nest.*" --drop'
```

Логин и пароль — значения `DB_NAME` и `DB_PASSWORD` из корневого `.env`.

Секреты генерируются командой:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

`JWT_TOKEN_SECRET` и `JWT_REFRESH_SECRET` должны различаться — иначе refresh-токен
принимается как access-токен.

## Тестовые аккаунты

Учётные записи для демо создаются локально и в репозиторий не попадают.
Первого администратора заведите вручную:

```bash
# зарегистрируйте клиента через UI, затем повысьте роль в базе
mongosh nest --eval 'db.users.updateOne({email:"you@mail.ru"},{$set:{role:"admin"}})'
```

Дальше пользователей с любой ролью можно создавать через раздел
«Управление пользователями».

---

## Redis: точки роста

### Rate Limiting
Эндпоинты входа (`/auth/login`) и регистрации не имеют ограничений на количество запросов. Паттерн: `INCR user:{ip}:login_attempts` + `EXPIRE` на 60 секунд — при превышении порога (например, 10 попыток) возвращать `429 Too Many Requests`. В NestJS реализуется через `@nestjs/throttler` с Redis-стором.

### Pub/Sub + Redis Adapter для Socket.IO
Socket.IO хранит состояние соединений в памяти одного процесса. При запуске двух и более инстансов бэкенда сообщения чата поддержки будут доходить только до клиентов, подключённых к тому же серверу. Решение: пакет `@socket.io/redis-adapter` — серверы подписываются на Redis Pub/Sub и ретранслируют события всем инстансам.

### Token Blacklist (refresh токены)
Сейчас refresh-токены нельзя отозвать — они действуют до истечения TTL даже после выхода из аккаунта. Redis идеально подходит для blacklist: `SET revoked:{jti} 1 EX <ttl_токена>` при logout, проверка `EXISTS revoked:{jti}` в guard-е. Хранить только отозванные токены (не все), поэтому накладные расходы минимальны.
