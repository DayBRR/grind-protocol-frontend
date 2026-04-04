import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiService } from '../http/api.service';
import { Task, TaskCompletion, DailyProgress } from '../models/domain.models';

export interface CompleteTaskRequest {
  notes?: string;
}

@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly api = inject(ApiService);

  private readonly _todayTasks    = signal<Task[]>([]);
  private readonly _dailyProgress = signal<DailyProgress | null>(null);
  private readonly _allTasks      = signal<Task[]>([]);

  readonly todayTasks    = this._todayTasks.asReadonly();
  readonly dailyProgress = this._dailyProgress.asReadonly();
  readonly allTasks      = this._allTasks.asReadonly();

  readonly completedTodayCount = computed(() =>
    this._todayTasks().filter(t => (t.completedToday ?? 0) > 0).length
  );

  readonly mandatoryPendingCount = computed(() =>
    this._todayTasks().filter(t => t.mandatory && !(t.completedToday ?? 0)).length
  );

  loadTodayTasks(): Observable<Task[]> {
    return this.api.get<Task[]>('/tasks/today').pipe(
      tap(tasks => this._todayTasks.set(tasks))
    );
  }

  loadAllTasks(): Observable<Task[]> {
    return this.api.get<Task[]>('/tasks').pipe(
      tap(tasks => this._allTasks.set(tasks))
    );
  }

  loadDailyProgress(): Observable<DailyProgress> {
    return this.api.get<DailyProgress>('/progression/daily').pipe(
      tap(dp => this._dailyProgress.set(dp))
    );
  }

  completeTask(taskId: number, req: CompleteTaskRequest = {}): Observable<TaskCompletion> {
    return this.api.post<TaskCompletion>(`/tasks/${taskId}/complete`, req).pipe(
      tap(() => {
        // Optimistically update local state
        this._todayTasks.update(tasks =>
          tasks.map(t => t.id === taskId
            ? { ...t, completedToday: (t.completedToday ?? 0) + 1, canCompleteToday: false }
            : t
          )
        );
      })
    );
  }

  createTask(payload: Partial<Task>): Observable<Task> {
    return this.api.post<Task>('/tasks', payload).pipe(
      tap(task => this._allTasks.update(tasks => [...tasks, task]))
    );
  }

  updateTask(taskId: number, payload: Partial<Task>): Observable<Task> {
    return this.api.put<Task>(`/tasks/${taskId}`, payload).pipe(
      tap(updated => {
        this._allTasks.update(tasks => tasks.map(t => t.id === taskId ? updated : t));
        this._todayTasks.update(tasks => tasks.map(t => t.id === taskId ? { ...updated, completedToday: t.completedToday } : t));
      })
    );
  }

  deleteTask(taskId: number): Observable<void> {
    return this.api.delete<void>(`/tasks/${taskId}`).pipe(
      tap(() => {
        this._allTasks.update(tasks => tasks.filter(t => t.id !== taskId));
        this._todayTasks.update(tasks => tasks.filter(t => t.id !== taskId));
      })
    );
  }
}
