import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { SafeResourceUrl } from '@angular/platform-browser';
import { TranslationService } from '../../services/translation.service';

@Component({
  selector: 'app-link-video-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div [formGroup]="form()" class="flex flex-col gap-4">
      <div class="flex items-center gap-3 bg-app-surface2/50 p-2 rounded-xl border border-app-border focus-within:border-app-accent focus-within:ring-1 focus-within:ring-app-accent transition-all group-focus-within:shadow-lg">
        <div class="p-2 rounded-lg" [style.background]="themeColor() + '20'" [style.color]="themeColor()"><svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg></div>
        <input formControlName="url" type="url" class="flex-1 bg-transparent border-none text-app-text placeholder-app-muted focus:ring-0 text-sm font-medium font-mono" [placeholder]="t.translate('URL_PLACEHOLDER')">
      </div>
      @if (youtubeEmbedUrl(); as ytUrl) {
        <div class="relative w-full aspect-video rounded-xl overflow-hidden border border-app-border bg-black shadow-2xl">
            <iframe class="absolute inset-0 w-full h-full" [src]="ytUrl" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
        </div>
      }
    </div>
  `,
})
export class LinkVideoFormComponent {
  form = input.required<FormGroup>();
  themeColor = input.required<string>();
  youtubeEmbedUrl = input.required<SafeResourceUrl | null>();
  
  constructor(public t: TranslationService) {}
}
