import { Component, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { TranslationService } from '../../services/translation.service';

@Component({
  selector: 'app-problem-solution',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div [formGroup]="form()" class="border-t-4 border-green-500/50 bg-green-500/5 transition-all duration-300" [class.h-12]="!solutionOpen()" [class.h-64]="solutionOpen()">
      <div class="h-12 flex items-center justify-between px-6 cursor-pointer hover:bg-green-500/10" (click)="solutionOpen.set(!solutionOpen())">
          <div class="flex items-center text-green-500 font-bold text-sm uppercase tracking-wider"><svg class="w-5 h-5 mr-2 rtl:ml-2 rtl:mr-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>{{ t.translate('SOLUTION_LABEL') }}</div>
          <svg class="w-5 h-5 text-green-500 transform transition-transform" [class.rotate-180]="solutionOpen()" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
      </div>
      <div class="h-52 px-6 pb-6" [class.hidden]="!solutionOpen()"><textarea formControlName="solution" class="w-full h-full bg-green-900/10 rounded-xl border border-green-500/20 p-4 text-green-100 placeholder-green-500/50 focus:ring-green-500 focus:border-green-500 resize-none font-mono text-sm" [placeholder]="t.translate('SOLUTION_PLACEHOLDER')"></textarea></div>
    </div>
  `,
})
export class ProblemSolutionComponent {
  form = input.required<FormGroup>();
  solutionOpen = signal(false);

  constructor(public t: TranslationService) {}
}
