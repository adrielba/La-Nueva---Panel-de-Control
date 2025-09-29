import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BingoService } from '../../bingo.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  inputNumber: number | null = null;
  grid: number[] = Array.from({ length: 90}, (_,i) => i + 1);
  markedNumbers: number[] = [];
  recentNumbers: number[] = [];
  latestNumber: number | null = null;
  cantNumb: number = 0;
  selectedRonda: number | null = null;
  fechaSeleccionada: string = '';
  todosLosNumeros: number[] = [];
  mensaje: string = '';
  exito: boolean = true;
  showModal:boolean = false;
  ganadores: { serie:string; carton:number } [] = [];
  dateSelected: string = '';
  showNumberModal = false;
  numerosRepetidos: { numero: number, cantidad: number }[] = [];
  isValid:boolean = false;
  
  constructor(private http: HttpClient, private bingoService:BingoService) {}

  markNumber(){
    if(this.inputNumber && this.inputNumber >= 1 && this.inputNumber <= 90){
      if(!this.markedNumbers.includes(this.inputNumber)){
        this.markedNumbers.push(this.inputNumber);

        if(this.recentNumbers.length === 5){
          this.recentNumbers.shift();
        }
        this.recentNumbers.push(this.inputNumber);
        this.latestNumber = this.inputNumber;
        this.cantNumb++;
        this.todosLosNumeros.push(this.inputNumber);

        if(this.cantNumb >= 15){
          this.chequearGanador();

        }
      }
      this.inputNumber = null;
    } else{
      alert("Por favor ingresa un número del 1 al 90.");
    }
    this.validateEnvio();
  }
  validateEnvio() {
    const laronda = this.selectedRonda;
    const lafecha = this.fechaSeleccionada;
    const losnumeros = this.markedNumbers;

   
    if (laronda === null || lafecha === null) {
        this.isValid = false;
        return;
    }
    if (losnumeros.length < 15) {
      this.isValid = false;
      console.log('Invalid: Menos de 15 números marcados');
      return;
  }

 
    this.isValid = true;
}

  enviarDatos() {
    // Datos a enviar al backend
    const datos = {
      ronda: this.selectedRonda,
      fecha: this.fechaSeleccionada,
      numeros: this.todosLosNumeros
    };
 
    this.http.post('???', datos, { responseType: 'json' })
      .subscribe(response => {
      
        this.mostrarMensaje('Datos enviados correctamente', true);
        this.resetBingoData();
      }, error => {
        console.error('Error al enviar datos:', error);
        this.mostrarMensaje('Error al enviar datos', false);
      });
  }

  resetBingoData(){
    this.markedNumbers = [];
    this.recentNumbers = [];
    this.todosLosNumeros = [];
    this.latestNumber = null;
    this.cantNumb = 0;
    this.selectedRonda = null;
    this.isValid = false;
  }

  mostrarMensaje(texto:string, exito:boolean){
    this.mensaje = texto;
    this.exito = exito;

    setTimeout(()=> {
      this.mensaje = '';
    }, 3000);
  }

  chequearGanador() {
    this.bingoService.chequearGanador(this.todosLosNumeros).subscribe(
      (response: any) => {
        if (response.ganadores && response.ganadores.length > 0) {
          this.mostrarGanadores(response.ganadores);
        }
      },
      (error) => {
        console.error('Error al chequear ganadores:', error);
      }
    );
  }

  mostrarGanadores(ganadores: {serie:string; carton:number }[]){
    this.ganadores = ganadores;
    this.showModal = true;
  }

  cerrarModal(){
    this.showModal = false;
  }
  
  verNumerosRepetidos() {
    const fechaSeleccionada01 = this.dateSelected;
    if (!fechaSeleccionada01) {
        alert("Por favor, selecciona una fecha.");
        return;
    }

    
    const url = '???';
    const data = { fecha: this.dateSelected }; 

    this.http.post(url, data).subscribe(
        (response: any) => {
            console.log("Números más repetidos:", response);
            this.mostrarModal(response.data);
        },
        (error) => {
            console.error("Error al obtener números repetidos:", error);
            alert("Error al obtener los números más repetidos.");
        }
    );
}
mostrarModal(numeros: { numero: number, cantidad: number }[]) {
  this.numerosRepetidos = numeros;
  this.showNumberModal = true;
  console.log("Sali");
}
cerrarModal02() {
  this.showNumberModal = false;
}




}
