import { Component, OnInit, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { RewardService } from '../../../core/http/reward.service';
import { UserProfileService } from '../../../core/auth/user-profile.service';
import { RewardCardComponent } from '../../../shared/components/reward-card/reward-card.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { Reward } from '../../../core/models/domain.models';

const REWARD_ICONS: Record<string, string> = {
  game: '🎮', book: '📚', food: '🍔', movie: '🎬',
  travel: '🌴', music: '🎵', sport: '⚽', coffee: '☕', default: '🎁'
};

function guessIcon(title: string): string {
  const lower = title.toLowerCase();
  for (const [key, icon] of Object.entries(REWARD_ICONS)) {
    if (lower.includes(key)) return icon;
  }
  return REWARD_ICONS['default'];
}

@Component({
  selector: 'gp-reward-store',
  standalone: true,
  imports: [DecimalPipe, RewardCardComponent, ConfirmModalComponent],
  template: `
    <div class="store-page">

      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Reward Store</h1>
          <p class="page-sub">
            Balance: <span class="mono text-gold">{{ profile()?.corePoints ?? 0 | number }} CP</span>
          </p>
        </div>
        <button class="btn btn-primary" (click)="router.navigate(['/rewards/new'])">
          + Create Reward
        </button>
      </div>

      <!-- Grid -->
      @if (rewardService.rewards().length === 0) {
        <div class="empty">
          <p class="empty__icon">🎁</p>
          <p class="empty__title">No rewards yet</p>
          <p class="empty__sub">Create rewards to spend your Core Points on real-world treats</p>
          <button class="btn btn-primary" (click)="router.navigate(['/rewards/new'])">Create first reward</button>
        </div>
      } @else {
        <div class="rewards-grid">
          @for (r of rewardService.rewards(); track r.id) {
            <gp-reward-card
              [reward]="r"
              [icon]="iconFor(r)"
              (claim)="onClaim($event)"
            />
          }
        </div>
      }

    </div>

    <!-- Confirm claim -->
    @if (claimTarget()) {
      <gp-confirm-modal
        [open]="true"
        title="Claim reward?"
        [message]="'Spend ' + claimTarget()!.costCorePoints + ' Core Points to claim: ' + claimTarget()!.title"
        [detail]="'Remaining after claim: ' + ((profile()?.corePoints ?? 0) - claimTarget()!.costCorePoints) + ' CP'"
        confirmLabel="Claim"
        (confirm)="confirmClaim()"
        (cancel)="claimTarget.set(null)"
      />
    }
  `,
  styles: [`
    .store-page { display: flex; flex-direction: column; gap: 20px; max-width: 900px; }

    .page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
    .page-title  { font-size: 24px; font-weight: 800; }
    .page-sub    { font-size: 13px; color: var(--text-muted); margin-top: 4px; }

    .rewards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 14px;
    }

    .empty {
      text-align: center;
      padding: 48px 24px;
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
    }

    .empty__icon  { font-size: 32px; margin-bottom: 12px; }
    .empty__title { font-size: 16px; font-weight: 700; margin-bottom: 6px; }
    .empty__sub   { font-size: 13px; color: var(--text-muted); margin-bottom: 20px; }
  `]
})
export class RewardStoreComponent implements OnInit {
  readonly rewardService  = inject(RewardService);
  readonly profileService = inject(UserProfileService);
  readonly router         = inject(Router);

  readonly profile     = this.profileService.profile;
  readonly claimTarget = signal<Reward | null>(null);

  ngOnInit(): void {
    this.rewardService.loadRewards().subscribe();
  }

  iconFor(r: Reward): string { return guessIcon(r.title); }

  onClaim(r: Reward): void { this.claimTarget.set(r); }

  confirmClaim(): void {
    const r = this.claimTarget();
    if (!r) return;
    this.rewardService.claimReward(r.id).subscribe();
    this.claimTarget.set(null);
  }
}
