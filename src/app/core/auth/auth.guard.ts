import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated() && !auth.isAccessTokenExpired()) {
    return true;
  }

  return auth.refresh().pipe(
    map(() => true),
    catchError(error => {
      return of(auth.isDefinitiveRefreshError(error) && !auth.accessToken()
        ? router.createUrlTree(['/auth/login'])
        : false);
    })
  );
};
