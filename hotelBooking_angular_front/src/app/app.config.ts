import { ApplicationConfig, inject, provideBrowserGlobalErrorListeners } from '@angular/core';
// apollo-angular uses Angular HttpClient, so authInterceptor already adds Bearer token to /graphql requests
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { InMemoryCache } from '@apollo/client/core';
import { provideApollo } from 'apollo-angular';
import { HttpLink } from 'apollo-angular/http';

import { routes } from './app.routes';
import { provideStore } from '@ngrx/store';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { provideEffects } from '@ngrx/effects';
import { bookingFeature } from './reducers/booking.reducer';
import { authFeature } from './reducers/auth.reducer';
import { hotelsFeature } from './reducers/hotels.reducer';
import { roomsFeature } from './reducers/rooms.reducer';
import { reservationsFeature } from './reducers/reservations.reducer';
import { supportFeature } from './reducers/support.reducer';
import { usersFeature } from './reducers/users.reducer';
import { credentialsInterceptor } from './core/credentials-interceptor';
import { authInterceptor } from './core/auth-interceptor';
import { AuthEffects } from './effects/auth.effects';
import { HotelsEffects } from './effects/hotels.effects';
import { RoomsEffects } from './effects/rooms.effects';
import { ReservationsEffects } from './effects/reservations.effects';
import { SupportEffects } from './effects/support.effects';
import { UsersEffects } from './effects/users.effects';
import { environment } from '../environments/environment';

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
      [usersFeature.name]: usersFeature.reducer,
    }),
    provideEffects([AuthEffects, HotelsEffects, RoomsEffects, ReservationsEffects, SupportEffects, UsersEffects]),
    provideStoreDevtools({
      maxAge: 25,
      logOnly: false,
    }),
    provideApollo(() => {
      const httpLink = inject(HttpLink);
      return {
        link: httpLink.create({ uri: `${environment.api.host}/graphql` }),
        cache: new InMemoryCache(),
        defaultOptions: {
          watchQuery: { fetchPolicy: 'network-only' },
          query: { fetchPolicy: 'network-only' },
        },
      };
    }),
  ],
};
