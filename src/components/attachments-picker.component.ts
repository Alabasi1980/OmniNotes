import { Component, input, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Attachment } from '../models';
import { TranslationService } from '../services/translation.service';
import { UtilsService } from '../services/utils.service';

@Component({
  selector: 'app-attachments-picker',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
       @for (att of attachments(); track att.id) {
          <div class="relative group border border-white/10 rounded-xl p-2 flex flex-col items-center bg-white/5 hover:bg-white/10 transition-colors">
             <div class="h-16 w-full bg-slate-900/50 rounded-lg mb-2 flex items-center justify-center overflow-hidden border border-white/5">
                @if (att.type.startsWith('image/')) {
                   <img [src]="utils.resolveUrl(att.data)" class="h-full w-full object-contain">
                } @else {
                   <span class="text-xs text-slate-400 font-mono">FILE</span>
                }
             </div>
             <span class="text-xs truncate w-full text-center text-slate-300">{{ att.name }}</span>
             <button type="button" (click)="onRemove(att.id)" class="absolute -top-2 -right-2 bg-red-500/80 hover:bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-md opacity-0 group-hover:opacity-100 transition-all">
                &times;
             </button>
          </div>
       }
       
       <!-- Upload Button -->
       <label [class.opacity-50]="isUploading()" [class.cursor-not-allowed]="isUploading()" class="border-2 border-dashed border-white/20 rounded-xl p-4 flex flex-col items-center justify-center text-slate-400 hover:border-indigo-500 hover:text-indigo-400 hover:bg-white/5 cursor-pointer transition-all h-32 relative group">
          @if (isUploading()) {
            <svg class="animate-spin h-6 w-6 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          } @else {
            <svg class="h-8 w-8 mb-2 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            <span class="text-xs font-bold uppercase tracking-wider">{{ t.translate('ADD_FILE') }}</span>
            <span class="text-[10px] text-slate-500 mt-1">(Max 10MB)</span>
            <input 
               type="file" 
               class="hidden" 
               (change)="onFileSelected($event)" 
               multiple 
               [disabled]="isUploading()"
               accept="image/*,application/pdf,text/plain,text/markdown,.json"
            >
          }
       </label>
    </div>
  `
})
export class AttachmentsPickerComponent {
  t = inject(TranslationService);
  utils = inject(UtilsService);
  
  attachments = input.required<Attachment[]>();
  isUploading = input<boolean>(false);
  
  filesSelected = output<File[]>();
  remove = output<string>();

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const files = Array.from(input.files);
      const validFiles: File[] = [];
      const errors: string[] = [];
      const MAX_MB = 10;

      files.forEach(file => {
        if (file.size > MAX_MB * 1024 * 1024) {
          errors.push(`${file.name}: ${this.t.translate('FILE_TOO_LARGE')}`);
        } else {
          validFiles.push(file);
        }
      });

      if (errors.length > 0) {
        alert(errors.join('\n'));
      }

      if (validFiles.length > 0) {
        this.filesSelected.emit(validFiles);
      }
      
      input.value = ''; 
    }
  }

  onRemove(id: string) {
    this.remove.emit(id);
  }
}