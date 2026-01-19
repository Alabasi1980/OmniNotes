import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, from, of, throwError } from 'rxjs';
import { map, delay, catchError } from 'rxjs/operators';
import { Attachment } from '../../models';
import { ConfigService } from '../config.service';
import { UtilsService } from '../utils.service';

@Injectable({
  providedIn: 'root'
})
export class AttachmentsApiService {
  private http: HttpClient = inject(HttpClient);
  private config = inject(ConfigService);
  private utils = inject(UtilsService);

  private get apiUrl() {
    return `${this.config.state().apiBaseUrl}/api/attachments`;
  }

  // Step 5: Upload using FormData and optional noteId
  upload(file: File, noteId?: string): Observable<Attachment> {
    if (this.config.state().useRealApi) {
      return this.uploadToServer(file, noteId);
    } else {
      return this.convertToBase64Mock(file);
    }
  }

  delete(id: string): Observable<void> {
    if (this.config.state().useRealApi) {
       return this.http.delete<void>(`${this.apiUrl}/${id}`);
    } else {
       return of(undefined);
    }
  }

  private uploadToServer(file: File, noteId?: string): Observable<Attachment> {
    const formData = new FormData();
    formData.append('file', file);
    
    let params = new HttpParams();
    if (noteId) {
      params = params.set('noteId', noteId);
    }

    return this.http.post<any>(this.apiUrl, formData, { params }).pipe(
      map((res: any) => {
        // API returns nested object: { attachment: { ... } }
        const att = res.attachment || res;
        
        // Map Backend DTO fields to Frontend Model
        return {
          id: att.id,
          name: att.fileName || att.name,
          type: att.contentType || att.type,
          data: att.downloadUrl || att.data
        } as Attachment;
      }),
      catchError(err => {
        console.error('Upload failed', err);
        return throwError(() => new Error('Failed to upload file to server.'));
      })
    );
  }

  private convertToBase64Mock(file: File): Observable<Attachment> {
    return new Observable<Attachment>(observer => {
      const reader = new FileReader();
      
      reader.onload = (e: any) => {
        const result = e.target.result;
        const attachment: Attachment = {
          id: this.utils.generateId(),
          name: file.name,
          type: file.type,
          data: result // Base64 string acts as the data
        };
        // Simulate network delay
        setTimeout(() => {
          observer.next(attachment);
          observer.complete();
        }, 800);
      };

      reader.onerror = (error) => {
        observer.error(error);
      };

      reader.readAsDataURL(file);
    });
  }
}