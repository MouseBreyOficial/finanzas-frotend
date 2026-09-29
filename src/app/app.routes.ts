import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { LayoutComponent } from './layout/layout.component';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'registro',
    loadComponent: () => import('./pages/registro/registro.component').then(m => m.RegistroComponent)
  },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'cuentas',
        loadComponent: () => import('./pages/cuentas/cuentas.component').then(m => m.CuentasComponent)
      },
      {
        path: 'ingresos',
        loadComponent: () => import('./pages/ingresos/ingresos.component').then(m => m.IngresosComponent)
      },
      {
        path: 'gastos',
        loadComponent: () => import('./pages/gastos/gastos.component').then(m => m.GastosComponent)
      },
      {
        path: 'alertas',
        loadComponent: () => import('./pages/alertas/alertas.component').then(m => m.AlertasComponent)
      },
      { path: 'analisis', loadComponent: () => import('./pages/analisis/analisis.component').then(m => m.AnalisisComponent) },
      { path: 'usuarios', canActivate: [adminGuard], loadComponent: () => import('./pages/usuarios/usuarios.component').then(m => m.UsuariosComponent) },
      { path: 'perfil', loadComponent: () => import('./pages/perfil/perfil.component').then(m => m.PerfilComponent) }
    ]
  },
  { path: '**', redirectTo: '' }
];
