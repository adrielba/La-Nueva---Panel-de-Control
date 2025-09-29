import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './components/login/login.component';

import { provideHttpClient } from '@angular/common/http';
import { BuscarCartonesComponent } from './components/buscar-cartones/buscar-cartones.component';
import { InicioComponent } from './components/inicio/inicio.component';
import { FooterComponent } from './components/footer/footer.component';
import { EliminarCartonesComponent } from './components/eliminar-cartones/eliminar-cartones.component';
import { ReactiveFormsModule } from '@angular/forms';
import { CargarPostaComponent } from './components/cargar-posta/cargar-posta.component';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    LoginComponent,
    BuscarCartonesComponent,
    InicioComponent,
    FooterComponent,
    EliminarCartonesComponent,
    CargarPostaComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule
  ],
  providers: [provideHttpClient()],
  bootstrap: [AppComponent]
})
export class AppModule { }
