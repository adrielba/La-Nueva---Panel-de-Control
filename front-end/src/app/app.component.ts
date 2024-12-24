import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'front-end';

  mostrarNavBar: boolean = false;
  currentRole: string = '';

  constructor(private router: Router, private authService: AuthService) {
    this.router.events.subscribe(() => {
      this.mostrarNavBar = this.authService.isAuthenticated() && !this.router.url.includes('/login');
      this.currentRole = this.authService.getCurrentRole();
    });
  }
  onLogout(){
    this.authService.logout();
  }
}
