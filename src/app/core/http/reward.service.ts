import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import { UserProfileService } from '../auth/user-profile.service';
import {
  Reward,
  RewardRedeemResponse,
  RewardRedemptionResponse,
  RewardResponse,
  RewardView
} from '../models/domain.models';

@Injectable({ providedIn: 'root' })
export class RewardService {
  private readonly api = inject(ApiService);
  private readonly profileService = inject(UserProfileService);

  private readonly _rewards = signal<Reward[]>([]);
  private readonly _redemptions = signal<RewardRedemptionResponse[]>([]);

  readonly rewards = this._rewards.asReadonly();
  readonly redemptions = this._redemptions.asReadonly();

  loadRewards(): Observable<Reward[]> {
    return this.api.get<RewardResponse[]>('/me/rewards').pipe(
      tap(rewards => this._rewards.set(this.toRewardViews(rewards)))
    ) as unknown as Observable<Reward[]>;
  }

  loadRedemptions(): Observable<RewardRedemptionResponse[]> {
    return this.api.get<RewardRedemptionResponse[]>('/me/rewards/redemptions').pipe(
      tap(redemptions => this._redemptions.set(redemptions))
    );
  }

  redeemReward(rewardId: number): Observable<RewardRedeemResponse> {
    return this.api.post<RewardRedeemResponse>(`/me/rewards/${rewardId}/redeem`, {}).pipe(
      tap(response => {
        this.profileService.refreshProfile().subscribe();
        this.loadRedemptions().subscribe();

        const currentCorePoints = response.remainingCorePoints;
        this._rewards.update(rewards =>
          rewards.map(reward => this.enrichRewardView(reward, currentCorePoints))
        );
      })
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

  private toRewardViews(rewards: RewardResponse[]): RewardView[] {
    const corePoints = this.profileService.profile()?.corePoints ?? 0;
    return rewards.map(reward => this.toRewardView(reward, corePoints));
  }

  private toRewardView(reward: RewardResponse, corePoints: number): RewardView {
    return this.enrichRewardView({
      ...reward,
      title: reward.name,
      active: reward.enabled,
      canAfford: false,
      isOnCooldown: false,
      nextAvailableAt: null,
      availabilityType: reward.repeatable ? 'UNLIMITED' : 'LIMITED_PER_PERIOD',
      maxClaimsPerPeriod: reward.repeatable ? null : 1,
      periodType: null
    }, corePoints);
  }

  private enrichRewardView(reward: RewardView, corePoints: number): RewardView {
    return {
      ...reward,
      canAfford: reward.enabled && corePoints >= reward.costCorePoints,
      // The current backend does not return per-user cooldown availability yet.
      // Keep the UI helper false until that information is exposed.
      isOnCooldown: false,
      nextAvailableAt: null
    };
  }
}
