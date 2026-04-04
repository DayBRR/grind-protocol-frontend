import { Component, Input } from '@angular/core';

export interface StreakDay {
  label: string;
  hit: boolean;
  isToday: boolean;
}

@Component({
  selector: 'gp-streak-calendar',
  standalone: true,
  template: `
    <div class="streak-cal">
      @for (day of days; track day.label) {
        <div
          class="streak-cal__day"
          [class.streak-cal__day--hit]="day.hit"
          [class.streak-cal__day--today]="day.isToday"
        >
          <div class="streak-cal__dot"></div>
          <span [style.color]="day.isToday ? 'var(--streak)' : ''">{{ day.label }}</span>
        </div>
      }
    </div>
  `,
  styles: [`
    .streak-cal {
      display: flex;
      gap: 4px;
    }

    .streak-cal__day {
      flex: 1;
      height: 32px;
      border-radius: 5px;
      background: var(--bg-elevated);
      border: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 3px;
      font-family: var(--font-mono);
      font-size: 8px;
      color: var(--text-dim);
      transition: border-color 0.15s;
    }

    .streak-cal__day--hit {
      background: rgba(249,115,22,0.1);
      border-color: rgba(249,115,22,0.25);
    }

    .streak-cal__day--hit .streak-cal__dot {
      background: var(--streak);
      box-shadow: 0 0 5px var(--streak);
    }

    .streak-cal__day--today { border-color: rgba(249,115,22,0.45); }

    .streak-cal__dot {
      width: 5px; height: 5px;
      border-radius: 50%;
      background: var(--text-dim);
      transition: background 0.15s;
    }
  `]
})
export class StreakCalendarComponent {
  @Input({ required: true }) days!: StreakDay[];
}
