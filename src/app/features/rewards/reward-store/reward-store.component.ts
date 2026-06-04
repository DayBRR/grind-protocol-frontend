import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { forkJoin, finalize } from 'rxjs';
import { RewardService } from '../../../core/http/reward.service';
import { UserProfileService } from '../../../core/auth/user-profile.service';
import { RewardCardComponent } from '../../../shared/components/reward-card/reward-card.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { Reward, RewardRedemptionResponse } from '../../../core/models/domain.models';

const REWARD_ICONS: Record<string, string> = {
  food: '🍔',
  entertainment: '🎬',
  rest: '🛋️',
  purchase: '🛍️',
  experience: '🌴',
  virtual: '🎮',
  real: '🎁',
  default: '🎁'
};

function guessIcon(reward: Reward): string {
  const haystack = `${reward.name} ${reward.description ?? ''} ${reward.category} ${reward.type}`.toLowerCase();

  for (const [key, icon] of Object.entries(REWARD_ICONS)) {
    if (haystack.includes(key)) {
      return icon;
    }
  }

  return REWARD_ICONS['default'];
}

@Component({
  selector: 'gp-reward-store',
  standalone: true,
  imports: [DecimalPipe, RewardCardComponent, ConfirmModalComponent],
  templateUrl: './reward-store.component.html',
  styleUrls: ['./reward-store.component.scss']
})
export class RewardStoreComponent implements OnInit {
  readonly rewardService = inject(RewardService);
  readonly profileService = inject(UserProfileService);

  readonly profile = this.profileService.profile;
  readonly rewards = this.rewardService.rewards;
  readonly redemptions = this.rewardService.redemptions;

  readonly loading = signal(false);
  readonly redeeming = signal(false);
  readonly error = signal<string | null>(null);
  readonly claimTarget = signal<Reward | null>(null);

  readonly availableRedemptions = computed(() =>
    this.redemptions().filter(redemption => redemption.status === 'REDEEMED' || redemption.status === 'AVAILABLE')
  );

  readonly usedRedemptions = computed(() =>
    this.redemptions().filter(redemption => redemption.status === 'USED')
  );

  ngOnInit(): void {
    this.loadStore();
  }

  loadStore(): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      profile: this.profileService.refreshProfile(),
      rewards: this.rewardService.loadRewards(),
      redemptions: this.rewardService.loadRedemptions()
    }).pipe(
      finalize(() => this.loading.set(false))
    ).subscribe({
      error: err => this.error.set(this.errorMessage(err, 'Unable to load reward store.'))
    });
  }

  iconFor(reward: Reward): string {
    return guessIcon(reward);
  }

  onClaim(reward: Reward): void {
    if (!reward.canAfford || reward.isOnCooldown || !reward.enabled) {
      return;
    }

    this.claimTarget.set(reward);
  }

  confirmClaim(): void {
    const reward = this.claimTarget();

    if (!reward) {
      return;
    }

    this.redeeming.set(true);
    this.error.set(null);

    this.rewardService.redeemReward(reward.id).pipe(
      finalize(() => {
        this.redeeming.set(false);
        this.claimTarget.set(null);
      })
    ).subscribe({
      next: () => this.loadStore(),
      error: err => this.error.set(this.errorMessage(err, 'Unable to redeem reward.'))
    });
  }

  useRedemption(redemption: RewardRedemptionResponse): void {
    this.error.set(null);

    this.rewardService.useRedemption(redemption.id).subscribe({
      next: () => this.loadStore(),
      error: err => this.error.set(this.errorMessage(err, 'Unable to use redeemed reward.'))
    });
  }

  private errorMessage(err: unknown, fallback: string): string {
    const httpError = err as { error?: { message?: string; detail?: string; error?: string }; message?: string };

    return httpError?.error?.message
      ?? httpError?.error?.detail
      ?? httpError?.error?.error
      ?? httpError?.message
      ?? fallback;
  }
}
