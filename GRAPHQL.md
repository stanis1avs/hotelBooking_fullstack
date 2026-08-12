# GraphQL в hotelBooking — как это работает

## Оглавление

1. [Что такое GraphQL и зачем он здесь](#1-что-такое-graphql-и-зачем-он-здесь)
2. [Архитектура системы](#2-архитектура-системы)
3. [Бэкенд — элементы конструкции](#3-бэкенд--элементы-конструкции)
   - [ObjectType — типы данных](#31-objecttype--типы-данных)
   - [InputType — входные данные мутаций](#32-inputtype--входные-данные-мутаций)
   - [ArgsType — аргументы запросов](#33-argstype--аргументы-запросов)
   - [Resolver — обработчик запроса](#34-resolver--обработчик-запроса)
   - [Query — запрос данных](#35-query--запрос-данных)
   - [Mutation — изменение данных](#36-mutation--изменение-данных)
   - [Guard — защита резолверов](#37-guard--защита-резолверов)
   - [Decorator — мета-данные на резолвере](#38-decorator--мета-данные-на-резолвере)
4. [Фронтенд — элементы конструкции](#4-фронтенд--элементы-конструкции)
   - [gql — документ запроса](#41-gql--документ-запроса)
   - [ApolloService — адаптер данных](#42-apolloservice--адаптер-данных)
   - [provideApollo — настройка клиента](#43-provideapollo--настройка-клиента)
   - [NgRx Effects — точка соединения](#44-ngrx-effects--точка-соединения)
5. [Жизненный цикл запроса — end-to-end](#5-жизненный-цикл-запроса--end-to-end)
6. [Схема GraphQL API](#6-схема-graphql-api)
7. [Разделение ответственности NgRx vs Apollo](#7-разделение-ответственности-ngrx-vs-apollo)

---

## 1. Что такое GraphQL и зачем он здесь

**REST** (то, что было раньше): клиент делает запрос на конкретный URL, получает фиксированный набор данных. Нужны отели — `GET /api/common/hotels`. Нужны комнаты — `GET /api/common/hotel-rooms`. Два запроса, два URL, два разных формата ответа.

**GraphQL**: клиент делает **один запрос** на один URL (`POST /graphql`), сам описывает какие поля ему нужны, и получает ровно то, что просил — не больше, не меньше.

```
POST http://localhost:7000/graphql

{
  "query": "{ hotels(dateArrival: \"2026-05-01\", dateDeparture: \"2026-05-07\") { id title image } }"
}
```

В этом приложении GraphQL **работает параллельно с REST** — старые REST-эндпоинты никуда не делись. GraphQL добавлен сверху для всех операций с данными, кроме загрузки файлов (там остался REST с FormData).

---

## 2. Архитектура системы

```
┌────────────────────────────────────────────────────────────────┐
│  Angular Frontend                                              │
│                                                                │
│  NgRx Action → NgRx Effect → ApolloService → gql-документ    │
│                                    ↓                           │
│                             Apollo Client                      │
│                          (InMemoryCache)                       │
└────────────────────────────┬───────────────────────────────────┘
                             │  POST /graphql
                             │  Authorization: Bearer <token>
┌────────────────────────────▼───────────────────────────────────┐
│  NestJS Backend                                                │
│                                                                │
│  GraphQLModule → Resolver → Provider → MongoDB                │
│                     ↑                                          │
│              GqlJwtAuthGuard                                   │
│              GqlRolesGuard                                     │
└────────────────────────────────────────────────────────────────┘
```

---

## 3. Бэкенд — элементы конструкции

Весь GraphQL-код бэкенда находится в `hotelBooking_nest_back/src/GraphQL/`.

### 3.1 ObjectType — типы данных

**Что это**: описание формата данных, которые сервер возвращает клиенту. Аналог интерфейса в TypeScript, но для GraphQL-схемы.

**Где живёт**: `src/GraphQL/types/`

**Пример** — тип отеля (`hotel.type.ts`):

```typescript
@ObjectType()
export class HotelType {
  @Field(() => ID)
  id: string;          // ID — специальный scalar для идентификаторов

  @Field()
  title: string;       // обычная строка

  @Field({ nullable: true })
  description: string; // nullable: true = поле может быть null

  @Field({ nullable: true })
  image: string;       // base64 изображение
}
```

Декоратор `@ObjectType()` говорит NestJS: «этот класс — тип в GraphQL-схеме».  
Декоратор `@Field()` говорит: «это свойство доступно через GraphQL».  
Без `@Field()` поле невидимо для клиента — TypeScript-поля не попадают в схему автоматически.

**Все типы в проекте:**

| Файл | Что описывает |
|---|---|
| `user.type.ts` | Пользователь (id, email, name, role) |
| `hotel.type.ts` | Отель |
| `room.type.ts` | Комната + вложенный тип отеля внутри комнаты |
| `reservation.type.ts` | Бронирование (отдельные типы для клиента и менеджера) |
| `support.type.ts` | Заявка в поддержку + сообщение |
| `auth.type.ts` | Результат авторизации (токены + пользователь) |

---

### 3.2 InputType — входные данные мутаций

**Что это**: описание данных, которые **клиент отправляет** серверу в мутации. Как `@Body()` в REST-контроллере.

**Где живёт**: `src/GraphQL/inputs/`

**Пример** — данные для логина (`login.input.ts`):

```typescript
@InputType()
export class LoginInput {
  @Field()
  email: string;

  @Field()
  password: string;
}
```

Клиент пишет в запросе:

```graphql
mutation {
  login(input: { email: "user@test.com", password: "123456" }) {
    access_token
    user { id role }
  }
}
```

**Все InputType в проекте:**

| Файл | Используется в |
|---|---|
| `login.input.ts` | `login` mutation |
| `register.input.ts` | `register` mutation |
| `create-reservation.input.ts` | `createReservation` mutation |
| `create-user.input.ts` | `adminCreateUser` mutation |

---

### 3.3 ArgsType — аргументы запросов

**Что это**: похож на InputType, но используется для `@Query()` — когда нужно передать несколько аргументов сразу, оформив их в класс. Удобен для фильтров и пагинации.

**Разница с InputType**: InputType передаётся как один объект-аргумент (`input: { ... }`), ArgsType разворачивается в отдельные аргументы на уровне запроса.

**Пример** — поиск отелей (`search-hotels.args.ts`):

```typescript
@ArgsType()
export class SearchHotelsArgs {
  @Field(() => Int, { nullable: true, defaultValue: 0 })
  offset: number;

  @Field({ nullable: true })
  hotel?: string;       // название для поиска (необязательно)

  @Field()
  dateArrival: string;  // обязательное поле

  @Field()
  dateDeparture: string;
}
```

Клиент пишет:

```graphql
query {
  hotels(dateArrival: "2026-05-01", dateDeparture: "2026-05-07", hotel: "Park") {
    id title
  }
}
```

**Все ArgsType в проекте:**

| Файл | Используется в |
|---|---|
| `search-hotels.args.ts` | `hotels` query |
| `search-users.args.ts` | `adminUsers`, `managerUsers` queries |

---

### 3.4 Resolver — обработчик запроса

**Что это**: класс, который принимает GraphQL-запрос и возвращает данные. Аналог Controller в REST, но вместо HTTP-методов — декораторы `@Query()` и `@Mutation()`.

**Где живёт**: `src/GraphQL/resolvers/`

**Полный пример** — резолвер отелей (`hotels.resolver.ts`):

```typescript
@Resolver(() => HotelType)          // этот резолвер работает с типом HotelType
export class HotelsResolver {
  constructor(
    private readonly hotelsProvider: HotelsProvider,         // бизнес-логика
    private readonly reservationsProvider: ReservationsProvider
  ) {}

  @Query(() => [HotelType])         // возвращает массив HotelType
  async hotels(@Args() args: SearchHotelsArgs): Promise<HotelType[]> {
    // 1. Получаем занятые отели в указанный период
    const reservedHotelIds = await this.reservationsProvider
      .getReservationsInTime(args.dateArrival, args.dateDeparture);

    // 2. Получаем свободные отели
    const hotels = await this.hotelsProvider.getAllHotels(args, reservedHotelIds);

    // 3. Приводим к GraphQL-типу и возвращаем
    return hotels.map(h => ({ id: String(h.id), title: h.title, ... }));
  }
}
```

**Все резолверы в проекте:**

| Файл | Операции |
|---|---|
| `auth.resolver.ts` | `login`, `register`, `refreshToken` mutations; `me` query |
| `hotels.resolver.ts` | `hotels` query |
| `rooms.resolver.ts` | `hotelRooms`, `hotelRoom` queries |
| `reservations.resolver.ts` | `myReservations`, `allReservations` queries; `createReservation`, `deleteReservation` mutations |
| `users.resolver.ts` | `adminUsers`, `managerUsers` queries; `adminCreateUser` mutation |
| `support.resolver.ts` | `mySupportRequests`, `allSupportRequests`, `supportMessages` queries; `closeSupportRequest` mutation |

---

### 3.5 Query — запрос данных

**Что это**: операция для **получения** данных. Не меняет состояние системы. Аналог `GET` в REST.

**Синтаксис**: декоратор `@Query(() => ТипВозврата)` над методом резолвера.

```typescript
// Простой query без аутентификации
@Query(() => [HotelType])
async hotels(@Args() args: SearchHotelsArgs): Promise<HotelType[]> { ... }

// Query только для авторизованного клиента
@UseGuards(GqlJwtAuthGuard, GqlRolesGuard)
@Roles('client')
@Query(() => [ClientReservationType])
async myReservations(@CurrentUser() user: UserToJWTPayload): Promise<ClientReservationType[]> { ... }
```

---

### 3.6 Mutation — изменение данных

**Что это**: операция для **создания, изменения или удаления** данных. Аналог `POST`, `PUT`, `DELETE` в REST.

**Синтаксис**: декоратор `@Mutation(() => ТипВозврата)` над методом резолвера.

```typescript
// Создание бронирования — возвращает созданное бронирование
@UseGuards(GqlJwtAuthGuard, GqlRolesGuard)
@Roles('client')
@Mutation(() => ClientReservationType)
async createReservation(
  @Args('input') input: CreateReservationInput,  // данные от клиента
  @CurrentUser() user: UserToJWTPayload          // данные из JWT-токена
): Promise<ClientReservationType> { ... }

// Удаление бронирования — возвращает просто true/false
@UseGuards(GqlJwtAuthGuard)
@Mutation(() => Boolean)
async deleteReservation(@Args('id') id: string): Promise<boolean> { ... }
```

---

### 3.7 Guard — защита резолверов

**Что это**: класс, который проверяет права доступа **до** того, как резолвер выполнится. Если проверка не пройдена — запрос блокируется с ошибкой `401` или `403`.

**Где живёт**: `src/GraphQL/guards/`

В проекте два guard-а:

**`GqlJwtAuthGuard`** — проверяет что в запросе есть валидный JWT-токен:

```typescript
@Injectable()
export class GqlJwtAuthGuard extends AuthGuard('jwt') {
  getRequest(context: ExecutionContext) {
    // Passport ожидает HTTP-запрос, но у GraphQL контекст другой —
    // нужно вытащить req из GQL-контекста вручную
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req;
  }
}
```

Проблема: стандартный `AuthGuard('jwt')` из Passport ищет токен в обычном HTTP-запросе. Но в GraphQL запрос приходит иначе — через `ExecutionContext`. Поэтому переопределяем `getRequest()`, чтобы вытащить оригинальный `req` из GQL-контекста.

**`GqlRolesGuard`** — проверяет роль пользователя:

```typescript
@Injectable()
export class GqlRolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Читаем список разрешённых ролей из метаданных (@Roles декоратор)
    const roles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!roles) return true; // нет ограничений по ролям — пускаем всех

    const ctx = GqlExecutionContext.create(context);
    const user = ctx.getContext().req.user; // пользователь из JWT
    return roles.includes(user?.role);      // проверяем роль
  }
}
```

---

### 3.8 Decorator — мета-данные на резолвере

**Что это**: функции с `@` которые прикрепляют мета-данные к методам и классам. В GraphQL-слое используются три собственных декоратора.

**Где живёт**: `src/GraphQL/decorators/`

**`@Roles()`** — указывает какие роли могут вызвать этот метод:

```typescript
// Определение:
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

// Использование:
@Roles('manager')             // только менеджер
@Roles('admin')               // только админ
@Roles('client', 'manager')  // клиент или менеджер
```

`GqlRolesGuard` читает это значение через `Reflector` и сравнивает с ролью пользователя из токена.

**`@CurrentUser()`** — извлекает данные текущего пользователя из JWT:

```typescript
// Определение:
export const CurrentUser = createParamDecorator(
  (_data, context: ExecutionContext): UserToJWTPayload => {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req.user; // данные которые JwtStrategy положил в req.user
  }
);

// Использование:
async myReservations(@CurrentUser() user: UserToJWTPayload) {
  // user = { id: '...', email: '...', role: 'client' }
  return this.reservationsProvider.getReservationById(user.id);
}
```

Без этого декоратора пришлось бы каждый раз вручную доставать пользователя из контекста.

---

### AppGraphQLModule — сборка всего вместе

**Где живёт**: `src/GraphQL/graphql.module.ts`

Самодостаточный модуль — сам импортирует все Mongoose-схемы и создаёт провайдеры. Не затрагивает существующие REST-модули.

```typescript
@Module({
  imports: [
    MongooseModule.forFeature([/* все 6 схем */]),
    PassportModule,
    JwtModule.registerAsync({ /* конфиг из .env */ }),
  ],
  providers: [
    // Бизнес-логика (те же провайдеры что у REST)
    HotelsProvider, RoomsProvider, ReservationsProvider,
    UsersProvider, AuthProvider, SupportProvider,
    // JWT-стратегия нужна для GqlJwtAuthGuard
    JwtStrategy,
    // Резолверы
    AuthResolver, HotelsResolver, RoomsResolver,
    ReservationsResolver, UsersResolver, SupportResolver,
  ],
})
export class AppGraphQLModule {}
```

---

## 4. Фронтенд — элементы конструкции

Весь GraphQL-код фронтенда находится в `hotelBooking_angular_front/src/app/graphql/`.

### 4.1 gql — документ запроса

**Что это**: тег-функция которая превращает строку с GraphQL-запросом в объект-документ, понятный Apollo Client. Это статическое описание того, что нужно запросить.

**Где живёт**: `src/app/graphql/queries/` и `src/app/graphql/mutations/`

```typescript
// queries/hotels.queries.ts
import { gql } from 'apollo-angular';

export const GET_HOTELS = gql`
  query GetHotels($offset: Int, $hotel: String, $dateArrival: String!, $dateDeparture: String!) {
    hotels(offset: $offset, hotel: $hotel, dateArrival: $dateArrival, dateDeparture: $dateDeparture) {
      id
      title
      description
      image
    }
  }
`;
```

Синтаксис внутри `gql`:
- `query GetHotels(...)` — имя операции и переменные
- `$offset: Int` — переменная типа Int (необязательная, без `!`)
- `$dateArrival: String!` — переменная типа String (обязательная, с `!`)
- `hotels(...)` — вызов query на сервере
- `{ id title description image }` — **selection set**: только эти поля придут в ответе

**Все GQL-документы:**

```
queries/
├── auth.queries.ts        — ME_QUERY
├── hotels.queries.ts      — GET_HOTELS
├── rooms.queries.ts       — GET_HOTEL_ROOMS
├── reservations.queries.ts — MY_RESERVATIONS, ALL_RESERVATIONS
├── users.queries.ts       — ADMIN_USERS, MANAGER_USERS
└── support.queries.ts     — MY_SUPPORT_REQUESTS, ALL_SUPPORT_REQUESTS, SUPPORT_MESSAGES

mutations/
├── auth.mutations.ts      — LOGIN_MUTATION, REGISTER_MUTATION, REFRESH_TOKEN_MUTATION
├── reservations.mutations.ts — CREATE_RESERVATION, DELETE_RESERVATION
├── users.mutations.ts     — ADMIN_CREATE_USER
└── support.mutations.ts   — CLOSE_SUPPORT_REQUEST
```

---

### 4.2 ApolloService — адаптер данных

**Что это**: Angular-сервис который оборачивает Apollo Client и предоставляет типизированные методы, возвращающие `Observable<T>`. NgRx-эффекты работают именно с этим сервисом — они не знают о GraphQL напрямую.

**Где живёт**: `src/app/graphql/apollo.service.ts`

**Принцип работы**:

```typescript
@Injectable({ providedIn: 'root' })
export class ApolloService {
  constructor(private readonly apollo: Apollo) {}

  // Query — читаем данные
  getHotels(params: { offset: number; hotel?: string; dateArrival: string; dateDeparture: string }): Observable<HotelDto[]> {
    return this.apollo
      .query<{ hotels: HotelDto[] }>({
        query: GET_HOTELS,           // GQL-документ
        variables: params,           // переменные запроса
        fetchPolicy: 'network-only', // всегда идти на сервер, не брать из кеша
      })
      .pipe(
        map((res) => res.data!.hotels) // достаём нужное поле из ответа
      );
  }

  // Mutation — меняем данные
  login(email: string, password: string): Observable<LoginResponseDto> {
    return this.apollo
      .mutate<{ login: { access_token: string; refresh_token: string; user: UserDto } }>({
        mutation: LOGIN_MUTATION,
        variables: { input: { email, password } },
      })
      .pipe(
        map((res) => {
          const { access_token, refresh_token, user } = res.data!.login;
          return { ...user, access_token, refresh_token }; // маппинг в формат DTO
        })
      );
  }
}
```

**Зачем отдельный сервис?** NgRx-эффекты не должны знать о деталях GraphQL (какой именно query, как называется поле в ответе). `ApolloService` скрывает эти детали и возвращает простой Observable с нужным типом.

---

### 4.3 provideApollo — настройка клиента

**Что это**: функция-провайдер которая регистрирует Apollo Client в Angular DI-контейнере. Вызывается один раз в `app.config.ts`.

**Где живёт**: `src/app/app.config.ts`

```typescript
provideApollo(() => {
  const httpLink = inject(HttpLink); // Angular HTTP-транспорт для Apollo

  return {
    // Куда отправлять запросы
    link: httpLink.create({ uri: `${environment.api.host}/graphql` }),

    // Кеш нормализованных данных в памяти
    cache: new InMemoryCache(),

    // Глобальные настройки — всегда ходить на сервер
    defaultOptions: {
      watchQuery: { fetchPolicy: 'network-only' },
      query:      { fetchPolicy: 'network-only' },
    },
  };
}),
```

**Важный момент**: apollo-angular использует Angular `HttpClient` как транспорт. Это значит, что все Angular HTTP-интерцепторы автоматически применяются и к GraphQL-запросам. В проекте уже есть `authInterceptor`, который добавляет `Authorization: Bearer <token>` к каждому запросу — поэтому отдельная настройка auth-заголовка для Apollo не нужна.

**`InMemoryCache`** — встроенный кеш Apollo. Нормализует данные по `id` (хранит сущности без дублирования). Но поскольку в проекте все запросы используют `fetchPolicy: 'network-only'`, кеш здесь работает только как временное хранилище между рендерами, а не как основной источник данных.

---

### 4.4 NgRx Effects — точка соединения

**Что это**: Effects — единственное место во фронтенде, где вызывается `ApolloService`. Они слушают NgRx-actions и реагируют на них асинхронными операциями.

**Принцип**: action приходит → Effect вызывает Apollo → получает данные → диспетчирует success/failure action.

**Пример** — загрузка отелей (`hotels.effects.ts`):

```typescript
// ДО (REST через Api):
this.loadHotels$ = createEffect(() =>
  this.actions$.pipe(
    ofType(HotelsActions.loadHotels),
    concatMap(({ params }) =>
      this.api.getHotels(params).pipe(        // ← вызов HttpClient
        map((items) => HotelsActions.loadHotelsSuccess({ items })),
        catchError((error) => of(HotelsActions.loadHotelsFailure({ error })))
      )
    )
  )
);

// ПОСЛЕ (GraphQL через ApolloService):
this.loadHotels$ = createEffect(() =>
  this.actions$.pipe(
    ofType(HotelsActions.loadHotels),
    concatMap(({ params }) =>
      this.apolloService.getHotels(params).pipe(  // ← вызов Apollo
        map((items) => HotelsActions.loadHotelsSuccess({ items })),
        catchError((error) => of(HotelsActions.loadHotelsFailure({ error })))
      )
    )
  )
);
```

Изменилась только одна строка — остальное осталось прежним. NgRx-редьюсеры, actions, selectors — всё без изменений.

---

## 5. Жизненный цикл запроса — end-to-end

Разберём на примере: **пользователь логинится**.

```
1. Компонент Login
   ↓ dispatch(AuthActions.login({ payload: { email, password } }))

2. AuthEffects.login$
   ↓ ofType(AuthActions.login)
   ↓ apolloService.login(email, password)

3. ApolloService.login()
   ↓ apollo.mutate({ mutation: LOGIN_MUTATION, variables: { input: { email, password } } })

4. Apollo Client
   ↓ POST http://localhost:7000/graphql
   ↓ Body: { "query": "mutation Login($input: LoginInput!) { login(input: $input) { ... } }", "variables": { "input": { "email": "...", "password": "..." } } }
   ↓ authInterceptor добавляет заголовок (здесь без токена, т.к. первый логин)

5. NestJS GraphQLModule
   ↓ Парсит запрос, находит мутацию "login"
   ↓ Вызывает AuthResolver.login()

6. AuthResolver.login()
   ↓ authProvider.validateUser(email, password) — проверяет пароль через bcrypt
   ↓ authProvider.login(user) — генерирует access_token (JWT, 2 дня)
   ↓ authProvider.validateRefresh(data) — генерирует refresh_token (JWT, 10 дней)
   ↓ return { access_token, refresh_token, user: { id, email, name, role } }

7. Apollo Client получает ответ
   ↓ res.data = { login: { access_token: "...", refresh_token: "...", user: { ... } } }

8. ApolloService.login() обрабатывает
   ↓ map: { ...user, access_token, refresh_token } → LoginResponseDto

9. AuthEffects.login$ (продолжение)
   ↓ tap: authToken.setAccessToken(res.access_token) → localStorage
   ↓ tap: authToken.setRefreshToken(res.refresh_token) → localStorage
   ↓ map: AuthActions.loginSuccess({ payload: res })

10. NgRx Reducer
    ↓ on(AuthActions.loginSuccess): state.user = payload, state.accessToken = payload.access_token

11. Компонент получает данные через selector
    ↓ store.select(selectAuthUser) — реактивно обновляется
```

---

## 6. Схема GraphQL API

Полная схема автоматически генерируется в `hotelBooking_nest_back/src/schema.gql` при запуске сервера (`autoSchemaFile`).

### Queries

| Название | Доступ | Описание |
|---|---|---|
| `hotels(offset, hotel?, dateArrival, dateDeparture)` | Публичный | Список доступных отелей за период |
| `hotelRooms(hotel, isEnabled?)` | Публичный | Комнаты конкретного отеля |
| `hotelRoom(id)` | Публичный | Одна комната по ID |
| `me` | Любой авторизованный | Текущий пользователь из токена |
| `myReservations` | `client` | Мои бронирования |
| `allReservations(offset?)` | `manager` | Все бронирования |
| `mySupportRequests` | `client` | Мои заявки в поддержку |
| `allSupportRequests` | `manager` | Все активные заявки |
| `supportMessages(requestId)` | `client`, `manager` | История сообщений заявки |
| `adminUsers(...)` | `admin` | Поиск пользователей (для admin) |
| `managerUsers(...)` | `manager` | Поиск пользователей (для manager) |

### Mutations

| Название | Доступ | Описание |
|---|---|---|
| `login(input)` | Публичный | Вход — возвращает токены + user |
| `register(input)` | Публичный | Регистрация клиента |
| `refreshToken(refreshToken)` | Публичный | Обновление токенов |
| `createReservation(input)` | `client` | Создать бронирование |
| `deleteReservation(id)` | `client`, `manager` | Отменить бронирование |
| `adminCreateUser(input)` | `admin` | Создать пользователя |
| `closeSupportRequest(id)` | `manager` | Закрыть заявку поддержки |

### Что осталось на REST

Некоторые операции не вынесены в GraphQL по техническим причинам:

| Операция | Причина |
|---|---|
| Создание/редактирование отеля (`POST/PUT /api/admin/hotels`) | Загрузка файлов через `multipart/form-data` — несовместимо с GraphQL |
| Создание/редактирование комнаты (`POST/PUT /api/admin/hotel-rooms`) | Та же причина |
| Удаление отелей/комнат (`DELETE`) | Оставлены на REST для консистентности с создание/обновлением |
| Создание заявки в поддержку | Идёт через WebSocket (`requestSupport` event), не через HTTP |

---

## 7. Разделение ответственности NgRx vs Apollo

Ключевой принцип архитектуры: **Apollo управляет серверными данными, NgRx управляет UI-состоянием**.

```
┌─────────────────────────────┬──────────────────────────────────────┐
│ Apollo InMemoryCache        │ NgRx Store                           │
├─────────────────────────────┼──────────────────────────────────────┤
│ Кеш ответов от сервера      │ hotels.term (строка поиска)          │
│ (hotels, rooms, users...)   │ hotels.dateArrival                   │
│                             │ hotels.dateDeparture                 │
│                             │ users.searchParams                   │
│                             │ *.loading (флаг загрузки)            │
│                             │ *.error (ошибка)                     │
│                             │ auth.user (текущий пользователь)     │
│                             │ auth.accessToken / refreshToken      │
└─────────────────────────────┴──────────────────────────────────────┘
```

**Поток данных:**

```
UI изменяет фильтр (NgRx action)
    → NgRx reducer обновляет UI state (term, dates)
    → NgRx effect читает state + вызывает ApolloService
    → Apollo делает запрос на сервер с новыми параметрами
    → Ответ приходит → NgRx action success → reducer обновляет items
    → Компоненты читают items через selectors
```

Компоненты продолжают работать с NgRx (через `store.select(...)`) — они не знают что данные теперь приходят через GraphQL, а не REST.
