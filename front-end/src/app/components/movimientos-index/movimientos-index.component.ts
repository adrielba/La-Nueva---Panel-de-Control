import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PropietariosService } from '../../services/propietarios.service';

@Component({
  selector: 'app-movimientos-index',
  templateUrl: './movimientos-index.component.html',
  styleUrls: ['./movimientos-index.component.css'],
})
export class MovimientosIndexComponent implements OnInit {
  q = '';
  page = 1;
  pageSize = 20;

  rows: any[] = [];
  total = 0;
  loading = false;
  errorMsg = '';

  // mes seleccionado (formato UI YYYY-MM)
  selectedMes = this.currentMonthYYYYMM();
  monthOptions = this.buildMonthOptions(18); // 18 últimos meses

  constructor(private propsSvc: PropietariosService, private router: Router) {}

  ngOnInit(): void {
    this.load();
  }

  currentMonthYYYYMM(): string {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }

  buildMonthOptions(n: number): string[] {
    const out: string[] = [];
    const base = new Date();
    for (let i = 0; i < n; i++) {
      const d = new Date(base.getFullYear(), base.getMonth() - i, 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      out.push(`${y}-${m}`);
    }
    return out;
  }

  get totalPages(): number {
    const p = Math.ceil(this.total / this.pageSize);
    return p > 0 ? p : 1;
  }

  load(): void {
    this.loading = true;
    this.errorMsg = '';
    this.propsSvc
      .list({
        q: this.q || undefined,
        page: this.page,
        pageSize: this.pageSize,
      })
      .subscribe({
        next: (res) => {
          this.loading = false;
          if (res?.success) {
            this.rows = res.rows || [];
            this.total = res.total || 0;
          } else {
            this.rows = [];
            this.total = 0;
            this.errorMsg = 'No se pudo cargar.';
          }
        },
        error: () => {
          this.loading = false;
          this.errorMsg = 'Error de servidor.';
          this.rows = [];
          this.total = 0;
        },
      });
  }

  apply(): void {
    this.page = 1;
    this.load();
  }
  clear(): void {
    this.q = '';
    this.apply();
  }
  prev(): void {
    if (this.page > 1) {
      this.page--;
      this.load();
    }
  }
  next(): void {
    if (this.page < this.totalPages) {
      this.page++;
      this.load();
    }
  }

  openProp(p: any) {
    // Navegamos al detalle con query param mes=YYYY-MM
    this.router.navigate(['/movimientos/prop', p.id], {
      queryParams: { mes: this.selectedMes },
    });
  }
}
