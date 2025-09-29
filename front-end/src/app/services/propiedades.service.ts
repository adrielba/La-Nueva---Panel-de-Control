import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PropsListOpts {
  q?: string;
  tipo?: string; // 'privado' | 'comercial' | '' (todas)
  propietario_id?: number;
  page?: number;
  pageSize?: number;
  sort?: 'id' | 'direccion' | 'propietario' | 'domicilio_tipo';
  dir?: 'asc' | 'desc';
}

@Injectable({ providedIn: 'root' })
export class PropiedadesService {
  //http://localhost/backend/index.php
  //https://rg-chivoclub.online/bakend/index.php
  private baseUrl = `${environment.apiBaseUrl}/index.php`;

  constructor(private http: HttpClient) {}

  list(opts: PropsListOpts = {}): Observable<any> {
    let params = new HttpParams().set('action', 'props_list');
    if (opts.q) params = params.set('q', opts.q);
    if (opts.tipo !== undefined && opts.tipo !== null)
      params = params.set('tipo', String(opts.tipo));
    if (opts.propietario_id)
      params = params.set('propietario_id', String(opts.propietario_id));
    params = params
      .set('page', String(opts.page ?? 1))
      .set('pageSize', String(opts.pageSize ?? 20))
      .set('sort', String(opts.sort ?? 'direccion'))
      .set('dir', String(opts.dir ?? 'asc'));
    return this.http.get<any>(this.baseUrl, { params });
  }

  create(body: any): Observable<any> {
    const params = new HttpParams().set('action', 'props_create');
    return this.http.post<any>(this.baseUrl, body, { params });
  }

  update(id: number, body: any): Observable<any> {
    const params = new HttpParams()
      .set('action', 'props_update')
      .set('id', String(id));
    return this.http.put<any>(this.baseUrl, body, { params });
  }

  delete(id: number): Observable<any> {
    const params = new HttpParams()
      .set('action', 'props_delete')
      .set('id', String(id));
    return this.http.delete<any>(this.baseUrl, { params });
  }

  sync(): Observable<any> {
    const params = new HttpParams().set('action', 'props_sync');
    return this.http.post<any>(this.baseUrl, {}, { params });
  }

  cleanup(): Observable<any> {
    const params = new HttpParams().set('action', 'props_cleanup');
    return this.http.post<any>(this.baseUrl, {}, { params });
  }
  detail(id: number) {
    const params = new HttpParams()
      .set('action', 'props_detail')
      .set('id', String(id));
    return this.http.get<any>(this.baseUrl, { params });
  }
}
