import { HttpErrorResponse, HttpInterceptorFn, HttpStatusCode } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';

export const refreshInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse)) {
        return throwError(() => error);
      }

      if (error.status !== HttpStatusCode.Unauthorized || isAuthRequest(req.url)) {
        return throwError(() => error);
      }

      return auth.refresh().pipe(
        switchMap(() => {
          const token = auth.accessToken();

          if (!token) {
            auth.clearSessionAndRedirect();
            return throwError(() => error);
          }

          return next(
            req.clone({
              setHeaders: {
                Authorization: `Bearer ${token}`
              }
            })
          );
        }),
        catchError(refreshError => {
          auth.clearSessionAndRedirect();
          return throwError(() => refreshError);
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
