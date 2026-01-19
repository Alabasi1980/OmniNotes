import { Injectable, inject } from '@angular/core';
import { Note, Catalog } from '../models';
import { UtilsService } from './utils.service';

@Injectable({
  providedIn: 'root'
})
export class SeedService {
  private utils = inject(UtilsService);

  getInitialNotes(): Note[] {
    return [
      {
        id: this.utils.generateId(),
        type: 'problem',
        title: 'Angular Signal Effect Glitch',
        content: 'I am encountering an `ExpressionChangedAfterItHasBeenCheckedError` when updating a signal inside an effect.',
        metadata: {
           solution: 'Wrap the update in `untracked` or use `computed` if it is derived state. Avoid writing to signals inside effects unless absolutely necessary.'
        },
        tags: ['Angular', 'Signals', 'Bug'],
        catalogId: 'c1',
        attachments: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isArchived: false
      },
      {
        id: this.utils.generateId(),
        type: 'link',
        title: 'Tailwind CSS Documentation',
        content: 'The official documentation is the best place to find class references.',
        metadata: {
           url: 'https://tailwindcss.com/docs'
        },
        tags: ['CSS', 'Reference'],
        catalogId: 'c1',
        attachments: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isArchived: false
      },
      {
        id: this.utils.generateId(),
        type: 'general',
        title: 'Grocery List - Friday',
        content: '- Milk\n- Eggs\n- Bread\n- Coffee beans',
        metadata: {},
        tags: ['Personal', 'Shopping'],
        catalogId: 'c3',
        attachments: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isArchived: false
      }
    ];
  }

  getInitialCatalogs(): Catalog[] {
    return [
      { id: 'c1', name: 'Programming' },
      { id: 'c2', name: 'Cooking' },
      { id: 'c3', name: 'Daily Life' }
    ];
  }
}