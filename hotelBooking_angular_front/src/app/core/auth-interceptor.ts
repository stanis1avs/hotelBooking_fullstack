import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthToken } from './auth-token';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authToken = inject(AuthToken);

  if (req.url.includes('/api/auth/login') || req.url.includes('/api/client/register') || req.url.includes('/api/auth/refresh')) {
    return next(req);
  }

  const token = authToken.getAccessToken();
  if (!token) {
    return next(req);
  }

  return next(
    req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    })
  );
};
