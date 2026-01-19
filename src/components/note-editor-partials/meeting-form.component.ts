import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { TranslationService } from '../../services/translation.service';

@Component({
  selector: 'app-meeting-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div [formGroup]="form()" class="grid grid-cols-1 md:grid-cols-2 gap-6 bg-orange-500/5 p-4 rounded-xl border border-orange-500/10">
      <div class="space-y-1"><label class="text-[10px] font-bold text-orange-400 uppercase tracking-wider">{{ t.translate('MEETING_DATE') }}</label><input formControlName="meetingDate" type="datetime-local" class="block w-full bg-app-surface2 border-none rounded-lg text-sm text-app-text focus:ring-orange-500"></div>
      <div class="space-y-1"><label class="text-[10px] font-bold text-orange-400 uppercase tracking-wider">{{ t.translate('ATTENDEES') }}</label><div class="flex flex-wrap gap-1.5 p-2 bg-app-surface2 rounded-lg border border-app-border min-h-[38px]">@for (person of attendees(); track person) {<span class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-orange-500/20 text-orange-200">{{ person }}<button type="button" (click)="removeAttendee(person)" class="ml-1 hover:text-white">×</button></span>}<input #attendeeInput (keyup.enter)="addAttendee(attendeeInput)" type="text" class="flex-1 min-w-[60px] bg-transparent border-none text-xs focus:ring-0 p-0" [placeholder]="t.translate('ATTENDEES_PLACEHOLDER')"></div></div>
    </div>
  `,
})
export class MeetingFormComponent {
  form = input.required<FormGroup>();
  attendees = input.required<string[]>();
  attendeeAdded = output<string>();
  attendeeRemoved = output<string>();

  constructor(public t: TranslationService) {}
  
  addAttendee(input: HTMLInputElement) {
    const person = input.value.trim();
    if (person) {
      this.attendeeAdded.emit(person);
      input.value = '';
    }
  }

  removeAttendee(person: string) {
    this.attendeeRemoved.emit(person);
  }
}
