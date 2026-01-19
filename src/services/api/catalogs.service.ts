import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Catalog } from '../../models';
import { ConfigService } from '../config.service';
import { UtilsService } from '../utils.service';
import { SeedService } from '../seed.service';

@Injectable({
  providedIn: 'root'
})
export class CatalogsApiService {
  private http: HttpClient = inject(HttpClient);
  private config = inject(ConfigService);
  private utils = inject(UtilsService);
  private seeder = inject(SeedService);
  
  private STORAGE_KEY = 'omni_catalogs_data';

  constructor() {
    if (!this.config.state().useRealApi) {
      this.seedData();
    }
  }

  private get apiUrl() {
    return `${this.config.state().apiBaseUrl}/api/catalogs`;
  }

  // Step 4: pure HTTP implementation for Catalogs
  getAll(): Observable<Catalog[]> {
    if (this.config.state().useRealApi) {
      return this.http.get<Catalog[]>(this.apiUrl);
    } else {
      try {
        const cats = this.getLocal();
        return of(cats).pipe(delay(200));
      } catch (err) {
        return throwError(() => err);
      }
    }
  }

  create(catalog: Catalog): Observable<Catalog> {
    if (this.config.state().useRealApi) {
      const body = { name: catalog.name, parentId: catalog.parentId ?? null };
      return this.http.post<Catalog>(this.apiUrl, body);
    } else {
      try {
        const cats = this.getLocal();
        const newCat = { ...catalog };
        if (!newCat.id) newCat.id = this.utils.generateId();
        
        cats.push(newCat);
        this.saveLocal(cats);
        return of(newCat).pipe(delay(300));
      } catch (err) {
        return throwError(() => err);
      }
    }
  }

  update(id: string, catalog: Partial<Catalog>): Observable<Catalog> {
    if (this.config.state().useRealApi) {
      return this.http.put<Catalog>(`${this.apiUrl}/${id}`, catalog);
    } else {
      try {
        const cats = this.getLocal();
        const index = cats.findIndex(c => c.id === id);
        if (index !== -1) {
          cats[index] = { ...cats[index], ...catalog };
          this.saveLocal(cats);
          return of(cats[index]).pipe(delay(300));
        }
        return throwError(() => new Error('Catalog not found'));
      } catch (err) {
        return throwError(() => err);
      }
    }
  }

  delete(id: string): Observable<void> {
    if (this.config.state().useRealApi) {
      return this.http.delete<void>(`${this.apiUrl}/${id}`);
    } else {
      try {
        const cats = this.getLocal();
        const filtered = cats.filter(c => c.id !== id);
        this.saveLocal(filtered);
        return of(undefined).pipe(delay(300));
      } catch (err) {
        return throwError(() => err);
      }
    }
  }

  private getLocal(): Catalog[] {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch (e) {
      console.warn('Corrupt catalog data in localStorage, resetting.', e);
      localStorage.removeItem(this.STORAGE_KEY);
      return [];
    }
  }

  private saveLocal(cats: Catalog[]) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cats));
    } catch (e) {
      console.error('Failed to save catalogs', e);
    }
  }

  private seedData() {
    if (!localStorage.getItem(this.STORAGE_KEY)) {
      this.saveLocal(this.seeder.getInitialCatalogs());
    }
  }
}