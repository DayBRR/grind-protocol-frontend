import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiService } from '../http/api.service';
import { TimelineEvent } from '../models/domain.models';

export interface TimelineParams {
  page?: number;
  size?: number;
  eventType?: string;
}

@Injectable({ providedIn: 'root' })
export class TimelineService {
  private readonly api = inject(ApiService);

  private readonly _events = signal<TimelineEvent[]>([]);

  readonly events = this._events.asReadonly();

  loadEvents(params: TimelineParams = {}): Observable<TimelineEvent[]> {
    return this.api.get<TimelineEvent[]>('/timeline', {
      page: params.page ?? 0,
      size: params.size ?? 20,
      ...(params.eventType ? { eventType: params.eventType } : {})
    }).pipe(
      tap(events => this._events.set(events))
    );
  }

  loadRecent(limit = 5): Observable<TimelineEvent[]> {
    return this.loadEvents({ size: limit });
  }
}
