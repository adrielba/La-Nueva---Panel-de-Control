import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Propietario {
  id?: number;
  nombre: string;
  cuit_cuil?: string | null;
  telefono?: string | null;
  email?: string | null;
  banco_alias?: string | null;
  notas?: string | null;
  propiedades?: number;
}

@Injectable({ providedIn: 'root' })
export class PropietariosService {
  //https://sarosistema.site/backend/index.php
  //http://localhost/backend/index.php
  //https://rg-chivoclub.online/bakend/index.php
  private baseUrl = `${environment.apiBaseUrl}/index.php`;

  constructor(private http: HttpClient) {}

  list(
    opts: { q?: string; page?: number; pageSize?: number } = {}
  ): Observable<any> {
    let params = new HttpParams().set('action', 'propietarios_list');
    if (opts.q) params = params.set('q', opts.q);
    params = params
      .set('page', String(opts.page ?? 1))
      .set('pageSize', String(opts.pageSize ?? 20));
    return this.http.get<any>(this.baseUrl, { params });
  }

  get(id: number): Observable<any> {
    const params = new HttpParams()
      .set('action', 'propietarios_get')
      .set('id', String(id));
    return this.http.get<any>(this.baseUrl, { params });
  }

  // NUEVO: propiedades agrupadas
  props(id: number): Observable<any> {
    const params = new HttpParams()
      .set('action', 'propietarios_props')
      .set('id', String(id));
    return this.http.get<any>(this.baseUrl, { params });
  }

  create(body: Propietario): Observable<any> {
    const params = new HttpParams().set('action', 'propietarios_create');
    return this.http.post<any>(this.baseUrl, body, { params });
  }

  update(id: number, body: Partial<Propietario>): Observable<any> {
    const params = new HttpParams()
      .set('action', 'propietarios_update')
      .set('id', String(id));
    return this.http.put<any>(this.baseUrl, body, { params });
  }

  delete(id: number): Observable<any> {
    const params = new HttpParams()
      .set('action', 'propietarios_delete')
      .set('id', String(id));
    return this.http.delete<any>(this.baseUrl, { params });
  }

  // Detalle básico (propietario + alquileres crudos si querés)
  detalle(id: number): Observable<any> {
    const params = new HttpParams()
      .set('action', 'propietarios_detalle')
      .set('id', String(id));
    return this.http.get<any>(this.baseUrl, { params });
  }
}
