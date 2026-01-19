import { Component, inject, computed, signal, ElementRef, ViewChild, HostListener, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CommandService, Command } from '../services/command.service';
import { TranslationService } from '../services/translation.service';

@Component({
  selector: 'app-ninja-palette',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (cmd.isOpen()) {
      <div class="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 animate-in fade-in duration-200">
        
        <!-- Backdrop -->
        <div (click)="cmd.close()" class="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"></div>

        <!-- Palette Container -->
        <div class="relative w-full max-w-2xl bg-app-surface/95 backdrop-blur-xl border border-app-border rounded-2xl shadow-2xl overflow-hidden transform scale-100 opacity-100 transition-all ring-1 ring-white/10 flex flex-col max-h-[70vh]">
          
          <!-- Search Input -->
          <div class="flex items-center px-4 py-4 border-b border-app-border bg-white/5 relative">
            <svg class="w-6 h-6 text-app-accent animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input 
              #searchInput
              type="text" 
              [placeholder]="t.translate('CMD_PLACEHOLDER')"
              [value]="cmd.query()"
              (input)="onInput($event)"
              (keydown)="onKeyDown($event)"
              class="flex-1 bg-transparent border-none text-xl font-medium text-app-text placeholder-app-muted focus:ring-0 ml-4 rtl:mr-4 rtl:ml-0 outline-none"
              autoFocus
            >
            <div class="hidden sm:flex items-center gap-2 text-xs text-app-muted font-mono bg-app-surface2 px-2 py-1 rounded border border-app-border">
               <span>ESC</span>
            </div>
          </div>

          <!-- Results List -->
          <div class="flex-1 overflow-y-auto p-2 custom-scrollbar scroll-py-2">
            @if (groupedCommands().length === 0) {
              <div class="py-12 text-center text-app-muted">
                 <p class="text-3xl mb-2">🤔</p>
                 <p>{{ t.translate('CMD_NO_RESULTS') }}</p>
              </div>
            } @else {
              @for (group of groupedCommands(); track group.section) {
                 <div class="mb-2">
                    <div class="px-3 py-1 text-xs font-bold text-app-muted uppercase tracking-wider mb-1 sticky top-0 bg-app-surface/95 backdrop-blur z-10">
                      {{ getSectionLabel(group.section) }}
                    </div>
                    @for (item of group.commands; track item.id) {
                      <button 
                        (click)="run(item)"
                        (mouseenter)="selectedIndex.set(getGlobalIndex(item))"
                        [class.bg-app-primary]="selectedIndex() === getGlobalIndex(item)"
                        [class.text-white]="selectedIndex() === getGlobalIndex(item)"
                        [class.bg-transparent]="selectedIndex() !== getGlobalIndex(item)"
                        [class.text-app-text]="selectedIndex() !== getGlobalIndex(item)"
                        class="w-full flex items-center px-3 py-3 rounded-xl transition-all duration-75 group relative overflow-hidden"
                      >
                         <!-- Selection Highlight (Gradient) -->
                         @if(selectedIndex() === getGlobalIndex(item)) {
                            <div class="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent pointer-events-none"></div>
                         }

                         <span class="text-xl mr-3 rtl:ml-3 rtl:mr-0 filter drop-shadow-lg">{{ item.icon }}</span>
                         
                         <div class="flex-1 text-left rtl:text-right overflow-hidden">
                            <div class="font-medium truncate">{{ item.title }}</div>
                            @if (item.subtitle) {
                              <div [class.text-indigo-200]="selectedIndex() === getGlobalIndex(item)" [class.text-app-muted]="selectedIndex() !== getGlobalIndex(item)" class="text-xs truncate opacity-80">
                                {{ item.subtitle }}
                              </div>
                            }
                         </div>

                         @if (item.shortcut) {
                            <span [class.text-white]="selectedIndex() === getGlobalIndex(item)" [class.text-app-muted]="selectedIndex() !== getGlobalIndex(item)" class="text-xs font-mono border border-current rounded px-1.5 py-0.5 opacity-60">
                               {{ item.shortcut }}
                            </span>
                         }

                         @if (selectedIndex() === getGlobalIndex(item)) {
                            <svg class="w-4 h-4 ml-2 rtl:mr-2 rtl:ml-0 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                         }
                      </button>
                    }
                 </div>
              }
            }
          </div>

          <!-- Footer -->
          <div class="px-4 py-2 bg-app-surface2 border-t border-app-border text-xs text-app-muted flex items-center justify-between">
             <span>{{ t.translate('CMD_HINT') }}</span>
             <span class="font-mono opacity-50">Omni-OS v2.0</span>
          </div>

        </div>
      </div>
    }
  `
})
export class NinjaPaletteComponent {
  cmd = inject(CommandService);
  t = inject(TranslationService);
  
  @ViewChild('searchInput') searchInput!: ElementRef;

  selectedIndex = signal(0);
  
  // Flattened list for index calculation
  private flatList = computed(() => this.cmd.filteredCommands());

  groupedCommands = computed(() => {
    const list = this.cmd.filteredCommands();
    const groups: {section: string, commands: Command[]}[] = [];
    
    // Explicit order: Nav > Actions > Notes
    const order = ['nav', 'action', 'note'];
    
    order.forEach(sec => {
       const cmds = list.filter(c => c.section === sec);
       if (cmds.length) groups.push({ section: sec, commands: cmds });
    });

    return groups;
  });

  constructor() {
    // Reset index when query changes
    effect(() => {
       this.cmd.query(); 
       this.selectedIndex.set(0);
    });

    // Auto focus when opened
    effect(() => {
      if (this.cmd.isOpen()) {
        setTimeout(() => this.searchInput?.nativeElement.focus(), 50);
      }
    });
  }

  getSectionLabel(sec: string): string {
    switch(sec) {
      case 'nav': return this.t.translate('CMD_SECTION_NAV');
      case 'action': return this.t.translate('CMD_SECTION_ACTIONS');
      case 'note': return this.t.translate('CMD_SECTION_NOTES');
      default: return sec;
    }
  }

  getGlobalIndex(item: Command): number {
    return this.flatList().indexOf(item);
  }

  onInput(e: Event) {
    this.cmd.setQuery((e.target as HTMLInputElement).value);
  }

  run(cmd: Command) {
    cmd.action();
    this.cmd.close();
  }

  onKeyDown(e: KeyboardEvent) {
    const list = this.flatList();
    if (!list.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.selectedIndex.update(i => (i + 1) % list.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.selectedIndex.update(i => (i - 1 + list.length) % list.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = list[this.selectedIndex()];
      if (item) this.run(item);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      this.cmd.close();
    }
  }
}