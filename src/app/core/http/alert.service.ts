import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiService } from '../http/api.service';
import { Alert } from '../models/domain.models';

@Injectable({ providedIn: 'root' })
export class AlertService {
  private readonly api = inject(ApiService);

  private readonly _alerts = signal<Alert[]>([]);

  readonly alerts      = this._alerts.asReadonly();
  readonly unreadCount = computed(() => this._alerts().filter(a => !a.readAt && !a.dismissedAt).length);
  readonly activeAlerts = computed(() => this._alerts().filter(a => a.active && !a.dismissedAt));

  loadAlerts(): Observable<Alert[]> {
    return this.api.get<Alert[]>('/alerts').pipe(
      tap(alerts => this._alerts.set(alerts))
    );
  }

  markRead(alertId: number): Observable<Alert> {
    return this.api.patch<Alert>(`/alerts/${alertId}/read`, {}).pipe(
      tap(updated => this._alerts.update(list => list.map(a => a.id === alertId ? updated : a)))
    );
  }

  dismiss(alertId: number): Observable<Alert> {
    return this.api.patch<Alert>(`/alerts/${alertId}/dismiss`, {}).pipe(
      tap(updated => this._alerts.update(list => list.map(a => a.id === alertId ? updated : a)))
    );
  }
}
