import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DbService } from '../services/db.service';
import { TranslationService } from '../services/translation.service';
import { Catalog } from '../models';

@Component({
  selector: 'app-catalogs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-8 pb-20">
      
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h2 class="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-500">{{ t.translate('CATALOGS') }}</h2>
          <p class="text-slate-400 mt-1">{{ t.translate('CATALOGS_DESC') }}</p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <!-- Left: Create/Edit Form -->
        <div class="lg:col-span-1">
          <div class="glass-panel rounded-2xl p-6 sticky top-24">
            <h3 class="text-lg font-bold text-slate-200 mb-6 flex items-center">
              <span class="mr-2 text-xl">{{ editingCatalogId() ? '✏️' : '✨' }}</span>
              {{ editingCatalogId() ? t.translate('UPDATE_CATALOG') : t.translate('ADD_CATALOG') }}
            </h3>
            
            <form (submit)="saveCatalog($event)" class="space-y-5">
              <div>
                <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{{ t.translate('CATALOG_NAME') }}</label>
                <input 
                  type="text" 
                  [(ngModel)]="newName" 
                  name="name" 
                  required
                  class="block w-full rounded-xl border-white/10 bg-black/20 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-3 px-4 placeholder-slate-600"
                  [placeholder]="t.translate('CATALOG_NAME')"
                >
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{{ t.translate('PARENT_CATALOG') }}</label>
                <select 
                  [(ngModel)]="selectedParentId" 
                  name="parentId"
                  class="block w-full rounded-xl border-white/10 bg-black/20 text-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-3 px-4"
                >
                  <option [ngValue]="null" class="bg-slate-900">{{ t.translate('NO_PARENT') }}</option>
                  @for (cat of db.catalogs(); track cat.id) {
                    @if (cat.id !== editingCatalogId()) {
                       <option [value]="cat.id" class="bg-slate-900">{{ cat.name }}</option>
                    }
                  }
                </select>
              </div>

              <div class="flex gap-3 pt-2">
                 <button 
                   type="submit" 
                   [disabled]="!newName || isSubmitting()"
                   class="flex-1 flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-[0_0_15px_rgba(79,70,229,0.4)] text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                   @if (isSubmitting()) {
                      <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                   }
                   {{ editingCatalogId() ? t.translate('UPDATE_CATALOG') : t.translate('ADD_CATALOG') }}
                 </button>
                 
                 @if (editingCatalogId()) {
                    <button 
                       type="button" 
                       (click)="cancelEdit()"
                       class="px-4 py-2 border border-white/10 rounded-xl shadow-sm text-sm font-bold text-slate-400 hover:bg-white/10 transition-colors">
                       {{ t.translate('CANCEL') }}
                    </button>
                 }
              </div>
            </form>
          </div>
        </div>

        <!-- Right: List -->
        <div class="lg:col-span-2">
           <div class="glass-panel rounded-2xl overflow-hidden border border-white/10">
              <table class="min-w-full divide-y divide-white/5">
                 <thead class="bg-white/5">
                    <tr>
                       <th scope="col" class="px-6 py-4 text-left rtl:text-right text-xs font-bold text-slate-300 uppercase tracking-wider">
                          {{ t.translate('CATALOG_NAME') }}
                       </th>
                       <th scope="col" class="px-6 py-4 text-left rtl:text-right text-xs font-bold text-slate-300 uppercase tracking-wider">
                          {{ t.translate('PARENT_CATALOG') }}
                       </th>
                       <th scope="col" class="px-6 py-4 text-right rtl:text-left text-xs font-bold text-slate-300 uppercase tracking-wider">
                          {{ t.translate('ACTIONS') }}
                       </th>
                    </tr>
                 </thead>
                 <tbody class="divide-y divide-white/5 bg-transparent">
                    @for (cat of db.catalogs(); track cat.id) {
                       <tr class="hover:bg-white/5 transition-colors group">
                          <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                             <div class="flex items-center">
                                <span class="mr-3 text-lg opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all">📂</span>
                                {{ cat.name }}
                             </div>
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                             @if (getParentName(cat.parentId)) {
                                <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-white/10">
                                   {{ getParentName(cat.parentId) }}
                                </span>
                             } @else {
                                <span class="text-slate-600">-</span>
                             }
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap text-right rtl:text-left text-sm font-medium">
                             <button (click)="startEdit(cat)" class="text-indigo-400 hover:text-indigo-300 mx-2 p-1 hover:bg-white/10 rounded transition-colors">
                                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                             </button>
                             <button (click)="deleteCatalog(cat)" class="text-red-400 hover:text-red-300 mx-2 p-1 hover:bg-white/10 rounded transition-colors">
                                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                             </button>
                          </td>
                       </tr>
                    }
                    @empty {
                       <tr>
                          <td colspan="3" class="px-6 py-16 text-center text-sm text-slate-500">
                             <div class="mb-2 text-2xl">📭</div>
                             {{ t.translate('NO_CATALOGS') }}
                          </td>
                       </tr>
                    }
                 </tbody>
              </table>
           </div>
        </div>
      </div>
    </div>
  `
})
export class CatalogsComponent {
  db = inject(DbService);
  t = inject(TranslationService);
  
  newName = '';
  selectedParentId: string | null = null;
  editingCatalogId = signal<string | null>(null);
  isSubmitting = signal(false);

  getParentName(parentId?: string): string | undefined {
    if (!parentId) return undefined;
    return this.db.catalogs().find(c => c.id === parentId)?.name;
  }

  saveCatalog(event: Event) {
    event.preventDefault();
    if (!this.newName) return;

    this.isSubmitting.set(true);
    const parent = this.selectedParentId || undefined;
    const editingId = this.editingCatalogId();

    let obs$;
    if (editingId) obs$ = this.db.updateCatalog(editingId, this.newName, parent);
    else obs$ = this.db.addCatalog(this.newName, parent);

    obs$.subscribe({
      next: () => this.resetForm(),
      error: (err) => {
        console.error(err);
        alert('Operation failed');
        this.isSubmitting.set(false);
      }
    });
  }

  startEdit(cat: Catalog) {
     this.editingCatalogId.set(cat.id);
     this.newName = cat.name;
     this.selectedParentId = cat.parentId || null;
  }

  cancelEdit() { this.resetForm(); }

  deleteCatalog(cat: Catalog) {
     if (confirm(this.t.translate('DELETE_CATALOG_CONFIRM'))) {
        this.db.deleteCatalog(cat.id).subscribe({
           error: () => alert('Failed to delete. Catalog might contain notes.')
        });
     }
  }

  private resetForm() {
    this.newName = '';
    this.selectedParentId = null;
    this.editingCatalogId.set(null);
    this.isSubmitting.set(false);
  }
}
