import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Reward } from '../../../core/models/domain.models';

@Component({
  selector: 'gp-reward-card',
  standalone: true,
  template: `
    <div class="reward-card" [class.reward-card--affordable]="reward.canAfford" [class.reward-card--cooldown]="reward.isOnCooldown">
      <div class="reward-card__icon">{{ icon }}</div>

      <div class="reward-card__info">
        <p class="reward-card__name">{{ reward.title }}</p>
        <p class="reward-card__desc">{{ reward.description }}</p>
      </div>

      <div class="reward-card__footer">
        <span class="reward-card__cost mono">
          🪙 {{ reward.costCorePoints }}
        </span>

        @if (reward.isOnCooldown) {
          <span class="reward-card__status reward-card__status--cooldown">Cooldown</span>
        } @else if (!reward.canAfford) {
          <span class="reward-card__status reward-card__status--locked">🔒</span>
        } @else {
          <button class="btn btn-primary btn--sm" (click)="claim.emit(reward)">Claim</button>
        }
      </div>
    </div>
  `,
  styles: [`
    .reward-card {
      background: var(--bg-elevated);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      transition: border-color 0.15s;
      cursor: default;
    }

    .reward-card:hover { border-color: var(--border-md); }

    .reward-card--affordable {
      border-color: rgba(234,179,8,0.2);
      background: rgba(234,179,8,0.04);
    }

    .reward-card--affordable:hover { border-color: rgba(234,179,8,0.35); }

    .reward-card--cooldown { opacity: 0.5; }

    .reward-card__icon {
      font-size: 24px;
      width: 40px; height: 40px;
      background: var(--bg-input);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .reward-card__info { flex: 1; }

    .reward-card__name {
      font-size: 13px;
      font-weight: 600;
      color: var(--text);
      margin: 0;
    }

    .reward-card__desc {
      font-size: 11px;
      color: var(--text-muted);
      margin: 3px 0 0;
      line-height: 1.5;
    }

    .reward-card__footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .reward-card__cost {
      font-size: 13px;
      font-weight: 600;
      color: var(--currency);
    }

    .reward-card__status {
      font-size: 11px;
      font-weight: 600;
      padding: 3px 8px;
      border-radius: 5px;
    }

    .reward-card__status--locked { color: var(--text-dim); }

    .reward-card__status--cooldown {
      color: var(--text-muted);
      background: var(--bg-input);
      border: 1px solid var(--border);
    }

    .btn--sm { padding: 5px 12px; font-size: 11px; }
  `]
})
export class RewardCardComponent {
  @Input({ required: true }) reward!: Reward;
  @Input() icon = '🎁';
  @Output() claim = new EventEmitter<Reward>();
}
