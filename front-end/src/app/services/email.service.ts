import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class EmailService {
  //https://sarosistema.site/backend/index.php
  //http://localhost/backend/index.php
  private baseUrl = `${environment.apiBaseUrl}/index.php`;

  constructor(private http: HttpClient) {}

  sendEmail(payload: {
    to_email: string;
    to_name?: string;
    subject: string;
    body_html: string;
    body_text?: string;
    attachments?: Array<{
      filename: string;
      content_base64: string; // puede venir con o sin "data:...;base64,"
      mime?: string;
    }>;
  }) {
    const params = new HttpParams().set('action', 'send_email');
    return this.http.post<any>(this.baseUrl, payload, { params });
  }
}
