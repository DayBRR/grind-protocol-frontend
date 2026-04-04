import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TaskService } from '../../../core/http/task.service';
import { DifficultySelectorComponent } from '../../../shared/components/difficulty-selector/difficulty-selector.component';
import { Task, TaskCategory, TaskDifficulty, TaskType } from '../../../core/models/domain.models';

const BASE_XP: Record<TaskDifficulty, number> = { S: 120, A: 80, B: 50, C: 25 };

@Component({
  selector: 'gp-task-create',
  standalone: true,
  imports: [FormsModule, DifficultySelectorComponent],
  template: `
    <div class="create-page">
      <div class="create-card">

        <!-- Header -->
        <div class="create-header">
          <button class="btn btn-ghost btn--icon" (click)="router.navigate(['/tasks'])">←</button>
          <h1 class="create-title">New Task</h1>
        </div>

        @if (error()) {
          <div class="form-error">{{ error() }}</div>
        }

        <!-- Form -->
        <div class="form-section">
          <label class="form-label">Title</label>
          <input type="text" placeholder="e.g. Morning workout" [(ngModel)]="form.title" />
        </div>

        <div class="form-section">
          <label class="form-label">Description (optional)</label>
          <textarea placeholder="What does this task involve?" [(ngModel)]="form.description" rows="3"></textarea>
        </div>

        <div class="form-row">
          <div class="form-section">
            <label class="form-label">Category</label>
            <select [(ngModel)]="form.category">
              @for (cat of categories; track cat) {
                <option [value]="cat">{{ cat }}</option>
              }
            </select>
          </div>

          <div class="form-section">
            <label class="form-label">Type</label>
            <select [(ngModel)]="form.taskType">
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
              <option value="ONE_TIME">One-time</option>
              <option value="LONG_TERM">Long-term</option>
            </select>
          </div>
        </div>

        <div class="form-section">
          <label class="form-label">Difficulty</label>
          <gp-difficulty-selector [(value)]="form.difficulty" (valueChange)="onDifficultyChange($event)" />
          <p class="form-hint">Base XP: {{ form.baseXp }}</p>
        </div>

        <div class="form-row">
          <div class="form-section">
            <label class="form-label toggle-label">
              <span>Mandatory</span>
              <div class="toggle" [class.toggle--on]="form.mandatory" (click)="form.mandatory = !form.mandatory">
                <div class="toggle__thumb"></div>
              </div>
            </label>
            <p class="form-hint">Required to qualify the day</p>
          </div>

          <div class="form-section">
            <label class="form-label toggle-label">
              <span>Repeatable</span>
              <div class="toggle" [class.toggle--on]="form.repeatable" (click)="form.repeatable = !form.repeatable">
                <div class="toggle__thumb"></div>
              </div>
            </label>
            <p class="form-hint">Can complete multiple times / day</p>
          </div>
        </div>

        <!-- XP preview -->
        <div class="xp-preview">
          <div class="xp-preview__item">
            <span class="xp-preview__label">XP earned</span>
            <span class="xp-preview__val mono text-xp">+{{ form.baseXp }}</span>
          </div>
          <div class="xp-preview__item">
            <span class="xp-preview__label">Core Points</span>
            <span class="xp-preview__val mono text-gold">+{{ cpPreview() }}</span>
          </div>
        </div>

        <!-- Actions -->
        <div class="create-actions">
          <button class="btn btn-ghost" (click)="router.navigate(['/tasks'])">Cancel</button>
          <button class="btn btn-primary" [disabled]="saving()" (click)="save()">
            {{ saving() ? 'Saving...' : 'Create Task' }}
          </button>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .create-page {
      display: flex; justify-content: center;
      padding-bottom: 40px;
    }

    .create-card {
      width: 100%; max-width: 560px;
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-xl);
      padding: 28px 32px;
      display: flex; flex-direction: column; gap: 20px;
    }

    .create-header {
      display: flex; align-items: center; gap: 14px;
    }

    .create-title { font-size: 20px; font-weight: 800; }

    .btn--icon { width: 34px; height: 34px; padding: 0; justify-content: center; flex-shrink: 0; }

    .form-error {
      background: rgba(239,68,68,0.1);
      border: 1px solid rgba(239,68,68,0.25);
      border-radius: var(--radius-md);
      color: var(--danger);
      font-size: 12px; padding: 10px 14px;
    }

    .form-section { display: flex; flex-direction: column; gap: 6px; }

    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }

    .form-label {
      font-size: 11px; font-weight: 600;
      color: var(--text-dim);
      letter-spacing: 0.06em; text-transform: uppercase;
    }

    .toggle-label {
      display: flex; align-items: center; justify-content: space-between;
    }

    .form-hint { font-size: 11px; color: var(--text-dim); }

    textarea { resize: vertical; min-height: 72px; }

    .toggle {
      width: 36px; height: 20px;
      border-radius: 10px;
      background: var(--border-md);
      position: relative;
      cursor: pointer;
      transition: background 0.2s;
      flex-shrink: 0;
    }

    .toggle--on { background: var(--primary); }

    .toggle__thumb {
      position: absolute;
      top: 2px; left: 2px;
      width: 16px; height: 16px;
      border-radius: 50%;
      background: white;
      transition: transform 0.2s;
    }

    .toggle--on .toggle__thumb { transform: translateX(16px); }

    .xp-preview {
      display: flex; gap: 12px;
      background: var(--bg-elevated);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 14px 16px;
    }

    .xp-preview__item { flex: 1; }
    .xp-preview__label { font-size: 10px; color: var(--text-dim); display: block; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.06em; }
    .xp-preview__val   { font-size: 18px; font-weight: 700; }

    .create-actions { display: flex; gap: 10px; justify-content: flex-end; }
  `]
})
export class TaskCreateComponent {
  readonly taskService = inject(TaskService);
  readonly router      = inject(Router);

  form = {
    title:       '',
    description: '',
    category:    'WORK' as TaskCategory,
    taskType:    'DAILY' as TaskType,
    difficulty:  'B' as TaskDifficulty,
    baseXp:      BASE_XP['B'],
    mandatory:   false,
    repeatable:  false
  };

  saving = signal(false);
  error  = signal<string | null>(null);

  readonly categories: TaskCategory[] = ['HEALTH', 'LEARNING', 'WORK', 'PERSONAL', 'FINANCE', 'OTHER'];

  cpPreview(): number { return Math.floor(this.form.baseXp / 10); }

  onDifficultyChange(d: TaskDifficulty): void {
    this.form.difficulty = d;
    this.form.baseXp = BASE_XP[d];
  }

  save(): void {
    if (!this.form.title.trim()) { this.error.set('Title is required.'); return; }
    this.saving.set(true);
    this.error.set(null);

    this.taskService.createTask(this.form as Partial<Task>).subscribe({
      next:  () => this.router.navigate(['/tasks']),
      error: err => {
        this.error.set(err?.error?.message ?? 'Failed to create task.');
        this.saving.set(false);
      }
    });
  }
}
