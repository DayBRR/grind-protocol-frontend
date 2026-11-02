import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { environment as productionEnvironment } from '../../../environments/environment.prod';
import { AuthService } from '../auth/auth.service';
import { ApiService } from './api.service';
import { authInterceptor } from './auth.interceptor';
import { refreshInterceptor } from './refresh.interceptor';

for (const config of [
  { name: 'development', production: false, apiUrl: 'http://localhost:8080/api' },
  { name: 'production', ...productionEnvironment }
]) {
  describe(`API routing in ${config.name}`, () => {
    let original: typeof environment;
    let backend: HttpTestingController;
    let api: ApiService;
    let auth: AuthService;
    let storedToken: string | null;

    beforeEach(() => {
      original = { ...environment };
      storedToken = localStorage.getItem('gp_access_token');
      localStorage.removeItem('gp_access_token');
      // Exercise the real clients with both bases without changing their contracts.
      Object.assign(environment, { production: config.production, apiUrl: config.apiUrl });
      TestBed.configureTestingModule({ providers: [
        provideHttpClient(withInterceptors([authInterceptor, refreshInterceptor])),
        provideHttpClientTesting(),
        { provide: Router, useValue: jasmine.createSpyObj('Router', ['navigate']) }
      ] });
      backend = TestBed.inject(HttpTestingController);
      api = TestBed.inject(ApiService);
      auth = TestBed.inject(AuthService);
    });

    afterEach(() => {
      try {
        backend.verify();
      } finally {
        Object.assign(environment, original);
        if (storedToken === null) localStorage.removeItem('gp_access_token');
        else localStorage.setItem('gp_access_token', storedToken);
      }
    });

    it('uses exactly one /api prefix for every API verb and retains query parameters', () => {
      if (config.production) expect(config.apiUrl).toBe('/api');
      api.get('/me/tasks', { active: true, page: 2 }).subscribe();
      const get = backend.expectOne(`${config.apiUrl}/me/tasks?active=true&page=2`);
      expect(get.request.method).toBe('GET');
      expect(get.request.url).not.toContain('/api/api');
      get.flush([]);
      for (const method of ['post', 'put', 'patch'] as const) {
        api[method]('/me/profile', { displayName: 'Test' }).subscribe();
        const request = backend.expectOne(`${config.apiUrl}/me/profile`);
        expect(request.request.method).toBe(method.toUpperCase());
        expect(request.request.body).toEqual({ displayName: 'Test' });
        request.flush({});
      }
      api.delete('/me/tasks/1').subscribe();
      const deletion = backend.expectOne(`${config.apiUrl}/me/tasks/1`);
      expect(deletion.request.method).toBe('DELETE');
      deletion.flush({});
    });

    for (const action of ['login', 'register'] as const) {
      it(`sends ${action} to the configured auth base with credentials`, () => {
        const credentials = { username: 'test', email: 'test@example.com', password: 'synthetic' };
        auth[action](credentials).subscribe();
        const request = backend.expectOne(`${config.apiUrl}/auth/${action}`);
        expect(request.request.method).toBe('POST');
        expect(request.request.withCredentials).toBeTrue();
        expect(request.request.headers.has('Authorization')).toBeFalse();
        request.flush({ token: 'synthetic-access-token' });
        expect(auth.accessToken()).toBe('synthetic-access-token');
      });
    }

    it('uses the cookie-compatible auth paths for refresh and logout', () => {
      auth.refresh().subscribe();
      const refresh = backend.expectOne(`${config.apiUrl}/auth/refresh`);
      expect(refresh.request.method).toBe('POST');
      expect(refresh.request.withCredentials).toBeTrue();
      refresh.flush({ token: 'synthetic-access-token' });
      auth.logout();
      const logout = backend.expectOne(`${config.apiUrl}/auth/logout`);
      expect(logout.request.method).toBe('POST');
      expect(logout.request.withCredentials).toBeTrue();
      expect(logout.request.headers.has('Authorization')).toBeFalse();
      logout.flush(null);
      expect(auth.accessToken()).toBeNull();
    });
  });
}
