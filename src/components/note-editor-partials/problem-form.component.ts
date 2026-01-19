import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { TranslationService } from '../../services/translation.service';

@Component({
  selector: 'app-problem-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div [formGroup]="form()">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="flex items-center gap-2 bg-red-500/10 px-3 py-2 rounded-xl border border-red-500/20"><span class="text-xs font-bold text-red-400 uppercase tracking-wider">{{ t.translate('SEVERITY_LABEL') }}</span><select formControlName="severity" class="bg-transparent border-none text-sm font-bold text-red-200 focus:ring-0 cursor-pointer w-full"><option value="low">{{ t.translate('SEV_LOW') }}</option><option value="medium">{{ t.translate('SEV_MEDIUM') }}</option><option value="high">{{ t.translate('SEV_HIGH') }}</option><option value="critical">{{ t.translate('SEV_CRITICAL') }}</option></select></div>
        <div class="flex items-center gap-2 bg-app-surface2 px-3 py-2 rounded-xl border border-app-border"><span class="text-xs font-bold text-app-muted uppercase tracking-wider">{{ t.translate('STATUS_LABEL') }}</span><select formControlName="status" class="bg-transparent border-none text-sm font-bold text-app-text focus:ring-0 cursor-pointer w-full"><option value="open">{{ t.translate('STATUS_OPEN') }}</option><option value="solved">{{ t.translate('STATUS_SOLVED') }}</option><option value="workaround">{{ t.translate('STATUS_WORKAROUND') }}</option></select></div>
        <div class="md:col-span-2 flex items-center gap-2 border-b border-app-border focus-within:border-red-500 transition-colors py-1"><span class="text-app-muted text-xs font-bold uppercase">{{ t.translate('ENV_LABEL') }}</span><input formControlName="environment" type="text" class="w-full bg-transparent border-none text-sm text-app-text focus:ring-0 p-1" [placeholder]="t.translate('ENV_PLACEHOLDER')"></div>
      </div>
    </div>
  `,
})
export class ProblemFormComponent {
  form = input.required<FormGroup>();
  
  constructor(public t: TranslationService) {}
}
