import { Routes } from '@angular/router';

export const REWARDS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./reward-store/reward-store.component').then(m => m.RewardStoreComponent)
  }
];
