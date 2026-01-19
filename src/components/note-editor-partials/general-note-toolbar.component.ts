import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VoiceRecorderComponent } from '../voice-recorder.component';
import { TranslationService } from '../../services/translation.service';

@Component({
  selector: 'app-general-note-toolbar',
  standalone: true,
  imports: [CommonModule, VoiceRecorderComponent],
  template: `
    <div class="h-12 border-t border-app-border bg-app-surface2/50 flex items-center px-4 justify-between backdrop-blur-md">
      <app-voice-recorder (audioFile)="audioFile.emit($event)"></app-voice-recorder>
      <div class="flex items-center gap-1">
          <button type="button" (click)="insertDate.emit()" class="p-2 hover:bg-white/10 rounded-lg text-app-muted hover:text-app-text transition-colors" [title]="t.translate('INSERT_DATE')">📅</button>
          <button type="button" (click)="insertTime.emit()" class="p-2 hover:bg-white/10 rounded-lg text-app-muted hover:text-app-text transition-colors" [title]="t.translate('INSERT_TIME')">⏰</button>
          <button type="button" (click)="insertSeparator.emit()" class="p-2 hover:bg-white/10 rounded-lg text-app-muted hover:text-app-text transition-colors" [title]="t.translate('INSERT_HR')">➖</button>
          @if (subType() === 'checklist') {
              <div class="h-4 w-px bg-app-border mx-1"></div>
              <button type="button" (click)="toggleCheckbox.emit()" class="p-2 hover:bg-app-accent/20 hover:text-app-accent rounded-lg text-app-muted transition-colors" [title]="t.translate('INSERT_CHECKBOX')">☑️</button>
              <button type="button" (click)="magicSort.emit()" class="p-2 hover:bg-purple-500/20 hover:text-purple-400 rounded-lg text-app-muted transition-colors" [title]="t.translate('MAGIC_SORT_HINT')">🪄</button>
          }
      </div>
    </div>
  `,
})
export class GeneralNoteToolbarComponent {
  subType = input.required<'idea' | 'checklist'>();
  
  audioFile = output<File>();
  insertDate = output();
  insertTime = output();
  insertSeparator = output();
  toggleCheckbox = output();
  magicSort = output();
  
  constructor(public t: TranslationService) {}
}
