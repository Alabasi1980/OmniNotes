import { Routes } from '@angular/router';
import { NoteListComponent } from './pages/note-list.component';
import { NoteDetailComponent } from './pages/note-detail.component';
import { SettingsComponent } from './pages/settings.component';
import { CatalogsComponent } from './pages/catalogs.component';

export const routes: Routes = [
  { path: '', component: NoteListComponent },
  { path: 'new', component: NoteDetailComponent },
  { path: 'note/:id', component: NoteDetailComponent },
  { path: 'catalogs', component: CatalogsComponent },
  { path: 'settings', component: SettingsComponent },
  { path: '**', redirectTo: '' }
];