import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AuthToken {
  private readonly accessKey = 'access_token';
  private readonly refreshKey = 'refresh_token';

  getAccessToken(): string | null {
    return localStorage.getItem(this.accessKey);
  }

  setAccessToken(token: string | null): void {
    if (!token) {
      localStorage.removeItem(this.accessKey);
      return;
    }
    localStorage.setItem(this.accessKey, token);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.refreshKey);
  }

  setRefreshToken(token: string | null): void {
    if (!token) {
      localStorage.removeItem(this.refreshKey);
      return;
    }
    localStorage.setItem(this.refreshKey, token);
  }

  clear(): void {
    localStorage.removeItem(this.accessKey);
    localStorage.removeItem(this.refreshKey);
  }
}
