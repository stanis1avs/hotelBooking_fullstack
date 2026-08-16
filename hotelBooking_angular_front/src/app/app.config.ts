import {
  ApplicationConfig,
  LOCALE_ID,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeRu from '@angular/common/locales/ru';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { InMemoryCache } from '@apollo/client/core';
import { provideApollo } from 'apollo-angular';
import { HttpLink } from 'apollo-angular/http';

import { routes } from './app.routes';
import { provideStore } from '@ngrx/store';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { provideEffects } from '@ngrx/effects';
import { authFeature } from './reducers/auth.reducer';
import { hotelsFeature } from './reducers/hotels.reducer';
import { roomsFeature } from './reducers/rooms.reducer';
import { reservationsFeature } from './reducers/reservations.reducer';
import { supportFeature } from './reducers/support.reducer';
import { usersFeature } from './reducers/users.reducer';
import { credentialsInterceptor } from './core/credentials-interceptor';
import { authInterceptor } from './core/auth-interceptor';
import { AuthSession } from './core/auth-session';
import { russianPaginatorIntl } from './core/paginator-intl';
import { AuthEffects } from './effects/auth.effects';
import { HotelsEffects } from './effects/hotels.effects';
import { RoomsEffects } from './effects/rooms.effects';
import { ReservationsEffects } from './effects/reservations.effects';
import { SupportEffects } from './effects/support.effects';
import { UsersEffects } from './effects/users.effects';
import { environment } from '../environments/environment';

/**
 * Access-токен живёт только в памяти, поэтому после перезагрузки страницы
 * сессию нужно восстановить по httpOnly-cookie до первого рендера.
 */
// Без регистрации локали DatePipe выводит месяцы по-английски
// («Создано 13 September 2023»), а календарь открывается с воскресенья.
registerLocaleData(localeRu);

export const appConfig: ApplicationConfig = {
  providers: [
    // Явно фиксируем зональную стратегию: без неё поведение обнаружения
    // изменений зависит от умолчаний версии, а приложение отрисовывалось
    // наполовину и достраивалось только после первого клика.
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideBrowserGlobalErrorListeners(),
    // provideAnimationsAsync устарел в Angular 19+
    provideAnimations(),
    provideHttpClient(withInterceptors([credentialsInterceptor, authInterceptor])),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'top', anchorScrolling: 'enabled' })
    ),
    provideStore({
      [authFeature.name]: authFeature.reducer,
      [hotelsFeature.name]: hotelsFeature.reducer,
      [roomsFeature.name]: roomsFeature.reducer,
      [reservationsFeature.name]: reservationsFeature.reducer,
      [supportFeature.name]: supportFeature.reducer,
      [usersFeature.name]: usersFeature.reducer,
    }),
    provideEffects([AuthEffects, HotelsEffects, RoomsEffects, ReservationsEffects, SupportEffects, UsersEffects]),
    // В проде DevTools отдавали наружу всё состояние приложения, включая данные пользователей.
    provideStoreDevtools({
      maxAge: 25,
      logOnly: environment.production,
      connectInZone: true,
    }),
    provideApollo(() => {
      const httpLink = inject(HttpLink);
      return {
        link: httpLink.create({ uri: `${environment.api.host}/graphql`, withCredentials: true }),
        cache: new InMemoryCache(),
        defaultOptions: {
          watchQuery: { fetchPolicy: 'network-only' },
          query: { fetchPolicy: 'network-only' },
        },
      };
    }),
    /**
     * Восстановление сессии не блокирует запуск.
     *
     * Раньше здесь стоял APP_INITIALIZER, который дожидался ответа
     * /api/auth/refresh перед первой отрисовкой. Пока запрос шёл,
     * приложение стартовало в незавершённом состоянии: поля Material
     * без рамок и подписей, routerLinkActive без подсветки — и всё
     * достраивалось только после первого события от пользователя.
     *
     * Если токена нет, запрос к данным получит 401, и интерцептор
     * сам обновит токен и повторит запрос.
     */
    provideAppInitializer(() => {
      inject(AuthSession).restore().subscribe();
    }),
    { provide: LOCALE_ID, useValue: 'ru-RU' },
    { provide: MAT_DATE_LOCALE, useValue: 'ru-RU' },
    { provide: MatPaginatorIntl, useFactory: russianPaginatorIntl },
  ],
};
