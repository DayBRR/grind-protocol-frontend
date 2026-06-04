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
    if (!this.reward.enabled) {
      return 'Unavailable';
    }

    if (this.reward.requiredLevel && this.reward.requiredLevel > 0) {
      return `Level ${this.reward.requiredLevel}+`;
    }

    if (this.reward.requiredCurrentStreak && this.reward.requiredCurrentStreak > 0) {
      return `${this.reward.requiredCurrentStreak} day streak`;
    }

    if (!this.reward.canAfford) {
      return 'Not enough CP';
    }

    if (this.reward.isOnCooldown) {
      return 'Cooldown';
    }

    return null;
  }

  onClaim(): void {
    if (this.lockedReason) {
      return;
    }

    this.claim.emit(this.reward);
  }
}
