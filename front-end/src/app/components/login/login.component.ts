import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  username: string = '';
  password: string = '';
  isLoading: boolean = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  showGreenMessage: boolean = false;
  showRedMessage: boolean = false;

  constructor(private authService: AuthService, private router: Router) {}

  onLogin() {
    if (this.isLoading) return; // evita doble submit
    this.isLoading = true;
    this.errorMessage = null;
    this.successMessage = null;

    this.authService.login(this.username, this.password).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.successMessage = 'Ingreso correctamente';
        // 🔁 opcional: redirigir después de 600ms para que se vea el mensaje/spinner
        setTimeout(() => this.router.navigateByUrl('/inicio'), 600);
      },
      error: (error) => {
        this.isLoading = false;
        if (error.status === 401 || error.status === 404) {
          this.errorMessage = error.error?.error || 'Credenciales inválidas';
        } else {
          this.errorMessage =
            'Error en el servidor. Intente nuevamente más tarde.';
        }
        console.log(error);
      },
    });
  }
}
