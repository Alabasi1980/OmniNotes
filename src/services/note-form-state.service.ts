import { Injectable, signal, computed, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Note, NoteType, Attachment } from '../models';

/**
 * A local state service provided at the component level (`note-editor`).
 * It manages the form state for creating or editing a single note.
 * Its lifecycle is tied to the NoteEditorComponent instance.
 */
@Injectable()
export class NoteFormStateService {
  private fb = inject(FormBuilder);

  // --- State Signals ---
  form!: FormGroup;
  tags = signal<string[]>([]);
  attachments = signal<Attachment[]>([]);
  attendees = signal<string[]>([]);

  // --- Computed State from Form ---
  type = computed(() => this.form.get('type')?.value as NoteType);
  subType = computed(() => this.form.get('subType')?.value as 'idea' | 'checklist');
  priority = computed(() => this.form.get('priority')?.value as 'low' | 'medium' | 'high' | null);
  confidence = computed(() => this.form.get('confidence')?.value as number | null);
  themeColor = computed(() => this.form.get('themeColor')?.value || '#6366f1');
  
  showEmptyState = computed(() => {
    const content = this.form.get('content')?.value || '';
    return !content.trim();
  });
  
  checklistProgress = computed(() => {
    if (this.subType() !== 'checklist') return 0;
    const content = this.form.get('content')?.value || '';
    const lines = content.split('\n').filter((l: string) => l.trim().startsWith('- ['));
    if (lines.length === 0) return 0;
    const completed = lines.filter((l: string) => l.trim().startsWith('- [x]')).length;
    return Math.round((completed / lines.length) * 100);
  });

  constructor() {
    this.initForm();
  }
  
  /**
   * Initializes the service with data from an existing note or resets it for a new one.
   */
  initialize(note: Note | undefined, defaultCatalogId: string | undefined) {
    if (note) {
      this.populateForm(note);
    } else {
      this.resetForm(defaultCatalogId);
    }
  }

  /**
   * Gathers all state and returns a Note data object ready for saving.
   */
  getNoteDataForSave(): Partial<Note> {
    const formData = this.form.value;
    return {
      title: formData.title,
      content: formData.content,
      type: formData.type,
      catalogId: formData.catalogId,
      tags: this.tags(),
      attachments: this.attachments(),
      metadata: {
        url: formData.url,
        solution: formData.solution,
        source: formData.source,
        severity: formData.severity,
        status: formData.status,
        environment: formData.environment,
        attendees: this.attendees(),
        meetingDate: formData.meetingDate,
        subType: formData.subType,
        priority: formData.priority,
        confidence: formData.confidence,
        themeColor: formData.themeColor
      }
    };
  }

  // --- State Mutation Methods ---

  setType(newType: NoteType) { this.form.patchValue({ type: newType }); }
  setPriority(level: string) { this.form.patchValue({ priority: level }); }
  setConfidence(level: number) { this.form.patchValue({ confidence: level }); }
  setSubType(subType: 'idea' | 'checklist') { this.form.patchValue({ subType }); }

  addTag(tag: string) {
    if (tag && !this.tags().includes(tag)) {
      this.tags.update(current => [...current, tag]);
      this.form.markAsDirty();
    }
  }

  removeTag(tagToRemove: string) {
    this.tags.update(current => current.filter(t => t !== tagToRemove));
    this.form.markAsDirty();
  }

  addAttachment(attachment: Attachment) {
    this.attachments.update(atts => [...atts, attachment]);
    this.form.markAsDirty();
  }

  removeAttachment(id: string) {
    this.attachments.update(atts => atts.filter(a => a.id !== id));
    this.form.markAsDirty();
  }

  addAttendee(person: string) {
    if (person && !this.attendees().includes(person)) {
      this.attendees.update(current => [...current, person]);
      this.form.markAsDirty();
    }
  }

  removeAttendee(person: string) {
    this.attendees.update(current => current.filter(p => p !== person));
    this.form.markAsDirty();
  }

  // --- Private Form Helpers ---

  private initForm() {
    this.form = this.fb.group({
      title: ['', Validators.required], content: [''], type: ['general', Validators.required],
      catalogId: ['', Validators.required],
      // Metadata fields are grouped for simplicity
      url: [''], solution: [''], source: [''], severity: ['low'], status: ['open'],
      environment: [''], meetingDate: [''], subType: ['idea'], priority: [null],
      confidence: [null], themeColor: ['#6366f1']
    });
  }

  private populateForm(note: Note) {
    this.form.reset({
      title: note.title, content: note.content, type: note.type, catalogId: note.catalogId,
      url: note.metadata?.url || '', solution: note.metadata?.solution || '',
      source: note.metadata?.source || '', severity: note.metadata?.severity || 'low',
      status: note.metadata?.status || 'open', environment: note.metadata?.environment || '',
      meetingDate: this.formatDateForInput(note.metadata?.meetingDate),
      subType: note.metadata?.subType || 'idea', priority: note.metadata?.priority || null,
      confidence: note.metadata?.confidence || null, themeColor: note.metadata?.themeColor || '#6366f1'
    });

    this.tags.set(note.tags || []);
    this.attachments.set(note.attachments || []);
    this.attendees.set(note.metadata?.attendees || []);
    this.form.markAsPristine();
  }

  private resetForm(defaultCatalogId: string | undefined) {
    this.form.reset({
      title: '', content: '', type: 'general', catalogId: defaultCatalogId || '',
      url: '', solution: '', source: '', severity: 'low', status: 'open',
      environment: '', meetingDate: '', subType: 'idea', priority: null,
      confidence: null, themeColor: '#6366f1'
    });
    this.tags.set([]); this.attachments.set([]); this.attendees.set([]);
    this.form.markAsPristine();
  }
  
  private formatDateForInput(dateStr?: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}T${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  }
}
