import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./features/home/home-page.component').then(m => m.HomePageComponent) },
  // TODO: public routes, product list/detail, auth, admin lazy routes
];
