import { Component, input, output, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { Catalog, Attachment, NoteType } from '../models';
import { TranslationService } from '../services/translation.service';
import { AttachmentsPickerComponent } from './attachments-picker.component';

// Import new partial components
import { SidebarActionsComponent } from './note-sidebar-partials/sidebar-actions.component';
import { SidebarCorePropsComponent } from './note-sidebar-partials/sidebar-core-props.component';
import { SidebarTagsComponent } from './note-sidebar-partials/sidebar-tags.component';
import { SidebarGeneralPropsComponent } from './note-sidebar-partials/sidebar-general-props.component';
import { SidebarFocusTimerComponent } from './note-sidebar-partials/sidebar-focus-timer.component';

@Component({
  selector: 'app-note-sidebar',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ReactiveFormsModule, 
    AttachmentsPickerComponent,
    SidebarActionsComponent,
    SidebarCorePropsComponent,
    SidebarTagsComponent,
    SidebarGeneralPropsComponent,
    SidebarFocusTimerComponent
  ],
  providers: [DatePipe],
  template: `
    <div class="flex flex-col h-full bg-app-surface/80 backdrop-blur-xl border border-app-border rounded-3xl overflow-hidden shadow-2xl md:w-80">
      
      <app-sidebar-actions
        [isSaving]="isSaving()"
        (saveClicked)="saveClicked.emit()"
        (cancelClicked)="cancelClicked.emit()">
      </app-sidebar-actions>
      
      <!-- Scrollable Properties -->
      <div class="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        
        <app-sidebar-core-props
          [form]="form()"
          [catalogs]="catalogs()"
          (typeChanged)="typeChanged.emit($event)">
        </app-sidebar-core-props>

        <app-sidebar-tags
          [tags]="tags()"
          [showAiButton]="showAiButton()"
          [aiLoading]="aiLoading()"
          (tagAdded)="tagAdded.emit($event)"
          (tagRemoved)="tagRemoved.emit($event)"
          (autoTagClicked)="autoTagClicked.emit()">
        </app-sidebar-tags>

        @if (type() === 'general') {
          <app-sidebar-general-props
            [form]="form()"
            [priority]="priority()"
            (priorityChanged)="priorityChanged.emit($event)">
          </app-sidebar-general-props>
        }
        
        <!-- Attachments -->
        <div class="space-y-2">
           <label class="block text-xs font-bold text-app-muted uppercase tracking-wider">{{ t.translate('ATTACHMENTS') }}</label>
           @if (!canUpload()) {
              <div class="text-xs text-amber-400 bg-amber-900/30 p-2 rounded-lg text-center border border-amber-500/30">
                 {{ t.translate('SAVE_TO_UPLOAD') }}
              </div>
           }
           <app-attachments-picker 
              [attachments]="attachments()" 
              [isUploading]="isUploading()"
              (filesSelected)="filesSelected.emit($event)"
              (remove)="attachmentRemoved.emit($event)"
           ></app-attachments-picker>
        </div>
      </div>
      
      <app-sidebar-focus-timer
        [focusActive]="focusActive()"
        [focusTime]="focusTime()"
        [themeColor]="themeColor()"
        (focusToggled)="focusToggled.emit()">
      </app-sidebar-focus-timer>
    </div>
  ` 
})
export class NoteSidebarComponent {
  t = inject(TranslationService);

  // --- INPUTS ---
  form = input.required<FormGroup>();
  catalogs = input.required<Catalog[]>();
  tags = input.required<string[]>();
  attachments = input.required<Attachment[]>();
  type = input.required<NoteType>();
  isUploading = input.required<boolean>();
  isSaving = input.required<boolean>();
  aiLoading = input.required<boolean>();
  showAiButton = input.required<boolean>();
  canUpload = input.required<boolean>();
  focusActive = input.required<boolean>();
  focusTime = input.required<number>();
  themeColor = input.required<string>();
  priority = input.required<string|null>();

  // --- OUTPUTS ---
  saveClicked = output<void>();
  cancelClicked = output<void>();
  typeChanged = output<NoteType>();
  priorityChanged = output<string>();
  filesSelected = output<File[]>();
  tagAdded = output<string>();
  tagRemoved = output<string>();
  attachmentRemoved = output<string>();
  autoTagClicked = output<void>();
  focusToggled = output<void>();
}
