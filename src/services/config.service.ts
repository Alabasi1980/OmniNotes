import { Injectable, signal, effect } from '@angular/core';

export interface AppConfig {
  useRealApi: boolean;
  apiBaseUrl: string;
}

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private STORAGE_KEY = 'omni_config';

  // Fix: Set useRealApi to false by default so the app works out-of-the-box (Mock mode).
  // The user can enable Real API in Settings when the backend is ready.
  readonly state = signal<AppConfig>({
    useRealApi: false,
    apiBaseUrl: 'http://localhost:7200'
  });

  constructor() {
    this.load();
    
    effect(() => {
      this.save();
    });
  }

  setConfig(config: Partial<AppConfig>) {
    this.state.update(current => ({ ...current, ...config }));
  }

  private load() {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        this.state.set({
          useRealApi: parsed.hasOwnProperty('useRealApi') ? parsed.useRealApi : false, // Default to false if key missing
          apiBaseUrl: parsed.apiBaseUrl || 'http://localhost:7200'
        });
      } catch (e) {
        console.warn('Invalid config found', e);
      }
    }
  }

  private save() {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.state()));
  }
}