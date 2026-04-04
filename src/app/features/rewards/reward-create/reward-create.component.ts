import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RewardService } from '../../../core/http/reward.service';
import { Reward } from '../../../core/models/domain.models';

@Component({
  selector: 'gp-reward-create',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="create-page">
      <div class="create-card">

        <div class="create-header">
          <button class="btn btn-ghost btn--icon" (click)="router.navigate(['/rewards'])">←</button>
          <h1 class="create-title">New Reward</h1>
        </div>

        @if (error()) {
          <div class="form-error">{{ error() }}</div>
        }

        <div class="form-section">
          <label class="form-label">Title</label>
          <input type="text" placeholder="e.g. Buy a new book" [(ngModel)]="form.title" />
        </div>

        <div class="form-section">
          <label class="form-label">Description (optional)</label>
          <textarea placeholder="What is this reward?" [(ngModel)]="form.description" rows="2"></textarea>
        </div>

        <div class="form-section">
          <label class="form-label">Cost (Core Points)</label>
          <input type="number" min="1" placeholder="500" [(ngModel)]="form.costCorePoints" />
        </div>

        <div class="form-row">
          <div class="form-section">
            <label class="form-label">Availability</label>
            <select [(ngModel)]="form.availabilityType">
              <option value="UNLIMITED">Unlimited</option>
              <option value="COOLDOWN">Cooldown</option>
              <option value="LIMITED_PER_PERIOD">Limited per period</option>
            </select>
          </div>

          @if (form.availabilityType === 'COOLDOWN') {
            <div class="form-section">
              <label class="form-label">Cooldown (days)</label>
              <input type="number" min="1" placeholder="7" [(ngModel)]="form.cooldownDays" />
            </div>
          }
        </div>

        <div class="create-actions">
          <button class="btn btn-ghost" (click)="router.navigate(['/rewards'])">Cancel</button>
          <button class="btn btn-primary" [disabled]="saving()" (click)="save()">
            {{ saving() ? 'Saving...' : 'Create Reward' }}
          </button>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .create-page { display: flex; justify-content: center; padding-bottom: 40px; }

    .create-card {
      width: 100%; max-width: 520px;
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-xl);
      padding: 28px 32px;
      display: flex; flex-direction: column; gap: 18px;
    }

    .create-header { display: flex; align-items: center; gap: 14px; }
    .create-title  { font-size: 20px; font-weight: 800; }
    .btn--icon     { width: 34px; height: 34px; padding: 0; justify-content: center; flex-shrink: 0; }

    .form-error {
      background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.25);
      border-radius: var(--radius-md); color: var(--danger); font-size: 12px; padding: 10px 14px;
    }

    .form-section { display: flex; flex-direction: column; gap: 6px; }
    .form-row     { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }

    .form-label {
      font-size: 11px; font-weight: 600; color: var(--text-dim);
      letter-spacing: 0.06em; text-transform: uppercase;
    }

    textarea { resize: vertical; min-height: 60px; }

    .create-actions { display: flex; gap: 10px; justify-content: flex-end; }
  `]
})
export class RewardCreateComponent {
  readonly rewardService = inject(RewardService);
  readonly router        = inject(Router);

  form = {
    title:            '',
    description:      '',
    costCorePoints:   300,
    availabilityType: 'UNLIMITED' as Reward['availabilityType'],
    cooldownDays:     null as number | null
  };

  saving = signal(false);
  error  = signal<string | null>(null);

  save(): void {
    if (!this.form.title.trim()) { this.error.set('Title is required.'); return; }
    if (!this.form.costCorePoints || this.form.costCorePoints < 1) { this.error.set('Cost must be at least 1 CP.'); return; }
    this.saving.set(true);
    this.error.set(null);

    this.rewardService.createReward(this.form as Partial<Reward>).subscribe({
      next:  () => this.router.navigate(['/rewards']),
      error: err => {
        this.error.set(err?.error?.message ?? 'Failed to create reward.');
        this.saving.set(false);
      }
    });
  }
}
