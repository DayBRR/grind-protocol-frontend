import { LowerCasePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, forkJoin, switchMap, tap } from 'rxjs';
import { TaskService } from '../../../core/http/task.service';
import { UserProfileService } from '../../../core/auth/user-profile.service';
import { nextTaskReward } from '../../../core/models/task-reward-preview';
import { Task } from '../../../core/models/domain.models';

@Component({
  selector: 'gp-task-detail',
  standalone: true,
  imports: [LowerCasePipe],
  templateUrl: './task-detail.component.html',
  styleUrls: ['./task-detail.component.scss']
})
export class TaskDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly taskService = inject(TaskService);
  private readonly profileService = inject(UserProfileService);
  readonly router = inject(Router);

  readonly task = signal<Task | null>(null);
  readonly rewardPreview = computed(() => {
    const task = this.task();
    return task ? nextTaskReward(task) : null;
  });
  readonly loading = signal(false);
  readonly completing = signal(false);
  readonly errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.loadTask();
  }

  loadTask(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!Number.isFinite(id)) {
      this.errorMessage.set('Invalid task id.');
      return;
    }

    const existing = this.findTaskInState(id);
    if (existing) {
      this.task.set(existing);
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    forkJoin({
      today: this.taskService.loadTodayTasks(),
      all: this.taskService.loadAllTasks()
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          const loaded = this.findTaskInState(id);
          this.task.set(loaded ?? null);

          if (!loaded) {
            this.errorMessage.set('Task could not be found.');
          }
        },
        error: () => this.errorMessage.set('Task detail could not be loaded from the backend.')
      });
  }

  onComplete(task: Task): void {
    if (!nextTaskReward(task) || this.completing()) return;

    this.completing.set(true);
    this.errorMessage.set(null);

    this.taskService.completeTask(task.id)
      .pipe(
        tap(() => {
          const updated = this.findTaskInState(task.id);
          if (updated) this.task.set(updated);
        }),
        switchMap(() => forkJoin({
          profile: this.profileService.refreshProfile(),
          tasks: this.taskService.loadTodayTasks()
        })),
        finalize(() => this.completing.set(false))
      )
      .subscribe({
        next: () => {
          const refreshed = this.findTaskInState(task.id);
          if (refreshed) this.task.set(refreshed);
        },
        error: error => this.errorMessage.set(error?.error?.message ?? 'Task could not be completed.')
      });
  }

  private findTaskInState(taskId: number): Task | undefined {
    return this.taskService.todayTasks().find(task => task.id === taskId)
      ?? this.taskService.allTasks().find(task => task.id === taskId);
  }
}
