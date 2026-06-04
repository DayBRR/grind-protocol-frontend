import { Injectable, inject, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { ApiService } from './api.service';
import { Reward, RewardRedeemResponse, RewardRedemptionResponse, RewardResponse, RewardView } from '../models/domain.models';
import { UserProfileService } from '../auth/user-profile.service';

@Injectable({ providedIn: 'root' })
export class RewardService {
  private readonly api = inject(ApiService);
  private readonly profile = inject(UserProfileService);

  private readonly _rewards = signal<Reward[]>([]);
  private readonly _redemptions = signal<RewardRedemptionResponse[]>([]);

  readonly rewards = this._rewards.asReadonly();
  readonly redemptions = this._redemptions.asReadonly();

  loadRewards(): Observable<Reward[]> {
    return this.api.get<RewardResponse[]>('/me/rewards').pipe(
      map(rewards => rewards.map(reward => this.toView(reward))),
      tap(rewards => this._rewards.set(rewards))
    );
  }

  loadRedemptions(): Observable<RewardRedemptionResponse[]> {
    return this.api.get<RewardRedemptionResponse[]>('/me/rewards/redemptions').pipe(
      tap(redemptions => this._redemptions.set(redemptions))
    );
  }

  claimReward(rewardId: number): Observable<RewardRedeemResponse> {
    return this.api.post<RewardRedeemResponse>(`/me/rewards/${rewardId}/redeem`, {}).pipe(
      tap(() => {
        this.profile.refreshProfile().subscribe();
        this._rewards.update(rewards => rewards.map(reward => this.toView(reward)));
      })
    );
  }

  useRedemption(redemptionId: number): Observable<RewardRedemptionResponse> {
    return this.api.post<RewardRedemptionResponse>(`/me/rewards/redemptions/${redemptionId}/use`, {}).pipe(
      tap(updated => {
        this._redemptions.update(redemptions =>
          redemptions.map(redemption => redemption.id === redemptionId ? updated : redemption)
        );
      })
    );
  }

  /**
   * Reward creation is not exposed by the current backend API.
   */
  createReward(_payload: Partial<Reward>): Observable<Reward> {
    throw new Error('Reward creation is not available in the current backend API.');
  }

  private toView(reward: RewardResponse | RewardView): RewardView {
    const cp = this.profile.profile()?.corePoints ?? 0;
    const level = this.profile.profile()?.level ?? 1;
    const currentStreak = this.profile.profile()?.currentStreak ?? 0;

    const requiredLevelOk = reward.requiredLevel == null || level >= reward.requiredLevel;
    const requiredStreakOk = reward.requiredCurrentStreak == null || currentStreak >= reward.requiredCurrentStreak;
    const canAfford = reward.enabled && cp >= reward.costCorePoints && requiredLevelOk && requiredStreakOk;

    return {
      ...reward,
      title: 'title' in reward ? reward.title : reward.name,
      active: 'active' in reward ? reward.active : reward.enabled,
      canAfford,
      isOnCooldown: 'isOnCooldown' in reward ? reward.isOnCooldown : false,
      nextAvailableAt: 'nextAvailableAt' in reward ? reward.nextAvailableAt : null
    };
  }
}
