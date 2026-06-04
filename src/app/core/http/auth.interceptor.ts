import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.accessToken();

  if (!token || isAuthRequest(req.url)) {
    return next(req);
  }

  return next(
    req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    })
  );
};

function isAuthRequest(url: string): boolean {
  return url.includes('/auth/login')
    || url.includes('/auth/register')
    || url.includes('/auth/refresh')
    || url.includes('/auth/logout');
}
