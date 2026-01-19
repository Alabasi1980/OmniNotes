import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { TranslationService } from '../../services/translation.service';

@Component({
  selector: 'app-lesson-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div [formGroup]="form()" class="flex items-center gap-6">
      <div class="flex-1 flex items-center gap-3 border-b border-app-border focus-within:border-blue-500 transition-colors pb-1"><span class="text-blue-400 font-bold text-xs uppercase">{{ t.translate('SOURCE_LABEL') }}</span><input formControlName="source" type="text" class="flex-1 bg-transparent border-none text-sm text-app-text placeholder-app-muted/50 focus:ring-0 p-0" [placeholder]="t.translate('SOURCE_PLACEHOLDER')"></div>
      <div class="flex items-center gap-2"><span class="text-[10px] font-bold text-app-muted uppercase">{{ t.translate('CONFIDENCE') }}</span><div class="flex bg-app-surface2 rounded-lg p-0.5">@for (star of [1,2,3,4,5]; track star) {<button type="button" (click)="setConfidence(star)" [class.text-yellow-400]="(confidence() || 0) >= star" [class.text-app-muted]="(confidence() || 0) < star" class="p-1 hover:scale-110 transition-transform">★</button>}</div></div>
    </div>
  `,
})
export class LessonFormComponent {
  form = input.required<FormGroup>();
  confidence = input.required<number | null>();
  confidenceSet = output<number>();

  constructor(public t: TranslationService) {}

  setConfidence(level: number) {
    this.confidenceSet.emit(level);
  }
}
