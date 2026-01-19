import { Component, inject, computed, signal, HostListener } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslationService } from './services/translation.service';
import { ThemeService } from './services/theme.service';
import { CommandService } from './services/command.service';
import { NinjaPaletteComponent } from './components/ninja-palette.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, NinjaPaletteComponent],
  template: `
    <app-ninja-palette></app-ninja-palette>

    <div class="flex flex-col h-screen overflow-hidden text-app-text selection:bg-app-accent selection:text-white" [dir]="t.dir()">
      
      <!-- New Collapsible Header -->
      <header class="relative flex-shrink-0 glass-panel border-b border-app-border z-40">
        <div class="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8 max-w-screen-2xl mx-auto">
          
          <!-- Left: Logo & App Name -->
          <div class="flex items-center gap-3 cursor-pointer" (click)="cmd.open()">
            <div class="relative group">
              @if (theme.currentTheme() === 'cosmic') {
                <div class="absolute -inset-1 bg-gradient-to-r from-pink-600 to-purple-600 rounded-xl blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
              }
              <div class="relative h-9 w-9 bg-app-surface2 rounded-lg flex items-center justify-center border border-app-border text-app-text">
                <span class="text-lg">{{ themeIcon() }}</span>
              </div>
            </div>
            <div>
              <h1 class="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-app-text to-app-muted tracking-tight font-display">OmniNotes</h1>
            </div>
          </div>

          <!-- Center: Desktop Navigation -->
          <nav class="hidden md:flex items-center gap-1 bg-app-surface2/50 p-1 rounded-full border border-app-border">
            <a routerLink="/" routerLinkActive="bg-app-surface text-app-text shadow-sm" [routerLinkActiveOptions]="{exact: true}" 
               class="px-4 py-1.5 text-sm font-medium text-app-muted rounded-full hover:text-app-text transition-colors">
               {{ t.translate('ALL_NOTES') }}
            </a>
            <a routerLink="/catalogs" routerLinkActive="bg-app-surface text-app-text shadow-sm"
               class="px-4 py-1.5 text-sm font-medium text-app-muted rounded-full hover:text-app-text transition-colors">
               {{ t.translate('CATALOGS') }}
            </a>
            <a routerLink="/settings" routerLinkActive="bg-app-surface text-app-text shadow-sm"
               class="px-4 py-1.5 text-sm font-medium text-app-muted rounded-full hover:text-app-text transition-colors">
               {{ t.translate('SETTINGS') }}
            </a>
          </nav>

          <!-- Right: Actions -->
          <div class="flex items-center gap-2">
            <a routerLink="/new"
               class="hidden sm:flex items-center gap-2 px-4 py-2 bg-app-primary hover:bg-app-accent text-white rounded-full text-sm font-bold shadow-lg shadow-app-primary/20 transition-all hover:scale-105">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
              <span class="hidden lg:inline">{{ t.translate('NEW_ENTRY') }}</span>
            </a>
            
            <button (click)="cmd.open()" class="hidden md:flex items-center justify-center w-9 h-9 rounded-full text-app-muted hover:bg-app-surface2 hover:text-app-text transition-colors" [title]="t.translate('FOCUS_MODE') + ' (Ctrl+K)'">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </button>

            <button (click)="theme.toggle()" class="flex items-center justify-center w-9 h-9 rounded-full text-app-muted hover:bg-app-surface2 hover:text-app-text transition-colors">
              <span class="text-xl">{{ themeIcon() }}</span>
            </button>

            <!-- Mobile Hamburger Menu Button -->
            <button (click)="isMobileMenuOpen.set(!isMobileMenuOpen())" class="md:hidden p-2 rounded-lg text-app-muted hover:bg-app-surface2">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m4 6h-16" /></svg>
            </button>
          </div>
        </div>
        
        <!-- Mobile Menu Panel -->
        @if(isMobileMenuOpen()) {
          <div class="md:hidden absolute top-16 left-0 right-0 glass-panel border-b border-app-border animate-in fade-in slide-in-from-top-4 duration-300">
            <nav class="flex flex-col p-4 space-y-2">
              <a (click)="closeMobileMenu()" routerLink="/" routerLinkActive="bg-app-surface2 text-app-text" [routerLinkActiveOptions]="{exact: true}" 
                 class="flex items-center px-4 py-3 text-base font-medium text-app-muted rounded-xl">
                 {{ t.translate('ALL_NOTES') }}
              </a>
              <a (click)="closeMobileMenu()" routerLink="/new" routerLinkActive="bg-app-surface2 text-app-text"
                 class="flex items-center px-4 py-3 text-base font-medium text-app-muted rounded-xl">
                 {{ t.translate('NEW_ENTRY') }}
              </a>
              <a (click)="closeMobileMenu()" routerLink="/catalogs" routerLinkActive="bg-app-surface2 text-app-text"
                 class="flex items-center px-4 py-3 text-base font-medium text-app-muted rounded-xl">
                 {{ t.translate('CATALOGS') }}
              </a>
              <a (click)="closeMobileMenu()" routerLink="/settings" routerLinkActive="bg-app-surface2 text-app-text"
                 class="flex items-center px-4 py-3 text-base font-medium text-app-muted rounded-xl">
                 {{ t.translate('SETTINGS') }}
              </a>
              <div class="h-px bg-app-border my-2"></div>
              <button (click)="t.toggle(); closeMobileMenu()" class="w-full flex items-center px-4 py-3 text-base font-medium rounded-xl text-app-muted hover:bg-app-surface2">
                 <span class="mr-3 rtl:ml-3 rtl:mr-0 text-lg">🌍</span>
                 <span>{{ t.translate('LANG_SWITCH') }}</span>
               </button>
            </nav>
          </div>
        }
      </header>

      <!-- Main Content -->
      <main class="flex-1 overflow-y-auto bg-app-bg">
        <div class="max-w-screen-2xl mx-auto py-6 px-4 sm:px-6 lg:px-8 h-full">
          <router-outlet></router-outlet>
        </div>
      </main>
    </div>
  `
})
export class AppComponent {
  t = inject(TranslationService);
  theme = inject(ThemeService);
  cmd = inject(CommandService);

  isMobileMenuOpen = signal(false);

  closeMobileMenu() {
    this.isMobileMenuOpen.set(false);
  }

  themeIcon = computed(() => {
    switch(this.theme.currentTheme()) {
      case 'cosmic': return '🔮';
      case 'zen': return '🧘';
      default: return '🔮';
    }
  });

  themeLabel = computed(() => {
    switch(this.theme.currentTheme()) {
      case 'cosmic': return 'Cosmic';
      case 'zen': return 'Zen';
      default: return 'Theme';
    }
  });

  @HostListener('window:keydown.control.k', ['$event'])
  @HostListener('window:keydown.meta.k', ['$event'])
  onCtrlK(event: KeyboardEvent) {
    event.preventDefault();
    this.cmd.toggle();
  }
}
