import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { InicioComponent } from './components/inicio/inicio.component';
import { authGuard } from './auth.guard';
import { LoginredirectguardService } from './loginredirectguard.service';

import { AlquileresComponent } from './components/alquileres/alquileres.component';
import { InquilinosComponent } from './components/inquilinos/inquilinos.component';
import { PropietariosComponent } from './components/propietarios/propietarios.component';
import { ReportesComponent } from './components/reportes/reportes.component';
import { MovimientosComponent } from './components/movimientos/movimientos.component';
import { MovimientosIndexComponent } from './components/movimientos-index/movimientos-index.component';
import { PropiedadesComponent } from './components/propiedades/propiedades.component';
import { AdministracionComponent } from './components/administracion/administracion.component';
import { DetallePropiedadComponent } from './components/detalle-propiedad/detalle-propiedad.component';
import { AmobladosComponent } from './components/amoblados/amoblados.component';
import { AmobmovsComponent } from './components/amobmovs/amobmovs.component';
import { AmobServiciosComponent } from './components/amob-servicios/amob-servicios.component';
const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [LoginredirectguardService],
  },
  {
    path: 'inicio',
    component: InicioComponent,
    canActivate: [authGuard],
    data: { roles: ['superadmin', 'master'] },
  },
  {
    path: 'alquileres',
    component: AlquileresComponent,
    canActivate: [authGuard],
    data: { roles: ['superadmin', 'master'] },
  },
  {
    path: 'inquilinos',
    component: InquilinosComponent,
    canActivate: [authGuard],
    data: { roles: ['superadmin', 'master'] },
  },
  {
    path: 'propietarios',
    component: PropietariosComponent,
    canActivate: [authGuard],
    data: { roles: ['superadmin', 'master'] },
  },
  {
    path: 'detalle-propiedad/:id',
    component: DetallePropiedadComponent,
    canActivate: [authGuard],
    data: { roles: ['superadmin', 'master'] },
  },
  {
    path: 'reportes',
    component: ReportesComponent,
    canActivate: [authGuard],
    data: { roles: ['superadmin', 'master'] },
  },
  {
    path: 'movimientos',
    component: MovimientosIndexComponent,
    canActivate: [authGuard],
    data: { roles: ['superadmin', 'master'] },
  },
  {
    path: 'movimientos/prop/:propId',
    component: MovimientosComponent,
    canActivate: [authGuard],
    data: { roles: ['superadmin', 'master'] },
  },
  {
    path: 'propiedades',
    component: PropiedadesComponent,
    canActivate: [authGuard],
    data: { roles: ['superadmin', 'master'] },
  },
  {
    path: 'amoblados',
    component: AmobladosComponent,
    canActivate: [authGuard],
    data: { roles: ['superadmin', 'master'] },
  },
  {
    path: 'amob-movs/:dirId',
    component: AmobmovsComponent,
    canActivate: [authGuard],
    data: { roles: ['superadmin', 'master'] },
  },
  {
    path: 'amoblados/direcciones/:dirId/servicios',
    component: AmobServiciosComponent,
    canActivate: [authGuard],
    data: { roles: ['superadmin', 'master'] },
  },
  {
    path: 'administracion',
    component: AdministracionComponent,
    canActivate: [authGuard],
    data: { roles: ['master'] }, // solo master
  },
  { path: '**', redirectTo: '/login' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
