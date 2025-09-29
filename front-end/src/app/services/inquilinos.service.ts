import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Inquilino {
  id?: number;
  nombre: string;
  dni_cuit?: string | null;
  telefono?: string | null;
  email?: string | null;
  notas?: string | null;
  garantes?: string | null; // NUEVO
  alquiler?: number | null; // NUEVO
}

@Injectable({
  providedIn: 'root',
})
export class InquilinosService {
  //https://rg-chivoclub.online/bakend/index.php
  //http://localhost/backend/index.php
  //https://sarosistema.site/backend/index.php
  private baseUrl = `${environment.apiBaseUrl}/index.php`;
  constructor(private http: HttpClient) {}

  list(
    opts: { q?: string; page?: number; pageSize?: number } = {}
  ): Observable<any> {
    let params = new HttpParams().set('action', 'inquilinos_list');
    if (opts.q) params = params.set('q', opts.q);
    params = params
      .set('page', String(opts.page ?? 1))
      .set('pageSize', String(opts.pageSize ?? 20));
    return this.http.get<any>(this.baseUrl, { params });
  }

  get(id: number): Observable<any> {
    const params = new HttpParams()
      .set('action', 'inquilinos_get')
      .set('id', String(id));
    return this.http.get<any>(this.baseUrl, { params });
  }

  create(body: Inquilino): Observable<any> {
    const params = new HttpParams().set('action', 'inquilinos_create');
    return this.http.post<any>(this.baseUrl, body, { params });
  }

  update(id: number, body: Partial<Inquilino>): Observable<any> {
    const params = new HttpParams()
      .set('action', 'inquilinos_update')
      .set('id', String(id));
    return this.http.put<any>(this.baseUrl, body, { params });
  }

  delete(id: number): Observable<any> {
    const params = new HttpParams()
      .set('action', 'inquilinos_delete')
      .set('id', String(id));
    return this.http.delete<any>(this.baseUrl, { params });
  }

  detail(opts: { id?: number; nombre?: string }) {
    let params = new HttpParams().set('action', 'inquilinos_detail');
    if (opts.id) params = params.set('id', String(opts.id));
    if (opts.nombre) params = params.set('nombre', opts.nombre);
    return this.http.get<any>(this.baseUrl, { params });
  }

  importFromAlquileres(): Observable<any> {
    const params = new HttpParams().set(
      'action',
      'inquilinos_import_alquileres'
    );
    // POST vacío (o GET). Uso POST por claridad semántica (opera sobre datos).
    return this.http.post<any>(this.baseUrl, {}, { params });
  }
}
