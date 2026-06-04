import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import { AchievementClaimResponse, AchievementResponse } from '../models/domain.models';

@Injectable({ providedIn: 'root' })
export class AchievementService {
  private readonly api = inject(ApiService);

  private readonly _achievements = signal<AchievementResponse[]>([]);

  readonly achievements = this._achievements.asReadonly();

  readonly visibleAchievements = computed(() =>
    this._achievements().filter(achievement => !achievement.hidden || achievement.unlocked)
  );

  readonly claimableAchievements = computed(() =>
    this.visibleAchievements().filter(achievement => achievement.unlocked && !achievement.claimed)
  );

  readonly dashboardAchievements = computed(() => {
    return [...this.visibleAchievements()].sort((a, b) => {
      const aClaimable = a.unlocked && !a.claimed ? 0 : 1;
      const bClaimable = b.unlocked && !b.claimed ? 0 : 1;
      if (aClaimable !== bClaimable) return aClaimable - bClaimable;

      const aUnlocked = a.unlocked ? 0 : 1;
      const bUnlocked = b.unlocked ? 0 : 1;
      if (aUnlocked !== bUnlocked) return aUnlocked - bUnlocked;

      return this.progressPercent(b) - this.progressPercent(a);
    });
  });

  loadAchievements(): Observable<AchievementResponse[]> {
    return this.api.get<AchievementResponse[]>('/me/achievements').pipe(
      tap(achievements => this._achievements.set(achievements))
    );
  }

  claimAchievement(achievementId: number): Observable<AchievementClaimResponse> {
    return this.api.post<AchievementClaimResponse>(`/me/achievements/${achievementId}/claim`, {}).pipe(
      tap(response => {
        this._achievements.update(achievements =>
          achievements.map(achievement =>
            achievement.achievementId === response.achievementId
              ? { ...achievement, claimed: true, claimedAt: new Date().toISOString() }
              : achievement
          )
        );
      })
    );
  }

  progressPercent(achievement: AchievementResponse): number {
    if (!achievement.targetValue || achievement.targetValue <= 0) return achievement.unlocked ? 100 : 0;
    return Math.min(100, Math.round((achievement.progressValue / achievement.targetValue) * 100));
  }
}
