import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class RemindersService {
  //https://sarosistema.site/backend/index.php
  //http://localhost/backend/index.php
  //https://rg-chivoclub.online/bakend/index.php
  private baseUrl = `${environment.apiBaseUrl}/index.php`;

  constructor(private http: HttpClient) {}

  generate(horizonDays = 31) {
    const params = new HttpParams()
      .set('action', 'reminders_generate')
      .set('horizon_days', String(horizonDays));
    return this.http.post<any>(this.baseUrl, {}, { params });
  }

  list(horizonDays = 31) {
    const params = new HttpParams()
      .set('action', 'reminders_list')
      .set('horizon_days', String(horizonDays));
    return this.http.get<any>(this.baseUrl, { params });
  }

  stats() {
    const params = new HttpParams().set('action', 'reminders_stats');
    return this.http.get<any>(this.baseUrl, { params });
  }

  dismiss(id: number) {
    return this.http.post<any>(
      this.baseUrl,
      { id },
      { params: new HttpParams().set('action', 'reminders_dismiss') }
    );
  }

  snooze(id: number, days = 3) {
    return this.http.post<any>(
      this.baseUrl,
      { id, days },
      { params: new HttpParams().set('action', 'reminders_snooze') }
    );
  }

  done(id: number) {
    // (si usás esta ruta alias)
    return this.http.post<any>(
      this.baseUrl,
      { id },
      { params: new HttpParams().set('action', 'reminders_done') }
    );
  }

  linkEmail(id: number, queueId: number) {
    const params = new HttpParams().set('action', 'reminders_link_email');
    return this.http.post<any>(
      this.baseUrl,
      { id, queue_id: queueId },
      { params }
    );
  }

  markDone(id: number) {
    return this.http.post<any>(
      this.baseUrl,
      { id },
      {
        params: new HttpParams().set('action', 'reminders_mark_done'),
      }
    );
  }
}
