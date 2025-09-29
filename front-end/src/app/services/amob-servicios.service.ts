import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface AmobServ {
  id: number;
  dir_id: number;
  servicio: string;
  cliente_numero?: string | null;
  notas?: string | null;
  created_at?: string;
  updated_at?: string;
}
export interface AmobServListRes {
  success: boolean;
  rows: AmobServ[];
  total: number;
  page: number;
  pageSize: number;
}

@Injectable({ providedIn: 'root' })
export class AmobServiciosService {
  private base = `${environment.apiBaseUrl}/index.php`;

  constructor(private http: HttpClient) {}

  list(opts: { dir_id: number; q?: string; page?: number; pageSize?: number }) {
    let p = new HttpParams()
      .set('action', 'amobserv_list')
      .set('dir_id', String(opts.dir_id))
      .set('page', String(opts.page ?? 1))
      .set('pageSize', String(opts.pageSize ?? 20));
    if (opts.q) p = p.set('q', opts.q);
    return this.http.get<AmobServListRes>(this.base, { params: p });
  }

  create(payload: Partial<AmobServ>) {
    const p = new HttpParams().set('action', 'amobserv_create');
    return this.http.post<{ success: boolean; id: number }>(
      this.base + '?' + p.toString(),
      payload
    );
  }

  update(id: number, payload: Partial<AmobServ>) {
    const p = new HttpParams()
      .set('action', 'amobserv_update')
      .set('id', String(id));
    return this.http.put<{ success: boolean }>(
      this.base + '?' + p.toString(),
      payload
    );
  }

  remove(id: number) {
    const p = new HttpParams()
      .set('action', 'amobserv_delete')
      .set('id', String(id));
    return this.http.delete<{ success: boolean }>(
      this.base + '?' + p.toString()
    );
  }
}
