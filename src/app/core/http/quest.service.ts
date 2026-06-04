import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import { QuestClaimResponse, QuestResponse } from '../models/domain.models';

@Injectable({ providedIn: 'root' })
export class QuestService {
  private readonly api = inject(ApiService);

  private readonly _quests = signal<QuestResponse[]>([]);

  readonly quests = this._quests.asReadonly();

  readonly activeQuests = computed(() =>
    this._quests().filter(quest => quest.status === 'ACTIVE' || quest.status === 'COMPLETED')
  );

  readonly claimableQuests = computed(() =>
    this._quests().filter(quest => quest.status === 'COMPLETED')
  );

  readonly dashboardQuests = computed(() => {
    return [...this.activeQuests()].sort((a, b) => {
      const aClaimable = a.status === 'COMPLETED' ? 0 : 1;
      const bClaimable = b.status === 'COMPLETED' ? 0 : 1;
      if (aClaimable !== bClaimable) return aClaimable - bClaimable;

      return this.progressPercent(b) - this.progressPercent(a);
    });
  });

  loadQuests(): Observable<QuestResponse[]> {
    return this.api.get<QuestResponse[]>('/me/quests').pipe(
      tap(quests => this._quests.set(quests))
    );
  }

  claimQuest(questId: number): Observable<QuestClaimResponse> {
    return this.api.post<QuestClaimResponse>(`/me/quests/${questId}/claim`, {}).pipe(
      tap(response => {
        this._quests.update(quests =>
          quests.map(quest =>
            quest.questId === response.questId
              ? { ...quest, status: response.status, claimedAt: new Date().toISOString() }
              : quest
          )
        );
      })
    );
  }

  progressPercent(quest: QuestResponse): number {
    if (!quest.targetValue || quest.targetValue <= 0) return quest.status === 'COMPLETED' || quest.status === 'CLAIMED' ? 100 : 0;
    return Math.min(100, Math.round((quest.progressValue / quest.targetValue) * 100));
  }
}
