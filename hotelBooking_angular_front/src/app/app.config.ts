import {
  ApplicationConfig,
  APP_INITIALIZER,
  inject,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { InMemoryCache } from '@apollo/client/core';
import { provideApollo } from 'apollo-angular';
import { HttpLink } from 'apollo-angular/http';
import { firstValueFrom } from 'rxjs';

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
function restoreSession() {
  const session = inject(AuthSession);
  return () => firstValueFrom(session.restore());
}

export const appConfig: ApplicationConfig = {
  providers: [
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
    { provide: APP_INITIALIZER, useFactory: restoreSession, multi: true },
  ],
};
