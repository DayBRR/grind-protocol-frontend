import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import { DailyProgressResponse } from '../models/domain.models';

@Injectable({ providedIn: 'root' })
export class DailyProgressService {
  private readonly api = inject(ApiService);

  private readonly _today = signal<DailyProgressResponse | null>(null);

  readonly today = this._today.asReadonly();

  loadToday(): Observable<DailyProgressResponse> {
    return this.api.get<DailyProgressResponse>('/me/daily-progress/today').pipe(
      tap(progress => this._today.set(progress))
    );
  }

  refreshToday(): Observable<DailyProgressResponse> {
    return this.loadToday();
  }
}
