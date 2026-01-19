import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DbService } from '../services/db.service';
import { TranslationService } from '../services/translation.service';
import { NoteType, Note } from '../models';
import { MarkdownViewComponent } from '../components/markdown-view.component';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-note-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, MarkdownViewComponent],
  template: `
    <div class="flex flex-col h-full">
      
      <!-- 1. REFORMATTED HEADER SECTION -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
        <div>
          <h1 class="text-3xl font-bold text-app-text">Your Notes</h1>
          <p class="text-app-muted mt-1">
            {{ activeCount() }} active notes, {{ problemCount() }} problems solved.
          </p>
        </div>

        <!-- Search HUD -->
        <div class="w-full md:w-96 group">
           <div class="relative transition-all duration-300 transform group-focus-within:scale-105 group-focus-within:-translate-y-1">
              <div class="absolute inset-0 bg-gradient-to-r from-app-primary to-app-accent rounded-2xl blur opacity-20 group-focus-within:opacity-40 transition-opacity"></div>
              <div class="relative bg-app-surface/80 backdrop-blur-xl rounded-2xl flex items-center border border-app-border group-focus-within:border-app-accent shadow-xl overflow-hidden">
                 <div class="pl-4 rtl:pr-4 text-app-muted group-focus-within:text-app-accent transition-colors">
                    <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                 </div>
                 <input 
                    type="text" 
                    [ngModel]="filter().query"
                    (input)="onSearch($event)"
                    class="block w-full px-4 py-4 bg-transparent border-none text-lg text-app-text placeholder-app-muted/50 focus:ring-0 font-medium" 
                    [placeholder]="t.translate('SEARCH_PLACEHOLDER')" 
                 />
                 <!-- Type Selector inside Search -->
                 <div class="pr-2 rtl:pl-2">
                    <select 
                       [ngModel]="filter().type"
                       (ngModelChange)="onTypeChange($event)"
                       class="bg-app-surface2/50 border-none text-xs font-bold text-app-muted rounded-lg focus:ring-0 cursor-pointer hover:bg-app-surface2 hover:text-app-text transition-colors py-1.5"
                    >
                       <option value="all">ALL</option>
                       <option value="general">NOTE</option>
                       <option value="problem">BUG</option>
                       <option value="lesson">LEARN</option>
                       <option value="link">LINK</option>
                    </select>
                 </div>
              </div>
           </div>
        </div>
      </div>

      <!-- 2. HIGH-TECH FILTER BAR -->
      <div class="flex items-center gap-4 mb-8 overflow-x-auto pb-4 custom-scrollbar px-1 no-scrollbar mask-gradient">
          <button 
             (click)="toggleArchive()" 
             class="flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 border flex items-center gap-2"
             [class]="filter().isArchived ? 'bg-pink-500/20 border-pink-500 text-pink-400 shadow-[0_0_15px_rgba(236,72,153,0.3)]' : 'bg-app-surface border-app-border text-app-muted hover:bg-app-surface2'"
          >
             <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
             {{ filter().isArchived ? t.translate('ARCHIVED_LABEL') : t.translate('ACTIVE_LABEL') }}
          </button>

          <div class="h-8 w-px bg-app-border flex-shrink-0"></div>

          <!-- Tags Stream -->
          <div class="flex items-center gap-2">
             <button 
               (click)="toggleTag(null)"
               class="flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 border"
               [class]="!filter().tag ? 'bg-white text-black border-white shadow-lg scale-105' : 'bg-app-surface border-app-border text-app-muted hover:border-app-text hover:text-app-text'"
             >
               All Tags
             </button>
             
             @for (tag of allTags(); track tag) {
               <button 
                 (click)="toggleTag(tag)"
                 class="flex-shrink-0 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-300 border"
                 [class]="filter().tag === tag ? 'bg-app-primary/20 border-app-primary text-app-primary shadow-[0_0_10px_rgba(99,102,241,0.3)]' : 'bg-app-surface border-app-border text-app-muted hover:bg-app-surface2'"
               >
                 #{{ tag }}
               </button>
             }
          </div>
      </div>

      <!-- 3. MASONRY GRID LAYOUT -->
      <div class="columns-1 md:columns-2 xl:columns-3 gap-6 space-y-6">
        
        <!-- Create New Card (Always First) -->
        <div class="break-inside-avoid relative group cursor-pointer" (click)="createNew()">
           <div class="absolute -inset-0.5 bg-gradient-to-r from-app-primary to-app-accent rounded-2xl opacity-20 group-hover:opacity-100 blur transition duration-500"></div>
           <div class="relative h-32 flex flex-col items-center justify-center bg-app-surface rounded-xl border border-app-border hover:bg-app-surface2 transition-all">
              <div class="w-12 h-12 rounded-full bg-gradient-to-tr from-app-primary to-app-accent flex items-center justify-center text-white mb-2 shadow-lg group-hover:scale-110 transition-transform">
                 <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
              </div>
              <span class="font-bold text-app-text">{{ t.translate('NEW_ENTRY') }}</span>
           </div>
        </div>

        @for (note of notes(); track note.id) {
          <div class="break-inside-avoid group relative perspective-1000">
             
             <!-- Card Container -->
             <div class="relative bg-app-surface/60 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-app-primary/10 transition-all duration-300 hover:-translate-y-1">
                
                <!-- Dynamic Glow Border based on Type -->
                <div [class]="'absolute top-0 left-0 w-1 h-full opacity-60 ' + getTypeBorderColor(note.type)"></div>

                <!-- Card Actions HUD (Reveals on Hover) -->
                <div class="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0 z-20">
                   <button (click)="openNote(note.id)" class="p-2 bg-app-surface rounded-lg border border-app-border text-app-text hover:bg-app-primary hover:text-white shadow-lg transition-colors" title="Edit">
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                   </button>
                   <button (click)="toggleArchiveStatus($event, note)" class="p-2 bg-app-surface rounded-lg border border-app-border text-app-text hover:bg-pink-500 hover:text-white shadow-lg transition-colors" title="Archive">
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                   </button>
                </div>

                <!-- Card Content Link -->
                <a [routerLink]="['/note', note.id]" class="block p-6">
                   
                   <!-- Metadata Header -->
                   <div class="flex items-center gap-2 mb-3">
                      <span class="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white/5 text-app-muted border border-white/5">
                        {{ t.getNoteTypeName(note.type) }}
                      </span>
                      <span class="text-[10px] text-app-muted font-mono ml-auto">
                        {{ getTimeAgo(note.updatedAt) }}
                      </span>
                   </div>

                   <!-- Title -->
                   <h3 class="text-xl font-bold text-app-text mb-3 leading-snug group-hover:text-app-primary transition-colors">
                      {{ note.title }}
                   </h3>

                   <!-- Content Preview -->
                   <div class="text-sm text-app-muted/80 line-clamp-6 mb-4 font-normal leading-relaxed markdown-preview">
                      <app-markdown-view [content]="getPreview(note)"></app-markdown-view>
                   </div>
                   
                   <!-- Footer Info -->
                   <div class="flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
                      <!-- Tags -->
                      <div class="flex gap-1 overflow-hidden">
                         @for (tag of note.tags.slice(0, 3); track tag) {
                            <span class="text-[10px] text-app-muted bg-app-surface2 px-1.5 py-0.5 rounded">#{{tag}}</span>
                         }
                         @if(note.tags.length > 3) { <span class="text-[10px] text-app-muted">+{{note.tags.length - 3}}</span> }
                      </div>

                      <!-- Attachments Indicator -->
                      @if (note.attachments.length > 0) {
                         <div class="flex items-center text-xs text-app-text font-medium bg-white/5 px-2 py-1 rounded-full">
                            <svg class="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                            {{ note.attachments.length }}
                         </div>
                      }
                   </div>
                </a>

             </div>
          </div>
        }
        @empty {
          <!-- Empty State -->
          <div class="col-span-full py-20 text-center break-inside-avoid">
             <div class="inline-block relative">
                <div class="absolute inset-0 bg-app-primary blur-2xl opacity-20 animate-pulse"></div>
                <div class="relative text-6xl mb-4">🛸</div>
             </div>
             <h3 class="text-2xl font-bold text-app-text mb-2">{{ t.translate('NO_NOTES_FOUND') }}</h3>
             <p class="text-app-muted mb-6">The galaxy is empty here. Start a new mission.</p>
          </div>
        }
      </div>
    </div>
  `
})
export class NoteListComponent {
  private db = inject(DbService);
  private router = inject(Router);
  t = inject(TranslationService);
  
  // Signals
  filter = this.db.filterSignal;
  notes = this.db.notes; 

  // Stats for Header
  activeCount = computed(() => this.notes().filter(n => !n.isArchived).length);
  problemCount = computed(() => this.notes().filter(n => n.type === 'problem' && n.metadata['solution']).length);

  // Search Debounce
  private searchSubject = new Subject<string>();

  allTags = computed(() => {
    const tags = new Set<string>();
    this.notes().forEach(n => n.tags.forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  });

  constructor() {
    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(query => {
      this.db.setFilter({ query });
    });
  }

  onSearch(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.searchSubject.next(val);
  }

  onTypeChange(newType: string) {
    this.db.setFilter({ type: newType as NoteType | 'all' });
  }

  toggleArchive() {
    this.db.setFilter({ isArchived: !this.filter().isArchived });
  }

  toggleArchiveStatus(event: Event, note: Note) {
    event.stopPropagation();
    event.preventDefault();
    this.db.updateNote(note.id, { isArchived: !note.isArchived }).subscribe();
  }

  toggleTag(tag: string | null) {
    if (this.filter().tag === tag) {
      this.db.setFilter({ tag: null });
    } else {
      this.db.setFilter({ tag });
    }
  }

  createNew() {
    this.router.navigate(['/new']);
  }

  openNote(id: string) {
    this.router.navigate(['/note', id]);
  }

  getTypeBorderColor(type: NoteType): string {
    switch (type) {
      case 'problem': return 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]';
      case 'lesson': return 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]';
      case 'link': return 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]';
      case 'video': return 'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]';
      default: return 'bg-app-text shadow-[0_0_10px_rgba(255,255,255,0.2)]';
    }
  }

  getTimeAgo(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  }

  getPreview(note: Note): string {
    // Return shortened content for preview
    return note.content.substring(0, 300);
  }
}
