import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { finalize, tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, LoginRequest, RegisterRequest, TokenPayload } from '../models/auth.models';

const ACCESS_TOKEN_KEY = 'gp_access_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly base = `${environment.apiUrl}/auth`;

  private readonly _accessToken = signal<string | null>(
    localStorage.getItem(ACCESS_TOKEN_KEY)
  );

  readonly isAuthenticated = computed(() => !!this._accessToken());
  readonly accessToken = this._accessToken.asReadonly();

  login(req: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/login`, req, {
      withCredentials: true
    }).pipe(
      tap(res => this.storeAccessToken(res))
    );
  }

  register(req: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/register`, req, {
      withCredentials: true
    }).pipe(
      tap(res => this.storeAccessToken(res))
    );
  }

  refresh(): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/refresh`, null, {
      withCredentials: true
    }).pipe(
      tap(res => this.storeAccessToken(res))
    );
  }

  logout(): void {
    this.http.post<void>(`${this.base}/logout`, null, {
      withCredentials: true
    }).pipe(
      finalize(() => this.clearSessionAndRedirect())
    ).subscribe();
  }

  clearSession(): void {
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
