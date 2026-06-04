import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, forkJoin, map, tap } from 'rxjs';
import { ApiService } from './api.service';
import {
  CreateTaskCompletionRequest,
  CreateTaskRequest,
  DailyProgress,
  Task,
  TaskCompletion,
  TaskCompletionResponse,
  TaskResponse,
  TaskView
} from '../models/domain.models';
import { DailyProgressService } from './daily-progress.service';

export interface CompleteTaskRequest {
  notes?: string | null;
}

@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly api = inject(ApiService);
  private readonly dailyProgressService = inject(DailyProgressService);

  private readonly _todayTasks = signal<Task[]>([]);
  private readonly _dailyProgress = signal<DailyProgress | null>(null);
  private readonly _allTasks = signal<Task[]>([]);
  private readonly _todayCompletions = signal<TaskCompletion[]>([]);

  readonly todayTasks = this._todayTasks.asReadonly();
  readonly dailyProgress = this._dailyProgress.asReadonly();
  readonly allTasks = this._allTasks.asReadonly();
  readonly todayCompletions = this._todayCompletions.asReadonly();

  readonly completedTodayCount = computed(() => {
    const progress = this._dailyProgress();
    if (progress) return progress.completedValidTaskCount;
    return this._todayTasks().filter(t => (t.completedToday ?? 0) > 0).length;
  });

  readonly mandatoryPendingCount = computed(() => {
    const progress = this._dailyProgress();
    if (progress) {
      return Math.max(progress.mandatoryTasksRequired - progress.mandatoryTasksCompleted, 0);
    }
    return this._todayTasks().filter(t => t.mandatory && !(t.completedToday ?? 0)).length;
  });

  loadTodayTasks(): Observable<Task[]> {
    return forkJoin({
      tasks: this.api.get<TaskResponse[]>('/me/tasks'),
      completions: this.api.get<TaskCompletionResponse[]>('/me/task-completions/today'),
      dailyProgress: this.dailyProgressService.loadToday()
    }).pipe(
      map(({ tasks, completions, dailyProgress }) => {
        const activeTasks = tasks.filter(task => task.active);
        const viewTasks = this.mergeCompletions(activeTasks, completions);
        this._allTasks.set(tasks.map(task => this.toTaskView(task)));
        this._todayCompletions.set(completions);
        this._dailyProgress.set(dailyProgress);
        this._todayTasks.set(viewTasks);
        return viewTasks;
      })
    );
  }

  loadAllTasks(): Observable<Task[]> {
    return this.api.get<TaskResponse[]>('/me/tasks').pipe(
      map(tasks => tasks.map(task => this.toTaskView(task))),
      tap(tasks => this._allTasks.set(tasks))
    );
  }

  loadDailyProgress(): Observable<DailyProgress> {
    return this.dailyProgressService.loadToday().pipe(
      tap(progress => this._dailyProgress.set(progress))
    );
  }

  completeTask(taskId: number, req: CompleteTaskRequest = {}): Observable<TaskCompletion> {
    const payload: CreateTaskCompletionRequest = {
      taskId,
      notes: req.notes ?? null
    };

    return this.api.post<TaskCompletionResponse>('/me/task-completions', payload).pipe(
      tap(completion => {
        this._todayCompletions.update(completions => [...completions, completion]);
        this._todayTasks.update(tasks =>
          this.mergeCompletions(
            tasks,
            [...this._todayCompletions(), completion]
          )
        );
      })
    );
  }

  createTask(payload: Partial<Task> | CreateTaskRequest): Observable<Task> {
    return this.api.post<TaskResponse>('/me/tasks', this.toCreateTaskRequest(payload)).pipe(
      map(task => this.toTaskView(task)),
      tap(task => this._allTasks.update(tasks => [...tasks, task]))
    );
  }

  /**
   * Not exposed by the current backend controller.
   * Kept as an explicit runtime error so old UI code fails loudly instead of calling a wrong endpoint.
   */
  updateTask(_taskId: number, _payload: Partial<Task>): Observable<Task> {
    throw new Error('Task update is not available in the current backend API.');
  }

  /**
   * Not exposed by the current backend controller.
   * Kept as an explicit runtime error so old UI code fails loudly instead of calling a wrong endpoint.
   */
  deleteTask(_taskId: number): Observable<void> {
    throw new Error('Task delete/deactivate is not available in the current backend API.');
  }

  private mergeCompletions(tasks: TaskResponse[] | TaskView[], completions: TaskCompletionResponse[]): TaskView[] {
    const completionsByTask = completions.reduce<Record<number, number>>((acc, completion) => {
      acc[completion.taskId] = (acc[completion.taskId] ?? 0) + 1;
      return acc;
    }, {});

    return tasks.map(task => {
      const completedToday = completionsByTask[task.id] ?? 0;
      return {
        ...this.toTaskView(task),
        completedToday,
        canCompleteToday: completedToday < task.maxCompletionsPerDay
      };
    });
  }

  private toTaskView(task: TaskResponse | TaskView): TaskView {
    return {
      ...task,
      description: task.description ?? '',
      traitCodes: task.traitCodes ?? [],
      completedToday: this.hasCompletedToday(task) ? task.completedToday : 0,
      canCompleteToday: this.hasCanCompleteToday(task) ? task.canCompleteToday : true
    };
  }

  private hasCompletedToday(task: TaskResponse | TaskView): task is TaskView {
    return 'completedToday' in task;
  }

  private hasCanCompleteToday(task: TaskResponse | TaskView): task is TaskView {
    return 'canCompleteToday' in task;
  }

  private toCreateTaskRequest(payload: Partial<Task> | CreateTaskRequest): CreateTaskRequest {
    return {
      title: payload.title ?? '',
      description: payload.description ?? null,
      category: this.toBackendCategory(payload.category ?? 'PERSONAL'),
      difficulty: this.toBackendDifficulty(payload.difficulty ?? 'MEDIUM'),
      taskType: this.toBackendTaskType(payload.taskType ?? 'DAILY'),
      baseXp: payload.baseXp ?? 10,
      mandatory: payload.mandatory ?? false,
      streakEligible: payload.streakEligible ?? true,
      repeatable: payload.repeatable ?? false,
      maxCompletionsPerDay: payload.maxCompletionsPerDay ?? 1,
      diminishingReturnsEnabled: payload.diminishingReturnsEnabled ?? false,
      dueTime: payload.dueTime ?? null,
      weeklyClosingDay: payload.weeklyClosingDay ?? null,
      traitCodes: payload.traitCodes ?? []
    };
  }

  private toBackendDifficulty(value: Task['difficulty']): CreateTaskRequest['difficulty'] {
    const map: Record<string, CreateTaskRequest['difficulty']> = {
      S: 'EPIC',
      A: 'HARD',
      B: 'MEDIUM',
      C: 'EASY'
    };
    return map[value] ?? value as CreateTaskRequest['difficulty'];
  }

  private toBackendCategory(value: Task['category']): CreateTaskRequest['category'] {
    const map: Record<string, CreateTaskRequest['category']> = {
      HEALTH: 'BODY',
      LEARNING: 'MIND',
      FINANCE: 'PERSONAL',
      OTHER: 'PERSONAL'
    };
    return map[value] ?? value as CreateTaskRequest['category'];
  }

  private toBackendTaskType(value: Task['taskType']): CreateTaskRequest['taskType'] {
    const map: Record<string, CreateTaskRequest['taskType']> = {
      WEEKLY: 'HABIT',
      LONG_TERM: 'ONE_TIME'
    };
    return map[value] ?? value as CreateTaskRequest['taskType'];
  }
}

