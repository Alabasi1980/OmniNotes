import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { ConfigService } from '../config.service';

@Injectable({
  providedIn: 'root' 
})
export class AiApiService {
  private http: HttpClient = inject(HttpClient);
  private config = inject(ConfigService);
  
  private get apiUrl() {
    return `${this.config.state().apiBaseUrl}/api/ai/suggest-tags`;
  }
  
  // Client-side key is NOT required when using Real API.
  // This is only for local mock fallback if needed.
  private mockApiKey = '';

  suggestTags(content: string): Observable<string[]> {
    // 1. If Real API is enabled, delegate to Server (No Key required on Client)
    if (this.config.state().useRealApi) {
      return this.suggestTagsFromServer(content);
    } 
    // 2. Fallback to Client-side SDK (Requires mockApiKey to be set manually)
    else {
      return this.suggestTagsMock(content);
    }
  }

  /**
   * Real API Implementation:
   * Sends POST to {apiBaseUrl}/api/ai/suggest-tags
   * Body matches SuggestTagsRequest: { "content": "..." }
   */
  private suggestTagsFromServer(content: string): Observable<string[]> {
    const body = { content };
    
    return this.http.post<{ tags: string[] }>(this.apiUrl, body).pipe(
      map((response: any) => response.tags || []),
      catchError(err => {
        console.error('AI Server Error', err);
        return throwError(() => new Error('Failed to fetch tags from server. Ensure Backend is running and AI Key is configured on Server.'));
      })
    );
  }

  /**
   * Mock Implementation:
   * Uses Client-side SDK directly. Only for offline/demo development.
   */
  private suggestTagsMock(content: string): Observable<string[]> {
    if (!this.mockApiKey) {
      return throwError(() => new Error('No API Key configured for local mock mode.'));
    }

    const ai = new GoogleGenAI({ apiKey: this.mockApiKey });
    const prompt = `Analyze the following note content and suggest 5 relevant short tags (single words). Return them as a comma-separated list without any extra text. Content: ${content}`;

    const promise = ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    }).then((response: GenerateContentResponse) => {
      const text = response.text;
      if (!text) return [];
      // Parse CSV result
      return text.split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0)
        .map(t => t.replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '')); // Clean
    });

    return from(promise);
  }

  // The button is enabled if we are using Real API OR if we have a local key
  hasKey(): boolean {
    return this.config.state().useRealApi || !!this.mockApiKey;
  }
}