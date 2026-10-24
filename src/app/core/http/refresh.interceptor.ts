import { HttpErrorResponse, HttpInterceptorFn, HttpStatusCode } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, Observable, of, switchMap, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { AuthResponse } from '../models/auth.models';

export const refreshInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const sentAuthorization = req.headers.get('Authorization');

  return next(req).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse)) {
        return throwError(() => error);
      }

      if (error.status !== HttpStatusCode.Unauthorized || isAuthRequest(req.url)) {
        return throwError(() => error);
      }

      const currentToken = auth.accessToken();
      // A cleared session must not be restored by late failures from old requests.
      if (!currentToken || !sentAuthorization) return throwError(() => error);

      const renewal: Observable<AuthResponse | null> = sentAuthorization !== `Bearer ${currentToken}`
        ? of(null)
        : auth.refresh();

      return renewal.pipe(
        switchMap(() => {
          const token = auth.accessToken();

          if (!token) {
            return throwError(() => error);
          }

          return next(
            req.clone({
              setHeaders: {
                Authorization: `Bearer ${token}`
              }
            })
          );
        })
      );
    })
  );
};

function isAuthRequest(url: string): boolean {
  return url.includes('/auth/login')
    || url.includes('/auth/register')
    || url.includes('/auth/refresh')
    || url.includes('/auth/logout');
}
