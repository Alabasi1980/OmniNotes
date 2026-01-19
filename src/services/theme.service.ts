import { Injectable, signal, effect } from '@angular/core';

export type Theme = 'cosmic' | 'zen';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private STORAGE_KEY = 'omni_theme';
  
  // Default to cosmic
  currentTheme = signal<Theme>('cosmic');

  constructor() {
    // Load from storage
    const stored = localStorage.getItem(this.STORAGE_KEY) as Theme;
    if (stored && ['cosmic', 'zen'].includes(stored)) {
      this.currentTheme.set(stored);
    } else {
      // Fallback if stored theme was 'fantasy' which is now removed
      this.currentTheme.set('cosmic');
    }

    // Apply class to body whenever signal changes
    effect(() => {
      const theme = this.currentTheme();
      // Remove all theme classes first
      document.body.classList.remove('theme-cosmic', 'theme-zen', 'theme-fantasy');
      // Add current theme class
      document.body.classList.add(`theme-${theme}`);
      localStorage.setItem(this.STORAGE_KEY, theme);
    });
  }

  setTheme(theme: Theme) {
    this.currentTheme.set(theme);
  }

  toggle() {
    this.currentTheme.update(current => {
      if (current === 'cosmic') return 'zen';
      return 'cosmic';
    });
  }
}