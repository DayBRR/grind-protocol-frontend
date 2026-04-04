import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Alert, AlertSeverity } from '../../../core/models/domain.models';

const SEVERITY_COLORS: Record<AlertSeverity, { bg: string; border: string; text: string; icon: string }> = {
  CRITICAL: { bg: 'rgba(217,70,168,0.08)', border: 'rgba(217,70,168,0.25)', text: 'var(--primary)', icon: '🚨' },
  WARNING:  { bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.25)', text: 'var(--streak)',  icon: '⚡' },
  INFO:     { bg: 'rgba(34,211,238,0.08)', border: 'rgba(34,211,238,0.25)', text: 'var(--xp)',      icon: 'ℹ' }
};

@Component({
  selector: 'gp-alert-banner',
  standalone: true,
  template: `
    <div
      class="alert-banner"
      [style.background]="colors.bg"
      [style.border-color]="colors.border"
    >
      <div class="alert-banner__icon">{{ colors.icon }}</div>

      <div class="alert-banner__body">
        <p class="alert-banner__title" [style.color]="colors.text">{{ alert.title }}</p>
        <p class="alert-banner__msg">{{ alert.message }}</p>
      </div>

      <div class="alert-banner__actions">
        @if (ctaLabel) {
          <button class="btn btn-primary btn--sm" (click)="ctaClick.emit()">{{ ctaLabel }}</button>
        }
        <button class="alert-banner__dismiss" (click)="dismiss.emit(alert.id)" title="Dismiss">✕</button>
      </div>
    </div>
  `,
  styles: [`
    .alert-banner {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border-radius: var(--radius-md);
      border: 1px solid;
      animation: fade-in 0.25s ease-out;
    }

    .alert-banner__icon {
      width: 30px; height: 30px;
      border-radius: 7px;
      background: rgba(255,255,255,0.06);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      flex-shrink: 0;
    }

    .alert-banner__body { flex: 1; }

    .alert-banner__title {
      font-size: 12px;
      font-weight: 700;
      margin: 0;
    }

    .alert-banner__msg {
      font-size: 11px;
      color: var(--text-muted);
      margin: 2px 0 0;
    }

    .alert-banner__actions {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }

    .alert-banner__dismiss {
      width: 24px; height: 24px;
      border-radius: 5px;
      background: transparent;
      border: none;
      color: var(--text-dim);
      cursor: pointer;
      font-size: 11px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: color 0.15s, background 0.15s;
    }

    .alert-banner__dismiss:hover { color: var(--text); background: rgba(255,255,255,0.06); }

    .btn--sm { padding: 5px 12px; font-size: 11px; white-space: nowrap; }
  `]
})
export class AlertBannerComponent {
  @Input({ required: true }) alert!: Alert;
  @Input() ctaLabel: string | null = null;
  @Output() ctaClick = new EventEmitter<void>();
  @Output() dismiss  = new EventEmitter<number>();

  get colors() { return SEVERITY_COLORS[this.alert.severity]; }
}
