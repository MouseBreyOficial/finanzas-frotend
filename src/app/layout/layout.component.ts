import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { AuthService } from '../core/services/auth.service';
import { NotificationService } from '../core/services/notification.service';
import { ThemeService, AppThemeName, AppColorMode, AppPrimaryColor } from '../core/services/theme.service';

@Component({selector:'app-layout',standalone:true,imports:[FormsModule,RouterOutlet,RouterLink,RouterLinkActive,ButtonModule,SelectModule,ToastModule],template:`
<p-toast position="top-right"></p-toast>
<div class="nav-shell"><aside class="sidebar"><div class="brand"><div class="brand-icon"><i class="pi pi-chart-line"></i></div><div><strong>Finanzas</strong><small>Personal</small></div></div>
<div class="nav-label">GENERAL</div><nav>
<a class="nav-item" routerLink="/dashboard" routerLinkActive="active"><i class="pi pi-home"></i><span>Dashboard</span></a>
<a class="nav-item" routerLink="/cuentas" routerLinkActive="active"><i class="pi pi-wallet"></i><span>Cuentas</span></a>
<div class="nav-label">MOVIMIENTOS</div>
<a class="nav-item" routerLink="/ingresos" routerLinkActive="active"><i class="pi pi-arrow-up-right"></i><span>Ingresos</span></a>
<a class="nav-item" routerLink="/gastos" routerLinkActive="active"><i class="pi pi-arrow-down-right"></i><span>Gastos</span></a>
<a class="nav-item" routerLink="/analisis" routerLinkActive="active"><i class="pi pi-chart-bar"></i><span>Análisis</span></a>
<a class="nav-item" routerLink="/alertas" routerLinkActive="active"><i class="pi pi-bell"></i><span>Alertas</span></a>
<div class="nav-label">SISTEMA</div>
@if (auth.isAdministrator()) {
<a class="nav-item" routerLink="/usuarios" routerLinkActive="active"><i class="pi pi-users"></i><span>Usuarios</span></a>
}
<a class="nav-item" routerLink="/perfil" routerLinkActive="active"><i class="pi pi-user"></i><span>Mi perfil</span></a>
</nav><div class="sidebar-footer"><i class="pi pi-shield"></i><span>Sesión protegida con JWT</span></div></aside>
<main class="main-content"><header class="topbar"><div class="topbar-title"><span>Panel financiero</span></div><div class="topbar-user">
<div class="quick-appearance" title="Apariencia rápida">
  <i class="pi pi-palette"></i>
  <p-select class="quick-select theme-select" [(ngModel)]="selectedTheme" [options]="themeService.themes" (onChange)="changeTheme($event.value)" appendTo="body" ariaLabel="Tema" />
  <p-select class="quick-select color-select" [(ngModel)]="selectedPrimary" [options]="themeService.primaryColors" optionLabel="label" optionValue="value" (onChange)="changePrimary($event.value)" appendTo="body" ariaLabel="Color principal" />
  <p-button [icon]="selectedMode === 'dark' ? 'pi pi-moon' : 'pi pi-sun'" [text]="true" [rounded]="true" [ariaLabel]="selectedMode === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'" (onClick)="toggleMode()" />
</div>
<a routerLink="/perfil" class="user-link"><div class="mini-avatar">{{ initials }}</div><div><strong>{{auth.getNombreCompleto()}}</strong><small>{{auth.getUsername()}}</small></div></a><p-button icon="pi pi-sign-out" [text]="true" [rounded]="true" ariaLabel="Cerrar sesión" (onClick)="logout()" /></div></header><router-outlet /></main></div>`})
export class LayoutComponent implements OnInit, OnDestroy{
  readonly auth=inject(AuthService); readonly themeService=inject(ThemeService);
  private router=inject(Router); private notifications=inject(NotificationService);
  selectedTheme:AppThemeName=this.themeService.theme;
  selectedPrimary:AppPrimaryColor=this.themeService.primaryColor;
  selectedMode:AppColorMode=this.themeService.mode;
  ngOnInit(){void this.notifications.start();}
  ngOnDestroy(){this.notifications.stop();}
  get initials(){return (this.auth.getNombreCompleto()||'U').split(' ').slice(0,2).map(x=>x[0]).join('').toUpperCase();}
  changeTheme(theme:AppThemeName){this.selectedTheme=theme;this.themeService.setTheme(theme);}
  changePrimary(color:AppPrimaryColor){this.selectedPrimary=color;this.themeService.setPrimaryColor(color);}
  toggleMode(){this.selectedMode=this.selectedMode==='dark'?'light':'dark';this.themeService.setMode(this.selectedMode);}
  logout(){this.notifications.stop();this.auth.logout();void this.router.navigate(['/login']);}
}
