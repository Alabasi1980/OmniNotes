import { Component, input, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../../services/translation.service';

@Component({
  selector: 'app-sidebar-actions',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-4 border-b border-app-border bg-app-surface2/50 flex items-center justify-between">
      <h3 class="text-lg font-bold text-app-text flex items-center gap-2">
        <span class="text-xl">🛠️</span>
        <span>{{ t.translate('PROPERTIES') }}</span>
      </h3>
      <div class="flex items-center gap-2">
        <button type="button" (click)="cancelClicked.emit()" class="px-4 py-1.5 text-xs font-bold text-app-muted bg-app-surface hover:bg-white/10 rounded-lg transition-colors">{{ t.translate('CANCEL') }}</button>
        <button 
          type="button" 
          (click)="saveClicked.emit()" 
          [disabled]="isSaving()"
          class="px-5 py-1.5 text-xs font-bold text-white bg-app-primary hover:bg-app-accent rounded-lg shadow-lg shadow-app-primary/20 transition-all disabled:opacity-50">
          {{ t.translate('SAVE_NOTE') }}
        </button>
      </div>
    </div>
  `
})
export class SidebarActionsComponent {
  t = inject(TranslationService);
  isSaving = input.required<boolean>();
  saveClicked = output<void>();
  cancelClicked = output<void>();
}
