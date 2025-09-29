import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UsersService {
  //https://sarosistema.site/backend/index.php
  //http://localhost/backend/index.php
  //https://rg-chivoclub.online/bakend/index.php
  private baseUrl = `${environment.apiBaseUrl}/index.php`;

  constructor(private http: HttpClient) {}

  list(params: { q?: string; page?: number; pageSize?: number }) {
    let p = new HttpParams().set('action', 'users_list');
    if (params.q) p = p.set('q', params.q);
    p = p.set('page', String(params.page || 1));
    p = p.set('pageSize', String(params.pageSize || 20));
    return this.http.get<any>(this.baseUrl, { params: p });
  }

  create(payload: {
    username: string;
    password: string;
    role?: string;
    name: string;
  }) {
    const params = new HttpParams().set('action', 'users_create');
    return this.http.post<any>(this.baseUrl, payload, { params });
  }

  update(
    id: number,
    payload: { username?: string; role?: string; name?: string }
  ) {
    const params = new HttpParams()
      .set('action', 'users_update')
      .set('id', String(id));
    return this.http.put<any>(this.baseUrl, payload, { params });
  }

  setPassword(id: number, password: string) {
    const params = new HttpParams().set('action', 'users_set_password');
    return this.http.post<any>(this.baseUrl, { id, password }, { params });
  }

  delete(id: number) {
    const params = new HttpParams()
      .set('action', 'users_delete')
      .set('id', String(id));
    return this.http.delete<any>(this.baseUrl, { params });
  }
}
