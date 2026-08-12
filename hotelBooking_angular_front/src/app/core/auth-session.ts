import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, of, shareReplay, tap } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthToken } from './auth-token';
import { UserDto } from './api';

interface RefreshResponse extends UserDto {
  access_token: string;
}

/**
 * Восстановление сессии по refresh-cookie.
 *
 * Живёт отдельно от NgRx-эффектов, потому что вызывается ещё до старта
 * приложения (APP_INITIALIZER) и из HTTP-интерцептора — из мест, где
 * диспетчеризация экшенов недоступна или приводит к циклу.
 */
@Injectable({ providedIn: 'root' })
export class AuthSession {
  private readonly http = inject(HttpClient);
  private readonly authToken = inject(AuthToken);
  private inFlight: Observable<string> | null = null;

  /** Обменивает httpOnly-cookie на новый access-токен. */
  refresh(): Observable<string> {
    if (this.inFlight) return this.inFlight;

    this.inFlight = this.http
      .post<RefreshResponse>(`${environment.api.host}${environment.api.endpoints.authRefresh}`, {}, { withCredentials: true })
      .pipe(
        map((res) => res.access_token),
        tap((token) => this.authToken.setAccessToken(token)),
        tap({ finalize: () => (this.inFlight = null) }),
        shareReplay({ bufferSize: 1, refCount: false })
      );

    return this.inFlight;
  }

  /** Пробует восстановить сессию на старте приложения; отсутствие cookie — не ошибка. */
  restore(): Observable<boolean> {
    return this.refresh().pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }

  logout(): Observable<void> {
    this.authToken.clear();
    return this.http
      .post<void>(`${environment.api.host}${environment.api.endpoints.authLogout}`, {}, { withCredentials: true })
      .pipe(catchError(() => of(void 0)));
  }
}
