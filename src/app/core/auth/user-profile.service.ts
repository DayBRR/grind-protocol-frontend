import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { ApiService } from '../http/api.service';
import { UpdateUserProfileRequest, UserProfileResponse, UserProfileView } from '../models/domain.models';

const LEVEL_TITLES: Record<number, string> = {
  1: 'Initiate',
  2: 'Apprentice',
  3: 'Grinder',
  4: 'Dedicated',
  5: 'Focused',
  6: 'Disciplined',
  7: 'Relentless',
  8: 'Iron Grinder',
  9: 'Steel Will',
  10: 'Diamond Mind',
  11: 'Obsidian Core',
  12: 'Titan',
  13: 'Ascendant',
  14: 'Mythic',
  15: 'Legend'
};

@Injectable({ providedIn: 'root' })
export class UserProfileService {
  private readonly api = inject(ApiService);

  private readonly _profile = signal<UserProfileView | null>(null);

  readonly profile = this._profile.asReadonly();
  readonly hasProfile = computed(() => !!this._profile());

  loadProfile(): Observable<UserProfileView> {
    return this.api.get<UserProfileResponse>('/me/profile').pipe(
      map(profile => this.toView(profile)),
      tap(profile => this._profile.set(profile))
    );
  }

  refreshProfile(): Observable<UserProfileView> {
    return this.loadProfile();
  }

  updateProfile(request: UpdateUserProfileRequest): Observable<UserProfileView> {
    return this.api.put<UserProfileResponse>('/me/profile', request).pipe(
      map(profile => this.toView(profile)),
      tap(profile => this._profile.set(profile))
    );
  }

  private toView(profile: UserProfileResponse): UserProfileView {
    return {
      ...profile,
      levelTitle: LEVEL_TITLES[profile.level] ?? 'Legend'
    };
  }
}
