import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../environments/environment';

/**
 * withCredentials нужен только для запросов к собственному API — там живёт
 * refresh-cookie. Раньше флаг ставился вообще на все запросы, включая
 * обращения к сторонним хостам.
 */
export const credentialsInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.api.host)) {
    return next(req);
  }
  return next(req.clone({ withCredentials: true }));
};
