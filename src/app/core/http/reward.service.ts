import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiService } from '../http/api.service';
import { Reward, RewardClaim } from '../models/domain.models';
import { UserProfileService } from '../auth/user-profile.service';

@Injectable({ providedIn: 'root' })
export class RewardService {
  private readonly api     = inject(ApiService);
  private readonly profile = inject(UserProfileService);

  private readonly _rewards = signal<Reward[]>([]);

  readonly rewards = this._rewards.asReadonly();

  loadRewards(): Observable<Reward[]> {
    return this.api.get<Reward[]>('/rewards').pipe(
      tap(rewards => this._rewards.set(this.enrichAffordability(rewards)))
    );
  }

  claimReward(rewardId: number): Observable<RewardClaim> {
    return this.api.post<RewardClaim>(`/rewards/${rewardId}/claim`, {}).pipe(
      tap(() => {
        // Refresh profile to update CP balance
        this.profile.refreshProfile().subscribe();
        // Re-evaluate affordability
        this._rewards.update(rewards => this.enrichAffordability(rewards));
      })
    );
  }

  createReward(payload: Partial<Reward>): Observable<Reward> {
    return this.api.post<Reward>('/rewards', payload).pipe(
      tap(reward => this._rewards.update(r => [...r, reward]))
    );
  }

  private enrichAffordability(rewards: Reward[]): Reward[] {
    const cp = this.profile.profile()?.corePoints ?? 0;
    return rewards.map(r => ({ ...r, canAfford: cp >= r.costCorePoints }));
  }
}
