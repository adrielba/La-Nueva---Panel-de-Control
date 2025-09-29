import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PropServiciosService {
  // Ajustá la URL según tu entorno
  private baseUrl = `${environment.apiBaseUrl}/index.php`;

  constructor(private http: HttpClient) {}

  list(
    propiedad_id: number,
    opts: { q?: string; page?: number; pageSize?: number } = {}
  ): Observable<any> {
    let params = new HttpParams()
      .set('action', 'propserv_list')
      .set('propiedad_id', String(propiedad_id))
      .set('page', String(opts.page ?? 1))
      .set('pageSize', String(opts.pageSize ?? 20));
    if (opts.q) params = params.set('q', opts.q);
    return this.http.get<any>(this.baseUrl, { params });
  }

  create(body: {
    propiedad_id: number;
    servicio: string;
    cliente_numero?: string;
    notas?: string;
  }): Observable<any> {
    const params = new HttpParams().set('action', 'propserv_create');
    return this.http.post<any>(this.baseUrl, body, { params });
  }

  update(
    id: number,
    body: Partial<{ servicio: string; cliente_numero: string; notas: string }>
  ): Observable<any> {
    const params = new HttpParams()
      .set('action', 'propserv_update')
      .set('id', String(id));
    return this.http.put<any>(this.baseUrl, body, { params });
  }

  delete(id: number): Observable<any> {
    const params = new HttpParams()
      .set('action', 'propserv_delete')
      .set('id', String(id));
    return this.http.delete<any>(this.baseUrl, { params });
  }
}
