import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () =>
      import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layout/shell/shell.component').then(m => m.ShellComponent),
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadChildren: () =>
          import('./features/dashboard/dashboard.routes').then(m => m.DASHBOARD_ROUTES)
      },
      {
        path: 'tasks',
        loadChildren: () =>
          import('./features/tasks/tasks.routes').then(m => m.TASKS_ROUTES)
      },
      {
        path: 'rewards',
        loadChildren: () =>
          import('./features/rewards/rewards.routes').then(m => m.REWARDS_ROUTES)
      },
      {
        path: 'profile',
        loadChildren: () =>
          import('./features/profile/profile.routes').then(m => m.PROFILE_ROUTES)
      },
      {
        path: 'alerts',
        loadChildren: () =>
          import('./features/alerts/alerts.routes').then(m => m.ALERTS_ROUTES)
      },
      {
        path: 'timeline',
        loadChildren: () =>
          import('./features/timeline/timeline.routes').then(m => m.TIMELINE_ROUTES)
      }
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
