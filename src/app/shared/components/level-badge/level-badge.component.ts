import { Component, Input } from '@angular/core';

@Component({
  selector: 'gp-level-badge',
  standalone: true,
  template: `
    <div class="level-badge">
      <span class="level-badge__lbl">LVL</span>
      <span class="level-badge__num mono">{{ level }}</span>
      @if (title) {
        <span class="level-badge__title">— {{ title }}</span>
      }
    </div>
  `,
  styles: [`
    .level-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: var(--text-muted);
    }

    .level-badge__lbl {
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.08em;
      color: var(--text-dim);
    }

    .level-badge__num {
      font-size: 13px;
      font-weight: 700;
      color: var(--primary);
    }

    .level-badge__title {
      font-size: 12px;
      font-weight: 500;
      color: var(--text-muted);
    }
  `]
})
export class LevelBadgeComponent {
  @Input({ required: true }) level!: number;
  @Input() title: string | null = null;
}
