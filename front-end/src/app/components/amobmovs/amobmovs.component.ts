import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AmobladosService, AmobMov } from '../../services/amoblados.service';

@Component({
  selector: 'app-amobmovs',
  templateUrl: './amobmovs.component.html',
  styleUrls: [
    '../alquileres/alquileres.component.css',
    './amobmovs.component.css',
  ],
})
export class AmobmovsComponent implements OnInit {
  dirId!: number;
  dirNombre = '';

  // filtros por fecha (default: hoy)
  fecha = new Date().toISOString().slice(0, 10);
  fecha_from = '';
  fecha_to = '';

  loading = false;
  rows: any[] = [];

  // base: alquiler/adm/neto (del día o rango)
  base = { alquiler: 0, adm: 0, neto: 0 };

  // totales de ajustes
  creditos = 0;
  debitos = 0;

  // overlay alta
  formOpen = false;
  form = {
    fecha: new Date().toISOString().slice(0, 10),
    tipo: 'CREDITO' as 'CREDITO' | 'DEBITO',
    monto: null as number | null,
    detalle: '',
    estado: 'confirmado' as 'pendiente' | 'confirmado',
  };

  selectedDate = new Date();
  daysOfMonth: number[] = [];
  viewYear = 0;
  viewMonth = 0; // 0..11

  constructor(private route: ActivatedRoute, private svc: AmobladosService) {}

  ngOnInit() {
    this.selectedDate = new Date();
    this.computeDaysBar(this.selectedDate);
    this.applyDayFilter(); // setea from/to al día y llama a load*
    this.dirId = Number(this.route.snapshot.paramMap.get('dirId'));
    this.load();
  }

  private buildDateArgs() {
    const args: any = {};
    if (this.fecha) {
      args.fecha_from = this.fecha;
      args.fecha_to = this.fecha;
    }
    if (this.fecha_from) args.fecha_from = this.fecha_from;
    if (this.fecha_to) args.fecha_to = this.fecha_to;
    return args;
  }

  load() {
    this.loading = true;
    const args = this.buildDateArgs();

    // 1) resumen
    this.svc
      .amobMovsSummary(this.dirId, undefined, args.fecha_from, args.fecha_to)
      .subscribe({
        next: (sum) => {
          this.dirNombre = sum?.direccion || '';
          this.base = {
            alquiler: +(sum?.base?.alquiler ?? 0),
            adm: +(sum?.base?.adm ?? 0),
            neto: +(sum?.base?.neto ?? 0),
          };
          this.creditos = +(sum?.ajustes?.creditos ?? 0);
          this.debitos = +(sum?.ajustes?.debitos ?? 0);

          // 2) filas
          this.svc
            .movsByDir(this.dirId, undefined, args.fecha_from, args.fecha_to)
            .subscribe({
              next: (res) => {
                this.rows = res?.rows || [];
                this.loading = false;
              },
              error: () => {
                this.rows = [];
                this.loading = false;
              },
            });
        },
        error: () => {
          this.base = { alquiler: 0, adm: 0, neto: 0 };
          this.creditos = this.debitos = 0;
          // igual intentamos traer filas
          this.svc
            .movsByDir(this.dirId, undefined, args.fecha_from, args.fecha_to)
            .subscribe({
              next: (res) => {
                this.rows = res?.rows || [];
                this.loading = false;
              },
              error: () => {
                this.rows = [];
                this.loading = false;
              },
            });
        },
      });
  }

  clearDates() {
    this.fecha = '';
    this.fecha_from = '';
    this.fecha_to = '';
    this.load();
  }

  get netoFinal(): number {
    return this.base.neto + this.creditos - this.debitos;
  }

  // Alta movimiento
  nuevo() {
    this.formOpen = true;
    this.form = {
      fecha: this.fecha || new Date().toISOString().slice(0, 10),
      tipo: 'CREDITO',
      monto: null,
      detalle: '',
      estado: 'confirmado',
    };
  }
  cancelar() {
    this.formOpen = false;
  }
  guardarMov() {
    if (!this.form.monto || this.form.monto <= 0) {
      alert('Ingresá un monto válido.');
      return;
    }
    const payload: any = {
      dir_id: this.dirId,
      fecha: this.form.fecha,
      tipo: this.form.tipo,
      monto: this.form.monto!,
      detalle: (this.form.detalle || '').trim(),
      estado: this.form.estado,
      motivo: 'Ajuste', // <- requerido por el backend
    };
    this.svc.createAmobMov(payload).subscribe({
      next: (res) => {
        if (res?.success) {
          this.formOpen = false;
          this.load();
        } else {
          alert('No se pudo crear el movimiento.');
        }
      },
      error: () => alert('Error de servidor al crear movimiento.'),
    });
  }

  private formatDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  private computeDaysBar(forDate: Date) {
    this.viewYear = forDate.getFullYear();
    this.viewMonth = forDate.getMonth();
    const first = new Date(this.viewYear, this.viewMonth, 1);
    const last = new Date(this.viewYear, this.viewMonth + 1, 0);
    const total = last.getDate();
    this.daysOfMonth = Array.from({ length: total }, (_, i) => i + 1);
  }
  isActiveDay(dayNum: number) {
    return (
      this.selectedDate.getFullYear() === this.viewYear &&
      this.selectedDate.getMonth() === this.viewMonth &&
      this.selectedDate.getDate() === dayNum
    );
  }
  selectDay(dayNum: number) {
    this.selectedDate = new Date(this.viewYear, this.viewMonth, dayNum);
    this.applyDayFilter();
  }
  prevDay() {
    const d = new Date(this.selectedDate);
    d.setDate(d.getDate() - 1);
    this.selectedDate = d;
    this.computeDaysBar(d);
    this.applyDayFilter();
  }
  nextDay() {
    const d = new Date(this.selectedDate);
    d.setDate(d.getDate() + 1);
    this.selectedDate = d;
    this.computeDaysBar(d);
    this.applyDayFilter();
  }
  goToday() {
    const d = new Date();
    this.selectedDate = d;
    this.computeDaysBar(d);
    this.applyDayFilter();
  }

  // Aplica el día elegido como rango [from=to] y recarga
  private applyDayFilter() {
    const day = this.formatDate(this.selectedDate);
    this.fecha_from = day; // <-- usa tus variables ya existentes
    this.fecha_to = day; //     para listar y resumir
    this.load(); // si tenés métodos separados
    // idem
    // o un único this.load() si lo usás combinado
  }

  eliminarMov(r: any) {
    if (!r?.id) return;
    if (!confirm(`¿Eliminar el movimiento #${r.id}?`)) return;

    this.loading = true;
    this.svc.deleteAmobMov(r.id).subscribe({
      next: (res) => {
        this.loading = false;
        if (res?.success) {
          // recargar la lista (y, si corresponde, el resumen)
          this.load(); // si tenés un método específico
        } else {
          alert('No se pudo eliminar el movimiento.');
        }
      },
      error: () => {
        this.loading = false;
        alert('Error de servidor al eliminar el movimiento.');
      },
    });
  }

  // ====== PRINT SOLO "MOVIMIENTOS DE AMOBLADOS" ======
  private esc(v: any): string {
    if (v === null || v === undefined) return '—';
    return String(v).replace(
      /[&<>"']/g,
      (m) =>
        ((
          {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
          } as any
        )[m])
    );
  }
  private fmt(n: any): string {
    if (n === null || n === undefined || n === '') return '0,00';
    const x = Number(n);
    if (Number.isNaN(x)) return '0,00';
    return x.toLocaleString('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
  private fmtDateRange(): string {
    const f = (s: string) =>
      this.esc((s || '').split('-').reverse().join(' / '));
    if (this.fecha_from && this.fecha_to && this.fecha_from === this.fecha_to) {
      return `Fecha: ${f(this.fecha_from)}`;
    }
    if (this.fecha_from || this.fecha_to) {
      const a = this.fecha_from ? f(this.fecha_from) : '—';
      const b = this.fecha_to ? f(this.fecha_to) : '—';
      return `Rango: ${a} a ${b}`;
    }
    return 'Rango: —';
  }

  private buildPrintHtmlMovs(): string {
    const css = `
    @page { size: A4; margin: 14mm; }
    body { font-family: system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,'Helvetica Neue',Arial,sans-serif; color:#111; }
    h1 { font-size: 18pt; margin: 0 0 6pt; }
    .meta { color:#6b7280; margin-bottom: 12pt; }
    .summary { 
      display:grid; 
      grid-template-columns: repeat(3, minmax(0,1fr)); 
      gap:10pt; 
      margin: 10pt 0 12pt; 
    }
    .card { border:1px solid #e5e7eb; border-radius:8pt; padding:10pt; }
    .k { font-size:10pt; color:#555; }
    .v { font-size:12pt; font-weight:700; white-space:nowrap; }
    .em { background:#f1f5f9; }
    table { width:100%; border-collapse: collapse; margin-top: 6pt; }
    th, td { border:1px solid #e5e7eb; padding:6pt 8pt; font-size:11pt; }
    th { background:#f8fafc; text-align:left; }
    .right { text-align:right; }
    .muted { color:#6b7280; }
  `;

    const rowsHtml =
      this.rows && this.rows.length
        ? this.rows
            .map(
              (r) => `
        <tr>
          <td>${this.esc(r.fecha || '')}</td>
          <td>${this.esc(r.detalle || '')}</td>
          <td>${this.esc(r.tipo || '')}</td>
          <td class="right">${this.fmt(r.monto)}</td>
          <td>${this.esc(r.estado || '')}</td>
        </tr>
      `
            )
            .join('')
        : `<tr><td colspan="5" class="muted">Sin movimientos.</td></tr>`;

    const netoFinal =
      (Number(this.base.neto) || 0) +
      (Number(this.creditos) || 0) -
      (Number(this.debitos) || 0);

    const body = `
    <h1>Movimientos de amoblados</h1>
    <div class="meta">
      <div><strong>Dirección:</strong> ${this.esc(
        this.dirNombre || 'ID ' + this.dirId
      )}</div>
      <div>${this.fmtDateRange()}</div>
    </div>

    <div class="summary">
      <div class="card"><div class="k">Alquiler</div><div class="v">$ ${this.fmt(
        this.base.alquiler
      )}</div></div>
      <div class="card"><div class="k">ADM</div><div class="v">$ ${this.fmt(
        this.base.adm
      )}</div></div>
      <div class="card"><div class="k">Neto (Alq − ADM)</div><div class="v">$ ${this.fmt(
        this.base.neto
      )}</div></div>

      <div class="card"><div class="k">Créditos (confirmados)</div><div class="v">$ ${this.fmt(
        this.creditos
      )}</div></div>
      <div class="card"><div class="k">Débitos (confirmados)</div><div class="v">$ ${this.fmt(
        this.debitos
      )}</div></div>
      <div class="card em"><div class="k">NETO FINAL (Neto + Créditos − Débitos)</div><div class="v">$ ${this.fmt(
        netoFinal
      )}</div></div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width: 18%;">Fecha</th>
          <th>Detalle</th>
          <th style="width: 14%;">Tipo</th>
          <th style="width: 16%;" class="right">Monto</th>
          <th style="width: 16%;">Estado</th>
        </tr>
      </thead>
      <tbody>${rowsHtml}</tbody>
    </table>
  `;

    return `<!doctype html>
  <html lang="es">
    <head>
      <meta charset="utf-8">
      <title>Movimientos – ${this.esc(
        this.dirNombre || 'ID ' + this.dirId
      )}</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>${css}</style>
    </head>
    <body>${body}</body>
  </html>`;
  }

  printMovs() {
    const html = this.buildPrintHtmlMovs();
    const w = window.open('', '_blank', 'width=900,height=700');
    if (!w) {
      alert('El navegador bloqueó la ventana de impresión. Permití pop-ups.');
      return;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
    w.onload = () => {
      w.focus();
      w.print();
      w.close();
    };
  }
}
