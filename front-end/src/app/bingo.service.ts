import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class BingoService {
  constructor(private http: HttpClient) {}

  chequearGanador(numerosCantados: number[]) {
    const datos = { numerosCantados };
    return this.http.post<{ganadores: { serie:string; carton:number }[]}>(
      '???',
      datos
    );
  }
}

