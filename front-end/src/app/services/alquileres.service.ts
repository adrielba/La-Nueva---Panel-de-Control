import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ListOpts {
  mes?: string;
  q?: string;
  page?: number;
  pageSize?: number;
  sort?: string;
  dir?: 'asc' | 'desc';
  propietario_id?: number;
  alq_min?: number;
  alq_max?: number;
  adm_min?: number;
  adm_max?: number;
  neto_min?: number;
  neto_max?: number;
  alta_from?: string;
  alta_to?: string;
  cambia_from?: string;
  cambia_to?: string;
  pago_from?: string;
  pago_to?: string;
  fin_from?: string;
  fin_to?: string;
  estado?: string[]; // ['pagado','pendiente','no pagado','nulo']
}

@Injectable({ providedIn: 'root' })
export class AlquileresService {
  //https://rg-chivoclub.online/bakend/index.php
  //http://localhost/backend/index.php
  //https://sarosistema.site/backend/index.php
  private readonly baseUrl = `${environment.apiBaseUrl}/index.php`;
  //private readonly baseUrl = 'http://localhost/backend/index.php';

  constructor(private http: HttpClient) {}

  /** ¡OJO!: esta firma acepta un OBJETO, no un string */
  list(opts: ListOpts = {}): Observable<any> {
    let params = new HttpParams().set('action', 'alquileres_list');

    // básicos
    if (opts.mes) params = params.set('mes', opts.mes);
    if (opts.q) params = params.set('q', opts.q);
    if (opts.propietario_id != null) {
      params = params.set('propietario_id', String(opts.propietario_id));
    }
    params = params
      .set('page', String(opts.page ?? 1))
      .set('pageSize', String(opts.pageSize ?? 20));
    if (opts.sort) params = params.set('sort', opts.sort);
    if (opts.dir) params = params.set('dir', opts.dir);

    // montos
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

    // fechas (YYYY-MM-DD)
    if (opts.alta_from) params = params.set('alta_from', opts.alta_from);
    if (opts.alta_to) params = params.set('alta_to', opts.alta_to);
    if (opts.cambia_from) params = params.set('cambia_from', opts.cambia_from);
    if (opts.cambia_to) params = params.set('cambia_to', opts.cambia_to);
    if (opts.pago_from) params = params.set('pago_from', opts.pago_from);
    if (opts.pago_to) params = params.set('pago_to', opts.pago_to);
    if (opts.fin_from) params = params.set('fin_from', opts.fin_from);
    if (opts.fin_to) params = params.set('fin_to', opts.fin_to);

    // estado (CSV para el backend)
    if (opts.estado && opts.estado.length) {
      params = params.set('estado', opts.estado.join(','));
    }

    return this.http.get<any>(this.baseUrl, { params });
  }

  create(payload: any): Observable<any> {
    const params = new HttpParams().set('action', 'alquileres_create');
    return this.http.post<any>(this.baseUrl, payload, { params });
  }

  get(id: number): Observable<any> {
    const params = new HttpParams()
      .set('action', 'alquileres_get')
      .set('id', String(id));
    return this.http.get<any>(this.baseUrl, { params });
  }

  update(id: number, payload: any): Observable<any> {
    const params = new HttpParams()
      .set('action', 'alquileres_update')
      .set('id', String(id));
    return this.http.put<any>(this.baseUrl, payload, { params });
  }

  remove(id: number): Observable<any> {
    const params = new HttpParams()
      .set('action', 'alquileres_delete')
      .set('id', String(id));
    return this.http.delete<any>(this.baseUrl, { params });
  }
}
