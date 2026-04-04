import { Component, Input } from '@angular/core';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'gp-xp-progress-bar',
  standalone: true,
  imports: [DecimalPipe],
  template: `
    <div class="xp-bar-wrap">
      <div class="xp-bar__labels">
        <span class="mono">{{ currentXp | number }} XP</span>
        <span class="xp-bar__next">LVL {{ level + 1 }} &#64; {{ targetXp | number }} XP</span>
      </div>
      <div class="xp-bar__track">
        <div class="xp-bar__fill" [style.width.%]="progress * 100"></div>
      </div>
    </div>
  `,
  styles: [`
    .xp-bar-wrap { width: 100%; }

    .xp-bar__labels {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      font-family: var(--font-mono);
      color: var(--text-dim);
      margin-bottom: 6px;
    }

    .xp-bar__next { color: var(--text-dim); }

    .xp-bar__track {
      height: 5px;
      background: var(--bg-input);
      border-radius: 3px;
      overflow: hidden;
    }

    .xp-bar__fill {
      height: 100%;
      background: linear-gradient(90deg, var(--xp), #818cf8);
      border-radius: 3px;
      transition: width 0.6s ease;
      animation: pulse-xp 2s ease-in-out infinite;
    }

    @keyframes pulse-xp {
      0%, 100% { box-shadow: 0 0 4px rgba(34,211,238,0.3); }
      50%       { box-shadow: 0 0 10px rgba(34,211,238,0.6); }
    }
  `]
})
export class XpProgressBarComponent {
  @Input({ required: true }) currentXp!: number;
  @Input({ required: true }) targetXp!: number;
  @Input({ required: true }) progress!: number;   // 0–1
  @Input({ required: true }) level!: number;
}
