import { Component, Input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TimelineEvent, TimelineEventType } from '../../../core/models/domain.models';

const EVENT_COLORS: Record<TimelineEventType, string> = {
  TASK_COMPLETED:  'var(--xp)',
  XP_EARNED:       'var(--xp)',
  DAY_QUALIFIED:   'var(--success)',
  STREAK_EXTENDED: 'var(--streak)',
  STREAK_BROKEN:   'var(--danger)',
  LEVEL_UP:        'var(--primary)',
  REWARD_CLAIMED:  'var(--currency)',
  REWARD_UNLOCKED: 'var(--currency)'
};

const EVENT_ICONS: Record<TimelineEventType, string> = {
  TASK_COMPLETED:  '✓',
  XP_EARNED:       '★',
  DAY_QUALIFIED:   '◆',
  STREAK_EXTENDED: '🔥',
  STREAK_BROKEN:   '✕',
  LEVEL_UP:        '▲',
  REWARD_CLAIMED:  '🪙',
  REWARD_UNLOCKED: '🔓'
};

@Component({
  selector: 'gp-timeline-dot',
  standalone: true,
  imports: [DatePipe],
  template: `
    <div class="tl-item">
      <div class="tl-item__dot-col">
        <div class="tl-item__icon" [style.color]="dotColor" [style.border-color]="dotColor" [style.box-shadow]="'0 0 8px ' + dotColor">{{ icon }}</div>
      </div>
      <div class="tl-item__body">
        <p class="tl-item__title">{{ event.title }}</p>
        <p class="tl-item__desc">{{ event.description }}</p>
      </div>
      <span class="tl-item__time mono">{{ event.createdAt | date:'HH:mm' }}</span>
    </div>
  `,
  styles: [`
    .tl-item {
      display: flex;
      gap: 12px;
      padding: 10px 0 0 10px;
      align-items: center;
    }

    .tl-item__body {
      border-bottom: 1px solid var(--border);
      padding-bottom: 10px;
    }

    .tl-item:last-child .tl-item__body { border-bottom: none; padding-bottom: 0; }

    .tl-item__dot-col { flex-shrink: 0; }

    .tl-item__icon {
      width: 28px; height: 28px; border-radius: 8px;
      border: 1px solid;
      display: flex; align-items: center; justify-content: center;
      font-size: 12px; font-weight: 900;
      background: rgba(0,0,0,0.2);
    }

    .tl-item__body { flex: 1; }

    .tl-item__title { font-size: 12px; font-weight: 600; color: var(--text); margin: 0; }

    .tl-item__desc { font-size: 11px; color: var(--text-dim); margin: 2px 0 0; }

    .tl-item__time { font-size: 10px; color: var(--text-dim); padding-top: 4px; flex-shrink: 0; }
  `]
})
export class TimelineDotComponent {
  @Input({ required: true }) event!: TimelineEvent;

  get dotColor(): string { return EVENT_COLORS[this.event.eventType] ?? 'var(--text-dim)'; }
  get icon(): string     { return EVENT_ICONS[this.event.eventType]  ?? '•'; }
}
