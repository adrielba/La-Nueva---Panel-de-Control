import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-eliminar-cartones',
  templateUrl: './eliminar-cartones.component.html',
  styleUrl: './eliminar-cartones.component.css'
})
export class EliminarCartonesComponent {
  serie: number | null = null;
  cartones: any[] = [];
  mostrarOverlay: boolean = false;
  mostrarResultadosOverlay:boolean = false;
  mostrarResultadosOverlay2:boolean = false;
  cabeceras = Array.from({ length: 15 }, (_, i) => i + 1);
  currentPage = 1; 
  totalPages = 1;
  isBuscarValid: boolean = false;
  goToPage: number = 1;
  numeroDeSerie: number = 0;
  mostrarConfirmacion = false;
  mensajeExito: string | null = null;
  
  

  constructor(private http:HttpClient){}
  
  buscarCartonesPorSerie(serie: number) {
    if (serie === null) {
      alert('Por favor, ingresa un número de serie válido.');
      return;
    }
  
    this.http.get(`???`, { responseType: 'json' })
      .subscribe(
        (response: any) => {
          if (response.data) {
            this.mostrarResultadosOverlay = true;
            this.cartones = response.data;
          } else {
            console.error('Error al buscar cartones:', response.error);
            alert(response.error || 'No se encontraron cartones para la serie especificada.');
          }
        },
        (error) => {
          console.error('No se pudo realizar la búsqueda:', error);
        }
      );
  }

  cerrarResultados(){
    this.mostrarResultadosOverlay = false;
  }

  cerrarOverlay() {
    this.mostrarResultadosOverlay = false;
  }

  confirmarEliminacion() {
    this.mostrarResultadosOverlay = false;
    this.mostrarConfirmacion = true;
  }

  eliminarCartones() {
    if (!this.numeroDeSerie) return;

    this.http.delete(`???`)
      .subscribe(() => {
        this.mostrarConfirmacion = false;
        this.mensajeExito = `Serie ${this.numeroDeSerie} eliminada correctamente.`;
      });
  }

  cerrarConfirmacion() {
    this.mostrarConfirmacion = false;
  }

  cerrarMensaje() {
    this.mensajeExito = null;
    this.numeroDeSerie = 0;
  }

 
}
