import { Injectable } from '@angular/core';
import { definePreset, usePreset } from '@primeng/themes';
import Aura from '@primeng/themes/aura';
import Lara from '@primeng/themes/lara';
import Material from '@primeng/themes/material';
import Nora from '@primeng/themes/nora';

export type AppThemeName = 'Aura' | 'Lara' | 'Material' | 'Nora';
export type AppColorMode = 'light' | 'dark';
export type AppPrimaryColor = 'blue' | 'green' | 'emerald' | 'violet' | 'orange' | 'red' | 'indigo' | 'noir';

type PrimePreset = Record<string, unknown>;

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly themeKey = 'finanzas_theme';
  private readonly modeKey = 'finanzas_color_mode';
  private readonly primaryKey = 'finanzas_primary_color';

  // Keep this explicit type: usePreset() requires Record<string, unknown>.
  private readonly presets: Record<AppThemeName, PrimePreset> = {
    Aura: Aura as PrimePreset,
    Lara: Lara as PrimePreset,
    Material: Material as PrimePreset,
    Nora: Nora as PrimePreset
  };

  readonly themes: AppThemeName[] = ['Aura', 'Lara', 'Material', 'Nora'];
  readonly modes = [
    { label: 'Claro', value: 'light' as AppColorMode },
    { label: 'Oscuro', value: 'dark' as AppColorMode }
  ];
  readonly primaryColors: { label: string; value: AppPrimaryColor }[] = [
    { label: 'Azul', value: 'blue' },
    { label: 'Verde', value: 'green' },
    { label: 'Esmeralda', value: 'emerald' },
    { label: 'Violeta', value: 'violet' },
    { label: 'Naranja', value: 'orange' },
    { label: 'Rojo', value: 'red' },
    { label: 'Índigo', value: 'indigo' },
    { label: 'Noir', value: 'noir' }
  ];

  constructor() { this.restore(); }

  get theme(): AppThemeName {
    const value = localStorage.getItem(this.themeKey) as AppThemeName | null;
    return value && this.presets[value] ? value : 'Aura';
  }

  get mode(): AppColorMode {
    return localStorage.getItem(this.modeKey) === 'dark' ? 'dark' : 'light';
  }

  get primaryColor(): AppPrimaryColor {
    const value = localStorage.getItem(this.primaryKey) as AppPrimaryColor | null;
    return value && this.primaryColors.some(x => x.value === value) ? value : 'blue';
  }

  setTheme(theme: AppThemeName): void {
    if (!this.presets[theme]) return;
    localStorage.setItem(this.themeKey, theme);
    this.applyPreset(theme, this.primaryColor);
  }

  setPrimaryColor(color: AppPrimaryColor): void {
    if (!this.primaryColors.some(x => x.value === color)) return;
    localStorage.setItem(this.primaryKey, color);
    this.applyPreset(this.theme, color);
  }

  setMode(mode: AppColorMode): void {
    document.documentElement.classList.toggle('app-dark', mode === 'dark');
    localStorage.setItem(this.modeKey, mode);
  }

  restore(): void {
    this.applyPreset(this.theme, this.primaryColor);
    document.documentElement.classList.toggle('app-dark', this.mode === 'dark');
  }

  private applyPreset(theme: AppThemeName, color: AppPrimaryColor): void {
    const base = this.presets[theme];
    const preset = definePreset(base, {
      semantic: {
        primary: this.primaryPalette(color)
      }
    }) as PrimePreset;
    usePreset(preset);
  }

  private primaryPalette(color: AppPrimaryColor): Record<string, string> {
    if (color === 'noir') {
      return {
        50: '{zinc.50}', 100: '{zinc.100}', 200: '{zinc.200}', 300: '{zinc.300}',
        400: '{zinc.400}', 500: '{zinc.500}', 600: '{zinc.600}', 700: '{zinc.700}',
        800: '{zinc.800}', 900: '{zinc.900}', 950: '{zinc.950}'
      };
    }
    return {
      50: `{${color}.50}`, 100: `{${color}.100}`, 200: `{${color}.200}`, 300: `{${color}.300}`,
      400: `{${color}.400}`, 500: `{${color}.500}`, 600: `{${color}.600}`, 700: `{${color}.700}`,
      800: `{${color}.800}`, 900: `{${color}.900}`, 950: `{${color}.950}`
    };
  }
}
