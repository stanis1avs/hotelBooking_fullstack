import { HttpInterceptorFn } from '@angular/common/http';

export const credentialsInterceptor: HttpInterceptorFn = (req, next) => {
  const withCredentialsReq = req.clone({ withCredentials: true });
  return next(withCredentialsReq);
};
