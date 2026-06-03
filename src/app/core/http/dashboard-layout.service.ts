import { Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { DashboardWidgetLayout, WIDGET_ID } from '../models/dashboard-layout.models';

const STORAGE_KEY = 'gp_dashboard_layout';

export const DEFAULT_DASHBOARD_LAYOUT: DashboardWidgetLayout[] = [
  { id: WIDGET_ID.STREAK,             x: 0,  y: 0, w: 4,  h: 4, draggable: true },
  { id: WIDGET_ID.TODAY_PROGRESS,     x: 4,  y: 0, w: 4,  h: 5, draggable: true },
  { id: WIDGET_ID.REWARDS,            x: 8,  y: 0, w: 4,  h: 4, draggable: true },
  { id: WIDGET_ID.XP_PERFORMANCE,     x: 0,  y: 5, w: 6,  h: 4, draggable: true },
  { id: WIDGET_ID.FOCUS_DISTRIBUTION, x: 6,  y: 5, w: 6,  h: 4, draggable: true },
  { id: WIDGET_ID.RECENT_ACTIVITY,    x: 0,  y: 9, w: 12, h: 4, draggable: true },
];

@Injectable({ providedIn: 'root' })
export class DashboardLayoutService {
  readonly layout = signal<DashboardWidgetLayout[]>(DEFAULT_DASHBOARD_LAYOUT);

  loadLayout(): Observable<void> {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try { this.layout.set(JSON.parse(stored)); }
      catch { this.layout.set([...DEFAULT_DASHBOARD_LAYOUT]); }
    }
    return of(undefined);
  }

  updateLayout(layout: DashboardWidgetLayout[]): void {
    this.layout.set(layout);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
  }

  resetToDefault(): void {
    this.layout.set([...DEFAULT_DASHBOARD_LAYOUT]);
    localStorage.removeItem(STORAGE_KEY);
  }
}
