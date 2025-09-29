import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
} from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    // Detectá login por la URL (ajustá si tu endpoint cambia)
    const isLogin =
      req.url.includes('action=login') || /\/login(\?|$)/.test(req.url);

    if (isLogin) {
      // No agregues headers custom para evitar preflight
      return next.handle(req);
    }

    const token = localStorage.getItem('auth_token') || '';
    const uid = localStorage.getItem('user_id') || '';
    const uname = localStorage.getItem('user_name') || '';
    const urole = localStorage.getItem('user_role') || '';

    let headers = req.headers;

    // Evitá headers vacíos (cada header custom dispara preflight)
    if (uid) headers = headers.set('X-User-Id', uid);
    if (uname) headers = headers.set('X-User-Name', uname);
    if (urole) headers = headers.set('X-User-Role', urole);
    if (token) headers = headers.set('X-Auth-Token', token);

    const clone = req.clone({ headers });
    return next.handle(clone);
  }
}
