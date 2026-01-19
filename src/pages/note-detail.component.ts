import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DbService } from '../services/db.service';
import { TranslationService } from '../services/translation.service';
import { ConfigService } from '../services/config.service';
import { UtilsService } from '../services/utils.service';
import { MarkdownViewComponent } from '../components/markdown-view.component';
import { NoteEditorComponent } from '../components/note-editor.component';
import { Note, NoteType } from '../models';

@Component({
  selector: 'app-note-detail',
  standalone: true,
  imports: [CommonModule, MarkdownViewComponent, NoteEditorComponent],
  template: `
    <div class="pb-20">
      
      <!-- EDIT MODE -->
      @if (isEditing()) {
        <app-note-editor
          [initialNote]="note()"
          [isNew]="isNew()"
          [useRealApi]="config.state().useRealApi"
          (save)="onSave($event)"
          (cancel)="onCancel()">
        </app-note-editor>
      }

      <!-- VIEW MODE -->
      @if (!isEditing() && note(); as currentNote) {
        
        <!-- Toolbar -->
        <div class="glass-panel rounded-xl px-6 py-4 flex items-center justify-between mb-8 sticky top-2 z-30 shadow-sm">
           <div class="flex items-center space-x-4 rtl:space-x-reverse">
              <button (click)="goBack()" class="p-2 hover:bg-app-surface2 rounded-full text-app-muted hover:text-app-text transition-colors transform rtl:rotate-180">
                 <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                 </svg>
              </button>
              <div class="text-sm text-app-muted font-mono">
                 {{ t.translate('LAST_EDITED') }} {{ formatDate(currentNote.updatedAt) }}
              </div>
           </div>
           
           <button (click)="toggleEdit()" class="px-5 py-2 bg-app-primary hover:bg-app-accent text-white rounded-lg text-sm font-medium shadow transition-all">
              {{ t.translate('EDIT') }}
           </button>
        </div>

        <article class="glass-panel rounded-2xl overflow-hidden relative">
           <!-- Decorative Top Border -->
           <div class="h-1 w-full bg-gradient-to-r from-app-accent via-app-primary to-pink-500"></div>

           <!-- Header -->
           <div class="p-8 md:p-10 border-b border-app-border bg-app-surface2/30">
              <div class="flex items-center gap-3 mb-6">
                 <span class="px-3 py-1 rounded text-xs font-bold uppercase tracking-wider bg-app-surface text-app-accent border border-app-border">
                    {{ t.getNoteTypeName(currentNote.type) }}
                 </span>
                 @if (currentNote.isArchived) {
                    <span class="px-3 py-1 rounded text-xs font-bold uppercase tracking-wider bg-pink-500/10 border border-pink-500/30 text-pink-400">
                      {{ t.translate('ARCHIVED_LABEL') }}
                    </span>
                 }
                 @if (catalogName()) {
                   <span class="text-app-muted">/</span>
                   <span class="text-sm text-app-muted font-medium hover:text-app-text transition-colors cursor-pointer">{{ catalogName() }}</span> 
                 }
              </div>
              
              <h1 class="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-app-text to-app-muted mb-6 leading-tight">{{ currentNote.title }}</h1>
              
              <div class="flex flex-wrap gap-2">
                 @for (tag of currentNote.tags; track tag) {
                    <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-app-primary/10 text-app-primary border border-app-primary/20">
                       #{{ tag }}
                    </span>
                 }
              </div>
           </div>

           <!-- Content Body -->
           <div class="p-8 md:p-10">
              <!-- Link/Video URL Highlight -->
              @if (currentNote.metadata['url']) {
                 <div class="mb-10 p-5 bg-blue-500/5 border border-blue-500/20 rounded-xl flex items-start relative overflow-hidden group">
                    <svg class="h-6 w-6 text-blue-400 mr-4 rtl:ml-4 rtl:mr-0 mt-0.5 z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    <div class="flex-1 overflow-hidden z-10">
                       <h3 class="text-sm font-bold text-blue-400 mb-1 uppercase tracking-wide">{{ t.translate('REFERENCED_LINK') }}</h3>
                       <a [href]="currentNote.metadata['url']" target="_blank" class="text-blue-500 hover:text-blue-400 hover:underline truncate block text-base">{{ currentNote.metadata['url'] }}</a>
                    </div>
                 </div>
              }

              <!-- Main Content -->
              <div class="prose prose-lg max-w-none">
                 <app-markdown-view [content]="currentNote.content"></app-markdown-view>
              </div>

              <!-- Problem/Solution specific -->
              @if (currentNote.type === 'problem' && currentNote.metadata['solution']) {
                 <div class="mt-16 pt-10 border-t border-app-border">
                    <h2 class="text-2xl font-bold text-green-500 mb-6 flex items-center">
                       <div class="p-2 rounded-lg bg-green-500/10 mr-3 rtl:ml-3 rtl:mr-0">
                         <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                         </svg>
                       </div>
                       {{ t.translate('SOLUTION_LABEL') }}
                    </h2>
                    <div class="bg-green-500/5 rounded-2xl p-8 border border-green-500/20">
                       <app-markdown-view [content]="currentNote.metadata['solution']"></app-markdown-view>
                    </div>
                 </div>
              }

              <!-- Attachments Gallery -->
              @if (currentNote.attachments.length > 0) {
                 <div class="mt-16 pt-10 border-t border-app-border">
                    <h3 class="text-xl font-bold text-app-text mb-6 flex items-center gap-2">
                       <span class="text-2xl">📎</span> {{ t.translate('ATTACHMENTS') }}
                    </h3>
                    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                       @for (att of currentNote.attachments; track att.id) {
                          <div class="group relative aspect-square bg-app-surface2 rounded-xl overflow-hidden border border-app-border hover:border-app-accent transition-all">
                             @if (att.type.startsWith('image/')) {
                                <img [src]="utils.resolveUrl(att.data)" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" [alt]="att.name">
                             } @else {
                                <div class="w-full h-full flex flex-col items-center justify-center p-4 text-center">
                                   <svg class="h-12 w-12 text-app-muted group-hover:text-app-text transition-colors mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 012.586 2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                   </svg>
                                   <span class="text-xs font-medium text-app-muted truncate w-full px-2">{{ att.name }}</span>
                                </div>
                             }
                             <!-- Download Overlay -->
                             <a [href]="utils.resolveUrl(att.data)" [download]="att.name" target="_blank" class="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                                <div class="bg-white/20 p-3 rounded-full hover:bg-white/40 transition-colors">
                                  <svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                  </svg>
                                </div>
                             </a>
                          </div>
                       }
                    </div>
                 </div>
              }
           </div>
        </article>

        <!-- Archive/Delete Actions -->
        <div class="mt-8 flex justify-end gap-6 items-center">
           <button (click)="toggleArchive()" class="text-app-muted hover:text-pink-400 text-sm font-medium flex items-center transition-colors">
              <svg class="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
              {{ currentNote.isArchived ? t.translate('UNARCHIVE_NOTE') : t.translate('ARCHIVE_NOTE') }}
           </button>

           <div class="h-4 w-px bg-app-border"></div>

           <button (click)="deleteNote()" class="text-red-500 hover:text-red-400 text-sm font-medium flex items-center transition-colors">
              <svg class="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              {{ t.translate('DELETE_NOTE') }}
           </button>
        </div>
      }
    </div>
  `
})
export class NoteDetailComponent {
  private route: ActivatedRoute = inject(ActivatedRoute);
  private router: Router = inject(Router);
  private db: DbService = inject(DbService);
  config: ConfigService = inject(ConfigService);
  t: TranslationService = inject(TranslationService);
  utils: UtilsService = inject(UtilsService);

  noteId = signal<string | null>(null);
  note = signal<Note | undefined>(undefined);
  isEditing = signal(false);
  isNew = signal(false);

  catalogName = computed(() => {
    const n = this.note();
    if (!n?.catalogId) return null;
    const cat = this.db.catalogs().find(c => c.id === n.catalogId);
    return cat?.name;
  });

  constructor() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.noteId.set(id);
        const cachedNote = this.db.getNote(id);
        if (cachedNote) {
          this.note.set(cachedNote);
          this.isNew.set(false);
          this.isEditing.set(false);
        } else {
          this.db.fetchNoteById(id).subscribe({
            next: (fetchedNote) => {
              this.note.set(fetchedNote);
              this.isNew.set(false);
              this.isEditing.set(false);
            },
            error: () => this.router.navigate(['/'])
          });
        }
      } else if (this.route.snapshot.url[0]?.path === 'new') {
        this.isNew.set(true);
        this.isEditing.set(true);
        this.noteId.set(null);
      }
    });
  }

  toggleEdit() {
    this.isEditing.set(true);
  }

  onCancel() {
    if (this.isNew()) {
      this.router.navigate(['/']);
    } else {
      this.isEditing.set(false);
      if (this.noteId()) {
         this.db.fetchNoteById(this.noteId()!).subscribe(n => this.note.set(n));
      }
    }
  }

  onSave(formData: any) {
    const cats = this.db.catalogs();
    let catalogId = formData.catalogId;
    
    if (!catalogId && this.note()) catalogId = this.note()!.catalogId;
    if (!catalogId) {
        const filter = this.db.filterSignal();
        if (filter.catalogId && filter.catalogId !== 'all') catalogId = filter.catalogId;
        else if (cats.length > 0) catalogId = cats[0].id;
    }

    if (!catalogId) {
       alert(this.t.translate('NO_CATALOGS_ERROR'));
       return;
    }

    const noteData = { ...formData, catalogId: catalogId };

    let obs$;
    if (this.isNew()) {
      obs$ = this.db.addNote({ ...noteData, isArchived: false });
    } else {
      obs$ = this.db.updateNote(this.noteId()!, noteData);
    }

    obs$.subscribe({
      next: (savedNote) => {
        if(this.isNew()) {
           this.router.navigate(['/note', savedNote.id], { replaceUrl: true });
           this.noteId.set(savedNote.id);
           this.note.set(savedNote);
           this.isNew.set(false);
           this.isEditing.set(true); 
        } else {
           this.isEditing.set(false);
           this.note.set(savedNote);
        }
      },
      error: (err) => {
        console.error('Save failed', err);
        alert('Failed to save note.');
      }
    });
  }

  toggleArchive() {
    const current = this.note();
    if (!current) return;
    const updates = { ...current, isArchived: !current.isArchived };
    this.db.updateNote(current.id, updates).subscribe({
      next: (updated) => this.note.set(updated),
      error: () => alert('Failed to update status.')
    });
  }

  deleteNote() {
    if (confirm(this.t.translate('CONFIRM_DELETE'))) {
      this.db.deleteNote(this.noteId()!).subscribe({
        next: () => this.router.navigate(['/']),
        error: () => alert('Failed to delete.')
      });
    }
  }

  goBack() {
    this.router.navigate(['/']);
  }

  formatDate(date?: string) {
    if (!date) return '';
    return new Date(date).toLocaleString(this.t.currentLang() === 'ar' ? 'ar-EG' : 'en-US');
  }
}
