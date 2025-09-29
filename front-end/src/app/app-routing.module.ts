import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { HomeComponent } from './components/home/home.component';
import { InicioComponent } from './components/inicio/inicio.component';
import { BuscarCartonesComponent } from './components/buscar-cartones/buscar-cartones.component';
import { CargarPostaComponent } from './components/cargar-posta/cargar-posta.component';
import { authGuard } from './auth.guard';
import { LoginredirectguardService } from './loginredirectguard.service';


const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent, canActivate: [LoginredirectguardService] },
  { path: 'inicio', component: InicioComponent, canActivate: [authGuard], data: { roles: ['???', '??', '???'] }},
  { path: 'bolillero', component: HomeComponent, canActivate: [authGuard], data: { roles: ['???', '??'] }},
  { path: 'ver-cartones', component: BuscarCartonesComponent, canActivate: [authGuard], data: { roles: ['???', '???', '???'] }},
  { path: 'cargar-cartones', component: CargarPostaComponent, canActivate: [authGuard], data: { roles: ['???', '?????'] }},
  { path: '**', redirectTo: '/login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
