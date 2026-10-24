import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, finalize, shareReplay, tap } from 'rxjs/operators';
import { defer, Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, LoginRequest, RegisterRequest, TokenPayload } from '../models/auth.models';

const ACCESS_TOKEN_KEY = 'gp_access_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly base = `${environment.apiUrl}/auth`;
  private refreshInFlight?: Observable<AuthResponse>;
  private sessionVersion = 0;

  private readonly _accessToken = signal<string | null>(
    localStorage.getItem(ACCESS_TOKEN_KEY)
  );

  readonly isAuthenticated = computed(() => !!this._accessToken());
  readonly accessToken = this._accessToken.asReadonly();

  login(req: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/login`, req, {
      withCredentials: true
    }).pipe(
      tap(res => { this.sessionVersion++; this.storeAccessToken(res); })
    );
  }

  register(req: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/register`, req, {
      withCredentials: true
    }).pipe(
      tap(res => { this.sessionVersion++; this.storeAccessToken(res); })
    );
  }

  refresh(): Observable<AuthResponse> {
    // Resolve on subscription so even independently created observables join the flight.
    return defer(() => {
      if (!this.refreshInFlight) {
        const version = this.sessionVersion;
        this.refreshInFlight = this.http.post<AuthResponse>(`${this.base}/refresh`, null, {
          withCredentials: true
        }).pipe(
          tap(res => {
            if (version !== this.sessionVersion) {
              throw new Error('Session changed during refresh.');
            }
            this.storeAccessToken(res);
          }),
          catchError(error => {
            if (version === this.sessionVersion && this.isDefinitiveRefreshError(error)) {
              this.clearSessionAndRedirect();
            }
            return throwError(() => error);
          }),
          // Finalize the HTTP source once, not each waiting subscriber.
          finalize(() => { this.refreshInFlight = undefined; }),
          shareReplay({ bufferSize: 1, refCount: false })
        );
      }
      return this.refreshInFlight;
    });
  }

  isDefinitiveRefreshError(error: unknown): boolean {
    return error instanceof HttpErrorResponse && error.status === 401 && [
      'AUTH_REFRESH_MISSING', 'AUTH_REFRESH_INVALID', 'AUTH_REFRESH_EXPIRED',
      'AUTH_REFRESH_REVOKED', 'AUTH_REFRESH_REUSED', 'AUTH_SUSPICIOUS_SESSION'
    ].includes(error.error?.code);
  }

  logout(): void {
    this.clearSession();
    const version = this.sessionVersion;
    this.http.post<void>(`${this.base}/logout`, null, {
      withCredentials: true
    }).pipe(
      finalize(() => {
        if (version === this.sessionVersion) this.router.navigate(['/auth/login']);
      })
    ).subscribe({ error: () => { /* Local logout also completes when offline. */ } });
  }

  clearSession(): void {
    this.sessionVersion++;
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    this._accessToken.set(null);
  }

  clearSessionAndRedirect(): void {
    this.clearSession();
    this.router.navigate(['/auth/login']);
  }

  getTokenPayload(): TokenPayload | null {
    const token = this._accessToken();
    if (!token) {
      return null;
    }

    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload)) as TokenPayload;
    } catch {
      return null;
    }
  }

  isAccessTokenExpired(): boolean {
    const payload = this.getTokenPayload();
    if (!payload?.exp) {
      return true;
    }

    const expirationInMs = payload.exp * 1000;
    return Date.now() >= expirationInMs;
  }

  private storeAccessToken(res: AuthResponse): void {
    const token = res.token ?? res.accessToken;

    if (!token) {
      throw new Error('Auth response does not contain an access token.');
    }

    localStorage.setItem(ACCESS_TOKEN_KEY, token);
    this._accessToken.set(token);
  }
}
