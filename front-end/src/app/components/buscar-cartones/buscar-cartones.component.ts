import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-buscar-cartones',
  templateUrl: './buscar-cartones.component.html',
  styleUrl: './buscar-cartones.component.css'
})
export class BuscarCartonesComponent {
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
  
  

  constructor(private http:HttpClient){}
  
  verCartones(page: number = 1){
    if (page < 1 || page > this.totalPages) {
      console.error('Página fuera de rango');
      return;
    }

    this.currentPage = page;

    this.http.get(`???`, {responseType:'json'}).subscribe(
      (response:any)=>{
        if(response.data){
          
        this.mostrarOverlay = true;
        this.cartones = response.data.cartones; 
        this.totalPages = response.data.totalPages;
        
        }else{
          console.error('No se encontraron cartones:', response.error);
        }
      }, (error) =>{
        console.error('No se pudo obtener cartones', error);
      }
    );
  }

  cerrarOverlay() {
    this.mostrarOverlay = false;
  }

  irAPagina(page: number) {
    if (page && page >= 1 && page <= this.totalPages) {
      this.verCartones(page);
    } else {
      alert(`Por favor, ingresa un número entre 1 y ${this.totalPages}`);
    }
  }

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

}
