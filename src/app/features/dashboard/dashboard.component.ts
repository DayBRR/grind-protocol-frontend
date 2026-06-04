import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';

import { UserProfileService } from '../../core/auth/user-profile.service';
import { ProgressionService } from '../../core/http/progression.service';
import { DailyProgressService } from '../../core/http/daily-progress.service';
import { TaskService } from '../../core/http/task.service';
import { RewardService } from '../../core/http/reward.service';
import { AchievementService } from '../../core/http/achievement.service';
import { QuestService } from '../../core/http/quest.service';

import { XpProgressBarComponent } from '../../shared/components/xp-progress-bar/xp-progress-bar.component';
import { DailyRingComponent } from '../../shared/components/daily-ring/daily-ring.component';
import { StreakCalendarComponent, StreakDay } from '../../shared/components/streak-calendar/streak-calendar.component';
import { TaskCardComponent } from '../../shared/components/task-card/task-card.component';
import { LevelBadgeComponent } from '../../shared/components/level-badge/level-badge.component';
import { RadarChartComponent, RadarAxis } from '../../shared/components/radar-chart/radar-chart.component';

import { AchievementResponse, QuestResponse, Task } from '../../core/models/domain.models';

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

@Component({
  selector: 'gp-dashboard',
  standalone: true,
  imports: [
    DecimalPipe,
    XpProgressBarComponent,
    DailyRingComponent,
    StreakCalendarComponent,
    TaskCardComponent,
    LevelBadgeComponent,
    RadarChartComponent,
  ],
  template: `
    <div class="dashboard">

      @if (loading()) {
        <div class="dashboard-state">Loading your grind data...</div>
      }

      @if (errorMessage()) {
        <div class="dashboard-state dashboard-state--error">{{ errorMessage() }}</div>
      }

      <!-- ── HERO ──────────────────────────────────────── -->
      @if (profile(); as p) {
        <div class="hero">
          <div class="hero__avatar">{{ avatarInitials() }}</div>

          <div class="hero__info">
            <div class="hero__name-row">
              <h2 class="hero__name">{{ p.displayName }}</h2>
              <gp-level-badge [level]="level()" [title]="p.levelTitle" />
            </div>
            <gp-xp-progress-bar
              [currentXp]="totalXp()"
              [targetXp]="xpForNextLevel()"
              [progress]="xpProgressFraction()"
              [level]="level()"
              style="margin-top: 8px;"
            />
          </div>

          <div class="hero__stats">
            <div class="stat-chip stat-chip--streak">
              <span>🔥</span>
              <span class="stat-val">{{ currentStreak() }}</span>
              <span class="stat-lbl">day streak</span>
            </div>
            <div class="stat-chip stat-chip--points">
              <span>🪙</span>
              <span class="stat-val">{{ corePoints() | number }}</span>
              <span class="stat-lbl">CP</span>
            </div>
            <div class="stat-chip stat-chip--xp">
              <span>⚡</span>
              <span class="stat-val">{{ totalXp() | number }}</span>
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
              <div class="daily-count mono">{{ completedTodayCount() }} / {{ dailyGoal() }}</div>
            </div>
            <div class="daily-wrap">
              <gp-daily-ring [completed]="completedTodayCount()" [total]="dailyGoal()" />
              <div class="daily-tasks">
                @for (task of todayTasks(); track task.id) {
                  <gp-task-card [task]="task" (complete)="onCompleteTask($event)" (cardClick)="goToTask($event)" />
                }
                @if (todayTasks().length === 0 && !loading()) {
                  <p class="empty-state">No active tasks yet. <a (click)="goToTasks()">Add some →</a></p>
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
              @else { — Weekly XP endpoint not connected yet }
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

          <!-- Recent activity placeholder -->
          <div class="card">
            <p class="card-label">Recent activity</p>
            <p class="empty-state">Timeline is not connected to the backend yet. It will be restored after the real dashboard data is stable.</p>
          </div>

        </div>

        <!-- RIGHT: stats compactos -->
        <div class="layout__side">

          <!-- Streak -->
          <div class="card">
            <p class="card-label">Streak</p>
            <div class="streak-row">
              <div class="streak-num mono">{{ currentStreak() }}</div>
              <div class="streak-meta">
                <span class="streak-label">days in a row</span>
                <span class="streak-best mono">Best: {{ bestStreak() }}d</span>
              </div>
            </div>
            <gp-streak-calendar [days]="streakDays()" style="margin-top: 12px;" />
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
              <span class="cp-inline mono">🪙 {{ corePoints() | number }}</span>
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
              @if (rewardService.rewards().length === 0 && !loading()) {
                <p class="empty-state">No rewards available yet.</p>
              }
            </div>
          </div>

          <!-- Quests -->
          <div class="card">
            <div class="card-header">
              <p class="card-label">Quests</p>
              <span class="mini-counter mono">{{ questService.claimableQuests().length }} claimable</span>
            </div>
            <div class="progress-list">
              @for (quest of questService.dashboardQuests().slice(0, 3); track quest.questId) {
                <div class="progress-row" [class.progress-row--claimable]="quest.status === 'COMPLETED'">
                  <div class="progress-row__main">
                    <div class="progress-row__title">{{ quest.name }}</div>
                    <div class="progress-row__meta mono">
                      {{ quest.progressValue }} / {{ quest.targetValue }} · +{{ quest.xpReward }} XP · +{{ quest.corePointsReward }} CP
                    </div>
                    <div class="progress-line">
                      <div class="progress-line__bar" [style.width.%]="questProgress(quest)"></div>
                    </div>
                  </div>
                  @if (quest.status === 'COMPLETED') {
                    <button type="button" class="claim-btn" (click)="onClaimQuest(quest)">Claim</button>
                  }
                </div>
              }
              @if (questService.dashboardQuests().length === 0 && !loading()) {
                <p class="empty-state">No active quests available yet.</p>
              }
            </div>
          </div>

          <!-- Achievements -->
          <div class="card">
            <div class="card-header">
              <p class="card-label">Achievements</p>
              <span class="mini-counter mono">{{ achievementService.claimableAchievements().length }} claimable</span>
            </div>
            <div class="progress-list">
              @for (achievement of achievementService.dashboardAchievements().slice(0, 3); track achievement.achievementId) {
                <div class="progress-row" [class.progress-row--claimable]="achievement.unlocked && !achievement.claimed">
                  <div class="progress-row__main">
                    <div class="progress-row__title">{{ achievement.name }}</div>
                    <div class="progress-row__meta mono">
                      {{ achievement.progressValue }} / {{ achievement.targetValue }} · +{{ achievement.xpReward }} XP · +{{ achievement.corePointsReward }} CP
                    </div>
                    <div class="progress-line">
                      <div class="progress-line__bar" [style.width.%]="achievementProgress(achievement)"></div>
                    </div>
                  </div>
                  @if (achievement.unlocked && !achievement.claimed) {
                    <button type="button" class="claim-btn" (click)="onClaimAchievement(achievement)">Claim</button>
                  }
                  @if (achievement.claimed) {
                    <span class="claimed-pill">✓</span>
                  }
                </div>
              }
              @if (achievementService.dashboardAchievements().length === 0 && !loading()) {
                <p class="empty-state">No achievements visible yet.</p>
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

    /* ── QUESTS / ACHIEVEMENTS ── */
    .mini-counter { font-size: 10px; color: var(--text-dim); }
    .progress-list { display: flex; flex-direction: column; gap: 8px; }
    .progress-row {
      display: flex; align-items: center; gap: 8px;
      padding: 8px 10px; border-radius: var(--radius-sm);
      border: 1px solid var(--border); background: var(--bg-elevated);
    }
    .progress-row--claimable { border-color: rgba(34,197,94,0.25); background: rgba(34,197,94,0.05); }
    .progress-row__main { flex: 1; min-width: 0; }
    .progress-row__title { font-size: 12px; font-weight: 700; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .progress-row__meta { margin-top: 2px; font-size: 9px; color: var(--text-dim); }
    .progress-line { margin-top: 6px; height: 4px; border-radius: 999px; background: var(--bg-input); overflow: hidden; }
    .progress-line__bar { height: 100%; border-radius: inherit; background: var(--primary); transition: width 0.25s ease; }
    .claim-btn {
      border: 1px solid rgba(34,197,94,0.35); background: rgba(34,197,94,0.08);
      color: var(--success); border-radius: 999px; padding: 4px 8px;
      font-size: 10px; font-weight: 800; cursor: pointer;
    }
    .claim-btn:hover { background: rgba(34,197,94,0.14); }
    .claimed-pill { font-size: 12px; color: var(--success); font-weight: 800; }

    /* ── MISC ── */
    .empty-state { font-size: 12px; color: var(--text-dim); padding: 6px 0; }
    .dashboard-state { padding: 16px; border-radius: var(--radius-md); border: 1px solid var(--border); background: var(--bg-surface); color: var(--text-muted); font-size: 13px; }
    .dashboard-state--error { color: var(--danger, #ef4444); border-color: rgba(239,68,68,0.25); }
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
  readonly profileService = inject(UserProfileService);
  readonly progressionService = inject(ProgressionService);
  readonly dailyProgressService = inject(DailyProgressService);
  readonly taskService = inject(TaskService);
  readonly rewardService = inject(RewardService);
  readonly achievementService = inject(AchievementService);
  readonly questService = inject(QuestService);
  readonly router = inject(Router);

  readonly profile = this.profileService.profile;
  readonly progression = this.progressionService.summary;
  readonly dailyProgress = this.dailyProgressService.today;
  readonly todayTasks = this.taskService.todayTasks;
  readonly dayLabels = DAY_LABELS;

  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly dailyGoal = computed(() =>
    this.dailyProgress()?.requiredTaskCount ?? this.profile()?.dailyTaskGoal ?? 5
  );

  readonly completedTodayCount = computed(() =>
    this.dailyProgress()?.completedValidTaskCount ?? this.taskService.completedTodayCount()
  );

  readonly totalXp = computed(() => this.progression()?.totalXp ?? this.profile()?.totalXp ?? 0);
  readonly level = computed(() => this.progression()?.level ?? this.profile()?.level ?? 1);
  readonly corePoints = computed(() => this.progression()?.corePoints ?? this.profile()?.corePoints ?? 0);
  readonly currentStreak = computed(() => this.progression()?.currentStreak ?? this.profile()?.currentStreak ?? 0);
  readonly bestStreak = computed(() => this.progression()?.bestStreak ?? this.profile()?.bestStreak ?? 0);
  readonly xpForNextLevel = computed(() => this.progression()?.xpForNextLevel ?? this.totalXp() + 100);
  readonly xpProgressFraction = this.progressionService.xpProgressFraction;

  readonly avatarInitials = computed(() => {
    const name = this.profile()?.displayName ?? this.profile()?.username ?? '';
    return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2) || 'GP';
  });

  readonly streakDays = computed<StreakDay[]>(() => {
    const streak = this.currentStreak();
    const todayIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
    return DAY_LABELS.map((label, i) => ({
      label,
      hit: i < todayIdx && streak >= todayIdx - i,
      isToday: i === todayIdx
    }));
  });

  // Placeholder radar data — backend category stats are not available yet.
  readonly radarAxes = signal<RadarAxis[]>([
    { label: 'Mind', value: 0 },
    { label: 'Body', value: 0 },
    { label: 'Work', value: 0 },
    { label: 'Personal', value: 0 }
  ]);

  // Placeholder week data — backend weekly XP endpoint is not available yet.
  readonly weekBars = signal([
    { pct: 0, xp: 0, today: false },
    { pct: 0, xp: 0, today: false },
    { pct: 0, xp: 0, today: false },
    { pct: 0, xp: 0, today: false },
    { pct: 0, xp: 0, today: false },
    { pct: 0, xp: 0, today: false },
    { pct: 0, xp: 0, today: false }
  ]);

  readonly weekXp = signal(0);
  readonly weekXpDelta = signal(0);

  readonly todayIndex = computed(() => {
    const d = new Date().getDay();
    return d === 0 ? 6 : d - 1;
  });

  ngOnInit(): void {
    this.loadDashboardData();
  }

  onCompleteTask(task: Task): void {
    this.taskService.completeTask(task.id).subscribe({
      next: () => this.loadDashboardData(),
      error: () => this.errorMessage.set('The task could not be completed. Please try again.')
    });
  }

  onClaimAchievement(achievement: AchievementResponse): void {
    this.achievementService.claimAchievement(achievement.achievementId).subscribe({
      next: () => this.loadDashboardData(),
      error: () => this.errorMessage.set('The achievement could not be claimed. Please try again.')
    });
  }

  onClaimQuest(quest: QuestResponse): void {
    this.questService.claimQuest(quest.questId).subscribe({
      next: () => this.loadDashboardData(),
      error: () => this.errorMessage.set('The quest could not be claimed. Please try again.')
    });
  }

  achievementProgress(achievement: AchievementResponse): number {
    return this.achievementService.progressPercent(achievement);
  }

  questProgress(quest: QuestResponse): number {
    return this.questService.progressPercent(quest);
  }

  goToTasks(): void { this.router.navigate(['/tasks']); }
  goToTask(task: Task): void { this.router.navigate(['/tasks', task.id]); }

  private loadDashboardData(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    forkJoin({
      profile: this.profileService.loadProfile(),
      progression: this.progressionService.loadSummary(),
      dailyProgress: this.dailyProgressService.loadToday(),
      tasks: this.taskService.loadTodayTasks(),
      rewards: this.rewardService.loadRewards(),
      achievements: this.achievementService.loadAchievements(),
      quests: this.questService.loadQuests()
    }).subscribe({
      next: () => this.loading.set(false),
      error: () => {
        this.loading.set(false);
        this.errorMessage.set('Dashboard data could not be loaded from the backend.');
      }
    });
  }
}
