import { Component, inject, input, output, signal, effect, computed, ViewChild, ElementRef, AfterViewInit, OnDestroy, NgZone } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Note, NoteType } from '../models';
import { TranslationService } from '../services/translation.service';
import { MarkdownViewComponent } from './markdown-view.component';

import { LinkVideoFormComponent } from './note-editor-partials/link-video-form.component';
import { ProblemFormComponent } from './note-editor-partials/problem-form.component';
import { ProblemSolutionComponent } from './note-editor-partials/problem-solution.component';
import { MeetingFormComponent } from './note-editor-partials/meeting-form.component';
import { LessonFormComponent } from './note-editor-partials/lesson-form.component';
import { GeneralNoteToolbarComponent } from './note-editor-partials/general-note-toolbar.component';

declare const EasyMDE: any;

@Component({
  selector: 'app-note-canvas',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MarkdownViewComponent,
    LinkVideoFormComponent,
    ProblemFormComponent,
    ProblemSolutionComponent,
    MeetingFormComponent,
    LessonFormComponent,
    GeneralNoteToolbarComponent
  ],
  providers: [DatePipe],
  template: `
    <div 
      [style.box-shadow]="dynamicGlow()"
      [style.border-color]="dynamicBorder()"
      [class.animate-pulse-slow]="priority() === 'high' && type() === 'general'"
      class="flex-1 flex flex-col h-full min-w-0 bg-app-surface/50 rounded-3xl border border-app-border backdrop-blur-sm overflow-hidden relative transition-all duration-500 group"
    >
        <div [style.background]="themeColor()" class="absolute top-0 left-0 w-full h-1 opacity-60 z-30 transition-colors duration-500"></div>
        
        <div class="h-16 flex items-center justify-between px-6 border-b border-app-border bg-app-surface2/80 backdrop-blur-md z-20">
            <div class="flex items-center gap-2">
            <button type="button" (click)="toggleSidebar.emit()" class="md:hidden p-2 rounded-lg hover:bg-white/10 text-app-muted">
                <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            
            <div class="flex bg-black/20 rounded-lg p-1 border border-white/5">
                <button type="button" (click)="viewModeChange.emit('edit')" [class.bg-app-surface]="viewMode() === 'edit'" [class.text-white]="viewMode() === 'edit'" class="px-3 py-1 text-xs font-bold rounded-md transition-all text-app-muted hover:text-white">Edit</button>
                <button type="button" (click)="viewModeChange.emit('split')" [class.bg-app-surface]="viewMode() === 'split'" [class.text-white]="viewMode() === 'split'" class="px-3 py-1 text-xs font-bold rounded-md transition-all text-app-muted hover:text-white hidden lg:block">Split</button>
                <button type="button" (click)="togglePreview()" [class.bg-app-surface]="viewMode() === 'preview'" [class.text-white]="viewMode() === 'preview'" class="px-3 py-1 text-xs font-bold rounded-md transition-all text-app-muted hover:text-white">Preview</button>
            </div>
            </div>

            <div class="flex items-center gap-3">
                <span class="text-xs font-mono text-app-muted transition-opacity duration-300 flex items-center gap-1" [class.opacity-0]="!isSaving()" [class.opacity-100]="isSaving()">
                <span class="w-2 h-2 rounded-full bg-green-500 animate-ping"></span>
                {{ t.translate('SAVING') }}
                </span>
                <button type="button" (click)="toggleSidebar.emit()" class="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 text-xs font-medium text-app-muted transition-colors" [title]="t.translate('FOCUS_MODE')">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                </button>
            </div>
        </div>

        <div class="flex-1 flex flex-col relative overflow-hidden">
            
            <input type="file" #hiddenImageInput hidden accept="image/*" (change)="onHiddenImageSelected($event)">

            <div class="px-8 pt-8 pb-2 shrink-0">
              <input 
                  formControlName="title" 
                  type="text" 
                  class="w-full bg-transparent border-none text-4xl md:text-5xl font-bold text-app-text placeholder-app-muted/30 focus:ring-0 p-0 leading-tight font-display" 
                  [placeholder]="t.translate('TITLE_PLACEHOLDER')"
              >
            </div>

            <div class="px-8 pb-6 shrink-0 min-h-[3rem] animate-in fade-in slide-in-from-top-4 duration-300">
            @switch(type()) {
                @case('link') @case('video') {
                <app-link-video-form 
                    [form]="form()" 
                    [themeColor]="themeColor()" 
                    [youtubeEmbedUrl]="youtubeEmbedUrl()"
                ></app-link-video-form>
                }
                @case('problem') {
                <app-problem-form [form]="form()"></app-problem-form>
                }
                @case('meeting') {
                <app-meeting-form 
                    [form]="form()" 
                    [attendees]="attendees()" 
                    (attendeeAdded)="attendeeAdded.emit($event)" 
                    (attendeeRemoved)="attendeeRemoved.emit($event)"
                ></app-meeting-form>
                }
                @case('lesson') {
                <app-lesson-form 
                    [form]="form()" 
                    [confidence]="confidence()" 
                    (confidenceSet)="confidenceSet.emit($event)"
                ></app-lesson-form>
                }
            }
            </div>

            <div class="flex-1 flex overflow-hidden relative">
            @if (showEmptyState()) {
                <div class="absolute inset-0 z-10 flex flex-col items-center justify-center bg-app-surface/30 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div class="grid grid-cols-2 gap-4 max-w-md w-full">
                        <button (click)="handleEmptyStateAction('write')" class="flex flex-col items-center justify-center p-6 bg-app-surface2/80 hover:bg-app-surface2 border border-app-border rounded-2xl hover:scale-105 transition-all shadow-lg group"><span class="text-3xl mb-2 group-hover:scale-110 transition-transform">📝</span><span class="font-bold text-app-text">{{ t.translate('ES_WRITE') }}</span></button>
                        <button (click)="handleEmptyStateAction('checklist')" class="flex flex-col items-center justify-center p-6 bg-app-surface2/80 hover:bg-app-surface2 border border-app-border rounded-2xl hover:scale-105 transition-all shadow-lg group"><span class="text-3xl mb-2 group-hover:scale-110 transition-transform">☑️</span><span class="font-bold text-app-text">{{ t.translate('ES_CHECKLIST') }}</span></button>
                        <button (click)="handleEmptyStateAction('voice')" class="flex flex-col items-center justify-center p-6 bg-app-surface2/80 hover:bg-app-surface2 border border-app-border rounded-2xl hover:scale-105 transition-all shadow-lg group"><span class="text-3xl mb-2 group-hover:scale-110 transition-transform">🎙️</span><span class="font-bold text-app-text">{{ t.translate('ES_VOICE') }}</span></button>
                        <button (click)="handleEmptyStateAction('image')" class="flex flex-col items-center justify-center p-6 bg-app-surface2/80 hover:bg-app-surface2 border border-app-border rounded-2xl hover:scale-105 transition-all shadow-lg group"><span class="text-3xl mb-2 group-hover:scale-110 transition-transform">🖼️</span><span class="font-bold text-app-text">{{ t.translate('ES_IMAGE') }}</span></button>
                    </div>
                </div>
            }
            <div class="flex-1 flex flex-col h-full relative" [class.hidden]="viewMode() === 'preview'">
                <textarea #editorTextarea class="h-full w-full bg-transparent resize-none focus:outline-none font-sans text-lg leading-relaxed"></textarea>
                @if (subType() === 'checklist' && checklistProgress() > 0) {
                    <div class="absolute top-4 right-4 z-20 pointer-events-none transition-all duration-500" [class.scale-125]="checklistProgress() === 100" [class.opacity-0]="checklistProgress() === 0">
                        <div class="bg-app-surface/90 backdrop-blur border border-app-border rounded-full px-4 py-1.5 text-xs font-bold shadow-xl flex items-center gap-2" [class.text-green-400]="checklistProgress() === 100" [class.border-green-500]="checklistProgress() === 100" [class.shadow-green-500/20]="checklistProgress() === 100">
                        @if(checklistProgress() === 100) {<span class="text-base animate-bounce">🎉</span><span>COMPLETE</span>} @else {<span>{{ checklistProgress() }}%</span>}
                        </div>
                        @if (checklistProgress() === 100) {<div class="absolute inset-0 -z-10 bg-green-500 blur-xl opacity-20 animate-pulse"></div>}
                    </div>
                }
            </div>
            <div class="w-px bg-app-border" *ngIf="viewMode() === 'split'"></div>
            <div class="flex-1 h-full overflow-y-auto p-8 prose prose-lg max-w-none custom-scrollbar bg-app-surface2/20" [class.hidden]="viewMode() === 'edit'">
                <app-markdown-view [content]="form().value.content || ''"></app-markdown-view>
            </div>
            </div>
            
            @if (type() === 'problem') {
              <app-problem-solution [form]="form()"></app-problem-solution>
            }

            @if (type() === 'general') {
            <app-general-note-toolbar
                [subType]="subType()"
                (audioFile)="audioFile.emit($event)"
                (insertDate)="insertDate()"
                (insertTime)="insertTime()"
                (insertSeparator)="insertSeparator()"
                (toggleCheckbox)="toggleCheckbox()"
                (magicSort)="magicSort()"
            ></app-general-note-toolbar>
            }
        </div>
    </div>
  `
})
export class NoteCanvasComponent implements AfterViewInit, OnDestroy {
  t: TranslationService = inject(TranslationService);
  private sanitizer: DomSanitizer = inject(DomSanitizer);
  private datePipe: DatePipe = inject(DatePipe);
  private ngZone: NgZone = inject(NgZone);

  // --- Inputs ---
  form = input.required<FormGroup>();
  initialNote = input<Note>();
  isSaving = input.required<boolean>();
  viewMode = input.required<'edit' | 'split' | 'preview'>();
  type = input.required<NoteType>();
  subType = input.required<'idea' | 'checklist'>();
  priority = input.required<string | null>();
  themeColor = input.required<string>();
  attendees = input.required<string[]>();
  confidence = input.required<number | null>();
  checklistProgress = input.required<number>();
  showEmptyState = input.required<boolean>();

  // --- Outputs ---
  viewModeChange = output<'edit' | 'split' | 'preview'>();
  toggleSidebar = output<void>();
  audioFile = output<File>();
  attendeeAdded = output<string>();
  attendeeRemoved = output<string>();
  confidenceSet = output<number>();
  emptyStateAction = output<'write' | 'checklist' | 'voice' | 'image'>();
  
  // --- Views & Editor Instance ---
  @ViewChild('editorTextarea') editorTextarea!: ElementRef<HTMLTextAreaElement>;
  @ViewChild('hiddenImageInput') hiddenImageInput!: ElementRef<HTMLInputElement>;
  private easyMDE: any;

  // --- Computed State ---
  youtubeEmbedUrl = computed<SafeResourceUrl | null>(() => {
    if (this.type() !== 'video') return null;
    const url = this.form().get('url')?.value;
    if (!url) return null;

    const videoIdMatch = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    const videoId = videoIdMatch ? videoIdMatch[1] : null;

    if (videoId) {
      const embedUrl = `https://www.youtube.com/embed/${videoId}`;
      return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
    }
    return null;
  });

  dynamicGlow = computed(() => `0 0 40px 0 ${this.themeColor()}20`);
  dynamicBorder = computed(() => `${this.themeColor()}40`);
  
  constructor() {
    effect(() => {
        const note = this.initialNote();
        if (this.easyMDE) {
            this.easyMDE.value(note?.content || '');
        }
    });
  }

  ngAfterViewInit() {
    this.initEditor();
  }

  ngOnDestroy() {
    this.easyMDE?.toTextArea();
    this.easyMDE = null;
  }

  togglePreview() {
    if (this.viewMode() === 'preview') {
      this.viewModeChange.emit('edit');
    } else {
      this.viewModeChange.emit('preview');
    }
  }

  // --- UI & Editor Methods ---

  private initEditor() {
    if (this.editorTextarea) {
      this.easyMDE = new EasyMDE({
        element: this.editorTextarea.nativeElement,
        spellChecker: false,
        minHeight: '200px',
        maxHeight: 'none',
        toolbar: false,
        status: false,
        placeholder: this.t.translate('CONTENT_PLACEHOLDER'),
        autoRefresh: { delay: 1000 },
      });
      this.easyMDE.codemirror.on('change', () => {
        const val = this.easyMDE.value();
        this.form().patchValue({ content: val }, { emitEvent: false });
        this.form().markAsDirty();
        // Note: The auto-save subject is handled by the parent component
      });
      if (this.initialNote()) this.easyMDE.value(this.initialNote()!.content);
    }
  }

  // --- Empty State & Quick Actions ---
  handleEmptyStateAction(action: 'write' | 'checklist' | 'voice' | 'image') {
    if (action === 'write') {
        this.easyMDE.codemirror.focus();
    } else if (action === 'image') {
        this.hiddenImageInput.nativeElement.click();
    } else {
        this.emptyStateAction.emit(action);
    }
  }

  onHiddenImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
        // Since this component can't call db.service directly,
        // we'll need to emit the files up to the parent.
        // For simplicity, we'll just emit the first file as an audio file for now.
        // A more robust implementation might have a dedicated 'filesSelected' output.
        this.audioFile.emit(input.files[0]);
    }
  }

  // --- MD Editor Helpers ---
  private insertText(text: string) {
    this.easyMDE.codemirror.replaceSelection(text);
    this.easyMDE.codemirror.focus();
  }
  
  insertDate() { this.insertText(this.datePipe.transform(new Date(), 'yyyy-MM-dd') || ''); }
  insertTime() { this.insertText(this.datePipe.transform(new Date(), 'HH:mm') || ''); }
  insertSeparator() { this.insertText('\n\n---\n\n'); }

  toggleCheckbox() {
     const cm = this.easyMDE.codemirror;
     const cursor = cm.getCursor();
     const line = cm.getLine(cursor.line);
     
     if (line.match(/^\s*-\s\[[ x]\]\s/)) {
        const checked = line.includes('[x]');
        const newLine = line.replace(checked ? '[x]' : '[ ]', checked ? '[ ]' : '[x]');
        cm.replaceRange(newLine, {line: cursor.line, ch: 0}, {line: cursor.line, ch: line.length});
     } else {
        this.insertText('\n- [ ] ');
     }
  }

  magicSort() {
    const content = this.form().get('content')?.value || '';
    const lines = content.split('\n');
    const incomplete = lines.filter((l:string) => l.trim().startsWith('- [ ]'));
    const complete = lines.filter((l:string) => l.trim().startsWith('- [x]'));
    const other = lines.filter((l:string) => !l.trim().startsWith('- ['));
    const newContent = [...incomplete, ...complete, ...other].join('\n');
    this.easyMDE.value(newContent);
  }
}
