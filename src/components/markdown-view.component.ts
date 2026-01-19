import { Component, input, computed, inject, ViewEncapsulation, EffectRef, effect, ElementRef } from '@angular/core';
import { MarkdownService } from '../services/markdown.service';
import { CommonModule } from '@angular/common';

declare const mermaid: any;

@Component({
  selector: 'app-markdown-view',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="markdown-body text-gray-800" [innerHTML]="renderedContent()"></div>
  `,
  encapsulation: ViewEncapsulation.None
})
export class MarkdownViewComponent {
  content = input.required<string>();
  private mdService = inject(MarkdownService);
  private el = inject(ElementRef);

  renderedContent = computed(() => {
    return this.mdService.parse(this.content() || '');
  });

  constructor() {
    // Re-run mermaid init whenever content changes and is rendered
    effect(() => {
       const html = this.renderedContent();
       // Use setTimeout to wait for DOM update
       setTimeout(() => {
         if (typeof mermaid !== 'undefined') {
            mermaid.init(undefined, this.el.nativeElement.querySelectorAll('.mermaid'));
         }
       }, 100);
    });
  }
}