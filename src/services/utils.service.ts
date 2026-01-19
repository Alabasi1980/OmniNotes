import { Injectable, inject } from '@angular/core';
import { ConfigService } from './config.service';

@Injectable({
  providedIn: 'root'
})
export class UtilsService {
  private config = inject(ConfigService);

  generateId(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Resolves a file path to a full URL based on the current configuration.
   * Handles local Base64 data, absolute HTTP URLs, and relative backend paths.
   */
  resolveUrl(path: string | undefined): string {
    if (!path) return '';
    if (path.startsWith('data:') || path.startsWith('http')) return path;
    // Remove leading slash if present to avoid double slashes if apiBaseUrl ends with one
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    const baseUrl = this.config.state().apiBaseUrl.endsWith('/') 
      ? this.config.state().apiBaseUrl 
      : `${this.config.state().apiBaseUrl}/`;
      
    return `${baseUrl}${cleanPath}`;
  }
}