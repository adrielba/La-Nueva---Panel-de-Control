import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUser: any = null;

  constructor(private http: HttpClient, private router: Router) {
    if (this.isAuthenticated() && this.router.url === '/login') {
      this.router.navigate(['/inicio']);
    }
  }

  login(username: string, password: string): Observable<any> {
    //https://rg-chivoclub.online/bakend/index.php?action=login
    //http://localhost/backend/index.php?action=login
    //https://sarosistema.site/backend/index.php?action=login
    const url = 'https://rg-chivoclub.online/bakend/index.php?action=login';
    return this.http.post(url, { username, password }).pipe(
      tap((response: any) => {
        if (response.token) {
          const expirationDate = Date.now() + 8 * 60 * 60 * 1000;
          localStorage.setItem('auth_token', response.token);
          localStorage.setItem('token_expiry', expirationDate.toString());

          const role = (
            response?.user?.role ||
            response?.role ||
            ''
          ).toString();
          localStorage.setItem('user_role', role);

          // 👇 NUEVO: guardar id y username (el backend ya los manda)
          const uid = (response?.user?.id ?? '').toString();
          const uname = (response?.user?.username ?? '').toString();
          localStorage.setItem('user_id', uid);
          localStorage.setItem('user_name', uname);

          // navegar…
          this.router.navigate(['/inicio']); // o /inicio
        }
      })
    );
  }

  getCurrentRole(): string {
    return localStorage.getItem('user_role') || '';
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem('auth_token');
    const expiry = localStorage.getItem('token_expiry');
    if (!token || !expiry) return false;

    const expiryDate = parseInt(expiry, 10);
    if (new Date().getTime() > expiryDate) {
      this.logout();
      return false;
    }
    return true;
  }

  logout() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }

  setToken(token: string) {
    localStorage.setItem('auth_token', token);
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }
}
