import { Component, Input, computed, signal } from '@angular/core';

const CIRCUMFERENCE = 2 * Math.PI * 40; // r=40

@Component({
  selector: 'gp-daily-ring',
  standalone: true,
  template: `
    <div class="ring-wrap">
      <svg class="ring-svg" width="96" height="96" viewBox="0 0 96 96">
        <!-- Track -->
        <circle cx="48" cy="48" r="40" fill="none" stroke="var(--bg-input)" stroke-width="6"/>
        <!-- Progress -->
        <circle
          cx="48" cy="48" r="40"
          fill="none"
          stroke="var(--xp)"
          stroke-width="6"
          stroke-linecap="round"
          [attr.stroke-dasharray]="circumference"
          [attr.stroke-dashoffset]="dashOffset()"
          transform="rotate(-90 48 48)"
          class="ring-progress"
        />
      </svg>
      <div class="ring-center">
        <span class="ring-number mono">{{ completed }}/{{ total }}</span>
        <span class="ring-sub">tasks</span>
      </div>
    </div>
  `,
  styles: [`
    .ring-wrap {
      position: relative;
      width: min(96px, 100%);
      aspect-ratio: 1;
      height: auto;
      flex-shrink: 0;
    }

    .ring-svg {
      display: block;
      width: 100%;
      height: 100%;
    }

    .ring-center {
      position: absolute;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
    }

    .ring-number {
      display: block;
      font-size: clamp(14px, 22%, 20px);
      font-weight: 800;
      color: var(--text);
      line-height: 1;
    }

    .ring-sub {
      display: block;
      font-size: clamp(8px, 11%, 10px);
      color: var(--text-dim);
      font-family: var(--font-mono);
      margin-top: 2px;
    }

    .ring-progress {
      transition: stroke-dashoffset 0.6s ease;
      filter: drop-shadow(0 0 4px var(--xp));
    }
  `]
})
export class DailyRingComponent {
  @Input({ required: true }) completed!: number;
  @Input({ required: true }) total!: number;

  readonly circumference = CIRCUMFERENCE;

  dashOffset = computed(() => {
    const ratio = this.total > 0 ? this.completed / this.total : 0;
    return CIRCUMFERENCE * (1 - ratio);
  });
}
