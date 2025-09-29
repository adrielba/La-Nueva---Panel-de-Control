import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class FirmLedgerService {
  // Ajustá a tu backend:
  private baseUrl = `${environment.apiBaseUrl}/index.php`;

  constructor(private http: HttpClient) {}

  list(params: {
    q?: string;
    tipo?: 'ingreso' | 'egreso' | '';
    from?: string; // 'YYYY-MM-DD'
    to?: string; // 'YYYY-MM-DD'
    page?: number;
    pageSize?: number;
  }) {
    let p = new HttpParams().set('action', 'firm_list');
    Object.entries(params || {}).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') p = p.set(k, String(v));
    });
    return this.http.get<any>(this.baseUrl, { params: p });
  }

  summary(params: { from?: string; to?: string }) {
    let p = new HttpParams().set('action', 'firm_summary');
    Object.entries(params || {}).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') p = p.set(k, String(v));
    });
    return this.http.get<any>(this.baseUrl, { params: p });
  }

  create(payload: {
    fecha: string;
    concepto: string;
    tipo: 'ingreso' | 'egreso';
    monto: number;
  }) {
    const params = new HttpParams().set('action', 'firm_create');
    return this.http.post<any>(this.baseUrl, payload, { params });
  }

  update(
    id: number,
    payload: Partial<{
      fecha: string;
      concepto: string;
      tipo: 'ingreso' | 'egreso';
      monto: number;
    }>
  ) {
    const params = new HttpParams()
      .set('action', 'firm_update')
      .set('id', String(id));
    return this.http.post<any>(this.baseUrl, payload, { params });
  }

  remove(id: number) {
    const params = new HttpParams()
      .set('action', 'firm_delete')
      .set('id', String(id));
    return this.http.post<any>(this.baseUrl, {}, { params });
  }
}
