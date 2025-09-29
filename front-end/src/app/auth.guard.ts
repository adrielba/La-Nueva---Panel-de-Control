import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
} from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class authGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return false;
    }

    const allowedRoles = (route.data['roles'] as string[]) || [];
    if (allowedRoles.length === 0) return true; // si la ruta no define roles, pasa

    const userRole = this.authService.getCurrentRole();
    if (!userRole) {
      this.router.navigate(['/inicio']);
      return false;
    }

    if (!allowedRoles.includes(userRole)) {
      this.router.navigate(['/inicio']);
      return false;
    }

    return true;
  }
}
