import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DecimalPipe, UpperCasePipe } from '@angular/common';
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
    UpperCasePipe,
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
    <div class="dashboard-container">

      <!-- ── HERO (Row 1) ── -->
      @if (profile(); as p) {
        <div class="hero area-hero">
          <div class="hero__avatar">{{ avatarInitials() }}</div>
          <div class="hero__content">
            <div class="hero__main">
              <div class="hero__name-group">
                <h2 class="hero__name">{{ p.displayName }}</h2>
                <div class="hero__level mono">RANK: {{ p.levelTitle | uppercase }}</div>
              </div>
              <div class="hero__lvl-badge mono">LVL {{ p.level }}</div>
            </div>
            <div class="xp-bar-container">
              <div class="xp-bar"><div class="xp-bar__fill" [style.width.%]="p.xpProgress"></div></div>
              <div class="xp-bar-labels">
                <span class="mono">{{ p.totalXp | number }} XP</span>
                <span class="mono">{{ p.totalXp + p.xpToNextLevel | number }} XP</span>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- ── TOP STATS (Row 2) ── -->
      <!-- Today's Progress -->
      <div class="card area-prog">
        <div class="card-label">Today's progress</div>
        <div class="daily-compact">
          <div class="ring-box">
            <gp-daily-ring [completed]="taskService.completedTodayCount() || 3" [total]="dailyGoal()" />
          </div>
          <div class="daily-tasks-mini">
            @for (task of mockTasks.slice(0,3); track task.id) {
              <div class="mini-task" [class.done]="task.completedToday">
                <div class="mini-check">@if(task.completedToday){✓}</div>
                <div class="mini-content">
                   <span class="mini-name">{{ task.title }}</span>
                   <span class="mini-xp">+{{ task.baseXp }} XP</span>
                </div>
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Current Streak -->
      <div class="card area-stre">
        <div class="card-label">Current streak</div>
        <div class="streak-body">
          <div class="streak-focus">
            <div class="streak-fire">
              <span class="streak-val mono">{{ profile()?.currentStreak || 12 }}</span>
            </div>
            <div class="streak-info">
              <span class="streak-lbl">DAY STREAK</span>
              <span class="streak-sub">You're on fire! 🔥</span>
            </div>
          </div>
          <gp-streak-calendar [days]="streakDays()" />
        </div>
      </div>

      <!-- Rewards -->
      <div class="card area-rewd">
        <div class="card-header-flex">
          <div class="card-label">Rewards</div>
          <div class="wallet-pill mono">
            🪙 {{ profile()?.corePoints || 1250 | number }}
          </div>
        </div>
        <div class="reward-list-mini">
          @for (r of mockRewards; track r.id) {
            <div class="reward-row-mini" [class.disabled]="!r.canAfford">
              <span class="reward-row-icon">{{ r.icon }}</span>
              <span class="reward-row-name">{{ r.title }}</span>
              <span class="reward-row-cost mono">{{ r.costCorePoints }}</span>
            </div>
          }
        </div>
      </div>

      <!-- ── DATA ANALYSIS (Row 3) ── -->
      <!-- XP Performance -->
      <div class="card area-perf">
        <div class="card-label">XP Performance</div>
        <div class="xp-header">
          <div class="xp-header-info">
            <div class="xp-big-val mono">+{{ weekXp() | number }}<small>XP</small></div>
            <span class="xp-sub-label">WEEKLY GAIN</span>
          </div>
          <div class="xp-trend positive">
            <span class="trend-icon">↑</span> {{ weekXpDelta() }}%
          </div>
        </div>
        <div class="xp-visual-chart">
          @for (bar of weekBars(); track $index) {
            <div class="xp-v-col">
              <div class="xp-v-val mono" [class.active]="bar.xp > 0">{{ bar.xp || '0' }}</div>
              <div class="xp-v-track">
                <div class="xp-v-bar" [class.today]="bar.today" [style.height.%]="bar.pct"></div>
              </div>
              <span class="xp-v-day">{{ dayLabels[$index] }}</span>
            </div>
          }
        </div>
      </div>

      <!-- Focus Distribution -->
      <div class="card area-rada">
        <div class="card-label">Focus Distribution</div>
        <div class="radar-container">
          <div class="radar-content">
            <gp-radar-chart [axes]="radarAxes()" />
          </div>
          <div class="radar-overlay mono">
            <div class="radar-stat-mini">
              <span class="l">TOTAL SESSIONS</span>
              <span class="v">42</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ── ACTIVITY (Row 4) ── -->
      <div class="card area-time">
        <div class="card-label">Recent Activity</div>
        <div class="timeline-scroll">
          @for (event of mockEvents; track event.id) {
            <gp-timeline-dot [event]="event" />
          }
        </div>
      </div>

    </div>
  `,
  styles: [`
    .dashboard-container {
      display: grid;
      grid-template-columns: 1.2fr 1fr 1fr;
      grid-template-rows: auto 185px 270px auto;
      grid-template-areas:
        "hero hero hero"
        "prog stre rewd"
        "perf perf rada"
        "time time time";
      gap: 12px;
      width: 100%;
      max-width: 1400px;
      margin: 0 auto;
      padding: 4px 4px 40px 4px;
      animation: fade-in 0.4s ease-out;
    }


    /* Assign Grid Areas */
    .area-hero { grid-area: hero; }
    .area-prog { grid-area: prog; }
    .area-stre { grid-area: stre; }
    .area-rewd { grid-area: rewd; }
    .area-perf { grid-area: perf; }
    .area-rada { grid-area: rada; }
    .area-time { grid-area: time; }

    .card {
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 14px 16px;
      display: flex;
      flex-direction: column;
      min-height: 0;
    }

    .card-label {
      font-size: 9px; font-weight: 800; letter-spacing: 0.1em;
      text-transform: uppercase; color: var(--text-dim);
      margin-bottom: 12px; display: flex; align-items: center; gap: 6px;
    }
    .card-label::before { content: ''; width: 4px; height: 4px; background: var(--primary); border-radius: 1px; }

    /* ── HERO ── */
    .hero {
      display: flex; align-items: center; gap: 16px; padding: 12px 20px;
      background: var(--bg-surface); border: 1px solid var(--border); border-radius: 12px;
    }
    .hero__avatar {
      width: 44px; height: 44px; border-radius: 10px; background: var(--bg-input);
      border: 2px solid var(--primary-dim); display: flex; align-items: center; justify-content: center;
      font-size: 18px; font-weight: 900; color: var(--primary);
    }
    .hero__content { flex: 1; }
    .hero__main { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
    .hero__name { font-size: 18px; font-weight: 900; margin: 0; }
    .hero__lvl-badge { background: var(--primary); color: #000; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 900; }

    .xp-bar-container { width: 100%; }
    .xp-bar { height: 4px; background: var(--bg-input); border-radius: 4px; overflow: hidden; margin-bottom: 4px; }
    .xp-bar__fill { height: 100%; background: var(--primary); box-shadow: 0 0 10px var(--primary-glow); transition: width 1s ease; }
    .xp-bar-labels { display: flex; justify-content: space-between; font-size: 9px; color: var(--text-muted); }

    /* ── TOP ROW ── */
    .daily-compact { display: flex; gap: 28px; align-items: center; flex: 1; }
    .ring-box { width: 84px; height: 84px; flex-shrink: 0; }
    .daily-tasks-mini { display: flex; flex-direction: column; gap: 8px; flex: 1; min-width: 0; }
    .mini-task { 
      display: flex; align-items: center; gap: 10px; padding: 4px 0;
      transition: all 0.2s ease;
    }
    .mini-check { 
      width: 14px; height: 14px; border: 1.5px solid var(--border-strong); 
      border-radius: 4px; flex-shrink: 0; display: flex; align-items: center; justify-content: center;
      font-size: 8px; font-weight: 900; color: transparent; transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    .mini-task.done .mini-check { 
      background: var(--xp); border-color: var(--xp); color: #000;
      box-shadow: 0 0 10px var(--xp), 0 0 20px var(--xp-glow);
      transform: scale(1.1);
    }
    .mini-content { display: flex; flex-direction: column; gap: 1px; flex: 1; overflow: hidden; }
    .mini-name { font-size: 11px; font-weight: 600; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .mini-xp { font-size: 8px; font-weight: 800; color: var(--text-dim); font-family: var(--font-mono); }
    .mini-task.done .mini-name { color: var(--text-muted); text-decoration: line-through; opacity: 0.7; }
    .mini-task.done .mini-xp { color: var(--xp); opacity: 0.8; }

    .streak-body { display: flex; flex-direction: column; gap: 12px; flex: 1; justify-content: center; }
    .streak-focus { display: flex; align-items: center; gap: 16px; margin-bottom: 4px; }
    .streak-fire {
      width: 52px; height: 52px; border-radius: 14px;
      background: linear-gradient(135deg, #f97316, #ea580c);
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 0 20px rgba(249, 115, 22, 0.4);
      position: relative;
    }
    .streak-fire::after {
      content: '🔥'; position: absolute; top: -8px; right: -8px; font-size: 16px;
      filter: drop-shadow(0 0 8px rgba(249, 115, 22, 0.6));
    }
    .streak-val { font-size: 28px; font-weight: 900; color: #fff; line-height: 1; }
    .streak-info { display: flex; flex-direction: column; gap: 2px; }
    .streak-lbl { font-size: 10px; font-weight: 800; color: var(--streak); letter-spacing: 0.05em; }
    .streak-sub { font-size: 9px; font-weight: 600; color: var(--text-muted); }

    /* ── REWARDS ── */
    .card-header-flex { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
    .wallet-pill {
      font-size: 10px; font-weight: 800; color: var(--currency);
      background: rgba(234, 179, 8, 0.1); padding: 2px 8px; border-radius: 20px;
      border: 1px solid rgba(234, 179, 8, 0.2);
    }
    .reward-list-mini {
      display: flex; flex-direction: column; gap: 4px;
      overflow-y: auto; flex: 1; padding-right: 4px;
      max-height: 120px;
    }
    .reward-list-mini::-webkit-scrollbar { width: 2px; }
    .reward-list-mini::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }

    .reward-row-mini {
      display: flex; align-items: center; gap: 8px; padding: 6px 10px;
      background: rgba(234, 179, 8, 0.02); border-radius: 8px;
      border: 1px solid rgba(234, 179, 8, 0.1); transition: all 0.3s ease;
      cursor: pointer;
    }
    .reward-row-mini:hover:not(.disabled) {
      background: rgba(234, 179, 8, 0.08);
      border-color: var(--currency);
      box-shadow: 0 0 12px rgba(234, 179, 8, 0.3), inset 0 0 4px rgba(234, 179, 8, 0.1);
      transform: translateX(4px);
    }
    .reward-row-icon { font-size: 14px; }
    .reward-row-name { font-size: 10px; font-weight: 600; color: var(--text); flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .reward-row-cost { font-size: 9px; font-weight: 800; color: var(--currency); }
    .reward-row-mini.disabled { opacity: 0.4; filter: grayscale(1); cursor: not-allowed; }

    /* ── ANALYSIS ROW ── */
    .xp-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 20px; }
    .xp-header-info { display: flex; flex-direction: column; gap: 2px; }
    .xp-big-val { font-size: 26px; font-weight: 900; color: var(--text); line-height: 1; }
    .xp-big-val small { font-size: 10px; margin-left: 4px; color: var(--text-dim); }
    .xp-sub-label { font-size: 8px; font-weight: 800; color: var(--text-dim); letter-spacing: 0.05em; }
    .xp-trend { 
      font-size: 10px; font-weight: 800; color: var(--success);
      padding: 2px 6px; border-radius: 4px; background: rgba(34, 197, 94, 0.05);
    }

    .xp-visual-chart { 
      display: flex; align-items: flex-end; gap: 8px; flex: 1; padding: 12px 4px;
      background: linear-gradient(0deg, rgba(255,255,255,0.02) 1px, transparent 1px);
      background-size: 100% 25%;
    }
    .xp-v-col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 8px; height: 100%; }
    .xp-v-val { font-size: 8px; color: var(--text-muted); font-weight: 700; opacity: 0; transition: 0.2s; }
    .xp-v-col:hover .xp-v-val { opacity: 1; }
    .xp-v-track { width: 48px; flex: 1; display: flex; align-items: flex-end; justify-content: center; }
    .xp-v-bar { 
      width: 100%; 
      background: rgba(34, 211, 238, 0.08); 
      border: 2px solid var(--xp);
      border-bottom: none;
      border-radius: 6px 6px 0 0;
      box-shadow: 0 0 10px var(--xp-glow);
      transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    .xp-v-bar.today { 
      background: rgba(34, 211, 238, 0.2); 
      border-color: var(--xp);
      box-shadow: 0 0 15px var(--xp), inset 0 0 10px var(--xp-glow);
    }
    .xp-v-col:hover .xp-v-bar { 
      background: rgba(34, 211, 238, 0.25); 
      box-shadow: 0 0 12px var(--xp);
      transform: scaleX(1.1);
    }
    .xp-v-day { font-size: 9px; font-weight: 800; color: var(--text-dim); padding-top: 6px; }

    .radar-container { 
      flex: 1; display: flex; flex-direction: column; position: relative;
      min-height: 0; justify-content: center;
    }
    .radar-content { 
      flex: 1; display: flex; align-items: center; justify-content: center; 
      padding: 10px; min-height: 0;
    }
    .radar-overlay {
      position: absolute; bottom: 12px; right: 16px;
      display: flex; flex-direction: column; align-items: flex-end;
    }
    .radar-stat-mini {
      display: flex; flex-direction: column; align-items: flex-end; gap: 0px;
    }
    .radar-stat-mini .l { font-size: 7px; color: var(--text-dim); font-weight: 800; letter-spacing: 0.1em; }
    .radar-stat-mini .v { font-size: 14px; font-weight: 900; color: var(--primary); text-shadow: 0 0 10px var(--primary-glow); }

    /* ── TIMELINE ── */
    .timeline-scroll { display: flex; flex-direction: column; gap: 4px; }

    @keyframes fade-in {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    /* Responsive scaling */
    @media (max-width: 1100px) {
      .dashboard-container { 
        grid-template-columns: 1fr 1fr;
        grid-template-areas:
          "hero hero"
          "prog stre"
          "rewd rewd"
          "perf perf"
          "rada rada"
          "time time";
        height: auto;
        overflow: visible;
      }
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

  // Rich Mock Data for UI Demonstration
  readonly mockTasks: any[] = [
    { id: 1, title: 'Morning Cardio 30min', baseXp: 150, mandatory: true, completedToday: true },
    { id: 2, title: 'Deep Work: Project Grind', baseXp: 300, mandatory: true, completedToday: true },
    { id: 3, title: 'Read 20 pages of "Atomic Habits"', baseXp: 100, mandatory: false, completedToday: true },
    { id: 4, title: 'Weekly Review & Planning', baseXp: 200, mandatory: false, completedToday: false },
  ];

  readonly mockRewards: any[] = [
    { id: 1, title: 'Gaming Night (2h)', costCorePoints: 500, canAfford: true, icon: '🎮' },
    { id: 2, title: 'Cheat Meal: Pizza', costCorePoints: 800, canAfford: true, icon: '🍕' },
    { id: 3, title: 'New Tech Gadget', costCorePoints: 5000, canAfford: false, icon: '🎧' },
  ];

  readonly mockEvents: any[] = [
    { id: 1, eventType: 'TASK_COMPLETED', title: 'Task Master', description: 'Completed "Deep Work: Project Grind"', createdAt: new Date().toISOString() },
    { id: 2, eventType: 'LEVEL_UP', title: 'Rank Up!', description: 'Reached Level 14: Iron Grinder', createdAt: new Date(Date.now() - 3600000).toISOString() },
    { id: 3, eventType: 'STREAK_EXTENDED', title: 'On Fire', description: 'Streak extended to 12 days!', createdAt: new Date(Date.now() - 7200000).toISOString() },
  ];

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

  readonly radarAxes = signal<RadarAxis[]>([
    { label: 'Health',   value: 75 },
    { label: 'Work',     value: 60 },
    { label: 'Learning', value: 85 },
    { label: 'Finance',  value: 40 },
    { label: 'Personal', value: 55 },
    { label: 'Other',    value: 30 },
  ]);

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
