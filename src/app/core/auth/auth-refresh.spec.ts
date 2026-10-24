import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { authGuard } from './auth.guard';
import { authInterceptor } from '../http/auth.interceptor';
import { refreshInterceptor } from '../http/refresh.interceptor';
import { environment } from '../../../environments/environment';

describe('Automatic session renewal', () => {
  const base = `${environment.apiUrl}/auth`;
  let http: HttpClient;
  let backend: HttpTestingController;
  let auth: AuthService;
  let router: jasmine.SpyObj<Router>;

  function guard(): Observable<unknown> {
    return TestBed.runInInjectionContext(() => authGuard(
      {} as ActivatedRouteSnapshot, {} as RouterStateSnapshot
    )) as Observable<unknown>;
  }

  beforeEach(() => {
    localStorage.setItem('gp_access_token', 'old-token');
    router = jasmine.createSpyObj('Router', ['navigate', 'createUrlTree']);
    TestBed.configureTestingModule({ providers: [
      provideHttpClient(withInterceptors([authInterceptor, refreshInterceptor])),
      provideHttpClientTesting(), { provide: Router, useValue: router }
    ] });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
  });

  afterEach(() => {
    backend.verify();
    localStorage.removeItem('gp_access_token');
  });

  it('shares one refresh between concurrent 401s and the guard, retrying with the new token', () => {
    let completed = 0;
    http.get('/first').subscribe(() => completed++);
    http.get('/second').subscribe(() => completed++);
    backend.expectOne('/first').flush({}, { status: 401, statusText: 'Unauthorized' });
    backend.expectOne('/second').flush({}, { status: 401, statusText: 'Unauthorized' });
    guard().subscribe(result => expect(result).toBe(true));
    const refresh = backend.expectOne(`${base}/refresh`);
    expect(refresh.request.withCredentials).toBeTrue();
    expect(refresh.request.headers.has('Authorization')).toBeFalse();
    refresh.flush({ token: 'new-token' });
    for (const url of ['/first', '/second']) {
      const retry = backend.expectOne(url);
      expect(retry.request.headers.get('Authorization')).toBe('Bearer new-token');
      retry.flush({});
    }
    expect(completed).toBe(2);
    expect(auth.accessToken()).toBe('new-token');
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('reuses the replacement token for a late 401 without a second refresh', () => {
    http.get('/early').subscribe();
    http.get('/late').subscribe();
    const late = backend.expectOne('/late');
    backend.expectOne('/early').flush({}, { status: 401, statusText: 'Unauthorized' });
    backend.expectOne(`${base}/refresh`).flush({ token: 'new-token' });
    backend.expectOne('/early').flush({});
    late.flush({}, { status: 401, statusText: 'Unauthorized' });
    backend.expectNone(`${base}/refresh`);
    const retry = backend.expectOne('/late');
    expect(retry.request.headers.get('Authorization')).toBe('Bearer new-token');
    retry.flush({});
  });

  for (const code of ['AUTH_REFRESH_MISSING', 'AUTH_REFRESH_INVALID', 'AUTH_REFRESH_EXPIRED',
    'AUTH_REFRESH_REVOKED', 'AUTH_REFRESH_REUSED', 'AUTH_SUSPICIOUS_SESSION']) {
    it(`clears the session once for concurrent requests rejected with ${code}`, () => {
      http.get('/first').subscribe({ error: () => {} });
      http.get('/second').subscribe({ error: () => {} });
      backend.expectOne('/first').flush({}, { status: 401, statusText: 'Unauthorized' });
      const second = backend.expectOne('/second');
      guard().subscribe();
      backend.expectOne(`${base}/refresh`).flush({ code }, { status: 401, statusText: 'Unauthorized' });
      second.flush({}, { status: 401, statusText: 'Unauthorized' });
      backend.expectNone(`${base}/refresh`);
      expect(auth.accessToken()).toBeNull();
      expect(router.navigate).toHaveBeenCalledTimes(1);
    });
  }

  for (const status of [0, 500, 429, 401]) {
    it(`preserves the session for an unclassified refresh failure (${status}) and allows recovery`, () => {
      let result: unknown;
      guard().subscribe(value => result = value);
      const refresh = backend.expectOne(`${base}/refresh`);
      if (status === 0) refresh.error(new ProgressEvent('error'));
      else refresh.flush({}, { status, statusText: 'Failure' });
      expect(result).toBe(false);
      expect(auth.accessToken()).toBe('old-token');
      expect(router.navigate).not.toHaveBeenCalled();
      auth.refresh().subscribe();
      backend.expectOne(`${base}/refresh`).flush({ token: 'recovered' });
      expect(auth.accessToken()).toBe('recovered');
    });
  }

  for (const status of [401, 403, 500]) {
    it(`propagates retry HTTP ${status} without clearing the session or refreshing again`, () => {
      let received: number | undefined;
      http.get('/resource').subscribe({ error: error => received = error.status });
      backend.expectOne('/resource').flush({}, { status: 401, statusText: 'Unauthorized' });
      backend.expectOne(`${base}/refresh`).flush({ token: 'new-token' });
      backend.expectOne('/resource').flush({}, { status, statusText: 'Failure' });
      backend.expectNone(`${base}/refresh`);
      expect(received).toBe(status);
      expect(auth.accessToken()).toBe('new-token');
      expect(router.navigate).not.toHaveBeenCalled();
    });
  }

  it('preserves the session when the retried request has a network failure', () => {
    http.get('/resource').subscribe({ error: () => {} });
    backend.expectOne('/resource').flush({}, { status: 401, statusText: 'Unauthorized' });
    backend.expectOne(`${base}/refresh`).flush({ token: 'new-token' });
    backend.expectOne('/resource').error(new ProgressEvent('error'));
    expect(auth.accessToken()).toBe('new-token');
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('keeps a refresh running when one waiter unsubscribes', () => {
    const first = auth.refresh().subscribe();
    const refresh = backend.expectOne(`${base}/refresh`);
    first.unsubscribe();
    auth.refresh().subscribe();
    backend.expectNone(`${base}/refresh`);
    expect(refresh.cancelled).toBeFalse();
    refresh.flush({ token: 'new-token' });
    expect(auth.accessToken()).toBe('new-token');
  });

  it('does not restore a session when refresh completes after logout', () => {
    auth.refresh().subscribe({ error: () => {} });
    const refresh = backend.expectOne(`${base}/refresh`);
    auth.logout();
    backend.expectOne(`${base}/logout`).flush(null);
    refresh.flush({ token: 'obsolete' });
    expect(auth.accessToken()).toBeNull();
  });

  it('does not invalidate a new login when an earlier guard refresh is rejected', () => {
    let result: unknown;
    guard().subscribe(value => result = value);
    const refresh = backend.expectOne(`${base}/refresh`);
    auth.login({ username: 'user', password: 'password' }).subscribe();
    backend.expectOne(`${base}/login`).flush({ token: 'new-session' });
    refresh.flush({ code: 'AUTH_REFRESH_REVOKED' }, { status: 401, statusText: 'Unauthorized' });
    expect(auth.accessToken()).toBe('new-session');
    expect(result).toBe(false);
    expect(router.navigate).not.toHaveBeenCalled();
    expect(router.createUrlTree).not.toHaveBeenCalled();
  });

  for (const endpoint of ['login', 'register']) {
    it(`keeps ${endpoint} working without attempting automatic refresh on rejection`, () => {
      const request = endpoint === 'login'
        ? () => auth.login({ username: 'user', password: 'password' })
        : () => auth.register({ username: 'user', password: 'password', email: 'u@example.com' });
      request().subscribe();
      const success = backend.expectOne(`${base}/${endpoint}`);
      expect(success.request.withCredentials).toBeTrue();
      success.flush({ token: 'authenticated' });
      expect(auth.accessToken()).toBe('authenticated');
      request().subscribe({ error: () => {} });
      backend.expectOne(`${base}/${endpoint}`).flush({}, { status: 401, statusText: 'Unauthorized' });
      backend.expectNone(`${base}/refresh`);
      expect(auth.accessToken()).toBe('authenticated');
    });
  }

  it('completes local logout even if the server is unreachable', () => {
    auth.logout();
    const logout = backend.expectOne(`${base}/logout`);
    expect(logout.request.withCredentials).toBeTrue();
    logout.error(new ProgressEvent('error'));
    expect(auth.accessToken()).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
  });
});
