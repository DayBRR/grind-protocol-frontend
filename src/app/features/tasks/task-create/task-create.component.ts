import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { TaskService } from '../../../core/http/task.service';
import { DifficultySelectorComponent } from '../../../shared/components/difficulty-selector/difficulty-selector.component';
import { CreateTaskRequest, TaskCategory, TaskDifficulty, TaskType } from '../../../core/models/domain.models';

const BASE_XP: Record<TaskDifficulty, number> = {
  S: 120,
  A: 80,
  B: 50,
  C: 25
};

interface TaskCreateForm {
  title: string;
  description: string;
  category: TaskCategory;
  taskType: TaskType;
  difficulty: TaskDifficulty;
  baseXp: number;
  mandatory: boolean;
  streakEligible: boolean;
  repeatable: boolean;
  maxCompletionsPerDay: number;
  diminishingReturnsEnabled: boolean;
}

@Component({
  selector: 'gp-task-create',
  standalone: true,
  imports: [FormsModule, DifficultySelectorComponent],
  templateUrl: './task-create.component.html',
  styleUrls: ['./task-create.component.scss']
})
export class TaskCreateComponent {
  readonly taskService = inject(TaskService);
  readonly router = inject(Router);

  readonly form: TaskCreateForm = {
    title: '',
    description: '',
    category: 'WORK',
    taskType: 'DAILY',
    difficulty: 'B',
    baseXp: BASE_XP.B,
    mandatory: false,
    streakEligible: true,
    repeatable: false,
    maxCompletionsPerDay: 1,
    diminishingReturnsEnabled: false
  };

  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly categories: Array<{ value: TaskCategory; label: string }> = [
    { value: 'MIND', label: 'Mind' },
    { value: 'BODY', label: 'Body' },
    { value: 'WORK', label: 'Work' },
    { value: 'PERSONAL', label: 'Personal' }
  ];

  readonly taskTypes: Array<{ value: TaskType; label: string }> = [
    { value: 'DAILY', label: 'Daily' },
    { value: 'HABIT', label: 'Habit' },
    { value: 'ONE_TIME', label: 'One-time' }
  ];

  cpPreview(): number {
    return Math.floor(this.form.baseXp / 10);
  }

  onDifficultyChange(difficulty: TaskDifficulty): void {
    this.form.difficulty = difficulty;
    this.form.baseXp = BASE_XP[difficulty];
  }

  toggleRepeatable(): void {
    this.form.repeatable = !this.form.repeatable;
    this.form.maxCompletionsPerDay = this.form.repeatable ? Math.max(this.form.maxCompletionsPerDay, 2) : 1;
    this.form.diminishingReturnsEnabled = this.form.repeatable;
  }

  save(): void {
    const title = this.form.title.trim();

    if (!title) {
      this.error.set('Title is required.');
      return;
    }

    this.saving.set(true);
    this.error.set(null);

    const payload: Partial<CreateTaskRequest> = {
      title,
      description: this.form.description.trim() || null,
      category: this.form.category as CreateTaskRequest['category'],
      difficulty: this.form.difficulty as unknown as CreateTaskRequest['difficulty'],
      taskType: this.form.taskType as CreateTaskRequest['taskType'],
      baseXp: this.form.baseXp,
      mandatory: this.form.mandatory,
      streakEligible: this.form.streakEligible,
      repeatable: this.form.repeatable,
      maxCompletionsPerDay: this.form.maxCompletionsPerDay,
      diminishingReturnsEnabled: this.form.diminishingReturnsEnabled,
      dueTime: null,
      weeklyClosingDay: null,
      traitCodes: []
    };

    this.taskService.createTask(payload)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => this.router.navigate(['/tasks']),
        error: error => this.error.set(error?.error?.message ?? 'Failed to create task.')
      });
  }
}
