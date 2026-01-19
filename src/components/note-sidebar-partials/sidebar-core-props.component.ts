import { Component, input, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { Catalog, NoteType } from '../../models';
import { TranslationService } from '../../services/translation.service';

@Component({
  selector: 'app-sidebar-core-props',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="space-y-6" [formGroup]="form()">
      <!-- Type Selector -->
      <div class="space-y-2">
        <label class="block text-xs font-bold text-app-muted uppercase tracking-wider">{{ t.translate('TYPE') }}</label>
        <select 
          formControlName="type"
          (change)="onTypeChange($event)"
          class="block w-full bg-app-surface2 border-none rounded-lg text-sm text-app-text focus:ring-app-primary font-medium"
        >
          <option value="general">{{ t.getNoteTypeName('general') }}</option>
          <option value="problem">{{ t.getNoteTypeName('problem') }}</option>
          <option value="lesson">{{ t.getNoteTypeName('lesson') }}</option>
          <option value="link">{{ t.getNoteTypeName('link') }}</option>
          <option value="video">{{ t.getNoteTypeName('video') }}</option>
          <option value="meeting">{{ t.getNoteTypeName('meeting') }}</option>
        </select>
      </div>

      <!-- Catalog Selector -->
      <div class="space-y-2">
        <label class="block text-xs font-bold text-app-muted uppercase tracking-wider">{{ t.translate('CATALOG_LABEL') }}</label>
        <select 
          formControlName="catalogId"
          class="block w-full bg-app-surface2 border-none rounded-lg text-sm text-app-text focus:ring-app-primary font-medium"
        >
          @for (cat of catalogs(); track cat.id) {
            <option [value]="cat.id">{{ cat.name }}</option>
          }
          @empty {
            <option value="" disabled>No catalogs available</option>
          }
        </select>
      </div>
    </div>
  `
})
export class SidebarCorePropsComponent {
  t = inject(TranslationService);
  form = input.required<FormGroup>();
  catalogs = input.required<Catalog[]>();
  typeChanged = output<NoteType>();

  onTypeChange(event: Event) {
    const newType = (event.target as HTMLSelectElement).value as NoteType;
    this.typeChanged.emit(newType);
  }
}
