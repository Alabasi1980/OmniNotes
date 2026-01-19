import { Component, input, output, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { TranslationService } from '../../services/translation.service';

@Component({
  selector: 'app-sidebar-focus-timer',
  standalone: true,
  imports: [CommonModule],
  providers: [DatePipe],
  template: `
    <div class="p-4 border-t border-app-border bg-app-surface2/50">
      <div class="text-center">
        <label class="text-xs font-bold text-app-muted uppercase tracking-wider">{{ t.translate('FOCUS_TIMER') }}</label>
        <div class="text-3xl font-mono font-bold my-2" [style.color]="themeColor()">{{ focusTime() | date:'mm:ss':'UTC' }}</div>
        <button type="button" (click)="focusToggled.emit()" class="w-full py-2 rounded-lg text-sm font-bold text-white transition-colors" [class.bg-red-500]="focusActive()" [class.bg-green-500]="!focusActive()">
          {{ focusActive() ? t.translate('STOP_FOCUS') : t.translate('START_FOCUS') }}
        </button>
      </div>
    </div>
  `
})
export class SidebarFocusTimerComponent {
  t = inject(TranslationService);
  focusActive = input.required<boolean>();
  focusTime = input.required<number>();
  themeColor = input.required<string>();
  focusToggled = output<void>();
}
