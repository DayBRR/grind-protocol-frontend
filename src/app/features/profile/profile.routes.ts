import { Routes } from '@angular/router';

export const PROFILE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./profile-stats/profile-stats.component').then(m => m.ProfileStatsComponent)
  }
];
