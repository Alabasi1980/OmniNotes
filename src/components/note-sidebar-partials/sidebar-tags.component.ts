import { Component, input, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../../services/translation.service';

@Component({
  selector: 'app-sidebar-tags',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-2">
      <label class="block text-xs font-bold text-app-muted uppercase tracking-wider">{{ t.translate('TAGS') }}</label>
      <div class="flex flex-wrap gap-1.5 p-2 bg-app-surface2 rounded-lg border border-app-border min-h-[42px]">
        @for (tag of tags(); track tag) {
          <span class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-app-primary/20 text-app-primary">
            #{{ tag }}
            <button type="button" (click)="removeTag(tag)" class="ml-1 rtl:mr-1 rtl:ml-0 hover:text-white">×</button>
          </span>
        }
        <input #tagInput (keyup.enter)="addTag(tagInput)" type="text" class="flex-1 min-w-[60px] bg-transparent border-none text-xs focus:ring-0 p-0" [placeholder]="t.translate('ADD_TAG_PLACEHOLDER')">
      </div>
      @if (showAiButton()) {
        <button 
          type="button" 
          (click)="autoTagClicked.emit()" 
          [disabled]="aiLoading()"
          class="w-full mt-2 text-xs font-bold text-purple-400 bg-purple-900/20 hover:bg-purple-900/40 rounded-md py-1.5 flex items-center justify-center transition-colors disabled:opacity-50"
        >
          @if (aiLoading()) {
            <svg class="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            {{ t.translate('THINKING') }}
          } @else {
            <span class="mr-1">✨</span> {{ t.translate('AUTO_TAG') }}
          }
        </button>
      }
    </div>
  `
})
export class SidebarTagsComponent {
  t = inject(TranslationService);
  tags = input.required<string[]>();
  aiLoading = input.required<boolean>();
  showAiButton = input.required<boolean>();
  
  tagAdded = output<string>();
  tagRemoved = output<string>();
  autoTagClicked = output<void>();

  addTag(input: HTMLInputElement) {
    const tag = input.value.trim().toLowerCase();
    if (tag) {
      this.tagAdded.emit(tag);
    }
    input.value = '';
  }

  removeTag(tag: string) {
    this.tagRemoved.emit(tag);
  }
}
