import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmModalComponent } from './confirm-modal.component';

@Component({
  standalone: true,
  imports: [ConfirmModalComponent],
  template: `
    <button id="opener" (click)="open = true">Open dialog</button>
    <button id="background">Background action</button>
    <div #fallback id="fallback" tabindex="-1">Reward store</div>
    @if (mounted) {
      <gp-confirm-modal [open]="open" title="Redeem reward?" message="Spend 100 Core Points?"
        [detail]="detail" [fallbackFocus]="fallback"
        (cancel)="open = false" (confirm)="confirmed = confirmed + 1; open = false" />
    }
  `
})
class ModalHostComponent {
  open = false;
  mounted = true;
  confirmed = 0;
  detail: string | null = 'Remaining: 200 CP';
}

describe('ConfirmModalComponent accessibility', () => {
  let fixture: ComponentFixture<ModalHostComponent>;
  let opener: HTMLButtonElement;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [ModalHostComponent] });
    fixture = TestBed.createComponent(ModalHostComponent);
    fixture.detectChanges();
    opener = fixture.nativeElement.querySelector('#opener');
  });

  function dialog(): HTMLDialogElement {
    return fixture.nativeElement.querySelector('dialog');
  }
  function buttons(): HTMLButtonElement[] {
    return Array.from(dialog().querySelectorAll('button'));
  }
  function open(): void {
    opener.focus();
    opener.click();
    fixture.detectChanges();
  }
  function tab(shiftKey = false): KeyboardEvent {
    const event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey, bubbles: true, cancelable: true });
    document.activeElement!.dispatchEvent(event);
    return event;
  }

  it('starts closed without blocking the background', () => {
    expect(dialog().open).toBeFalse();
    opener.focus();
    expect(document.activeElement).toBe(opener);
  });

  it('opens as a native modal with an accessible name, description and initial safe focus', () => {
    open();
    expect(dialog().matches(':modal')).toBeTrue();
    expect(dialog().getAttribute('role')).toBe('dialog');
    expect(dialog().getAttribute('aria-modal')).toBe('true');
    expect(document.getElementById(dialog().getAttribute('aria-labelledby')!)!.textContent).toContain('Redeem reward?');
    const descriptions = dialog().getAttribute('aria-describedby')!.split(' ');
    expect(descriptions.length).toBe(2);
    expect(descriptions.map(id => document.getElementById(id)!.textContent).join(' ')).toContain('Remaining: 200 CP');
    expect(document.activeElement).toBe(buttons()[0]);
  });

  it('cycles Tab from the last action to the first', () => {
    open();
    buttons()[1].focus();
    expect(tab().defaultPrevented).toBeTrue();
    expect(document.activeElement).toBe(buttons()[0]);
  });

  it('cycles Shift+Tab from the first action to the last', () => {
    open();
    expect(tab(true).defaultPrevented).toBeTrue();
    expect(document.activeElement).toBe(buttons()[1]);
  });

  it('leaves ordinary internal Tab navigation to the browser', () => {
    open();
    expect(tab().defaultPrevented).toBeFalse();
  });

  it('ignores a disabled action when wrapping focus', () => {
    open();
    buttons()[1].disabled = true;
    expect(tab(true).defaultPrevented).toBeTrue();
    expect(document.activeElement).toBe(buttons()[0]);
  });

  it('prevents programmatic focus on background controls while open', () => {
    open();
    fixture.nativeElement.querySelector('#background').focus();
    expect(dialog().contains(document.activeElement)).toBeTrue();
  });

  it('routes the native Escape cancellation event through the parent and restores focus', () => {
    open();
    const cancel = new Event('cancel', { cancelable: true });
    dialog().dispatchEvent(cancel);
    fixture.detectChanges();
    expect(cancel.defaultPrevented).toBeTrue();
    expect(fixture.componentInstance.open).toBeFalse();
    expect(dialog().open).toBeFalse();
    expect(document.activeElement).toBe(opener);
  });

  it('restores focus after Cancel and permits background focus again', () => {
    open();
    buttons()[0].click();
    fixture.detectChanges();
    expect(document.activeElement).toBe(opener);
    const background = fixture.nativeElement.querySelector('#background');
    background.focus();
    expect(document.activeElement).toBe(background);
  });

  it('emits confirmation once and restores focus when the parent closes', () => {
    open();
    buttons()[1].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.confirmed).toBe(1);
    expect(dialog().open).toBeFalse();
    expect(document.activeElement).toBe(opener);
  });

  it('restores focus when its Angular view is destroyed', () => {
    open();
    fixture.componentInstance.mounted = false;
    fixture.detectChanges();
    expect(document.activeElement).toBe(opener);
    expect(document.querySelector('dialog:modal')).toBeNull();
  });

  it('focuses the logical fallback if the invoking button was removed', () => {
    open();
    opener.remove();
    fixture.componentInstance.mounted = false;
    fixture.detectChanges();
    expect(document.activeElement).toBe(fixture.nativeElement.querySelector('#fallback'));
  });

  it('does not cancel when clicking dialog content or its inner padding', () => {
    open();
    dialog().querySelector('p')!.click();
    const bounds = dialog().getBoundingClientRect();
    dialog().dispatchEvent(new MouseEvent('click', {
      clientX: bounds.left + bounds.width / 2, clientY: bounds.top + bounds.height / 2, bubbles: true
    }));
    fixture.detectChanges();
    expect(dialog().open).toBeTrue();
  });

  it('cancels on a backdrop click and restores the invoking control', () => {
    open();
    dialog().dispatchEvent(new MouseEvent('click', { clientX: -1, clientY: -1, bubbles: true }));
    fixture.detectChanges();
    expect(dialog().open).toBeFalse();
    expect(document.activeElement).toBe(opener);
  });

  it('does not steal focus when text changes while already open', () => {
    open();
    buttons()[1].focus();
    fixture.componentInstance.detail = null;
    fixture.detectChanges();
    expect(document.activeElement).toBe(buttons()[1]);
    expect(dialog().getAttribute('aria-describedby')!.split(' ').length).toBe(1);
  });

  it('captures a new invoking element on each opening', () => {
    open();
    fixture.componentInstance.open = false;
    fixture.detectChanges();
    const background = fixture.nativeElement.querySelector('#background');
    background.focus();
    fixture.componentInstance.open = true;
    fixture.detectChanges();
    fixture.componentInstance.open = false;
    fixture.detectChanges();
    expect(document.activeElement).toBe(background);
  });
});
