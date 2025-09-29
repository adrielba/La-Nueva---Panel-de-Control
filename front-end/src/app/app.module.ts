import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './components/login/login.component';

import { HttpClientModule, provideHttpClient } from '@angular/common/http';

import { InicioComponent } from './components/inicio/inicio.component';
import { FooterComponent } from './components/footer/footer.component';

import { ReactiveFormsModule } from '@angular/forms';

import { AlquileresComponent } from './components/alquileres/alquileres.component';
import { InquilinosComponent } from './components/inquilinos/inquilinos.component';
import { PropietariosComponent } from './components/propietarios/propietarios.component';
import { ReportesComponent } from './components/reportes/reportes.component';
import { MovimientosComponent } from './components/movimientos/movimientos.component';
import { MovimientosIndexComponent } from './components/movimientos-index/movimientos-index.component';
import { MovimientosPropComponent } from './components/movimientos-prop/movimientos-prop.component';
import { PropiedadesComponent } from './components/propiedades/propiedades.component';

import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptor } from './auth.interceptor';
import { AdministracionComponent } from './components/administracion/administracion.component';
import { CajaInmobiliariaComponent } from './components/caja-inmobiliaria/caja-inmobiliaria.component';
import { DetallePropiedadComponent } from './components/detalle-propiedad/detalle-propiedad.component';
import { AmobladosComponent } from './components/amoblados/amoblados.component';
import { AmobmovsComponent } from './components/amobmovs/amobmovs.component';
import { AmobServiciosComponent } from './components/amob-servicios/amob-servicios.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    InicioComponent,
    FooterComponent,
    AlquileresComponent,
    InquilinosComponent,
    PropietariosComponent,
    ReportesComponent,
    MovimientosComponent,
    MovimientosIndexComponent,
    MovimientosPropComponent,
    PropiedadesComponent,
    AdministracionComponent,
    CajaInmobiliariaComponent,
    DetallePropiedadComponent,
    AmobladosComponent,
    AmobmovsComponent,
    AmobServiciosComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
  ],
  providers: [
    provideHttpClient(),
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
