import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TaskService } from '../../../core/http/task.service';
import { TaskCardComponent } from '../../../shared/components/task-card/task-card.component';
import { Task, TaskType } from '../../../core/models/domain.models';
import { UserProfileService } from '../../../core/auth/user-profile.service';

type Filter = 'today' | 'all' | 'weekly';

@Component({
  selector: 'gp-task-list',
  standalone: true,
  imports: [TaskCardComponent],
  template: `
    <div class="task-list-page">

      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Tasks</h1>
          <p class="page-sub">{{ completedLabel() }}</p>
        </div>
        <button class="btn btn-primary" (click)="router.navigate(['/tasks/new'])">
          + New Task
        </button>
      </div>

      <!-- Filter tabs -->
      <div class="filter-tabs">
        @for (tab of tabs; track tab.value) {
          <button
            class="filter-tab"
            [class.filter-tab--active]="filter() === tab.value"
            (click)="filter.set(tab.value)"
          >
            {{ tab.label }}
            <span class="filter-tab__count">{{ countFor(tab.value) }}</span>
          </button>
        }
      </div>

      <!-- Task list -->
      <div class="tasks-section">
        @if (filteredTasks().length === 0) {
          <div class="empty">
            <p class="empty__icon">📋</p>
            <p class="empty__title">No tasks here</p>
            <p class="empty__sub">Start by adding your first task</p>
            <button class="btn btn-primary" (click)="router.navigate(['/tasks/new'])">Create task</button>
          </div>
        } @else {
          <!-- Mandatory first -->
          @if (mandatoryTasks().length > 0) {
            <div class="tasks-group">
              <p class="tasks-group__label">Required</p>
              @for (task of mandatoryTasks(); track task.id) {
                <gp-task-card
                  [task]="task"
                  (complete)="onComplete($event)"
                  (cardClick)="router.navigate(['/tasks', $event.id])"
                />
              }
            </div>
          }

          <!-- Optional tasks -->
          @if (optionalTasks().length > 0) {
            <div class="tasks-group">
              @if (mandatoryTasks().length > 0) {
                <p class="tasks-group__label">Optional</p>
              }
              @for (task of optionalTasks(); track task.id) {
                <gp-task-card
                  [task]="task"
                  (complete)="onComplete($event)"
                  (cardClick)="router.navigate(['/tasks', $event.id])"
                />
              }
            </div>
          }
        }
      </div>

    </div>
  `,
  styles: [`
    .task-list-page { display: flex; flex-direction: column; gap: 20px; max-width: 800px; }

    .page-header {
      display: flex; align-items: flex-start; justify-content: space-between; gap: 16px;
    }

    .page-title { font-size: 24px; font-weight: 800; }
    .page-sub   { font-size: 12px; color: var(--text-muted); margin-top: 4px; }

    .filter-tabs { display: flex; gap: 6px; }

    .filter-tab {
      padding: 7px 14px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border);
      background: var(--bg-elevated);
      color: var(--text-muted);
      font-size: 12px; font-weight: 600;
      cursor: pointer;
      display: flex; align-items: center; gap: 6px;
      transition: all 0.15s;
    }

    .filter-tab:hover { border-color: var(--border-md); color: var(--text); }

    .filter-tab--active {
      background: var(--primary-glow);
      border-color: rgba(217,70,168,0.25);
      color: var(--primary);
    }

    .filter-tab__count {
      font-family: var(--font-mono);
      font-size: 10px;
      background: var(--bg-input);
      padding: 1px 6px;
      border-radius: 4px;
    }

    .tasks-section { display: flex; flex-direction: column; gap: 16px; }

    .tasks-group { display: flex; flex-direction: column; gap: 6px; }

    .tasks-group__label {
      font-size: 10px; font-weight: 600;
      letter-spacing: 0.08em; text-transform: uppercase;
      color: var(--text-dim);
      margin-bottom: 4px;
    }

    .empty {
      text-align: center;
      padding: 48px 24px;
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
    }

    .empty__icon { font-size: 32px; margin-bottom: 12px; }
    .empty__title { font-size: 16px; font-weight: 700; margin-bottom: 6px; }
    .empty__sub { font-size: 13px; color: var(--text-muted); margin-bottom: 20px; }
  `]
})
export class TaskListComponent implements OnInit {
  readonly taskService    = inject(TaskService);
  readonly profileService = inject(UserProfileService);
  readonly router         = inject(Router);

  readonly filter = signal<Filter>('today');

  readonly tabs = [
    { value: 'today' as Filter, label: 'Today' },
    { value: 'weekly' as Filter, label: 'Weekly' },
    { value: 'all' as Filter, label: 'All Tasks' }
  ];

  readonly filteredTasks = computed<Task[]>(() => {
    const all = this.taskService.allTasks();
    switch (this.filter()) {
      case 'today':  return this.taskService.todayTasks();
      case 'weekly': return all.filter(t => t.taskType === 'WEEKLY' as TaskType);
      default:       return all;
    }
  });

  readonly mandatoryTasks = computed(() => this.filteredTasks().filter(t => t.mandatory));
  readonly optionalTasks  = computed(() => this.filteredTasks().filter(t => !t.mandatory));

  readonly completedLabel = computed(() => {
    const done  = this.taskService.completedTodayCount();
    const total = this.taskService.todayTasks().length;
    return `${done} of ${total} tasks completed today`;
  });

  countFor(filter: Filter): number {
    switch (filter) {
      case 'today':  return this.taskService.todayTasks().length;
      case 'weekly': return this.taskService.allTasks().filter(t => t.taskType === 'WEEKLY').length;
      default:       return this.taskService.allTasks().length;
    }
  }

  ngOnInit(): void {
    this.taskService.loadTodayTasks().subscribe();
    this.taskService.loadAllTasks().subscribe();
  }

  onComplete(task: Task): void {
    this.taskService.completeTask(task.id).subscribe(() => {
      this.profileService.refreshProfile().subscribe();
    });
  }
}
