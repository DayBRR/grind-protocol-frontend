import { Routes } from '@angular/router';

export const TIMELINE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./timeline-page.component').then(m => m.TimelinePageComponent)
  }
];
