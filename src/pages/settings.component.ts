import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ConfigService, AppConfig } from '../services/config.service';
import { TranslationService } from '../services/translation.service';
import { DbService } from '../services/db.service';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6 pb-20">
      
      <!-- Header -->
      <div class="glass-panel rounded-2xl p-6 mb-6">
        <h2 class="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-cyan-300">{{ t.translate('SETTINGS') }}</h2>
      </div>

      <!-- Database Config -->
      <div class="glass-panel rounded-2xl p-8 border border-white/10">
        <div class="flex items-start gap-6">
          <div class="bg-indigo-900/40 p-4 rounded-2xl border border-indigo-500/30 text-indigo-300">
            <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
            </svg>
          </div>
          <div class="flex-1">
            <h3 class="text-xl font-bold text-white">{{ t.translate('DB_CONFIG') }}</h3>
            <p class="text-sm text-slate-400 mt-2 leading-relaxed">{{ t.translate('DB_CONFIG_DESC') }}</p>
            
            <div class="mt-8 space-y-8">
              
              <!-- Toggle -->
              <div class="flex items-center bg-black/20 p-4 rounded-xl border border-white/5">
                <button 
                  (click)="toggleRealApi()" 
                  [class.bg-indigo-500]="form.useRealApi" 
                  [class.bg-slate-700]="!form.useRealApi"
                  class="relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                  <span 
                    [class.translate-x-5]="form.useRealApi" 
                    [class.rtl:-translate-x-5]="form.useRealApi" 
                    [class.translate-x-0]="!form.useRealApi"
                    class="pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200"></span>
                </button>
                <span class="ml-4 rtl:mr-4 text-base font-medium text-slate-200">{{ t.translate('ENABLE_REAL_API') }}</span>
              </div>

              <!-- Real API Settings Section -->
              <div [class.opacity-50]="!form.useRealApi" [class.pointer-events-none]="!form.useRealApi" class="space-y-6 transition-opacity">
                
                <!-- API URL Input -->
                <div>
                  <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{{ t.translate('API_URL') }}</label>
                  <div class="relative rounded-xl shadow-sm">
                     <div class="absolute inset-y-0 left-0 rtl:right-0 pl-3 rtl:pr-3 flex items-center pointer-events-none">
                       <span class="text-slate-500 text-lg">🔗</span>
                     </div>
                     <input 
                       type="url" 
                       [(ngModel)]="form.apiBaseUrl"
                       class="block w-full pl-10 rtl:pr-10 rounded-xl border-white/10 bg-black/20 text-white focus:border-indigo-500 focus:ring-indigo-500 py-3" 
                       placeholder="https://localhost:7200">
                  </div>
                </div>

                <!-- Test Connection -->
                <div class="flex items-center gap-4 mt-4">
                   <button 
                     type="button" 
                     (click)="testConnection()" 
                     [disabled]="testing()"
                     class="inline-flex items-center px-5 py-2 border border-white/20 shadow-sm text-sm font-bold rounded-xl text-slate-200 bg-white/5 hover:bg-white/10 focus:outline-none transition-all">
                     @if(testing()) {
                        <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        {{ t.translate('TESTING') }}
                     } @else {
                        {{ t.translate('TEST_CONNECTION') }}
                     }
                   </button>
                   
                   @if (testStatus() === 'success') {
                      <span class="text-sm text-green-400 font-bold flex items-center bg-green-900/30 px-3 py-1 rounded-full border border-green-500/20">
                         <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>
                         {{ t.translate('CONN_SUCCESS') }}
                      </span>
                   } @else if (testStatus() === 'error') {
                      <span class="text-sm text-red-400 font-bold flex items-center bg-red-900/30 px-3 py-1 rounded-full border border-red-500/20">
                         <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path></svg>
                         {{ t.translate('CONN_FAILED') }}
                      </span>
                   }
                </div>

              </div>

            </div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex justify-end pt-4">
        <button 
          (click)="save()" 
          class="inline-flex items-center px-8 py-3 border border-transparent text-base font-bold rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.5)] text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all hover:scale-105">
          {{ t.translate('SAVE_SETTINGS') }}
        </button>
      </div>

    </div>
  `
})
export class SettingsComponent {
  config = inject(ConfigService);
  db = inject(DbService);
  t = inject(TranslationService);
  http: HttpClient = inject(HttpClient); 

  form: AppConfig;
  
  testing = signal(false);
  testStatus = signal<'none' | 'success' | 'error'>('none');

  constructor() {
    const current = this.config.state();
    this.form = JSON.parse(JSON.stringify(current)); 
  }

  toggleRealApi() {
    this.form.useRealApi = !this.form.useRealApi;
  }

  testConnection() {
    if (!this.form.apiBaseUrl) return;
    
    this.testing.set(true);
    this.testStatus.set('none');

    this.http.get(`${this.form.apiBaseUrl}/api/notes`).pipe(
      catchError((err: any) => {
         if (err.status > 0) return of([]); 
         throw err;
      })
    ).subscribe({
      next: () => {
         this.testing.set(false);
         this.testStatus.set('success');
      },
      error: () => {
         this.testing.set(false);
         this.testStatus.set('error');
      }
    });
  }

  save() {
    this.config.setConfig(this.form);
    this.db.refreshData();
    alert(this.t.translate('SETTINGS_SAVED'));
  }
}
