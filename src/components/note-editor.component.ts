import { Component, inject, input, output, signal, effect, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Note, Attachment, Catalog } from '../models';
import { TranslationService } from '../services/translation.service';
import { DbService } from '../services/db.service';
import { interval, Subscription, Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { NoteSidebarComponent } from './note-sidebar.component';
import { NoteCanvasComponent } from './note-canvas.component';
import { NoteFormStateService } from '../services/note-form-state.service'; // Import the new service

@Component({
  selector: 'app-note-editor',
  standalone: true,
  imports: [ CommonModule, NoteSidebarComponent, NoteCanvasComponent ],
  providers: [ NoteFormStateService ], // Provide the service here
  template: `
    <form [formGroup]="state.form" class="h-[calc(100vh-6rem)] flex flex-col md:flex-row gap-6 overflow-hidden">
       
       <app-note-canvas
         [form]="state.form"
         [initialNote]="initialNote()"
         [isSaving]="isSaving()"
         [viewMode]="viewMode()"
         [type]="state.type()"
         [subType]="state.subType()"
         [priority]="state.priority()"
         [themeColor]="state.themeColor()"
         [attendees]="state.attendees()"
         [confidence]="state.confidence()"
         [checklistProgress]="state.checklistProgress()"
         [showEmptyState]="state.showEmptyState()"
         (viewModeChange)="viewMode.set($event)"
         (toggleSidebar)="toggleSidebar()"
         (audioFile)="onAudioFile($event)"
         (attendeeAdded)="state.addAttendee($event)"
         (attendeeRemoved)="state.removeAttendee($event)"
         (confidenceSet)="state.setConfidence($event)"
         (emptyStateAction)="handleEmptyStateAction($event)">
       </app-note-canvas>

       <div 
         [class.translate-x-full]="!isSidebarOpen() && t.dir() === 'ltr'"
         [class.-translate-x-full]="!isSidebarOpen() && t.dir() === 'rtl'"
         class="fixed inset-y-0 right-0 rtl:right-auto rtl:left-0 z-50 md:static md:z-0 md:inset-auto md:translate-x-0 transition-all duration-300 ease-in-out w-80"
         [class.md:w-0]="!isSidebarOpen()"
       >
          <app-note-sidebar
            [form]="state.form"
            [catalogs]="catalogs()"
            [tags]="state.tags()"
            [attachments]="state.attachments()"
            [type]="state.type()"
            [isUploading]="isUploading()"
            [isSaving]="isSaving()"
            [aiLoading]="aiLoading()"
            [showAiButton]="showAiButton()"
            [canUpload]="canUpload()"
            [focusActive]="focusActive()"
            [focusTime]="focusTime()"
            [themeColor]="state.themeColor()"
            [priority]="state.priority()"
            (saveClicked)="onSave()"
            (cancelClicked)="onCancel()"
            (typeChanged)="state.setType($event)"
            (priorityChanged)="state.setPriority($event)"
            (filesSelected)="uploadFiles($event)"
            (tagAdded)="state.addTag($event)"
            (tagRemoved)="state.removeTag($event)"
            (attachmentRemoved)="state.removeAttachment($event)"
            (autoTagClicked)="autoTag()"
            (focusToggled)="toggleFocusTimer()">
          </app-note-sidebar>
       </div>
    </form>
  `
})
export class NoteEditorComponent implements OnDestroy {
  private db = inject(DbService);
  t = inject(TranslationService);
  state = inject(NoteFormStateService); // Inject the state service

  // --- Inputs / Outputs ---
  initialNote = input<Note>();
  isNew = input(false);
  useRealApi = input(false);
  save = output<Partial<Note>>();
  cancel = output<void>();

  // --- Component-specific State (UI, Side Effects) ---
  isUploading = signal(false);
  isSaving = signal(false);
  aiLoading = signal(false);
  isSidebarOpen = signal(true);
  viewMode = signal<'edit' | 'split' | 'preview'>('edit');
  focusActive = signal(false);
  focusTime = signal(0); // in ms
  
  // --- For Sidebar ---
  catalogs = this.db.catalogs;
  canUpload = () => this.useRealApi() && !this.isNew();
  showAiButton = () => this.db.hasAiCapability();
  
  // --- Side Effect Subscriptions ---
  private focusTimerSub?: Subscription;
  private autoSaveSub?: Subscription;
  private autoSaveSubject = new Subject<void>();

  constructor() {
    effect(() => {
      const note = this.initialNote();
      const defaultCatalogId = this.catalogs()?.[0]?.id;
      this.state.initialize(note, defaultCatalogId);
    });

    this.state.form.valueChanges.pipe(debounceTime(300)).subscribe(() => {
      if (this.state.form.dirty) this.autoSaveSubject.next();
    });
    
    this.autoSaveSub = this.autoSaveSubject.pipe(debounceTime(5000)).subscribe(() => {
       if (this.state.form.valid && this.state.form.dirty) this.onSave(true);
    });

    if (window.innerWidth < 768) this.isSidebarOpen.set(false);
  }

  ngOnDestroy() {
    this.autoSaveSub?.unsubscribe();
    this.focusTimerSub?.unsubscribe();
  }

  onSave(isAutoSave = false) {
    if (!this.state.form.valid) return;
    if (!isAutoSave) this.isSaving.set(true);

    const noteData = this.state.getNoteDataForSave();
    this.save.emit(noteData);
    
    if (!isAutoSave) setTimeout(() => this.isSaving.set(false), 1000);
    this.state.form.markAsPristine();
  }

  onCancel() { this.cancel.emit(); }
  toggleSidebar() { this.isSidebarOpen.update(v => !v); }

  autoTag() {
    this.aiLoading.set(true);
    this.db.suggestTags(this.state.form.value.content).subscribe({
      next: (newTags) => {
        newTags.forEach(tag => this.state.addTag(tag));
        this.aiLoading.set(false);
      },
      error: (err) => {
        alert(this.t.translate('AI_ERROR'));
        console.error(err);
        this.aiLoading.set(false);
      }
    });
  }
  
  uploadFiles(files: File[]) {
    if (!this.canUpload()) return;
    this.isUploading.set(true);
    
    files.forEach(file => {
      this.db.uploadFile(file, this.initialNote()?.id).subscribe({
        next: (attachment) => this.state.addAttachment(attachment),
        error: (err) => console.error('Upload failed', err),
        complete: () => this.isUploading.set(false)
      });
    });
  }
  
  onAudioFile(file: File) { this.uploadFiles([file]); }
  
  toggleFocusTimer() {
    this.focusActive.update(v => !v);
    if (this.focusActive()) {
      const startTime = Date.now() - this.focusTime();
      this.focusTimerSub = interval(1000).subscribe(() => {
        this.focusTime.set(Date.now() - startTime);
      });
    } else {
      this.focusTimerSub?.unsubscribe();
    }
  }
  
  handleEmptyStateAction(action: 'checklist' | 'voice' | 'image') {
    if (action === 'checklist') this.state.setSubType('checklist');
  }
}
