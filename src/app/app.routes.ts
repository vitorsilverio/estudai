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
    path: 'flashcards/:topicId',
    loadComponent: () => import('./features/flashcards/flashcards.component').then((m) => m.FlashcardsComponent),
  },
  {
    path: 'leitura-diaria',
    loadComponent: () =>
      import('./features/leitura-diaria/leitura-diaria.component').then((m) => m.LeituraDiariaComponent),
  },
  {
    path: 'revisao',
    loadComponent: () => import('./features/revisao/revisao.component').then((m) => m.RevisaoComponent),
  },
  {
    path: 'progresso',
    loadComponent: () => import('./features/progresso/progresso.component').then((m) => m.ProgressoComponent),
  },
  {
    path: 'mapa-de-erros',
    loadComponent: () =>
      import('./features/mapa-de-erros/mapa-de-erros.component').then((m) => m.MapaDeErrosComponent),
  },
  {
    path: 'trocar-concurso',
    loadComponent: () => import('./features/exam-picker/exam-picker.component').then((m) => m.ExamPickerComponent),
  },
  { path: '**', redirectTo: '' },
];
