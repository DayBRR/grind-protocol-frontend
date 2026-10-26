import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { TaskService } from './task.service';
import { Task, TaskCompletion } from '../models/domain.models';
import { nextTaskReward } from '../models/task-reward-preview';
import { TaskDetailComponent } from '../../features/tasks/task-detail/task-detail.component';
import { environment } from '../../../environments/environment';

const task: Task = { id: 1, userId: 1, templateId: null, title: 'Repeat', description: '',
  category: 'MIND', difficulty: 'MEDIUM', taskType: 'DAILY', baseXp: 50,
  mandatory: true, streakEligible: true, repeatable: true, maxCompletionsPerDay: 3,
  diminishingReturnsEnabled: true, active: true, dueTime: null, weeklyClosingDay: null, traitCodes: [] };
function completion(index: number): TaskCompletion {
  return { id: index, taskId: 1, userId: 1, completedAt: '2026-10-26T12:00:00',
    completionDate: '2026-10-26', completionIndexForDay: index,
    countedForDailyGoal: index === 1, countedForStreak: index === 1, baseXp: 50,
    awardedXp: index === 1 ? 50 : 25, awardedCorePoints: index === 1 ? 5 : 2,
    notes: null, source: 'MANUAL' };
}

describe('Task reward forecast', () => {
  for (const [baseXp, completedToday, diminishingReturnsEnabled, xp, corePoints] of [
    [50, 0, true, 50, 5], [50, 1, true, 25, 2], [50, 2, true, 25, 2],
    [50, 1, false, 50, 5], [21, 1, true, 10, 1], [1, 1, true, 1, 0],
    [25, 0, true, 25, 2], [9, 0, true, 9, 0]
  ] as const) {
    it('forecasts ' + baseXp + '/' + completedToday + '/' + diminishingReturnsEnabled, () => {
      expect(nextTaskReward({ ...task, baseXp, completedToday, diminishingReturnsEnabled }))
        .toEqual({ xp, corePoints });
    });
  }
  it('has no available reward at 3/3', () => {
    expect(nextTaskReward({ ...task, completedToday: 3 })).toBeNull();
  });
});

describe('Task completions and detail', () => {
  let service: TaskService;
  let http: HttpTestingController;
  const base = environment.apiUrl;
  function flushToday(completions: TaskCompletion[] = []) {
    http.expectOne(base + '/me/tasks').flush([task]);
    http.expectOne(base + '/me/task-completions/today').flush(completions);
    http.expectOne(base + '/me/daily-progress/today').flush({ id: 1, userId: 1,
      progressDate: '2026-10-26', requiredTaskCount: 3, completedValidTaskCount: completions.length ? 1 : 0,
      mandatoryTasksRequired: 1, mandatoryTasksCompleted: completions.length ? 1 : 0,
      dayQualified: false, evaluatedAt: null });
  }
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(),
      provideRouter([]), { provide: ActivatedRoute, useValue: { snapshot: { paramMap: new Map([['id', '1']]) } } }] });
    service = TestBed.inject(TaskService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('counts each successful POST exactly once immediately and stops at 3/3', () => {
    service.loadTodayTasks().subscribe(); flushToday();
    for (let i = 1; i <= 3; i++) {
      service.completeTask(1).subscribe(result => expect(result).toEqual(completion(i)));
      http.expectOne(base + '/me/task-completions').flush(completion(i));
      expect(service.todayTasks()[0].completedToday).toBe(i);
      expect(service.todayCompletions().length).toBe(i);
      expect(service.todayTasks()[0].canCompleteToday).toBe(i < 3);
    }
    expect(nextTaskReward(service.todayTasks()[0])).toBeNull();
    service.loadTodayTasks().subscribe(); flushToday([completion(1), completion(2), completion(3)]);
    expect(service.completedTodayCount()).toBe(1);
    expect(service.dailyProgress()?.requiredTaskCount).toBe(3);
  });

  it('restores the detail forecast and count from HTTP on a fresh page load', () => {
    const fixture = TestBed.createComponent(TaskDetailComponent);
    fixture.detectChanges();
    const requests = http.match(base + '/me/tasks');
    expect(requests.length).toBe(2);
    requests.forEach(request => request.flush([task]));
    http.expectOne(base + '/me/task-completions/today').flush([completion(1)]);
    http.expectOne(base + '/me/daily-progress/today').flush({ completedValidTaskCount: 1 });
    fixture.detectChanges();
    expect(fixture.componentInstance.task()?.completedToday).toBe(1);
    expect(fixture.nativeElement.querySelector('.complete-btn').textContent).toContain('+25 XP');
    expect(fixture.nativeElement.textContent).toContain('Base XP');
    expect(fixture.componentInstance.rewardPreview()).toEqual({ xp: 25, corePoints: 2 });
  });

  it('updates detail before refresh finishes and retains it if refresh fails', () => {
    service.loadTodayTasks().subscribe(); flushToday();
    const fixture = TestBed.createComponent(TaskDetailComponent);
    fixture.detectChanges();
    fixture.componentInstance.onComplete(fixture.componentInstance.task()!);
    http.expectOne(base + '/me/task-completions').flush(completion(1));
    fixture.detectChanges();
    expect(fixture.componentInstance.task()?.completedToday).toBe(1);
    expect(fixture.componentInstance.rewardPreview()).toEqual({ xp: 25, corePoints: 2 });
    flushToday([completion(1)]);
    http.expectOne(base + '/me/profile').flush({}, { status: 500, statusText: 'Error' });
    expect(fixture.componentInstance.task()?.completedToday).toBe(1);
    expect(fixture.componentInstance.completing()).toBeFalse();
  });

  it('leaves rewards and count unchanged and permits retry after an HTTP failure', () => {
    service.loadTodayTasks().subscribe(); flushToday();
    const fixture = TestBed.createComponent(TaskDetailComponent);
    fixture.detectChanges();
    fixture.componentInstance.onComplete(fixture.componentInstance.task()!);
    http.expectOne(base + '/me/task-completions').flush({ message: 'Failed' }, { status: 500, statusText: 'Error' });
    fixture.detectChanges();
    expect(service.todayTasks()[0].completedToday).toBe(0);
    expect(service.todayCompletions()).toEqual([]);
    expect(fixture.componentInstance.rewardPreview()).toEqual({ xp: 50, corePoints: 5 });
    expect(fixture.componentInstance.completing()).toBeFalse();
    expect(fixture.nativeElement.textContent).toContain('Failed');
    expect(fixture.nativeElement.querySelector('.complete-btn').disabled).toBeFalse();
  });

  it('renders an unavailable reward and disabled button at the daily limit', () => {
    service.loadTodayTasks().subscribe(); flushToday([completion(1), completion(2), completion(3)]);
    const fixture = TestBed.createComponent(TaskDetailComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Unavailable');
    expect(fixture.nativeElement.querySelector('.complete-btn').disabled).toBeTrue();
    expect(fixture.nativeElement.querySelector('.complete-btn').textContent).not.toContain('XP');
    fixture.componentInstance.onComplete(fixture.componentInstance.task()!);
    http.expectNone(base + '/me/task-completions');
  });
});
