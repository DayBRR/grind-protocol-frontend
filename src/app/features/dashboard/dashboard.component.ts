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

import {
  AchievementResponse,
  BackendTaskCategory,
  CategoryFocusResponse,
  QuestResponse,
  Task,
  WeeklyProgressionSummaryResponse
} from '../../core/models/domain.models';

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const CATEGORY_RADAR_AXES: { category: BackendTaskCategory; label: string }[] = [
  { category: 'MIND', label: 'Mind' },
  { category: 'BODY', label: 'Body' },
  { category: 'WORK', label: 'Work' },
  { category: 'PERSONAL', label: 'Personal' }
];

interface WeekBar {
  pct: number;
  xp: number;
  today: boolean;
}

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
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],})
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

  readonly radarAxes = signal<RadarAxis[]>(this.emptyRadarAxes());

  readonly weekBars = signal<WeekBar[]>(this.emptyWeekBars());

  readonly weekXp = signal(0);
  readonly weekXpDelta = signal<number | null>(0);
  readonly weekXpDeltaAbs = computed(() => Math.abs(this.weekXpDelta() ?? 0));

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
      weeklySummary: this.progressionService.loadWeeklySummary(),
      dailyProgress: this.dailyProgressService.loadToday(),
      tasks: this.taskService.loadTodayTasks(),
      categoryFocus: this.taskService.loadCategoryFocus('WEEK'),
      rewards: this.rewardService.loadRewards(),
      achievements: this.achievementService.loadAchievements(),
      quests: this.questService.loadQuests()
    }).subscribe({
      next: ({ categoryFocus, weeklySummary }) => {
        this.applyWeeklySummary(weeklySummary);
        this.radarAxes.set(this.toRadarAxes(categoryFocus));
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.errorMessage.set('Dashboard data could not be loaded from the backend.');
      }
    });
  }

  private emptyRadarAxes(): RadarAxis[] {
    return CATEGORY_RADAR_AXES.map(axis => ({ label: axis.label, value: 0 }));
  }

  private emptyWeekBars(): WeekBar[] {
    return DAY_LABELS.map(() => ({ pct: 0, xp: 0, today: false }));
  }

  private toRadarAxes(categoryFocus: CategoryFocusResponse | null | undefined): RadarAxis[] {
    const categories = categoryFocus?.categories ?? [];

    return CATEGORY_RADAR_AXES.map(axis => ({
      label: axis.label,
      value: categories.find(item => item.category === axis.category)?.percentage ?? 0
    }));
  }

  private applyWeeklySummary(summary: WeeklyProgressionSummaryResponse): void {
    this.weekXp.set(summary.totalXp);
    this.weekXpDelta.set(summary.deltaPercent);
    this.weekBars.set(this.toWeekBars(summary));
  }

  private toWeekBars(summary: WeeklyProgressionSummaryResponse): WeekBar[] {
    const maxXp = Math.max(...summary.days.map(day => day.xpEarned), 0);
    const today = this.toLocalDateString(new Date());

    return summary.days.map(day => ({
      pct: maxXp > 0 ? (day.xpEarned / maxXp) * 100 : 0,
      xp: day.xpEarned,
      today: day.date === today
    }));
  }

  private toLocalDateString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
