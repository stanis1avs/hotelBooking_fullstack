import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../environments/environment';

/**
 * withCredentials нужен только для запросов к собственному API — там живёт
 * refresh-cookie. Раньше флаг ставился вообще на все запросы, включая
 * обращения к сторонним хостам.
 *
 * В проде host пустой (запросы относительные), поэтому проверяем,
 * что адрес не абсолютный и ведёт на наш же origin.
 */
const isOwnApi = (url: string): boolean => {
  const host = environment.api.host;
  if (host) return url.startsWith(host);
  return !/^https?:\/\//i.test(url);
};

export const credentialsInterceptor: HttpInterceptorFn = (req, next) => {
  if (!isOwnApi(req.url)) {
    return next(req);
  }
  return next(req.clone({ withCredentials: true }));
};
