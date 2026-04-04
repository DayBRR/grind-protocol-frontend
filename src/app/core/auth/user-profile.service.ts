import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, of, tap } from 'rxjs';
import { ApiService } from '../http/api.service';
import { UserProfile } from '../models/domain.models';

// DEV MOCK — remove when backend is connected
const MOCK_PROFILE: UserProfile = {
  id: 1, userId: 1, displayName: 'GrindDev',
  dailyTaskGoal: 5, totalXp: 3800, corePoints: 420,
  currentStreak: 7, bestStreak: 14, lastEvaluatedDate: null,
  level: 4, levelTitle: 'Dedicated', xpToNextLevel: 1800, xpProgress: 0.44
};

/** XP thresholds per level (index = level - 1) */
const LEVEL_THRESHOLDS = [
  0, 500, 1200, 2200, 3600, 5500, 8000, 11000,
  15000, 20000, 26000, 33000, 41000, 50000, 60000,
  72000, 86000, 102000, 120000, 140000
];

const LEVEL_TITLES: Record<number, string> = {
  1: 'Initiate', 2: 'Apprentice', 3: 'Grinder', 4: 'Dedicated',
  5: 'Focused', 6: 'Disciplined', 7: 'Relentless', 8: 'Iron Grinder',
  9: 'Steel Will', 10: 'Diamond Mind', 11: 'Obsidian Core', 12: 'Titan',
  13: 'Ascendant', 14: 'Iron Grinder', 15: 'Legend',
};

export function computeLevel(totalXp: number): { level: number; title: string; xpToNext: number; progress: number } {
  let level = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length - 1; i++) {
    if (totalXp >= LEVEL_THRESHOLDS[i + 1]) level = i + 2;
    else break;
  }
  const currentFloor = LEVEL_THRESHOLDS[level - 1] ?? 0;
  const nextCeiling  = LEVEL_THRESHOLDS[level] ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  const xpInLevel    = totalXp - currentFloor;
  const xpRange      = nextCeiling - currentFloor;
  return {
    level,
    title:     LEVEL_TITLES[level] ?? 'Legend',
    xpToNext:  nextCeiling - totalXp,
    progress:  Math.min(xpInLevel / xpRange, 1)
  };
}

@Injectable({ providedIn: 'root' })
export class UserProfileService {
  private readonly api = inject(ApiService);

  private readonly _profile = signal<UserProfile | null>(null);

  readonly profile  = this._profile.asReadonly();
  readonly hasProfile = computed(() => !!this._profile());

  loadProfile(): Observable<UserProfile> {
    // DEV MOCK — remove when backend is connected
    this._profile.set(MOCK_PROFILE);
    return of(MOCK_PROFILE);
  }

  refreshProfile(): Observable<UserProfile> {
    return this.loadProfile();
  }

  private enrich(raw: UserProfile): UserProfile {
    const lvl = computeLevel(raw.totalXp);
    return { ...raw, level: lvl.level, levelTitle: lvl.title, xpToNextLevel: lvl.xpToNext, xpProgress: lvl.progress };
  }
}
