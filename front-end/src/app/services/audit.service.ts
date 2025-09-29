import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuditService {
  private baseUrl = `${environment.apiBaseUrl}/index.php`;

  constructor(private http: HttpClient) {}

  list(
    opts: {
      user?: string;
      role?: string;
      action?: string;
      entity?: string;
      from?: string;
      to?: string;
      page?: number;
      pageSize?: number;
    } = {}
  ): Observable<any> {
    let p = new HttpParams().set('action', 'audit_logs_list');
    if (opts.user) p = p.set('user', opts.user);
    if (opts.role) p = p.set('role', opts.role);
    if (opts.action) p = p.set('action_filter', opts.action);
    if (opts.entity) p = p.set('entity_filter', opts.entity);
    if (opts.from) p = p.set('from', opts.from);
    if (opts.to) p = p.set('to', opts.to);
    p = p
      .set('page', String(opts.page ?? 1))
      .set('pageSize', String(opts.pageSize ?? 20));
    return this.http.get<any>(this.baseUrl, { params: p });
  }
}
