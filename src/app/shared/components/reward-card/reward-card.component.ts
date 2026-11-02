import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Reward } from '../../../core/models/domain.models';

@Component({
  selector: 'gp-reward-card',
  standalone: true,
  templateUrl: './reward-card.component.html',
  styleUrls: ['./reward-card.component.scss']
})
export class RewardCardComponent {
  @Input({ required: true }) reward!: Reward;
  @Input() icon = '🎁';

  @Output() claim = new EventEmitter<Reward>();

  get lockedReason(): string | null {
    return this.reward.lockedReason;
  }

  onClaim(event?: MouseEvent): void {
    if (this.lockedReason) {
      return;
    }

    // Touch browsers do not always focus a button on activation. Capture a real
    // opener before the dialog mounts so closing can restore keyboard focus.
    (event?.currentTarget as HTMLElement | null)?.focus({ preventScroll: true });
    this.claim.emit(this.reward);
  }
}
