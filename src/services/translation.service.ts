import { Injectable, signal, computed, effect } from '@angular/core';
import { NoteType } from '../models';
import { enTranslations } from './translations/en';
import { arTranslations } from './translations/ar';

export type Lang = 'en' | 'ar';

const DICTIONARY: Record<Lang, Record<string, string>> = {
  en: enTranslations,
  ar: arTranslations
};

@Injectable({ providedIn: 'root' })
export class TranslationService {
  currentLang = signal<Lang>('en');
  dir = computed(() => this.currentLang() === 'ar' ? 'rtl' : 'ltr');
  
  constructor() {
    const saved = localStorage.getItem('omni_lang') as Lang;
    if (saved && (saved === 'en' || saved === 'ar')) {
      this.currentLang.set(saved);
    }
    
    // Sync with DOM
    effect(() => {
      document.documentElement.lang = this.currentLang();
      document.documentElement.dir = this.dir();
      localStorage.setItem('omni_lang', this.currentLang());
    });
  }

  toggle() {
    this.currentLang.update(l => l === 'en' ? 'ar' : 'en');
  }

  translate(key: string): string {
    return DICTIONARY[this.currentLang()][key] || key;
  }

  getNoteTypeName(type: NoteType): string {
    switch(type) {
       case 'general': return this.translate('TYPE_GENERAL');
       case 'problem': return this.translate('TYPE_PROBLEM');
       case 'lesson': return this.translate('TYPE_LESSON');
       case 'link': return this.translate('TYPE_LINK');
       case 'video': return this.translate('TYPE_VIDEO');
       case 'meeting': return this.translate('TYPE_MEETING');
       default: return type as string;
    }
 }
}
