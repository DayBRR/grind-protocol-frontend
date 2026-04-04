import { Routes } from '@angular/router';

export const TASKS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./task-list/task-list.component').then(m => m.TaskListComponent)
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./task-create/task-create.component').then(m => m.TaskCreateComponent)
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./task-detail/task-detail.component').then(m => m.TaskDetailComponent)
  }
];
