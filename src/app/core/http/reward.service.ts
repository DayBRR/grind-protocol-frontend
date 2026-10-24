import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { Observable, catchError, finalize, forkJoin, map, switchMap, tap, throwError } from 'rxjs';
import { ApiService } from './api.service';
import { UserProfileService } from '../auth/user-profile.service';
import {
  RewardRedeemResponse,
  RewardRedemptionResponse,
  RewardResponse,
  RewardView
} from '../models/domain.models';

@Injectable({ providedIn: 'root' })
export class RewardService {
  private readonly api = inject(ApiService);
  private readonly profileService = inject(UserProfileService);

  private readonly _rewards = signal<RewardResponse[]>([]);
  private readonly _redemptions = signal<RewardRedemptionResponse[]>([]);

  private readonly historyLoaded = signal(false);
  private readonly clock = signal(Date.now());
  private readonly synchronizing = signal(false);
  readonly rewards = computed(() => {
    const profile = this.profileService.profile();
    const ready = !!profile && this.historyLoaded() && !this.synchronizing();
    this.clock(); // Invalidate at the next cooldown boundary.
    const now = Date.now();
    return this._rewards().map(reward => {
      const history = this._redemptions().filter(item => item.rewardId === reward.id &&
        ['REDEEMED', 'USED', 'EXPIRED'].includes(item.status));
      const latest = history.reduce<Date | null>((last, item) => {
        const date = new Date(item.redeemedAt);
        return !last || date > last ? date : last;
      }, null);
      // Match LocalDateTime.plusDays using calendar days, including DST.
      const next = latest && (reward.cooldownDays ?? 0) > 0 ? new Date(latest) : null;
      if (next) next.setDate(next.getDate() + reward.cooldownDays!);
      const isOnCooldown = !!next && now < next.getTime();
      const canAfford = !!profile && profile.corePoints >= reward.costCorePoints;
      const lockedReason = !reward.enabled ? 'Unavailable'
        : !ready ? 'Loading eligibility...'
        : profile!.level < (reward.requiredLevel ?? 0) ? 'Level ' + reward.requiredLevel + '+'
        : profile!.currentStreak < (reward.requiredCurrentStreak ?? 0) ? reward.requiredCurrentStreak + ' day streak'
        : !reward.repeatable && history.length > 0 ? 'Already redeemed'
        : isOnCooldown ? 'Cooldown'
        : !canAfford ? 'Not enough CP' : null;
      return { ...reward, title: reward.name, active: reward.enabled, canAfford,
        isOnCooldown, nextAvailableAt: next?.toISOString() ?? null,
        lockedReason, canRedeem: lockedReason === null } satisfies RewardView;
    });
  });

  constructor() {
    effect(onCleanup => {
      const now = Date.now();
      const deadlines = this.rewards().filter(r => r.isOnCooldown && r.nextAvailableAt)
        .map(r => new Date(r.nextAvailableAt!).getTime());
      if (!deadlines.length) return;
      const timer = setTimeout(() => this.clock.set(Date.now()),
        Math.min(2147483647, Math.max(1, Math.min(...deadlines) - now)));
      onCleanup(() => clearTimeout(timer));
    });
  }
  readonly redemptions = this._redemptions.asReadonly();

  loadRewards(): Observable<RewardResponse[]> {
    return this.api.get<RewardResponse[]>('/me/rewards').pipe(
      tap(rewards => this._rewards.set(rewards))
    );
  }

  loadRedemptions(): Observable<RewardRedemptionResponse[]> {
    return this.api.get<RewardRedemptionResponse[]>('/me/rewards/redemptions').pipe(
      tap(redemptions => {
        this._redemptions.set(redemptions);
        this.historyLoaded.set(true);
      })
    );
  }

  redeemReward(rewardId: number): Observable<RewardRedeemResponse> {
    return this.api.post<RewardRedeemResponse>(`/me/rewards/${rewardId}/redeem`, {}).pipe(
      tap(() => {
        this.historyLoaded.set(false);
        this.synchronizing.set(true);
      }),
      switchMap(response => forkJoin({
        profile: this.profileService.refreshProfile(),
        redemptions: this.loadRedemptions()
      }).pipe(
        map(() => response),
        catchError(() => {
          this.historyLoaded.set(false);
          return throwError(() => new Error('Reward redeemed, but eligibility could not be refreshed. Reload the store before redeeming again.'));
        }),
        finalize(() => this.synchronizing.set(false))
      ))
    );
  }

  useRedemption(redemptionId: number): Observable<RewardRedemptionResponse> {
    return this.api.post<RewardRedemptionResponse>(`/me/rewards/redemptions/${redemptionId}/use`, {}).pipe(
      tap(updated => {
        this._redemptions.update(redemptions =>
          redemptions.map(redemption => redemption.id === updated.id ? updated : redemption)
        );
      })
    );
  }

  /**
   * Backwards-compatible alias for older components.
   * Prefer redeemReward() in new code because it matches the backend wording.
   */
  claimReward(rewardId: number): Observable<RewardRedeemResponse> {
    return this.redeemReward(rewardId);
  }

  /**
   * Reward creation is intentionally not implemented in the frontend yet because
   * the stable backend currently exposes only listing, redeeming and using redemptions.
   */
  createReward(): Observable<never> {
    throw new Error('Reward creation is not available in the current backend contract.');
  }

}
