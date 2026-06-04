import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'gp-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],})
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
