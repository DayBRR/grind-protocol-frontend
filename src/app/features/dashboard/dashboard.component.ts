import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';

import { UserProfileService } from '../../core/auth/user-profile.service';
import { TaskService } from '../../core/http/task.service';
import { AlertService } from '../../core/http/alert.service';
import { TimelineService } from '../../core/http/timeline.service';
import { RewardService } from '../../core/http/reward.service';

import { XpProgressBarComponent } from '../../shared/components/xp-progress-bar/xp-progress-bar.component';
import { DailyRingComponent } from '../../shared/components/daily-ring/daily-ring.component';
import { StreakCalendarComponent, StreakDay } from '../../shared/components/streak-calendar/streak-calendar.component';
import { TaskCardComponent } from '../../shared/components/task-card/task-card.component';
import { AlertBannerComponent } from '../../shared/components/alert-banner/alert-banner.component';
import { TimelineDotComponent } from '../../shared/components/timeline-dot/timeline-dot.component';
import { LevelBadgeComponent } from '../../shared/components/level-badge/level-badge.component';
import { RadarChartComponent, RadarAxis } from '../../shared/components/radar-chart/radar-chart.component';

import { Task } from '../../core/models/domain.models';
import { RelativeTimePipe } from '../../shared/pipes/relative-time.pipe';

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

@Component({
  selector: 'gp-dashboard',
  standalone: true,
  imports: [
    DecimalPipe,
    RelativeTimePipe,
    XpProgressBarComponent,
    DailyRingComponent,
    StreakCalendarComponent,
    TaskCardComponent,
    AlertBannerComponent,
    TimelineDotComponent,
    LevelBadgeComponent,
    RadarChartComponent,
  ],
  template: `
    <div class="dashboard">

      <!-- ── ALERT BANNERS ─────────────────────────────── -->
      @for (alert of criticalAlerts(); track alert.id) {
        <gp-alert-banner
          [alert]="alert"
          [ctaLabel]="alert.alertType === 'STREAK_AT_RISK' ? 'Grind now' : null"
          (ctaClick)="goToTasks()"
          (dismiss)="alertService.dismiss($event).subscribe()"
        />
      }

      <!-- ── HERO ──────────────────────────────────────── -->
      @if (profile(); as p) {
        <div class="hero">
          <div class="hero__avatar">{{ avatarInitials() }}</div>

          <div class="hero__info">
            <div class="hero__name-row">
              <h2 class="hero__name">{{ p.displayName }}</h2>
              <gp-level-badge [level]="p.level" [title]="p.levelTitle" />
            </div>
            <gp-xp-progress-bar
              [currentXp]="p.totalXp"
              [targetXp]="p.totalXp + p.xpToNextLevel"
              [progress]="p.xpProgress"
              [level]="p.level"
              style="margin-top: 8px;"
            />
          </div>

          <div class="hero__stats">
            <div class="stat-chip stat-chip--streak">
              <span>🔥</span>
              <span class="stat-val">{{ p.currentStreak }}</span>
              <span class="stat-lbl">day streak</span>
            </div>
            <div class="stat-chip stat-chip--points">
              <span>🪙</span>
              <span class="stat-val">{{ p.corePoints | number }}</span>
              <span class="stat-lbl">CP</span>
            </div>
            <div class="stat-chip stat-chip--xp">
              <span>⚡</span>
              <span class="stat-val">{{ p.totalXp | number }}</span>
              <span class="stat-lbl">XP</span>
            </div>
          </div>
        </div>
      }

      <!-- ── MAIN LAYOUT ───────────────────────────────── -->
      <div class="layout">

        <!-- LEFT: contenido principal -->
        <div class="layout__main">

          <!-- Daily Progress -->
          <div class="card">
            <div class="card-header">
              <p class="card-label">Today's progress</p>
              <div class="daily-count mono">{{ taskService.completedTodayCount() }} / {{ dailyGoal() }}</div>
            </div>
            <div class="daily-wrap">
              <gp-daily-ring [completed]="taskService.completedTodayCount()" [total]="dailyGoal()" />
              <div class="daily-tasks">
                @for (task of todayTasks(); track task.id) {
                  <gp-task-card [task]="task" (complete)="onCompleteTask($event)" (cardClick)="goToTask($event)" />
                }
                @if (todayTasks().length === 0) {
                  <p class="empty-state">No tasks for today. <a (click)="goToTasks()">Add some →</a></p>
                }
              </div>
            </div>
          </div>

          <!-- XP This Week -->
          <div class="card">
            <div class="card-header">
              <p class="card-label">XP this week</p>
              <div class="xp-big mono">+{{ weekXp() | number }}</div>
            </div>
            <p class="xp-delta">
              @if (weekXpDelta() > 0) { ↑ {{ weekXpDelta() }}% vs last week }
              @else { — No data yet }
            </p>
            <div class="xp-chart">
              @for (bar of weekBars(); track $index) {
                <div class="xp-col">
                  @if (bar.xp > 0) {
                    <span class="xp-val">+{{ bar.xp }}</span>
                  } @else {
                    <span class="xp-val xp-val--empty">—</span>
                  }
                  <div class="xp-track">
                    <div class="xp-bar-col"
                      [class.xp-bar-col--today]="bar.today"
                      [style.height.px]="bar.pct * 0.56">
                    </div>
                  </div>
                  <span class="xp-day" [class.xp-day--today]="$index === todayIndex()">{{ dayLabels[$index] }}</span>
                </div>
              }
            </div>
          </div>

          <!-- Timeline -->
          <div class="card">
            <p class="card-label">Recent activity</p>
            @for (event of timelineService.events().slice(0, 4); track event.id) {
              <gp-timeline-dot [event]="event" />
            }
            @if (timelineService.events().length === 0) {
              <p class="empty-state">Complete your first task to start building history.</p>
            }
          </div>

        </div>

        <!-- RIGHT: stats compactos -->
        <div class="layout__side">

          <!-- Streak -->
          <div class="card">
            <p class="card-label">Streak</p>
            @if (profile(); as p) {
              <div class="streak-row">
                <div class="streak-num mono">{{ p.currentStreak }}</div>
                <div class="streak-meta">
                  <span class="streak-label">days in a row</span>
                  <span class="streak-best mono">Best: {{ p.bestStreak }}d</span>
                </div>
              </div>
              <gp-streak-calendar [days]="streakDays()" style="margin-top: 12px;" />
            }
          </div>

          <!-- Radar -->
          <div class="card">
            <p class="card-label">Category focus</p>
            <div class="radar-wrap">
              <gp-radar-chart [axes]="radarAxes()" />
            </div>
          </div>

          <!-- Rewards -->
          <div class="card">
            <div class="card-header">
              <p class="card-label">Rewards</p>
              @if (profile(); as p) {
                <span class="cp-inline mono">🪙 {{ p.corePoints | number }}</span>
              }
            </div>
            <div class="rewards-preview">
              @for (r of rewardService.rewards().slice(0,3); track r.id) {
                <div class="reward-row" [class.reward-row--affordable]="r.canAfford">
                  <span class="reward-row__name">{{ r.title }}</span>
                  <span class="reward-row__cost mono" [class.reward-row__cost--ok]="r.canAfford">
                    {{ r.canAfford ? '✓ ' : '' }}{{ r.costCorePoints }} CP
                  </span>
                </div>
              }
              @if (rewardService.rewards().length === 0) {
                <p class="empty-state">No rewards yet. <a (click)="router.navigate(['/rewards'])">Create one →</a></p>
              }
            </div>
          </div>

        </div>
      </div>

    </div>
  `,
  styles: [`
    .dashboard { display: flex; flex-direction: column; gap: 16px; max-width: 1100px; }

    /* ── HERO ── */
    .hero {
      display: flex; align-items: center; gap: 20px;
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 18px 24px;
      position: relative; overflow: hidden;
    }
    .hero::before {
      content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
      background: linear-gradient(90deg, var(--primary), var(--xp)); opacity: 0.6;
    }
    .hero__avatar {
      width: 48px; height: 48px; border-radius: 12px;
      background: var(--bg-input); border: 2px solid var(--primary-dim);
      display: flex; align-items: center; justify-content: center;
      font-size: 16px; font-weight: 800; color: var(--primary); flex-shrink: 0;
      box-shadow: 0 0 20px var(--primary-glow);
    }
    .hero__info { flex: 1; min-width: 0; }
    .hero__name-row { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
    .hero__name { font-size: 16px; font-weight: 800; }
    .hero__stats { display: flex; gap: 8px; flex-shrink: 0; }
    .stat-chip {
      display: flex; align-items: center; gap: 5px;
      padding: 6px 12px; border-radius: var(--radius-sm);
      border: 1px solid var(--border); background: var(--bg-elevated);
      font-size: 12px;
    }
    .stat-val { font-weight: 700; font-family: var(--font-mono); }
    .stat-lbl { font-size: 10px; color: var(--text-dim); }
    .stat-chip--streak { color: var(--streak); border-color: rgba(249,115,22,0.2); background: rgba(249,115,22,0.06); }
    .stat-chip--points { color: var(--currency); border-color: rgba(234,179,8,0.2); background: rgba(234,179,8,0.06); }
    .stat-chip--xp     { color: var(--xp);      border-color: rgba(34,211,238,0.2);  background: rgba(34,211,238,0.06); }

    /* ── LAYOUT ── */
    .layout {
      display: grid;
      grid-template-columns: 1fr 280px;
      gap: 16px;
      align-items: start;
    }
    .layout__main { display: flex; flex-direction: column; gap: 16px; }
    .layout__side  { display: flex; flex-direction: column; gap: 16px; }

    /* ── RADAR ── */
    .radar-wrap {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 200px;
    }

    /* ── CARD HEADER ── */
    .card-header {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 14px;
    }
    .card-header .card-label { margin-bottom: 0; }

    /* ── DAILY PROGRESS ── */
    .daily-count { font-size: 13px; color: var(--primary); font-weight: 700; }
    .daily-wrap { display: flex; gap: 16px; align-items: flex-start; }
    .daily-tasks { flex: 1; display: flex; flex-direction: column; gap: 6px; }

    /* ── STREAK ── */
    .streak-row { display: flex; align-items: center; gap: 14px; }
    .streak-num { font-size: 36px; font-weight: 800; color: var(--streak); line-height: 1; text-shadow: 0 0 24px rgba(249,115,22,0.25); }
    .streak-meta { display: flex; flex-direction: column; gap: 2px; }
    .streak-label { font-size: 11px; color: var(--text-muted); }
    .streak-best  { font-size: 11px; color: var(--text-dim); }

    /* ── XP CHART ── */
    .xp-big { font-size: 22px; font-weight: 800; color: var(--xp); }
    .xp-delta { font-size: 11px; color: var(--success); margin-bottom: 10px; }
    .xp-chart {
      display: flex; align-items: flex-end; gap: 4px; margin-top: 8px;
    }
    .xp-col {
      flex: 1; display: flex; flex-direction: column; align-items: center; gap: 3px;
    }
    .xp-track {
      width: 100%; height: 56px;
      display: flex; align-items: flex-end;
    }
    .xp-val {
      font-family: var(--font-mono); font-size: 8px;
      color: var(--xp); opacity: 0.75; line-height: 1; white-space: nowrap;
    }
    .xp-val--empty { color: var(--text-dim); opacity: 0.4; }
    .xp-bar-col {
      width: 100%; border-radius: 3px 3px 0 0; background: var(--bg-input);
      transition: height 0.4s ease, background 0.2s; cursor: pointer; min-height: 3px;
    }
    .xp-bar-col:hover { background: rgba(34,211,238,0.2); }
    .xp-bar-col--today { background: rgba(34,211,238,0.3); border: 1px solid rgba(34,211,238,0.25); border-bottom: none; }
    .xp-day {
      font-family: var(--font-mono); font-size: 9px; color: var(--text-dim); line-height: 1;
    }
    .xp-day--today { color: var(--streak); }

    /* ── REWARDS ── */
    .cp-inline { font-size: 12px; color: var(--currency); font-weight: 600; }
    .rewards-preview { display: flex; flex-direction: column; gap: 6px; }
    .reward-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: 7px 10px; border-radius: var(--radius-sm);
      border: 1px solid var(--border); background: var(--bg-elevated); font-size: 12px;
    }
    .reward-row--affordable { border-color: rgba(234,179,8,0.2); background: rgba(234,179,8,0.04); }
    .reward-row__name { color: var(--text); font-weight: 500; }
    .reward-row__cost { font-size: 11px; color: var(--text-dim); }
    .reward-row__cost--ok { color: var(--success); }

    /* ── MISC ── */
    .empty-state { font-size: 12px; color: var(--text-dim); padding: 6px 0; }
    .empty-state a { color: var(--primary); cursor: pointer; }

    @media (max-width: 800px) {
      .layout { grid-template-columns: 1fr; }
      .hero { flex-direction: column; align-items: flex-start; }
      .hero__stats { flex-wrap: wrap; }
      .daily-wrap { flex-direction: column; }
    }
  `]
})
export class DashboardComponent implements OnInit {
  readonly profileService  = inject(UserProfileService);
  readonly taskService     = inject(TaskService);
  readonly alertService    = inject(AlertService);
  readonly timelineService = inject(TimelineService);
  readonly rewardService   = inject(RewardService);
  readonly router          = inject(Router);

  readonly profile      = this.profileService.profile;
  readonly todayTasks   = this.taskService.todayTasks;
  readonly dayLabels    = DAY_LABELS;

  readonly criticalAlerts = computed(() =>
    this.alertService.activeAlerts().filter(a => a.severity !== 'INFO').slice(0, 2)
  );

  readonly dailyGoal = computed(() => this.profile()?.dailyTaskGoal ?? 5);

  readonly avatarInitials = computed(() => {
    const name = this.profile()?.displayName ?? '';
    return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
  });

  readonly streakDays = computed<StreakDay[]>(() => {
    const streak = this.profile()?.currentStreak ?? 0;
    const todayIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
    return DAY_LABELS.map((label, i) => ({
      label,
      hit: i < todayIdx && streak >= todayIdx - i,
      isToday: i === todayIdx
    }));
  });

  // Placeholder radar data — replace with real category completion stats
  readonly radarAxes = signal<RadarAxis[]>([
    { label: 'Health',   value: 75 },
    { label: 'Work',     value: 60 },
    { label: 'Learning', value: 85 },
    { label: 'Finance',  value: 40 },
    { label: 'Personal', value: 55 },
    { label: 'Other',    value: 30 },
  ]);

  // Placeholder week data — replace with real API call
  readonly weekBars = signal([
    { pct: 42, xp: 210, today: false },
    { pct: 68, xp: 340, today: false },
    { pct: 30, xp: 150, today: false },
    { pct: 85, xp: 425, today: false },
    { pct: 55, xp: 275, today: false },
    { pct: 72, xp: 360, today: true  },
    { pct: 0,  xp: 0,   today: false },
  ]);

  readonly weekXp      = signal(480);
  readonly weekXpDelta = signal(12);

  readonly todayIndex = computed(() => {
    const d = new Date().getDay();
    return d === 0 ? 6 : d - 1;
  });

  ngOnInit(): void {
    this.taskService.loadTodayTasks().subscribe();
    this.alertService.loadAlerts().subscribe();
    this.timelineService.loadRecent(5).subscribe();
    this.rewardService.loadRewards().subscribe();
  }

  onCompleteTask(task: Task): void {
    this.taskService.completeTask(task.id).subscribe(() => {
      this.profileService.refreshProfile().subscribe();
      this.timelineService.loadRecent(5).subscribe();
    });
  }

  goToTasks(): void  { this.router.navigate(['/tasks']); }
  goToTask(task: Task): void { this.router.navigate(['/tasks', task.id]); }
}
