import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'gp-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-card__logo">
          <div class="logo-box"><div class="logo-icon"></div></div>
          <h1 class="auth-card__brand">Grind Protocol</h1>
        </div>

        <h2 class="auth-card__title">Begin your grind</h2>
        <p class="auth-card__sub">Create your account and start building discipline</p>

        @if (error()) {
          <div class="auth-card__error">{{ error() }}</div>
        }

        <div class="auth-form">
          <div class="form-field">
            <label class="form-label">Username</label>
            <input
              type="text"
              placeholder="your_username"
              [(ngModel)]="username"
              autocomplete="username"
              [disabled]="loading()"
            />
          </div>

          <div class="form-field">
            <label class="form-label">Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              [(ngModel)]="email"
              autocomplete="email"
              [disabled]="loading()"
            />
          </div>

          <div class="form-field">
            <label class="form-label">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              [(ngModel)]="password"
              autocomplete="new-password"
              [disabled]="loading()"
              (keyup.enter)="submit()"
            />
          </div>

          <button
            class="btn btn-primary auth-submit"
            [disabled]="loading()"
            (click)="submit()"
          >
            {{ loading() ? 'Creating account...' : 'Create account' }}
          </button>
        </div>

        <p class="auth-card__footer">
          Already grinding? <a routerLink="/auth/login">Log in</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .auth-page {
      min-height: 100vh;
      background: var(--bg-base);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }

    .auth-card {
      width: 100%;
      max-width: 400px;
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-xl);
      padding: 36px 32px;
      position: relative;
      overflow: hidden;
      animation: fade-in 0.3s ease-out;
    }

    .auth-card::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 2px;
      background: linear-gradient(90deg, var(--primary), var(--xp));
      opacity: 0.6;
    }

    .auth-card__logo {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 28px;
    }

    .logo-box {
      width: 36px; height: 36px;
      background: var(--primary);
      border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 0 16px var(--primary-dim);
      flex-shrink: 0;
    }

    .logo-icon {
      width: 18px; height: 18px;
      border: 2.5px solid white;
      border-radius: 3px;
      position: relative;
    }

    .logo-icon::after {
      content: '';
      position: absolute;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      width: 6px; height: 6px;
      background: white; border-radius: 1px;
    }

    .auth-card__brand { font-size: 16px; font-weight: 800; color: var(--text); }
    .auth-card__title { font-size: 22px; font-weight: 800; margin-bottom: 6px; }
    .auth-card__sub   { font-size: 13px; color: var(--text-muted); margin-bottom: 24px; }

    .auth-card__error {
      background: rgba(239,68,68,0.1);
      border: 1px solid rgba(239,68,68,0.25);
      border-radius: var(--radius-md);
      color: var(--danger);
      font-size: 12px;
      padding: 10px 14px;
      margin-bottom: 18px;
    }

    .auth-form { display: flex; flex-direction: column; gap: 16px; }
    .form-field { display: flex; flex-direction: column; gap: 6px; }

    .form-label {
      font-size: 11px;
      font-weight: 600;
      color: var(--text-dim);
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }

    .auth-submit {
      width: 100%;
      justify-content: center;
      padding: 12px;
      font-size: 14px;
      margin-top: 4px;
    }

    .auth-submit:disabled { opacity: 0.6; cursor: not-allowed; }

    .auth-card__footer {
      text-align: center;
      margin-top: 20px;
      font-size: 12px;
      color: var(--text-muted);
    }
  `]
})
export class RegisterComponent {
  private readonly auth   = inject(AuthService);
  private readonly router = inject(Router);

  username = '';
  email    = '';
  password = '';
  loading  = signal(false);
  error    = signal<string | null>(null);

  submit(): void {
    if (this.loading()) {
      return;
    }

    const username = this.username.trim();
    const email = this.email.trim();
    const password = this.password;

    if (!username || !email || !password) {
      this.error.set('Please fill in all fields.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.auth.register({ username, email, password }).pipe(
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: err => this.error.set(this.resolveErrorMessage(err, 'Registration failed. Please try again.'))
    });
  }

  private resolveErrorMessage(err: any, fallback: string): string {
    return err?.error?.message
      ?? err?.error?.detail
      ?? err?.error?.error
      ?? fallback;
  }
}
