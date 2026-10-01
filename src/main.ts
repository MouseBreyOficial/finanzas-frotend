import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { providePrimeNG } from 'primeng/config';
import { definePreset } from '@primeng/themes';

import Aura from '@primeng/themes/aura';
import Lara from '@primeng/themes/lara';
import Material from '@primeng/themes/material';
import Nora from '@primeng/themes/nora';

import { MessageService } from 'primeng/api';

import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { authInterceptor } from './app/core/interceptors/auth.interceptor';


type AppThemeName = 'Aura' | 'Lara' | 'Material' | 'Nora';

type AppPrimaryColor =
  | 'blue'
  | 'green'
  | 'emerald'
  | 'violet'
  | 'orange'
  | 'red'
  | 'indigo'
  | 'noir';

type PrimePreset = Record<string, unknown>;


/*
 * ============================================================
 * TEMA GUARDADO
 * ============================================================
 */

const presets: Record<AppThemeName, PrimePreset> = {
  Aura: Aura as PrimePreset,
  Lara: Lara as PrimePreset,
  Material: Material as PrimePreset,
  Nora: Nora as PrimePreset
};


/*
 * ============================================================
 * OBTENER TEMA
 * ============================================================
 */

function getSavedTheme(): AppThemeName {

  const saved =
    localStorage.getItem('finanzas_theme') as AppThemeName | null;

  if (
    saved === 'Aura' ||
    saved === 'Lara' ||
    saved === 'Material' ||
    saved === 'Nora'
  ) {
    return saved;
  }

  return 'Aura';
}


/*
 * ============================================================
 * OBTENER COLOR
 * ============================================================
 */

function getSavedPrimaryColor(): AppPrimaryColor {

  const saved =
    localStorage.getItem(
      'finanzas_primary_color'
    ) as AppPrimaryColor | null;

  const validColors: AppPrimaryColor[] = [
    'blue',
    'green',
    'emerald',
    'violet',
    'orange',
    'red',
    'indigo',
    'noir'
  ];

  if (saved && validColors.includes(saved)) {
    return saved;
  }

  return 'blue';
}


/*
 * ============================================================
 * PALETA DE COLOR
 * ============================================================
 */

function primaryPalette(
  color: AppPrimaryColor
): Record<string, string> {

  if (color === 'noir') {

    return {
      50: '{zinc.50}',
      100: '{zinc.100}',
      200: '{zinc.200}',
      300: '{zinc.300}',
      400: '{zinc.400}',
      500: '{zinc.500}',
      600: '{zinc.600}',
      700: '{zinc.700}',
      800: '{zinc.800}',
      900: '{zinc.900}',
      950: '{zinc.950}'
    };
  }

  return {
    50: `{${color}.50}`,
    100: `{${color}.100}`,
    200: `{${color}.200}`,
    300: `{${color}.300}`,
    400: `{${color}.400}`,
    500: `{${color}.500}`,
    600: `{${color}.600}`,
    700: `{${color}.700}`,
    800: `{${color}.800}`,
    900: `{${color}.900}`,
    950: `{${color}.950}`
  };
}


/*
 * ============================================================
 * CREAR PRESET INICIAL
 * ============================================================
 */

const savedTheme = getSavedTheme();
const savedPrimaryColor = getSavedPrimaryColor();

const initialPreset = definePreset(
  presets[savedTheme],
  {
    semantic: {
      primary: primaryPalette(savedPrimaryColor)
    }
  }
);


/*
 * ============================================================
 * RESTAURAR MODO OSCURO ANTES DE INICIAR ANGULAR
 * ============================================================
 */

const savedMode =
  localStorage.getItem('finanzas_color_mode');

document.documentElement.classList.toggle(
  'app-dark',
  savedMode === 'dark'
);


/*
 * ============================================================
 * INICIAR ANGULAR
 * ============================================================
 */

bootstrapApplication(AppComponent, {

  providers: [

    MessageService,

    provideAnimationsAsync(),

    provideHttpClient(
      withInterceptors([
        authInterceptor
      ])
    ),

    provideRouter(routes),

    providePrimeNG({
      ripple: true,

      theme: {

        /*
         * PrimeNG ahora arranca directamente con
         * el tema + color guardados.
         */
        preset: initialPreset,

        options: {
          darkModeSelector: '.app-dark'
        }
      }
    })

  ]

}).catch(
  err => console.error(err)
);