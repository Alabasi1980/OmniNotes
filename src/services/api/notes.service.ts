import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { Note, FilterState } from '../../models';
import { ConfigService } from '../config.service';
import { UtilsService } from '../utils.service';
import { SeedService } from '../seed.service';

@Injectable({
  providedIn: 'root'
})
export class NotesApiService {
  private http: HttpClient = inject(HttpClient);
  private config = inject(ConfigService);
  private utils = inject(UtilsService);
  private seeder = inject(SeedService);
  
  private STORAGE_KEY = 'omni_notes_data';

  constructor() {
    if (!this.config.state().useRealApi) {
      this.seedData();
    }
  }

  private get apiUrl() {
    return `${this.config.state().apiBaseUrl}/api/notes`;
  }

  // --- Helpers for DTO Mapping ---
  
  private fromDto(dto: any): Note {
    // 1. Content Mapping
    // Backend: contentMd, Frontend: content
    const content = dto.contentMd !== undefined ? dto.contentMd : dto.content;
    
    // 2. Metadata Mapping
    // Backend: metadataJson (string), Frontend: metadata (object)
    let metadata = dto.metadata;
    if (dto.metadataJson) {
      try {
        metadata = typeof dto.metadataJson === 'string' 
          ? JSON.parse(dto.metadataJson) 
          : dto.metadataJson;
      } catch (e) {
        console.warn('Failed to parse metadataJson', e);
        metadata = {};
      }
    }

    // 3. Date Mapping
    // Backend: createdAtUtc, Frontend: createdAt
    const createdAt = dto.createdAtUtc || dto.createdAt;
    const updatedAt = dto.updatedAtUtc || dto.updatedAt;

    // 4. Attachment Mapping
    // Backend: { fileName, contentType, downloadUrl }
    // Frontend: { name, type, data }
    let attachments = dto.attachments || [];
    if (Array.isArray(attachments)) {
      attachments = attachments.map((att: any) => ({
        id: att.id,
        name: att.fileName || att.name,
        type: att.contentType || att.type,
        data: att.downloadUrl || att.data // 'data' serves as the URL/Base64 source
      }));
    }

    return {
      id: dto.id,
      type: dto.type,
      title: dto.title,
      content: content,
      metadata: metadata || {},
      tags: dto.tags || [],
      catalogId: dto.catalogId,
      isArchived: !!dto.isArchived,
      createdAt: createdAt,
      updatedAt: updatedAt,
      attachments: attachments
    } as Note;
  }

  private toCreateDto(note: Note): any {
    return {
      id: note.id,
      title: note.title,
      type: note.type,
      contentMd: note.content,
      metadataJson: JSON.stringify(note.metadata || {}),
      tags: note.tags,
      catalogId: note.catalogId,
      createdAtUtc: note.createdAt,
      updatedAtUtc: note.updatedAt,
      isArchived: note.isArchived,
      // For creation, we usually send just IDs or the full object depending on backend logic.
      // Assuming backend accepts the same mapped structure or we map back:
      attachments: note.attachments.map(att => ({
        id: att.id,
        fileName: att.name,
        contentType: att.type,
        downloadUrl: att.data
      }))
    };
  }

  private toUpdateDto(updates: Partial<Note>): any {
    const payload: any = { ...updates };
    
    if (updates.content !== undefined) {
      payload.contentMd = updates.content;
      delete payload.content;
    }

    if (updates.metadata !== undefined) {
      payload.metadataJson = JSON.stringify(updates.metadata);
      delete payload.metadata;
    }
    
    // Handle specific date updates if generated on client
    if (updates.updatedAt) {
      payload.updatedAtUtc = updates.updatedAt;
      delete payload.updatedAt;
    }

    // Map Attachments if present
    if (updates.attachments) {
       payload.attachments = updates.attachments.map(att => ({
        id: att.id,
        fileName: att.name,
        contentType: att.type,
        downloadUrl: att.data
      }));
    }

    return payload;
  }
  // -------------------------------

  getAll(filter?: FilterState): Observable<Note[]> {
    if (this.config.state().useRealApi) {
      let params = new HttpParams();
      if (filter) {
        if (filter.query) params = params.set('q', filter.query);
        if (filter.type && filter.type !== 'all') params = params.set('type', filter.type);
        if (filter.catalogId && filter.catalogId !== 'all') params = params.set('catalogId', filter.catalogId);
        if (filter.tag) params = params.set('tag', filter.tag);
        if (filter.startDate) params = params.set('fromUtc', filter.startDate);
        if (filter.endDate) params = params.set('toUtc', filter.endDate);
        if (filter.isArchived !== undefined) {
          params = params.set('archived', filter.isArchived ? 'true' : 'false');
        }
      }
      return this.http.get<any[]>(this.apiUrl, { params }).pipe(
        map((items: any[]) => items.map(item => this.fromDto(item)))
      );
    } else {
      // Mock Implementation
      try {
        let notes = this.getLocal();
        
        if (filter) {
          const q = (filter.query || '').toLowerCase();
          notes = notes.filter(n => {
             const targetArchivedState = !!filter.isArchived;
             if (!!n.isArchived !== targetArchivedState) return false;

             const matchQuery = !q || 
               n.title.toLowerCase().includes(q) || 
               n.content.toLowerCase().includes(q) || 
               n.tags.some(t => t.toLowerCase().includes(q)) ||
               (n.metadata['solution'] && (n.metadata['solution'] as string).toLowerCase().includes(q)) ||
               (n.metadata['url'] && (n.metadata['url'] as string).toLowerCase().includes(q));

             const matchType = !filter.type || filter.type === 'all' || n.type === filter.type;
             const matchCatalog = !filter.catalogId || filter.catalogId === 'all' || n.catalogId === filter.catalogId;
             const matchTag = !filter.tag || n.tags.includes(filter.tag);

             let matchDate = true;
             const nDate = new Date(n.updatedAt).getTime();
             if (filter.startDate) {
               matchDate = matchDate && nDate >= new Date(filter.startDate).getTime();
             }
             if (filter.endDate) {
               const endDate = new Date(filter.endDate);
               endDate.setDate(endDate.getDate() + 1);
               matchDate = matchDate && nDate < endDate.getTime();
             }

             return matchQuery && matchType && matchCatalog && matchTag && matchDate;
          });
        }
        notes.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        return of(notes).pipe(delay(400));
      } catch (err) {
        return throwError(() => err);
      }
    }
  }

  getOne(id: string): Observable<Note> {
    if (this.config.state().useRealApi) {
      return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
        map(item => this.fromDto(item))
      );
    } else {
      try {
        const notes = this.getLocal();
        const note = notes.find(n => n.id === id);
        if (note) return of(note).pipe(delay(200));
        return throwError(() => new Error('Note not found'));
      } catch (err) {
        return throwError(() => err);
      }
    }
  }

  create(note: Note): Observable<Note> {
    if (this.config.state().useRealApi) {
      const payload = this.toCreateDto(note);
      return this.http.post<any>(this.apiUrl, payload).pipe(
        map(item => this.fromDto(item))
      );
    } else {
      try {
        const notes = this.getLocal();
        const newNote = { ...note };
        if (!newNote.id) newNote.id = this.utils.generateId();
        notes.unshift(newNote);
        this.saveLocal(notes);
        return of(newNote).pipe(delay(400));
      } catch (err) {
        return throwError(() => err);
      }
    }
  }

  update(id: string, updates: Partial<Note>): Observable<Note> {
    if (this.config.state().useRealApi) {
      const payload = this.toUpdateDto(updates);
      return this.http.put<any>(`${this.apiUrl}/${id}`, payload).pipe(
        map(item => this.fromDto(item))
      );
    } else {
      try {
        const notes = this.getLocal();
        const index = notes.findIndex(n => n.id === id);
        if (index !== -1) {
          const updatedNote = { ...notes[index], ...updates, updatedAt: new Date().toISOString() };
          notes[index] = updatedNote;
          this.saveLocal(notes);
          return of(updatedNote).pipe(delay(300));
        }
        return throwError(() => new Error('Note not found'));
      } catch (err) {
        return throwError(() => err);
      }
    }
  }

  delete(id: string): Observable<void> {
    if (this.config.state().useRealApi) {
      return this.http.delete<void>(`${this.apiUrl}/${id}`);
    } else {
      try {
        const notes = this.getLocal();
        const filtered = notes.filter(n => n.id !== id);
        this.saveLocal(filtered);
        return of(undefined).pipe(delay(300));
      } catch (err) {
        return throwError(() => err);
      }
    }
  }

  private getLocal(): Note[] {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch (e) {
      console.warn('Corrupt note data in localStorage, resetting.', e);
      localStorage.removeItem(this.STORAGE_KEY);
      return [];
    }
  }

  private saveLocal(notes: Note[]) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(notes));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  }

  private seedData() {
    if (!localStorage.getItem(this.STORAGE_KEY)) {
      this.saveLocal(this.seeder.getInitialNotes());
    }
  }
}