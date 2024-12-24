import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class authGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return false;
    }

    const allowedRoles = route.data['roles'] as string[];
    const userRole = this.authService.getCurrentRole();

    if (!allowedRoles.includes(userRole)) {
      
      this.router.navigate(['/inicio']);
      return false;
    }

    return true;
  }
}
