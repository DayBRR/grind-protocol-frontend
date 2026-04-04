import { Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AlertService } from '../../core/http/alert.service';
import { Alert, AlertSeverity } from '../../core/models/domain.models';
import { RelativeTimePipe } from '../../shared/pipes/relative-time.pipe';

const SEV_COLORS: Record<AlertSeverity, string> = {
  CRITICAL: 'var(--primary)',
  WARNING:  'var(--streak)',
  INFO:     'var(--xp)'
};

const SEV_ICONS: Record<AlertSeverity, string> = {
  CRITICAL: '🚨',
  WARNING:  '⚡',
  INFO:     'ℹ'
};

@Component({
  selector: 'gp-alerts-page',
  standalone: true,
  imports: [DatePipe, RelativeTimePipe],
  template: `
    <div class="alerts-page">
      <div class="page-header">
        <h1 class="page-title">Alerts</h1>
        <span class="unread-badge mono">{{ alertService.unreadCount() }} unread</span>
      </div>

      @if (alertService.activeAlerts().length === 0) {
        <div class="empty">
          <p class="empty__icon">🔔</p>
          <p class="empty__title">All clear</p>
          <p class="empty__sub">No active alerts. Keep grinding.</p>
        </div>
      } @else {
        <div class="alert-list">
          @for (alert of alertService.activeAlerts(); track alert.id) {
            <div
              class="alert-item"
              [class.alert-item--unread]="!alert.readAt"
              [style.border-left-color]="severityColor(alert.severity)"
              (click)="onRead(alert)"
            >
              <div class="alert-item__icon">{{ severityIcon(alert.severity) }}</div>

              <div class="alert-item__body">
                <p class="alert-item__title" [style.color]="severityColor(alert.severity)">{{ alert.title }}</p>
                <p class="alert-item__msg">{{ alert.message }}</p>
                <p class="alert-item__time">{{ alert.triggeredAt | relativeTime }}</p>
              </div>

              <button
                class="alert-item__dismiss"
                (click)="$event.stopPropagation(); onDismiss(alert)"
                title="Dismiss"
              >✕</button>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .alerts-page { display: flex; flex-direction: column; gap: 20px; max-width: 700px; }

    .page-header { display: flex; align-items: center; gap: 14px; }
    .page-title  { font-size: 24px; font-weight: 800; flex: 1; }

    .unread-badge {
      font-size: 12px; font-weight: 600;
      background: var(--primary-glow);
      color: var(--primary);
      border: 1px solid rgba(217,70,168,0.2);
      padding: 4px 10px; border-radius: 20px;
    }

    .alert-list { display: flex; flex-direction: column; gap: 8px; }

    .alert-item {
      display: flex; align-items: flex-start; gap: 12px;
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-left: 3px solid var(--border);
      border-radius: var(--radius-md);
      padding: 14px 16px;
      cursor: pointer;
      transition: border-color 0.15s, background 0.15s;
    }

    .alert-item:hover { background: var(--bg-elevated); }
    .alert-item--unread { background: var(--bg-elevated); }

    .alert-item__icon {
      width: 28px; height: 28px;
      background: var(--bg-input);
      border-radius: 6px;
      display: flex; align-items: center; justify-content: center;
      font-size: 13px; flex-shrink: 0;
    }

    .alert-item__body { flex: 1; }
    .alert-item__title { font-size: 13px; font-weight: 700; margin: 0; }
    .alert-item__msg   { font-size: 12px; color: var(--text-muted); margin: 3px 0 0; line-height: 1.5; }
    .alert-item__time  { font-size: 10px; color: var(--text-dim); margin-top: 6px; font-family: var(--font-mono); }

    .alert-item__dismiss {
      width: 24px; height: 24px;
      border-radius: 5px; background: transparent; border: none;
      color: var(--text-dim); cursor: pointer; font-size: 11px;
      display: flex; align-items: center; justify-content: center;
      transition: color 0.15s, background 0.15s; flex-shrink: 0;
    }

    .alert-item__dismiss:hover { color: var(--text); background: rgba(255,255,255,0.06); }

    .empty {
      text-align: center; padding: 48px 24px;
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
    }

    .empty__icon  { font-size: 32px; margin-bottom: 12px; }
    .empty__title { font-size: 16px; font-weight: 700; margin-bottom: 6px; }
    .empty__sub   { font-size: 13px; color: var(--text-muted); }
  `]
})
export class AlertsPageComponent implements OnInit {
  readonly alertService = inject(AlertService);

  severityColor(s: AlertSeverity): string { return SEV_COLORS[s]; }
  severityIcon(s: AlertSeverity):  string { return SEV_ICONS[s]; }

  ngOnInit(): void {
    this.alertService.loadAlerts().subscribe();
  }

  onRead(alert: Alert): void {
    if (!alert.readAt) this.alertService.markRead(alert.id).subscribe();
  }

  onDismiss(alert: Alert): void {
    this.alertService.dismiss(alert.id).subscribe();
  }
}
