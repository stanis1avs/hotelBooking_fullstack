import { ApplicationConfig, provideAppInitializer, inject, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { routes } from './app.routes';
import { Store, provideStore } from '@ngrx/store';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { provideEffects } from '@ngrx/effects';
import { bookingFeature } from './reducers/booking.reducer';
import { authFeature } from './reducers/auth.reducer';
import { hotelsFeature } from './reducers/hotels.reducer';
import { roomsFeature } from './reducers/rooms.reducer';
import { reservationsFeature } from './reducers/reservations.reducer';
import { supportFeature } from './reducers/support.reducer';
import { credentialsInterceptor } from './core/credentials-interceptor';
import { authInterceptor } from './core/auth-interceptor';
import { AuthEffects } from './effects/auth.effects';
import { HotelsEffects } from './effects/hotels.effects';
import { RoomsEffects } from './effects/rooms.effects';
import { ReservationsEffects } from './effects/reservations.effects';
import { SupportEffects } from './effects/support.effects';
import { AuthToken } from './core/auth-token';
import { AuthActions } from './actions/auth.actions';
import { selectAuthUser } from './selectors/auth.selectors';
import { filter, firstValueFrom, timeout, catchError, of } from 'rxjs';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideAnimationsAsync(),
    provideHttpClient(withInterceptors([credentialsInterceptor, authInterceptor])),
    provideRouter(routes),
    provideStore({
      [bookingFeature.name]: bookingFeature.reducer,
      [authFeature.name]: authFeature.reducer,
      [hotelsFeature.name]: hotelsFeature.reducer,
      [roomsFeature.name]: roomsFeature.reducer,
      [reservationsFeature.name]: reservationsFeature.reducer,
      [supportFeature.name]: supportFeature.reducer,
    }),
    provideEffects([AuthEffects, HotelsEffects, RoomsEffects, ReservationsEffects, SupportEffects]),
    provideStoreDevtools({
      maxAge: 25,
      logOnly: false,
    }),
    provideAppInitializer(() => {
      const store = inject(Store);
      const authToken = inject(AuthToken);
      if (!authToken.getAccessToken()) return;
      store.dispatch(AuthActions.loadCurrentUser());
      return firstValueFrom(
        store.select(selectAuthUser).pipe(
          filter((user) => user !== null),
          timeout(5000),
          catchError(() => of(null))
        )
      ).then(() => void 0);
    }),
  ],
};
