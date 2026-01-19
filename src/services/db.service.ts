import { Injectable, signal, inject } from '@angular/core';
import { Note, Catalog, Attachment, FilterState } from '../models';
import { NotesApiService } from './api/notes.service';
import { CatalogsApiService } from './api/catalogs.service';
import { AttachmentsApiService } from './api/attachments.service';
import { AiApiService } from './api/ai.service';
import { ConfigService } from './config.service';
import { tap, catchError } from 'rxjs/operators';
import { of, Observable } from 'rxjs';
import { UtilsService } from './utils.service';
import { switchMap, tap as rxTap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class DbService {
  private notesApi = inject(NotesApiService);
  private catalogsApi = inject(CatalogsApiService);
  private attachmentsApi = inject(AttachmentsApiService);
  private aiApi = inject(AiApiService);
  private utils = inject(UtilsService);
  private config = inject(ConfigService);

  // State Signals (Frontend Cache)
  private notesSignal = signal<Note[]>([]);
  private catalogsSignal = signal<Catalog[]>([]);

  // Filter State
  readonly filterSignal = signal<FilterState>({
    query: '',
    type: 'all',
    catalogId: 'all',
    tag: null,
    isArchived: false // Default to showing active notes
  });

  readonly notes = this.notesSignal.asReadonly();
  readonly catalogs = this.catalogsSignal.asReadonly();

  constructor() {
    this.refreshData();
  }

  setFilter(update: Partial<FilterState>) {
    this.filterSignal.update(current => ({ ...current, ...update }));
    // Trigger reload with new filter
    this.refreshNotes();
  }

  refreshData() {
    this.refreshNotes();
    this.refreshCatalogs();
  }

  private refreshNotes() {
    this.notesApi.getAll(this.filterSignal()).pipe(
      catchError(err => {
        const msg = err && err.message ? err.message : JSON.stringify(err);
        console.error('Failed to load notes. Error details:', msg);
        return of([]);
      })
    ).subscribe(data => this.notesSignal.set(data));
  }



  private refreshCatalogs() {
    this.catalogsApi.getAll().pipe(
      catchError(err => {
        const msg = err && err.message ? err.message : JSON.stringify(err);
        console.error('Failed to load catalogs. Error details:', msg);
        return of([]);
      }), 
      switchMap((cats) => {
        // إذا Real API والكاتالوجات فارغة: أنشئ Inbox مرة واحدة
        if (this.config.state().useRealApi && (!cats || cats.length === 0)) {
          return this.catalogsApi.create({ id: '', name: 'Inbox', parentId: undefined }).pipe(
            catchError(err => {
               console.warn('Failed to auto-create Inbox catalog', err);
               return of({ id: 'temp', name: 'Inbox' } as Catalog);
            }),
            switchMap(() => this.catalogsApi.getAll().pipe(catchError(() => of([]))))
          );
        }
        return of(cats);
      })
    ).subscribe(data => this.catalogsSignal.set(data));
  }


  // CRUD Operations

  // Updated signature to allow 'id' to be passed (for draft notes)
  addNote(noteData: Partial<Note>): Observable<Note> {
    const newNoteObj = {
      ...noteData,
      // Use provided ID (from draft) or generate new
      id: noteData.id || this.utils.generateId(), 
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as Note;

    return this.notesApi.create(newNoteObj).pipe(
      tap((createdNote) => {
        // Optimistic update: Insert at top if it matches current filter (simplified: just prepend)
        // ideally we would re-fetch, but for UX speed we prepend.
        this.notesSignal.update(notes => [createdNote, ...notes]);
      })
    );
  }

  updateNote(id: string, updates: Partial<Note>): Observable<Note> {
    return this.notesApi.update(id, updates).pipe(
      tap((updatedNote) => {
        this.notesSignal.update(notes => 
          notes.map(n => n.id === id ? updatedNote : n)
        );
        
        // Suggestion 2: If we archived/unarchived, the note might need to disappear from the current view
        const currentFilter = this.filterSignal();
        if (updates.hasOwnProperty('isArchived') && updatedNote.isArchived !== currentFilter.isArchived) {
           this.notesSignal.update(notes => notes.filter(n => n.id !== id));
        }
      })
    );
  }

  deleteNote(id: string): Observable<void> {
    return this.notesApi.delete(id).pipe(
      tap(() => {
        this.notesSignal.update(notes => notes.filter(n => n.id !== id));
      })
    );
  }

  getNote(id: string): Note | undefined {
    // Check cache first (which might be filtered)
    return this.notesSignal().find(n => n.id === id);
  }

  // Fetch individual note if not in current filtered list
  fetchNoteById(id: string): Observable<Note> {
    return this.notesApi.getOne(id);
  }

  // Catalogs
  addCatalog(name: string, parentId?: string): Observable<Catalog> {
    const newCat: Catalog = { id: this.utils.generateId(), name, parentId };
    return this.catalogsApi.create(newCat).pipe(
      tap(created => {
        this.catalogsSignal.update(cats => [...cats, created]);
      })
    );
  }

  updateCatalog(id: string, name: string, parentId?: string): Observable<Catalog> {
    return this.catalogsApi.update(id, { name, parentId }).pipe(
      tap(updated => {
        this.catalogsSignal.update(cats => cats.map(c => c.id === id ? updated : c));
      })
    );
  }

  deleteCatalog(id: string): Observable<void> {
    return this.catalogsApi.delete(id).pipe(
      tap(() => {
        this.catalogsSignal.update(cats => cats.filter(c => c.id !== id));
      })
    );
  }

  // Attachments
  uploadFile(file: File, noteId?: string): Observable<Attachment> {
    return this.attachmentsApi.upload(file, noteId);
  }

  // AI Features
  suggestTags(content: string): Observable<string[]> {
    return this.aiApi.suggestTags(content);
  }
  
  hasAiCapability(): boolean {
    return this.aiApi.hasKey();
  }
}