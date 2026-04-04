import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'gp-confirm-modal',
  standalone: true,
  template: `
    @if (open) {
      <!-- Backdrop -->
      <div class="modal-backdrop" (click)="cancel.emit()">
        <div class="modal" (click)="$event.stopPropagation()">
          <h2 class="modal__title">{{ title }}</h2>
          <p class="modal__body">{{ message }}</p>

          @if (detail) {
            <div class="modal__detail">{{ detail }}</div>
          }

          <div class="modal__actions">
            <button class="btn btn-ghost" (click)="cancel.emit()">Cancel</button>
            <button class="btn btn-primary" (click)="confirm.emit()">{{ confirmLabel }}</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      animation: fade-in 0.15s ease-out;
    }

    .modal {
      background: var(--bg-surface);
      border: 1px solid var(--border-md);
      border-radius: var(--radius-xl);
      padding: 28px 32px;
      width: 100%;
      max-width: 400px;
      animation: slide-in-right 0.2s ease-out;
    }

    .modal__title {
      font-size: 18px;
      font-weight: 700;
      margin-bottom: 10px;
    }

    .modal__body {
      font-size: 13px;
      color: var(--text-muted);
      line-height: 1.6;
    }

    .modal__detail {
      margin-top: 16px;
      padding: 12px 16px;
      background: var(--bg-elevated);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      font-size: 13px;
      color: var(--text);
      font-family: var(--font-mono);
    }

    .modal__actions {
      display: flex;
      gap: 10px;
      margin-top: 24px;
      justify-content: flex-end;
    }
  `]
})
export class ConfirmModalComponent {
  @Input() open         = false;
  @Input() title        = 'Are you sure?';
  @Input() message      = '';
  @Input() detail: string | null = null;
  @Input() confirmLabel = 'Confirm';

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel  = new EventEmitter<void>();
}
