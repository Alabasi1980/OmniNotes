import { Injectable } from '@angular/core';

declare const marked: any;

@Injectable({
  providedIn: 'root'
})
export class MarkdownService {
  parse(content: string): string {
    if (typeof marked === 'undefined') {
      return content;
    }
    return marked.parse(content);
  }
}