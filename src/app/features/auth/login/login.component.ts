import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'gp-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],})
export class LoginComponent {
  private readonly auth   = inject(AuthService);
  private readonly router = inject(Router);

  username = '';
  password = '';
  loading  = signal(false);
  error    = signal<string | null>(null);

  submit(): void {
    if (this.loading()) {
      return;
    }

    const username = this.username.trim();
    const password = this.password;

    if (!username || !password) {
      this.error.set('Please enter your username and password.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.auth.login({ username, password }).pipe(
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: err => this.error.set(this.resolveErrorMessage(err, 'Login failed. Please check your credentials.'))
    });
  }

  private resolveErrorMessage(err: any, fallback: string): string {
    return err?.error?.message
      ?? err?.error?.detail
      ?? err?.error?.error
      ?? fallback;
  }
}
