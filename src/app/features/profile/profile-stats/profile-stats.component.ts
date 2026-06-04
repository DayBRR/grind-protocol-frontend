import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { forkJoin } from 'rxjs';
import { UserProfileService } from '../../../core/auth/user-profile.service';
import { ProgressionService } from '../../../core/http/progression.service';
import { XpProgressBarComponent } from '../../../shared/components/xp-progress-bar/xp-progress-bar.component';
import { LevelBadgeComponent } from '../../../shared/components/level-badge/level-badge.component';
import { XpFormatPipe } from '../../../shared/pipes/xp-format.pipe';

@Component({
  selector: 'gp-profile-stats',
  standalone: true,
  imports: [DecimalPipe, XpProgressBarComponent, LevelBadgeComponent, XpFormatPipe],
  template: `
    @if (loading()) {
      <p style="color: var(--text-dim); font-size: 13px;">Loading profile...</p>
    }

    @if (errorMessage()) {
      <p style="color: var(--danger, #ef4444); font-size: 13px;">{{ errorMessage() }}</p>
    }

    @if (profile(); as p) {
      <div class="profile-page">

        <!-- Hero card -->
        <div class="profile-hero">
          <div class="profile-hero__avatar">{{ initials() }}</div>
          <div class="profile-hero__info">
            <h1 class="profile-hero__name">{{ p.displayName }}</h1>
            <gp-level-badge [level]="level()" [title]="p.levelTitle" />
            <gp-xp-progress-bar
              [currentXp]="totalXp()"
              [targetXp]="xpForNextLevel()"
              [progress]="xpProgressFraction()"
              [level]="level()"
              style="margin-top: 12px;"
            />
          </div>
        </div>

        <!-- Stats grid -->
        <div class="stats-grid">
          <div class="stat-card">
            <span class="stat-card__label">Total XP</span>
            <span class="stat-card__val mono text-xp">{{ totalXp() | xpFormat }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-card__label">Level</span>
            <span class="stat-card__val mono text-primary">{{ level() }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-card__label">Core Points</span>
            <span class="stat-card__val mono text-gold">{{ corePoints() | number }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-card__label">Current Streak</span>
            <span class="stat-card__val mono text-streak">{{ currentStreak() }}d</span>
          </div>
          <div class="stat-card">
            <span class="stat-card__label">Best Streak</span>
            <span class="stat-card__val mono">{{ bestStreak() }}d</span>
          </div>
          <div class="stat-card">
            <span class="stat-card__label">Daily Goal</span>
            <span class="stat-card__val mono">{{ p.dailyTaskGoal }} tasks</span>
          </div>
        </div>

        <!-- XP to next level -->
        <div class="card next-level">
          <p class="card-label">Progress to Level {{ level() + 1 }}</p>
          <div class="next-level__nums">
            <span class="next-level__current mono">{{ totalXp() | xpFormat }}</span>
            <span class="next-level__sep">→</span>
            <span class="next-level__target mono text-xp">{{ xpForNextLevel() | xpFormat }}</span>
          </div>
          <gp-xp-progress-bar
            [currentXp]="totalXp()"
            [targetXp]="xpForNextLevel()"
            [progress]="xpProgressFraction()"
            [level]="level()"
            style="margin-top: 10px;"
          />
          <p class="next-level__remaining">{{ xpRemainingForNextLevel() | number }} XP remaining</p>
        </div>

      </div>
    }
  `,
  styles: [`
    .profile-page { display: flex; flex-direction: column; gap: 20px; max-width: 760px; }

    .profile-hero {
      display: flex; align-items: center; gap: 24px;
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 24px 28px;
      position: relative; overflow: hidden;
    }

    .profile-hero::before {
      content: '';
      position: absolute; top: 0; left: 0; right: 0; height: 2px;
      background: linear-gradient(90deg, var(--primary), var(--xp));
      opacity: 0.6;
    }

    .profile-hero__avatar {
      width: 72px; height: 72px;
      border-radius: 16px;
      background: var(--bg-input);
      border: 2px solid var(--primary-dim);
      display: flex; align-items: center; justify-content: center;
      font-size: 26px; font-weight: 800; color: var(--primary);
      flex-shrink: 0;
      box-shadow: 0 0 24px var(--primary-glow);
    }

    .profile-hero__info { flex: 1; min-width: 0; }
    .profile-hero__name { font-size: 22px; font-weight: 800; margin-bottom: 4px; }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
    }

    .stat-card {
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 16px;
      display: flex; flex-direction: column; gap: 6px;
    }

    .stat-card__label { font-size: 10px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.08em; font-weight: 600; }
    .stat-card__val   { font-size: 24px; font-weight: 800; }

    .next-level__nums {
      display: flex; align-items: center; gap: 12px;
      margin-top: 4px;
    }

    .next-level__current { font-size: 16px; font-weight: 600; color: var(--text-muted); }
    .next-level__sep     { color: var(--text-dim); }
    .next-level__target  { font-size: 16px; font-weight: 700; }
    .next-level__remaining { font-size: 11px; color: var(--text-dim); margin-top: 8px; text-align: right; }

    @media (max-width: 600px) {
      .stats-grid { grid-template-columns: repeat(2, 1fr); }
      .profile-hero { flex-direction: column; }
    }
  `]
})
export class ProfileStatsComponent implements OnInit {
  private readonly profileService = inject(UserProfileService);
  private readonly progressionService = inject(ProgressionService);

  readonly profile = this.profileService.profile;
  readonly progression = this.progressionService.summary;

  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly totalXp = computed(() => this.progression()?.totalXp ?? this.profile()?.totalXp ?? 0);
  readonly level = computed(() => this.progression()?.level ?? this.profile()?.level ?? 1);
  readonly corePoints = computed(() => this.progression()?.corePoints ?? this.profile()?.corePoints ?? 0);
  readonly currentStreak = computed(() => this.progression()?.currentStreak ?? this.profile()?.currentStreak ?? 0);
  readonly bestStreak = computed(() => this.progression()?.bestStreak ?? this.profile()?.bestStreak ?? 0);
  readonly xpForNextLevel = computed(() => this.progression()?.xpForNextLevel ?? this.totalXp() + 100);
  readonly xpRemainingForNextLevel = computed(() => this.progression()?.xpRemainingForNextLevel ?? 0);
  readonly xpProgressFraction = this.progressionService.xpProgressFraction;

  readonly initials = computed(() => {
    const name = this.profile()?.displayName ?? this.profile()?.username ?? '';
    return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2) || 'GP';
  });

  ngOnInit(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    forkJoin({
      profile: this.profileService.loadProfile(),
      progression: this.progressionService.loadSummary()
    }).subscribe({
      next: () => this.loading.set(false),
      error: () => {
        this.loading.set(false);
        this.errorMessage.set('Profile data could not be loaded from the backend.');
      }
    });
  }
}
