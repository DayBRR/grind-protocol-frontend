import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Task } from '../../../core/models/domain.models';

const DIFFICULTY_COLOR: Record<string, string> = {
  S: 'var(--currency)',
  A: 'var(--primary)',
  B: 'var(--xp)',
  C: 'var(--text-muted)'
};

const CATEGORY_COLOR: Record<string, string> = {
  HEALTH:   '#22c55e',
  LEARNING: '#818cf8',
  WORK:     '#22d3ee',
  PERSONAL: '#f97316',
  FINANCE:  '#eab308',
  OTHER:    '#8b899a'
};

@Component({
  selector: 'gp-task-card',
  standalone: true,
  template: `
    <div class="task-card" [class.task-card--done]="isDone" (click)="cardClick.emit(task)">
      <!-- Checkbox -->
      <button
        class="task-card__check"
        [class.task-card__check--done]="isDone"
        [disabled]="isDone || !task.canCompleteToday"
        (click)="$event.stopPropagation(); complete.emit(task)"
        aria-label="Complete task"
      >
        @if (isDone) { <span>✓</span> }
      </button>

      <!-- Body -->
      <div class="task-card__body">
        <span class="task-card__title">{{ task.title }}</span>
        <div class="task-card__meta">
          <span class="task-card__category" [style.color]="categoryColor">
            {{ task.category }}
          </span>
        </div>
      </div>

      <!-- Right badges -->
      <div class="task-card__right">
        @if (task.mandatory) {
          <span class="badge badge--req">REQ</span>
        }
        <span class="badge badge--diff" [style.color]="difficultyColor">{{ task.difficulty }}</span>
        <span class="badge badge--xp mono">+{{ task.baseXp }} XP</span>
      </div>
    </div>
  `,
  styles: [`
    .task-card {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border-radius: var(--radius-md);
      border: 1px solid var(--border);
      background: var(--bg-elevated);
      cursor: pointer;
      transition: border-color 0.15s;
    }

    .task-card:hover { border-color: var(--border-md); }
    .task-card--done { opacity: 0.5; }
    .task-card--done .task-card__title { text-decoration: line-through; color: var(--text-dim); }

    .task-card__check {
      width: 20px; height: 20px;
      border-radius: 5px;
      border: 1.5px solid var(--border-md);
      background: transparent;
      color: white;
      font-size: 11px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      flex-shrink: 0;
      transition: all 0.15s;
    }

    .task-card__check:hover:not(:disabled) { border-color: var(--xp); }
    .task-card__check--done { background: var(--success) !important; border-color: var(--success) !important; }
    .task-card__check:disabled { cursor: default; }

    .task-card__body { flex: 1; min-width: 0; }

    .task-card__title {
      font-size: 13px;
      font-weight: 500;
      color: var(--text);
      display: block;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .task-card__meta { margin-top: 2px; }

    .task-card__category {
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.06em;
    }

    .task-card__right {
      display: flex;
      align-items: center;
      gap: 5px;
      flex-shrink: 0;
    }

    .badge {
      font-size: 9px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
      letter-spacing: 0.05em;
    }

    .badge--req {
      color: var(--primary);
      background: var(--primary-glow);
      border: 1px solid rgba(217,70,168,0.15);
    }

    .badge--diff {
      background: var(--bg-input);
      border: 1px solid var(--border);
    }

    .badge--xp {
      color: var(--xp);
      background: var(--xp-glow);
      border: 1px solid rgba(34,211,238,0.15);
    }
  `]
})
export class TaskCardComponent {
  @Input({ required: true }) task!: Task;
  @Output() complete  = new EventEmitter<Task>();
  @Output() cardClick = new EventEmitter<Task>();

  get isDone(): boolean { return (this.task.completedToday ?? 0) > 0; }
  get difficultyColor(): string { return DIFFICULTY_COLOR[this.task.difficulty] ?? 'var(--text-muted)'; }
  get categoryColor(): string   { return CATEGORY_COLOR[this.task.category]    ?? 'var(--text-muted)'; }
}
