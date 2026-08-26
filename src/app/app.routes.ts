import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
  },
  {
    path: 'trilha',
    loadComponent: () => import('./features/trilha/trilha.component').then((m) => m.TrilhaComponent),
  },
  {
    path: 'trilha/:topicId/leitura',
    loadComponent: () => import('./features/leitura/leitura.component').then((m) => m.LeituraComponent),
  },
  {
    path: 'simulado/:topicId/resultado',
    loadComponent: () =>
      import('./features/simulado/simulado-resultado.component').then((m) => m.SimuladoResultadoComponent),
  },
  {
    path: 'simulado/:topicId',
    loadComponent: () => import('./features/simulado/simulado.component').then((m) => m.SimuladoComponent),
  },
  {
    path: 'revisao',
    loadComponent: () => import('./features/revisao/revisao.component').then((m) => m.RevisaoComponent),
  },
  {
    path: 'progresso',
    loadComponent: () => import('./features/progresso/progresso.component').then((m) => m.ProgressoComponent),
  },
  { path: '**', redirectTo: '' },
];
