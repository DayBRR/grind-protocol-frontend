import { Component, OnInit, inject, signal } from '@angular/core';
import { TimelineService } from '../../core/http/timeline.service';
import { TimelineDotComponent } from '../../shared/components/timeline-dot/timeline-dot.component';
import { TimelineEventType } from '../../core/models/domain.models';

const EVENT_TYPE_LABELS: Record<TimelineEventType, string> = {
  TASK_COMPLETED:  'Task completed',
  XP_EARNED:       'XP earned',
  DAY_QUALIFIED:   'Day qualified',
  STREAK_EXTENDED: 'Streak extended',
  STREAK_BROKEN:   'Streak broken',
  LEVEL_UP:        'Level up',
  REWARD_CLAIMED:  'Reward claimed',
  REWARD_UNLOCKED: 'Reward unlocked'
};

@Component({
  selector: 'gp-timeline-page',
  standalone: true,
  imports: [TimelineDotComponent],
  template: `
    <div class="timeline-page">

      <div class="page-header">
        <h1 class="page-title">Timeline</h1>
      </div>

      <!-- Filter chips -->
      <div class="filter-chips">
        <button
          class="chip"
          [class.chip--active]="!activeFilter()"
          (click)="setFilter(null)"
        >All</button>
        @for (type of eventTypes; track type) {
          <button
            class="chip"
            [class.chip--active]="activeFilter() === type"
            (click)="setFilter(type)"
          >{{ labelFor(type) }}</button>
        }
      </div>

      <!-- Events -->
      @if (timelineService.events().length === 0) {
        <div class="empty">
          <p class="empty__icon">📜</p>
          <p class="empty__title">No events yet</p>
          <p class="empty__sub">Complete tasks to start building your history</p>
        </div>
      } @else {
        <div class="card">
          @for (event of timelineService.events(); track event.id) {
            <gp-timeline-dot [event]="event" />
          }
        </div>

        @if (hasMore()) {
          <button class="btn btn-ghost load-more" (click)="loadMore()">Load more</button>
        }
      }

    </div>
  `,
  styles: [`
    .timeline-page { display: flex; flex-direction: column; gap: 20px; max-width: 700px; }

    .page-header { display: flex; align-items: center; gap: 16px; }
    .page-title  { font-size: 24px; font-weight: 800; }

    .filter-chips { display: flex; gap: 6px; flex-wrap: wrap; }

    .chip {
      padding: 5px 12px;
      border-radius: 20px;
      border: 1px solid var(--border);
      background: var(--bg-elevated);
      color: var(--text-muted);
      font-size: 11px; font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
    }

    .chip:hover { border-color: var(--border-md); color: var(--text); }

    .chip--active {
      background: var(--primary-glow);
      border-color: rgba(217,70,168,0.25);
      color: var(--primary);
    }

    .empty {
      text-align: center; padding: 48px 24px;
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
    }

    .empty__icon  { font-size: 32px; margin-bottom: 12px; }
    .empty__title { font-size: 16px; font-weight: 700; margin-bottom: 6px; }
    .empty__sub   { font-size: 13px; color: var(--text-muted); }

    .load-more { width: 100%; justify-content: center; }
  `]
})
export class TimelinePageComponent implements OnInit {
  readonly timelineService = inject(TimelineService);

  readonly activeFilter = signal<TimelineEventType | null>(null);
  readonly page         = signal(0);
  readonly hasMore      = signal(true);

  readonly eventTypes: TimelineEventType[] = [
    'TASK_COMPLETED', 'STREAK_EXTENDED', 'LEVEL_UP', 'REWARD_CLAIMED', 'DAY_QUALIFIED'
  ];

  ngOnInit(): void {
    this.load();
  }

  labelFor(type: TimelineEventType): string { return EVENT_TYPE_LABELS[type]; }

  setFilter(type: TimelineEventType | null): void {
    this.activeFilter.set(type);
    this.page.set(0);
    this.load();
  }

  loadMore(): void {
    this.page.update(p => p + 1);
    this.load();
  }

  private load(): void {
    this.timelineService.loadEvents({
      page: this.page(),
      size: 20,
      eventType: this.activeFilter() ?? undefined
    }).subscribe(events => {
      this.hasMore.set(events.length === 20);
    });
  }
}
