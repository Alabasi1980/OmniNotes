import { Component, input, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { TranslationService } from '../../services/translation.service';

@Component({
  selector: 'app-sidebar-general-props',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="space-y-6" [formGroup]="form()">
      <!-- Subtype -->
      <div class="space-y-2">
        <label class="block text-xs font-bold text-app-muted uppercase tracking-wider">{{ t.translate('SUBTYPE_LABEL') }}</label>
        <select formControlName="subType" class="block w-full bg-app-surface2 border-none rounded-lg text-sm text-app-text focus:ring-app-primary font-medium">
          <option value="idea">{{ t.translate('SUBTYPE_IDEA') }}</option>
          <option value="checklist">{{ t.translate('SUBTYPE_CHECKLIST') }}</option>
        </select>
      </div>
      <!-- Priority -->
      <div class="space-y-2">
        <label class="block text-xs font-bold text-app-muted uppercase tracking-wider">{{ t.translate('PRIORITY_LABEL') }}</label>
        <div class="grid grid-cols-3 gap-2">
            <button type="button" (click)="setPriority('low')" class="p-2 rounded-lg text-xs font-bold transition-all" [class.bg-app-accent]="priority() === 'low'" [class.text-white]="priority() === 'low'" [class.bg-app-surface2]="priority() !== 'low'">{{ t.translate('PRIORITY_LOW') }}</button>
            <button type="button" (click)="setPriority('medium')" class="p-2 rounded-lg text-xs font-bold transition-all" [class.bg-app-accent]="priority() === 'medium'" [class.text-white]="priority() === 'medium'" [class.bg-app-surface2]="priority() !== 'medium'">{{ t.translate('PRIORITY_MEDIUM') }}</button>
            <button type="button" (click)="setPriority('high')" class="p-2 rounded-lg text-xs font-bold transition-all" [class.bg-app-accent]="priority() === 'high'" [class.text-white]="priority() === 'high'" [class.bg-app-surface2]="priority() !== 'high'">{{ t.translate('PRIORITY_HIGH') }}</button>
        </div>
      </div>
      <!-- Mood Color -->
      <div class="space-y-2">
        <label class="block text-xs font-bold text-app-muted uppercase tracking-wider">{{ t.translate('MOOD_LABEL') }}</label>
        <input type="color" formControlName="themeColor" class="w-full h-10 bg-app-surface2 border-none rounded-lg cursor-pointer">
      </div>
    </div>
  `
})
export class SidebarGeneralPropsComponent {
  t = inject(TranslationService);
  form = input.required<FormGroup>();
  priority = input.required<string|null>();
  priorityChanged = output<string>();

  setPriority(level: 'low' | 'medium' | 'high') {
    this.priorityChanged.emit(level);
  }
}
