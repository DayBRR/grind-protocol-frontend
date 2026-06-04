import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { finalize, forkJoin, switchMap } from 'rxjs';
import { TaskService } from '../../../core/http/task.service';
import { TaskCardComponent } from '../../../shared/components/task-card/task-card.component';
import { Task } from '../../../core/models/domain.models';
import { UserProfileService } from '../../../core/auth/user-profile.service';

type Filter = 'today' | 'habits' | 'all';

@Component({
  selector: 'gp-task-list',
  standalone: true,
  imports: [TaskCardComponent],
  templateUrl: './task-list.component.html',
  styleUrls: ['./task-list.component.scss']
})
export class TaskListComponent implements OnInit {
  readonly taskService = inject(TaskService);
  readonly profileService = inject(UserProfileService);
  readonly router = inject(Router);

  readonly filter = signal<Filter>('today');
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly completingTaskIds = signal<Set<number>>(new Set<number>());

  readonly tabs = [
    { value: 'today' as Filter, label: 'Today' },
    { value: 'habits' as Filter, label: 'Habits' },
    { value: 'all' as Filter, label: 'All Tasks' }
  ];

  readonly filteredTasks = computed<Task[]>(() => {
    const all = this.taskService.allTasks();

    switch (this.filter()) {
      case 'today':
        return this.taskService.todayTasks();
      case 'habits':
        return all.filter(task => task.taskType === 'HABIT');
      default:
        return all;
    }
  });

  readonly mandatoryTasks = computed(() => this.filteredTasks().filter(task => task.mandatory));
  readonly optionalTasks = computed(() => this.filteredTasks().filter(task => !task.mandatory));

  readonly completedLabel = computed(() => {
    const done = this.taskService.completedTodayCount();
    const total = this.taskService.todayTasks().length;
    return `${done} of ${total} tasks completed today`;
  });

  ngOnInit(): void {
    this.loadTasks();
  }

  countFor(filter: Filter): number {
    switch (filter) {
      case 'today':
        return this.taskService.todayTasks().length;
      case 'habits':
        return this.taskService.allTasks().filter(task => task.taskType === 'HABIT').length;
      default:
        return this.taskService.allTasks().length;
    }
  }

  isCompleting(taskId: number): boolean {
    return this.completingTaskIds().has(taskId);
  }

  loadTasks(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    forkJoin({
      today: this.taskService.loadTodayTasks(),
      all: this.taskService.loadAllTasks()
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        error: () => this.errorMessage.set('Tasks could not be loaded from the backend.')
      });
  }

  onComplete(task: Task): void {
    if (!task.canCompleteToday || this.isCompleting(task.id)) return;

    this.setCompleting(task.id, true);
    this.errorMessage.set(null);

    this.taskService.completeTask(task.id)
      .pipe(
        switchMap(() => forkJoin({
          profile: this.profileService.refreshProfile(),
          tasks: this.taskService.loadTodayTasks()
        })),
        finalize(() => this.setCompleting(task.id, false))
      )
      .subscribe({
        error: error => this.errorMessage.set(error?.error?.message ?? 'Task could not be completed.')
      });
  }

  private setCompleting(taskId: number, completing: boolean): void {
    const next = new Set(this.completingTaskIds());

    if (completing) {
      next.add(taskId);
    } else {
      next.delete(taskId);
    }

    this.completingTaskIds.set(next);
  }
}
