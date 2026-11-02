import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';
import { DashboardComponent } from './dashboard.component';
import { DailyRingComponent } from '../../shared/components/daily-ring/daily-ring.component';
import { DailyProgressService } from '../../core/http/daily-progress.service';
import {
  DailyProgressResponse,
  ProgressionSummaryResponse,
  UserProfileResponse,
  WeeklyProgressionSummaryResponse
} from '../../core/models/domain.models';
import { environment } from '../../../environments/environment';

describe('Dashboard daily ring integration', () => {
  let http: HttpTestingController;
  let fixture: ComponentFixture<DashboardComponent>;
  const base = environment.apiUrl;
  const circumference = 2 * Math.PI * 40;
  const profile: UserProfileResponse = {
    userId: 1, username: 'ring-test', displayName: 'Ring Test', dailyTaskGoal: 5,
    totalXp: 100, level: 2, corePoints: 10, currentStreak: 2, bestStreak: 2,
    lastEvaluatedDate: '2026-11-01'
  };
  const progression: ProgressionSummaryResponse = {
    totalXp: 100, level: 2, xpForCurrentLevel: 100, xpForNextLevel: 200,
    xpProgressInCurrentLevel: 0, xpRemainingForNextLevel: 100,
    corePoints: 10, currentStreak: 2, bestStreak: 2
  };
  const weekly: WeeklyProgressionSummaryResponse = {
    weekStart: '2026-11-02', weekEnd: '2026-11-08', totalXp: 0,
    previousWeekTotalXp: 0, deltaPercent: null, days: []
  };

  function daily(completed: number, qualified = completed >= 3): DailyProgressResponse {
    return {
      id: 1, userId: 1, progressDate: '2026-11-02', requiredTaskCount: 3,
      completedValidTaskCount: completed, mandatoryTasksRequired: 1,
      mandatoryTasksCompleted: qualified ? 1 : 0, dayQualified: qualified,
      evaluatedAt: '2026-11-02T12:00:00'
    };
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  function loadDashboard(completed: number, qualified = completed >= 3): void {
    fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    // The ring is already rendered before the responses arrive, as after F5.
    expect(getComputedStyle(circle()).visibility).toBe('hidden');
    http.expectOne(base + '/me/profile').flush(profile);
    http.expectOne(base + '/me/progression').flush(progression);
    http.expectOne(base + '/me/progression/weekly-summary').flush(weekly);
    const progressRequests = http.match(base + '/me/daily-progress/today');
    // Both existing dashboard loaders request progress. Do not change their HTTP behavior here.
    expect(progressRequests.length).toBe(2);
    progressRequests.forEach(request => request.flush(daily(completed, qualified)));
    http.expectOne(base + '/me/tasks').flush([]);
    http.expectOne(base + '/me/task-completions/today').flush([]);
    http.expectOne(request => request.url === base + '/me/tasks/category-focus'
      && request.params.get('period') === 'WEEK').flush({ period: 'WEEK', categories: [] });
    http.expectOne(base + '/me/rewards').flush([]);
    http.expectOne(base + '/me/achievements').flush([]);
    http.expectOne(base + '/me/quests').flush([]);
    fixture.detectChanges();
    expect(fixture.componentInstance.loading()).toBeFalse();
    expect(fixture.componentInstance.errorMessage()).toBeNull();
  }

  function circle(): SVGCircleElement {
    return fixture.nativeElement.querySelector('gp-daily-ring .ring-progress');
  }

  function expectRing(completed: number, fraction: number): void {
    expect(fixture.nativeElement.querySelector('gp-daily-ring .ring-number').textContent).toBe(`${completed}/3`);
    expect(Number(circle().getAttribute('stroke-dashoffset'))).toBeCloseTo(circumference * (1 - fraction), 6);
    expect(getComputedStyle(circle()).visibility).toBe(completed > 0 ? 'visible' : 'hidden');
  }

  for (const [completed, fraction] of [[0, 0], [1, 1 / 3], [2, 2 / 3], [3, 1], [4, 1]]) {
    it(`hydrates ${completed}/3 from HTTP after a fresh page load`, () => {
      loadDashboard(completed);
      expectRing(completed, fraction);
      // The daily response takes precedence over the profile's different goal and the task list.
      expect(fixture.componentInstance.dailyGoal()).toBe(3);
    });
  }

  it('updates the existing ring through 0/3–4/3 when daily progress is refreshed', () => {
    loadDashboard(0);
    const ring = fixture.debugElement.query(By.directive(DailyRingComponent)).componentInstance;
    const service = TestBed.inject(DailyProgressService);
    for (const [completed, fraction] of [[1, 1 / 3], [2, 2 / 3], [3, 1], [4, 1], [0, 0]]) {
      service.refreshToday().subscribe();
      http.expectOne(base + '/me/daily-progress/today').flush(daily(completed));
      fixture.detectChanges();
      expectRing(completed, fraction);
      expect(fixture.debugElement.query(By.directive(DailyRingComponent)).componentInstance).toBe(ring);
    }
  });

  for (const completed of [3, 4]) {
    it(`keeps ${completed}/3 full while a pending mandatory task prevents qualification`, () => {
      loadDashboard(completed, false);
      expectRing(completed, 1);
      expect(fixture.componentInstance.dailyProgress()?.dayQualified).toBeFalse();
      expect(fixture.nativeElement.querySelector('.objective-card .card-subtitle').textContent)
        .toContain('Check your mandatory tasks');
      expect(fixture.nativeElement.querySelector('.hero__status').textContent).toContain('check mandatory tasks');
      expect(fixture.componentInstance.currentStreak()).toBe(2);
    });
  }

  it('keeps the same progress geometry when only provisional qualification changes', () => {
    loadDashboard(3);
    const service = TestBed.inject(DailyProgressService);
    service.refreshToday().subscribe();
    http.expectOne(base + '/me/daily-progress/today').flush(daily(3, false));
    fixture.detectChanges();
    expectRing(3, 1);
    expect(fixture.componentInstance.protocolStatus()).toContain('check mandatory tasks');
    service.refreshToday().subscribe();
    http.expectOne(base + '/me/daily-progress/today').flush(daily(3, true));
    fixture.detectChanges();
    expectRing(3, 1);
    expect(fixture.componentInstance.protocolStatus()).toBe('day qualified');
  });
});
