import { Injectable, signal } from '@angular/core';

/**
 * Хранилище access-токена.
 *
 * Токен живёт только в памяти: localStorage читается любым JavaScript,
 * поэтому XSS выгружал оттуда и access, и refresh (C-7 в BACKLOG.md).
 * Refresh теперь вообще не приходит на клиент — он в httpOnly-cookie,
 * а сессия после перезагрузки страницы восстанавливается вызовом /api/auth/refresh.
 */
@Injectable({ providedIn: 'root' })
export class AuthToken {
  private readonly token = signal<string | null>(null);

  getAccessToken(): string | null {
    return this.token();
  }

  setAccessToken(token: string | null): void {
    this.token.set(token);
  }

  clear(): void {
    this.token.set(null);
  }
}
