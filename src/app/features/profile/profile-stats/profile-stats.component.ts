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
  templateUrl: './profile-stats.component.html',
  styleUrls: ['./profile-stats.component.scss'],})
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
