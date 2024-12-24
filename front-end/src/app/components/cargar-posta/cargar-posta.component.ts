import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
@Component({
  selector: 'app-cargar-posta',
  templateUrl: './cargar-posta.component.html',
  styleUrl: './cargar-posta.component.css'
})
export class CargarPostaComponent {
  serie: number | null = null;
  carton1Numbers: (number | null)[] = Array(15).fill(null);
  carton2Numbers: (number | null)[] = Array(15).fill(null);
  errorMessage: string = '';
  isFormValid: boolean = false;

  
  constructor(private http: HttpClient) {}

  trackByIndex(index: number, item: any): number {
    return index;
  }

  updateNumber(carton: 1 | 2, index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value;
  
    if (value.length > 2) {
      value = value.slice(0, 2);
    }
  
    const numberValue = Number(value);
    if (isNaN(numberValue) || numberValue < 1 || numberValue > 90) {
      this.errorMessage = 'Los números deben estar entre 1 y 90.';
      input.value = ''; 
      this.isFormValid = false;
      return;
    }
  
    input.value = value;
    if (carton === 1) {
      this.carton1Numbers[index] = numberValue;
    } else {
      this.carton2Numbers[index] = numberValue;
    }
  
   
    this.errorMessage = '';
    this.validateForm();
  }

  validateForm(): void {
    const allNumbers = [...this.carton1Numbers, ...this.carton2Numbers];
    const uniqueNumbers = new Set(allNumbers.filter((num) => num !== null));

    if (allNumbers.some((num) => num === null)) {
      this.errorMessage = 'Debe completar todos los campos.';
      this.isFormValid = false;
      return;
    }

    if (uniqueNumbers.size !== allNumbers.length) {
      this.errorMessage = 'No puede haber números repetidos.';
      this.isFormValid = false;
      return;
    }

    if (!this.serie || this.serie <= 1) {
      this.errorMessage = 'El número de serie debe ser mayor a 1.';
      this.isFormValid = false;
      return;
    }

    this.errorMessage = '';
    this.isFormValid = true;
  }

  submitForm(): void {
    if (!this.isFormValid) {
      return;
    }

    const data = {
      serie: this.serie,
      cartones: [
        { carton: 1, numeros: this.carton1Numbers },
        { carton: 2, numeros: this.carton2Numbers },
      ],
    };

    this.http
      .post('???', data, {
        responseType: 'text',
      })
      .subscribe(
        (response) => {
          alert('Cartones cargados exitosamente.');
          this.resetForm();
        },
        (error) => {
          console.error('Error al enviar datos:', error);
        }
      );
  }

  resetForm(): void {
    this.serie = null;
    this.carton1Numbers.fill(null);
    this.carton2Numbers.fill(null);
    this.isFormValid = false;
    this.errorMessage = '';
  }

  focusNextInput(carton: 1 | 2, index: number): void {
   
    let nextCarton = carton;
    let nextIndex = index + 1;
  
    
    if (nextIndex >= 15 && carton === 1) {
      nextCarton = 2;
      nextIndex = 0;
    }
  
   
    if (nextCarton === 2 && nextIndex >= 15) {
      return;
    }
  
  
    const selector = nextCarton === 1
      ? `.carton1 .cell:nth-child(${nextIndex + 1}) input`
      : `.carton2 .cell:nth-child(${nextIndex + 1}) input`;
  
   
    const nextInput = document.querySelector<HTMLInputElement>(selector);
    if (nextInput) {
      nextInput.focus();
    }
  }

}
