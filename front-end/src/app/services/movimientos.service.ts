import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Movimiento {
  id?: number;
  fecha?: string | null;
  alquiler_id: number;
  propietario_id?: number | null;
  categoria_id: number;
  tipo: 'credito' | 'debito';
  monto: number;
  detalle?: string | null;
  estado?: 'pendiente' | 'confirmado' | 'anulado';
  direccion_snapshot?: string | null;
  hecho_por?: number | null;
}

@Injectable({ providedIn: 'root' })
export class MovimientosService {
  //https://sarosistema.site/backend/index.php
  //http://localhost/backend/index.php
  //https://rg-chivoclub.online/bakend/index.php
  private baseUrl = `${environment.apiBaseUrl}/index.php`;
  constructor(private http: HttpClient) {}

  categorias(): Observable<any> {
    const params = new HttpParams().set('action', 'mov_categorias_list');
    return this.http.get<any>(this.baseUrl, { params });
  }

  list(opts: any = {}): Observable<any> {
    let params = new HttpParams().set('action', 'mov_list');
    Object.keys(opts).forEach((k) => {
      if (opts[k] !== undefined && opts[k] !== null && opts[k] !== '')
        params = params.set(k, String(opts[k]));
    });
    return this.http.get<any>(this.baseUrl, { params });
  }

  create(body: any): Observable<any> {
    const params = new HttpParams().set('action', 'mov_create');
    return this.http.post<any>(this.baseUrl, body, { params });
  }

  update(id: number, body: any): Observable<any> {
    const params = new HttpParams()
      .set('action', 'mov_update')
      .set('id', String(id));
    return this.http.put<any>(this.baseUrl, body, { params });
  }

  setStatus(
    id: number,
    estado: 'pendiente' | 'confirmado' | 'anulado'
  ): Observable<any> {
    const params = new HttpParams().set('action', 'mov_set_status');
    return this.http.post<any>(this.baseUrl, { id, estado }, { params });
  }

  delete(id: number): Observable<any> {
    const params = new HttpParams()
      .set('action', 'mov_delete')
      .set('id', String(id));
    return this.http.delete<any>(this.baseUrl, { params });
  }

  seedOwner(payload: { propietario_id: number; mes: string }) {
    let params = new HttpParams()
      .set('action', 'mov_seed_owner')
      .set('propietario_id', String(payload.propietario_id))
      .set('mes', payload.mes); // <-- debe venir MM-YY

    // POST vacío, igual que create/update, pero contra index.php con params
    return this.http.post<any>(this.baseUrl, {}, { params });
  }
}
