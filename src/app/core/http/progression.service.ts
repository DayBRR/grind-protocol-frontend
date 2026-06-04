import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import { ProgressionSummaryResponse } from '../models/domain.models';

@Injectable({ providedIn: 'root' })
export class ProgressionService {
  private readonly api = inject(ApiService);

  private readonly _summary = signal<ProgressionSummaryResponse | null>(null);

  readonly summary = this._summary.asReadonly();

  readonly xpProgressFraction = computed(() => {
    const summary = this._summary();
    if (!summary) return 0;

    const levelRange = summary.xpForNextLevel - summary.xpForCurrentLevel;
    if (levelRange <= 0) return 1;

    return Math.max(0, Math.min(summary.xpProgressInCurrentLevel / levelRange, 1));
  });

  loadSummary(): Observable<ProgressionSummaryResponse> {
    return this.api.get<ProgressionSummaryResponse>('/me/progression').pipe(
      tap(summary => this._summary.set(summary))
    );
  }

  refreshSummary(): Observable<ProgressionSummaryResponse> {
    return this.loadSummary();
  }
}
