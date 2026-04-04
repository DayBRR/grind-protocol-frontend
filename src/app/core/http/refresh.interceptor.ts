import { HttpInterceptorFn, HttpStatusCode } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';

export const refreshInterceptor: HttpInterceptorFn = (req, next) => {
  // DEV BYPASS — remove when backend is connected
  return next(req).pipe(catchError(() => []));
};
