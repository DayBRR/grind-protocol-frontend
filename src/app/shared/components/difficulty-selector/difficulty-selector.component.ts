import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TaskDifficulty } from '../../../core/models/domain.models';

interface DiffOption {
  value: TaskDifficulty;
  label: string;
  color: string;
  hint: string;
}

const OPTIONS: DiffOption[] = [
  { value: 'S', label: 'S', color: 'var(--currency)', hint: 'Legendary' },
  { value: 'A', label: 'A', color: 'var(--primary)',  hint: 'Hard' },
  { value: 'B', label: 'B', color: 'var(--xp)',       hint: 'Medium' },
  { value: 'C', label: 'C', color: 'var(--text-muted)', hint: 'Easy' }
];

@Component({
  selector: 'gp-difficulty-selector',
  standalone: true,
  template: `
    <div class="diff-selector">
      @for (opt of options; track opt.value) {
        <button
          class="diff-btn"
          [class.diff-btn--active]="value === opt.value"
          [style.--btn-color]="opt.color"
          [title]="opt.hint"
          (click)="valueChange.emit(opt.value)"
        >
          {{ opt.label }}
        </button>
      }
    </div>
  `,
  styles: [`
    .diff-selector { display: flex; gap: 6px; }

    .diff-btn {
      flex: 1;
      height: 36px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-md);
      background: var(--bg-elevated);
      color: var(--text-muted);
      font-family: var(--font-display);
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.15s;
    }

    .diff-btn:hover {
      border-color: var(--btn-color);
      color: var(--btn-color);
    }

    .diff-btn--active {
      background: color-mix(in srgb, var(--btn-color) 12%, transparent);
      border-color: var(--btn-color);
      color: var(--btn-color);
      box-shadow: 0 0 10px color-mix(in srgb, var(--btn-color) 20%, transparent);
    }
  `]
})
export class DifficultySelectorComponent {
  @Input()  value: TaskDifficulty = 'B';
  @Output() valueChange = new EventEmitter<TaskDifficulty>();

  readonly options = OPTIONS;
}
