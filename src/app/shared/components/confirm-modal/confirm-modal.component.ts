import {
  AfterViewInit, Component, ElementRef, EventEmitter, Input,
  OnChanges, OnDestroy, Output, ViewChild
} from '@angular/core';

@Component({
  selector: 'gp-confirm-modal',
  standalone: true,
  template: `
    <dialog #dialog class="modal" role="dialog" aria-modal="true"
      [attr.aria-labelledby]="titleId"
      [attr.aria-describedby]="messageId + (detail ? ' ' + detailId : '')"
      (cancel)="onCancel($event)" (keydown)="onKeydown($event)"
      (click)="onBackdropClick($event)">
          <h2 class="modal__title" [id]="titleId">{{ title }}</h2>
          <p class="modal__body" [id]="messageId">{{ message }}</p>

          @if (detail) {
            <div class="modal__detail" [id]="detailId">{{ detail }}</div>
          }

          <div class="modal__actions">
            <button #cancelButton type="button" class="btn btn-ghost" autofocus (click)="cancel.emit()">Cancel</button>
            <button type="button" class="btn btn-primary" (click)="confirm.emit()">{{ confirmLabel }}</button>
          </div>
    </dialog>
  `,
  styles: [`
    .modal::backdrop {
      background: rgba(0,0,0,0.6);
    }

    .modal {
      position: fixed;
      inset: 0;
      margin: auto;
      color: var(--text);
      background: var(--bg-surface);
      border: 1px solid var(--border-md);
      border-radius: var(--radius-xl);
      padding: 28px 32px;
      width: calc(100% - 32px);
      max-width: 400px;
      max-height: calc(100dvh - 32px);
      overflow: auto;
      overflow-wrap: anywhere;
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
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 24px;
      justify-content: flex-end;
    }

    .modal__actions button {
      min-width: 44px;
      min-height: 44px;
    }
  `]
})
export class ConfirmModalComponent implements AfterViewInit, OnChanges, OnDestroy {
  private static nextId = 0;
  private readonly id = `gp-confirm-${ConfirmModalComponent.nextId++}`;
  readonly titleId = `${this.id}-title`;
  readonly messageId = `${this.id}-message`;
  readonly detailId = `${this.id}-detail`;

  @ViewChild('dialog') private dialog?: ElementRef<HTMLDialogElement>;
  @ViewChild('cancelButton') private cancelButton?: ElementRef<HTMLButtonElement>;
  private opener: HTMLElement | null = null;
  @Input() open         = false;
  @Input() title        = 'Are you sure?';
  @Input() message      = '';
  @Input() detail: string | null = null;
  @Input() confirmLabel = 'Confirm';
  @Input() fallbackFocus: HTMLElement | null = null;

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel  = new EventEmitter<void>();

  ngAfterViewInit(): void {
    this.syncOpenState();
  }

  ngOnChanges(): void {
    this.syncOpenState();
  }

  ngOnDestroy(): void {
    this.closeDialog();
  }

  onCancel(event: Event): void {
    // The parent owns `open`; Escape follows the same cancellation path as Cancel.
    event.preventDefault();
    this.cancel.emit();
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Tab') return;
    const dialog = this.dialog!.nativeElement;
    const buttons = Array.from(dialog.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'));
    const first = buttons[0];
    const last = buttons[buttons.length - 1];
    const active = dialog.ownerDocument.activeElement;
    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  onBackdropClick(event: MouseEvent): void {
    const dialog = this.dialog!.nativeElement;
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right
      || event.clientY < bounds.top || event.clientY > bounds.bottom) {
      this.cancel.emit();
    }
  }

  private syncOpenState(): void {
    const dialog = this.dialog?.nativeElement;
    if (!dialog) return;
    if (this.open && !dialog.open) {
      const active = dialog.ownerDocument.activeElement;
      this.opener = active instanceof HTMLElement ? active : null;
      dialog.showModal();
      this.cancelButton!.nativeElement.focus({ preventScroll: true });
    } else if (!this.open) {
      this.closeDialog();
    }
  }

  private closeDialog(): void {
    const dialog = this.dialog?.nativeElement;
    if (dialog?.open) dialog.close();
    if (this.opener?.isConnected) {
      this.opener.focus({ preventScroll: true });
    } else if (this.opener && this.fallbackFocus?.isConnected) {
      this.fallbackFocus.focus({ preventScroll: true });
    }
    this.opener = null;
  }
}
