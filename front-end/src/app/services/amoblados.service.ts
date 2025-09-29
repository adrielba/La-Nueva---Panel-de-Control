import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AmobDir {
  id: number;
  direccion: string;
  created_at?: string;
}

export interface AmobMov {
  id: number;
  dir_id: number;
  fecha: string;
  tipo: 'DEBITO' | 'CREDITO';
  monto: number;
  detalle: string;
  estado: 'pendiente' | 'confirmado';
  // snapshots informativos
  alquiler?: number;
  adm?: number;
  neto?: number;
}

export interface AmobladoListOpts {
  q?: string;

  // día exacto o rango
  fecha?: string; // YYYY-MM-DD
  fecha_from?: string;
  fecha_to?: string;

  // montos
  alq_min?: number;
  alq_max?: number;
  adm_min?: number;
  adm_max?: number;
  neto_min?: number;
  neto_max?: number;

  // estado
  estado?: string[]; // ['pagado','pendiente','no pagado','nulo']

  // paginado/orden
  page?: number;
  pageSize?: number;
  sort?: string;
  dir?: 'asc' | 'desc';
}

@Injectable({ providedIn: 'root' })
export class AmobladosService {
  private readonly baseUrl = `${environment.apiBaseUrl}/index.php`;

  constructor(private http: HttpClient) {}

  list(opts: AmobladoListOpts = {}): Observable<any> {
    let params = new HttpParams().set('action', 'amoblados_list');

    if (opts.q) params = params.set('q', opts.q);
    if (opts.fecha) params = params.set('fecha', opts.fecha);
    if (opts.fecha_from) params = params.set('fecha_from', opts.fecha_from);
    if (opts.fecha_to) params = params.set('fecha_to', opts.fecha_to);

    if (opts.alq_min != null)
      params = params.set('alq_min', String(opts.alq_min));
    if (opts.alq_max != null)
      params = params.set('alq_max', String(opts.alq_max));
    if (opts.adm_min != null)
      params = params.set('adm_min', String(opts.adm_min));
    if (opts.adm_max != null)
      params = params.set('adm_max', String(opts.adm_max));
    if (opts.neto_min != null)
      params = params.set('neto_min', String(opts.neto_min));
    if (opts.neto_max != null)
      params = params.set('neto_max', String(opts.neto_max));

    if (opts.estado?.length)
      params = params.set('estado', opts.estado.join(','));

    params = params
      .set('page', String(opts.page ?? 1))
      .set('pageSize', String(opts.pageSize ?? 20));

    if (opts.sort) params = params.set('sort', opts.sort);
    if (opts.dir) params = params.set('dir', opts.dir);

    return this.http.get<any>(this.baseUrl, { params });
  }

  get(id: number): Observable<any> {
    const params = new HttpParams()
      .set('action', 'amoblados_get')
      .set('id', String(id));
    return this.http.get<any>(this.baseUrl, { params });
  }

  create(payload: any): Observable<any> {
    const params = new HttpParams().set('action', 'amoblados_create');
    return this.http.post<any>(this.baseUrl, payload, { params });
  }

  update(id: number, payload: any): Observable<any> {
    const params = new HttpParams()
      .set('action', 'amoblados_update')
      .set('id', String(id));
    return this.http.put<any>(this.baseUrl, payload, { params });
  }

  remove(id: number): Observable<any> {
    const params = new HttpParams()
      .set('action', 'amoblados_delete')
      .set('id', String(id));
    return this.http.delete<any>(this.baseUrl, { params });
  }

  suggestDirecciones(q: string) {
    const params = new HttpParams()
      .set('action', 'amoblados_dir_suggest')
      .set('q', q);
    return this.http.get<any>(this.baseUrl, { params });
  }

  createBulk(payload: any) {
    const params = new HttpParams().set('action', 'amoblados_create_bulk');
    return this.http.post<any>(this.baseUrl, payload, { params });
  }

  // ⬇️ dentro de la clase AmobladosService
  listDirs(q?: string) {
    const params: any = { action: 'amobdirs_list', pageSize: 999 };
    if (q) params.q = q;
    return this.http.get<any>(this.baseUrl, { params });
  }

  deleteDir(id: number) {
    return this.http.delete<any>(
      `${this.baseUrl}?action=amobdirs_delete&id=${id}`
    );
  }

  // Movimientos por dirección
  movsByDir(
    dirId: number,
    fecha?: string,
    fecha_from?: string,
    fecha_to?: string
  ) {
    const params: any = { action: 'amobmovs_list', dir_id: dirId };
    if (fecha) params.fecha = fecha; // YYYY-MM-DD
    if (fecha_from) params.fecha_from = fecha_from;
    if (fecha_to) params.fecha_to = fecha_to;
    return this.http.get<any>(this.baseUrl, { params });
  }

  // CREAR MOV
  createAmobMov(payload: {
    dir_id: number;
    fecha: string; // YYYY-MM-DD
    tipo: 'CREDITO' | 'DEBITO';
    monto: number;
    detalle?: string;
    estado?: 'pendiente' | 'confirmado';
  }) {
    return this.http.post<any>(
      `${this.baseUrl}?action=amobmovs_create`,
      payload
    );
  }

  amobMovsSummary(
    dirId: number,
    fecha?: string,
    fecha_from?: string,
    fecha_to?: string
  ) {
    // si viene fecha exacta, la convierto a rango [fecha..fecha]
    const params: any = { action: 'amobmovs_summary', dir_id: dirId };
    if (fecha) {
      params.fecha_from = fecha;
      params.fecha_to = fecha;
    }
    if (fecha_from) params.fecha_from = fecha_from;
    if (fecha_to) params.fecha_to = fecha_to;
    return this.http.get<any>(this.baseUrl, { params });
  }

  deleteAmobMov(id: number) {
    return this.http.delete<any>(
      `${this.baseUrl}?action=amobmovs_delete&id=${id}`
    );
  }
}
