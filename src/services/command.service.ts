import { Injectable, signal, inject, computed } from '@angular/core';
import { Router } from '@angular/router';
import { ThemeService } from './theme.service';
import { TranslationService } from './translation.service';
import { DbService } from './db.service';
import { Note } from '../models';

export interface Command {
  id: string;
  title: string;
  subtitle?: string;
  icon: string;
  section: 'nav' | 'action' | 'note';
  shortcut?: string;
  action: () => void;
}

@Injectable({
  providedIn: 'root'
})
export class CommandService {
  private router = inject(Router);
  private theme = inject(ThemeService);
  private t = inject(TranslationService);
  private db = inject(DbService);

  isOpen = signal(false);
  query = signal('');

  // Static System Commands
  private systemCommands = computed<Command[]>(() => [
    {
      id: 'nav-home',
      title: this.t.translate('ALL_NOTES'),
      icon: '🏠',
      section: 'nav',
      action: () => this.navigate('/')
    },
    {
      id: 'nav-new',
      title: this.t.translate('NEW_ENTRY'),
      icon: '➕',
      section: 'nav',
      shortcut: 'N',
      action: () => this.navigate('/new')
    },
    {
      id: 'nav-catalogs',
      title: this.t.translate('CATALOGS'),
      icon: '📂',
      section: 'nav',
      action: () => this.navigate('/catalogs')
    },
    {
      id: 'nav-settings',
      title: this.t.translate('SETTINGS'),
      icon: '⚙️',
      section: 'nav',
      action: () => this.navigate('/settings')
    },
    {
      id: 'act-theme',
      title: 'Toggle Theme',
      subtitle: `Switch to ${this.theme.currentTheme() === 'cosmic' ? 'Zen' : 'Cosmic'}`,
      icon: '🎨',
      section: 'action',
      action: () => {
        this.theme.toggle();
        this.close();
      }
    },
    {
      id: 'act-lang',
      title: 'Switch Language',
      subtitle: this.t.currentLang() === 'en' ? 'Arabic' : 'English',
      icon: '🌍',
      section: 'action',
      action: () => {
        this.t.toggle();
        this.close();
      }
    }
  ]);

  // Derived filtered commands
  filteredCommands = computed(() => {
    const q = this.query().toLowerCase().trim();
    const system = this.systemCommands();
    
    // Notes as commands
    const notes = this.db.notes().map(n => ({
      id: `note-${n.id}`,
      title: n.title,
      subtitle: n.tags.map(t => `#${t}`).join(' '),
      icon: this.getNoteIcon(n.type),
      section: 'note' as const,
      action: () => this.navigate(`/note/${n.id}`)
    }));

    const all = [...system, ...notes];

    if (!q) return all.slice(0, 15); // Show top 15 default

    return all.filter(cmd => 
      cmd.title.toLowerCase().includes(q) || 
      (cmd.subtitle && cmd.subtitle.toLowerCase().includes(q))
    ).slice(0, 20);
  });

  toggle() {
    this.isOpen.update(v => !v);
    if (this.isOpen()) this.query.set('');
  }

  open() {
    this.isOpen.set(true);
    this.query.set('');
  }

  close() {
    this.isOpen.set(false);
  }

  setQuery(q: string) {
    this.query.set(q);
  }

  private navigate(path: string) {
    this.router.navigate([path]);
    this.close();
  }

  private getNoteIcon(type: string): string {
    switch (type) {
      case 'problem': return '🐞';
      case 'lesson': return '📚';
      case 'link': return '🔗';
      case 'video': return '🎥';
      default: return '📝';
    }
  }
}