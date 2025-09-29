import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class LiquidacionesService {
  // Ajusta si tu backend cambia
  private baseUrl = `${environment.apiBaseUrl}/index.php`;

  constructor(private http: HttpClient) {}

  /** Listar plantillas activas */
  templates() {
    const params = new HttpParams().set('action', 'liq_templates_list');
    return this.http.get<any>(this.baseUrl, { params });
  }

  /** Crear liquidación con plantilla */
  crear(
    propietario_id: number,
    anio: number,
    mes: number,
    template_id: number
  ) {
    const params = new HttpParams().set('action', 'liquidaciones_create');
    const body = { propietario_id, anio, mes, template_id };
    return this.http.post<any>(this.baseUrl, body, { params });
  }

  /** Traer hoja */
  sheet(propietario_id: number, anio: number, mes: number): Observable<any> {
    const params = new HttpParams()
      .set('action', 'liquidaciones_sheet')
      .set('propietario_id', propietario_id)
      .set('anio', anio)
      .set('mes', mes);
    return this.http.get<any>(this.baseUrl, { params });
  }

  /** Ítems */
  itemCreate(body: any): Observable<any> {
    const params = new HttpParams().set('action', 'liq_item_create');
    return this.http.post<any>(this.baseUrl, body, { params });
  }
  itemDelete(id: number): Observable<any> {
    const params = new HttpParams()
      .set('action', 'liq_item_delete')
      .set('id', id);
    // si tu backend usa DELETE, cambiá a delete:
    return this.http.post<any>(this.baseUrl, {}, { params });
  }

  /** Pagos */
  pagoCreate(body: any): Observable<any> {
    const params = new HttpParams().set('action', 'liq_pago_create');
    return this.http.post<any>(this.baseUrl, body, { params });
  }
  pagoDelete(id: number): Observable<any> {
    const params = new HttpParams()
      .set('action', 'liq_pago_delete')
      .set('id', id);
    return this.http.post<any>(this.baseUrl, {}, { params });
  }

  /** Recalcular totales */
  recalc(liquidacion_id: number): Observable<any> {
    const params = new HttpParams().set('action', 'liq_recalc');
    return this.http.post<any>(this.baseUrl, { liquidacion_id }, { params });
  }

  list(propietario_id: number, anio?: number, mes?: number) {
    let params = new HttpParams()
      .set('action', 'liquidaciones_list')
      .set('propietario_id', propietario_id);
    if (anio) params = params.set('anio', anio);
    if (mes) params = params.set('mes', mes);
    return this.http.get<any>(this.baseUrl, { params });
  }
}
