import { Component, OnInit } from '@angular/core';
import { FirmLedgerService } from '../../services/firm-ledger.service';
import { lastValueFrom, forkJoin } from 'rxjs';

type Tipo = '' | 'ingreso' | 'egreso';
type Metodo = '' | 'efectivo' | 'transferencia';

@Component({
  selector: 'app-caja-inmobiliaria',
  templateUrl: './caja-inmobiliaria.component.html',
  styleUrls: ['./caja-inmobiliaria.component.css'],
})
export class CajaInmobiliariaComponent implements OnInit {
  // filtros
  q = '';
  tipo: Tipo = '';
  from = '';
  to = '';

  // tabla
  rows: any[] = [];
  loading = false;
  errorMsg = '';
  page = 1;
  pageSize = 10;
  total = 0;

  // totales
  tot = { ingresos: 0, egresos: 0, saldo: 0 };

  // modal crear/editar
  formOpen = false;
  editingId: number | null = null;
  form = {
    fecha: '',
    concepto: '',
    tipo: '' as Tipo,
    monto: 0,
    metodo_pago: '' as Metodo,
  };

  // summary mensual
  summary: Array<{
    ym: string;
    ingresos: number;
    egresos: number;
    saldo: number;
  }> = [];

  monthLabel = '';

  private curYear = 0;
  private curMonth0 = 0; // 0=ene ... 11=dic

  constructor(private svc: FirmLedgerService) {}

  ngOnInit(): void {
    const now = new Date();
    this.setMonth(now.getFullYear(), now.getMonth()); // esto ya hace load() y summary()
  }

  get totalPages(): number {
    const p = Math.ceil(this.total / this.pageSize);
    return p > 0 ? p : 1;
  }

  apply() {
    this.page = 1;
    this.load();
    this.loadSummary();
  }
  clear() {
    this.q = '';
    this.tipo = '';
    this.page = 1;
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    this.from = `${yyyy}-${mm}-01`;
    this.to = `${yyyy}-${mm}-31`;
    this.load();
    this.loadSummary();
  }

  prev() {
    if (this.page > 1) {
      this.page--;
      this.load();
    }
  }
  next() {
    if (this.page < this.totalPages) {
      this.page++;
      this.load();
    }
  }

  load() {
    this.loading = true;
    this.errorMsg = '';
    this.svc
      .list({
        q: this.q || undefined,
        tipo: this.tipo || '',
        from: this.from || undefined,
        to: this.to || undefined,
        page: this.page,
        pageSize: this.pageSize,
      })
      .subscribe({
        next: (res) => {
          this.loading = false;
          if (res?.success) {
            this.rows = res.rows || [];
            this.total = res.total || 0;
            const t = res.totales || {};
            this.tot.ingresos = t.ingresos || 0;
            this.tot.egresos = t.egresos || 0;
            this.tot.saldo = t.saldo || 0;
          } else {
            this.rows = [];
            this.total = 0;
            this.errorMsg = 'No se pudo cargar.';
          }
        },
        error: () => {
          this.loading = false;
          this.rows = [];
          this.total = 0;
          this.errorMsg = 'Error de servidor.';
        },
      });
  }

  loadSummary() {
    this.svc
      .summary({ from: this.from || undefined, to: this.to || undefined })
      .subscribe({
        next: (res) => {
          this.summary = res?.rows || [];
        },
        error: () => {
          this.summary = [];
        },
      });
  }

  openNew() {
    this.formOpen = true;
    this.editingId = null;
    this.form = {
      fecha: this.from || '',
      concepto: '',
      tipo: '' as Tipo,
      monto: 0,
      metodo_pago: 'efectivo',
    };
  }
  openEdit(r: any) {
    if (r.origen_type !== 'manual') {
      alert('Solo asientos manuales pueden editarse.');
      return;
    }
    this.formOpen = true;
    this.editingId = r.id;
    this.form = {
      fecha: r.fecha,
      concepto: r.concepto,
      tipo: r.tipo,
      monto: r.monto,
      metodo_pago: (r.metodo_pago || '') as Metodo,
    };
  }
  closeForm() {
    this.formOpen = false;
    this.editingId = null;
  }

  guardar() {
    const { fecha, concepto, tipo, monto, metodo_pago } = this.form;
    if (!fecha || !concepto || !tipo || !(monto > 0)) {
      alert('Completá fecha, concepto, tipo e importe>0');
      return;
    }

    const payload: {
      fecha: string;
      concepto: string;
      tipo: 'ingreso' | 'egreso';
      monto: number;
      metodo_pago?: 'efectivo' | 'transferencia';
    } = {
      fecha,
      concepto,
      tipo: tipo as 'ingreso' | 'egreso',
      monto,
      ...(metodo_pago
        ? { metodo_pago: metodo_pago as 'efectivo' | 'transferencia' }
        : {}),
    };

    const obs = this.editingId
      ? this.svc.update(this.editingId, payload)
      : this.svc.create(payload);

    obs.subscribe({
      next: (res) => {
        if (res?.success !== false) {
          this.closeForm();
          this.load();
          this.loadSummary();
        } else {
          alert('No se pudo guardar.');
        }
      },
      error: () => alert('Error de servidor al guardar.'),
    });
  }

  eliminar(r: any) {
    if (r.origen_type !== 'manual') {
      alert('Solo asientos manuales pueden eliminarse.');
      return;
    }
    if (!confirm('¿Eliminar asiento?')) return;
    this.svc.remove(r.id).subscribe({
      next: (res) => {
        if (res?.success) {
          this.load();
          this.loadSummary();
        } else alert('No se pudo eliminar.');
      },
      error: () => alert('Error de servidor al eliminar.'),
    });
  }

  private setMonth(year: number, month0: number) {
    this.curYear = year;
    this.curMonth0 = month0;

    const first = new Date(year, month0, 1);
    const last = new Date(year, month0 + 1, 0);

    this.from = `${first.getFullYear()}-${String(first.getMonth() + 1).padStart(
      2,
      '0'
    )}-01`;
    this.to = `${last.getFullYear()}-${String(last.getMonth() + 1).padStart(
      2,
      '0'
    )}-${String(last.getDate()).padStart(2, '0')}`;

    const fmt = new Intl.DateTimeFormat('es-AR', {
      month: 'short',
      year: 'numeric',
    });
    this.monthLabel = fmt.format(first).replace('.', '');

    this.page = 1;
    this.load();
    this.loadSummary();
  }

  prevMonth() {
    let y = this.curYear,
      m = this.curMonth0 - 1;
    if (m < 0) {
      m = 11;
      y--;
    }
    this.setMonth(y, m);
  }

  nextMonth() {
    let y = this.curYear,
      m = this.curMonth0 + 1;
    if (m > 11) {
      m = 0;
      y++;
    }
    this.setMonth(y, m);
  }

  goToday() {
    const now = new Date();
    this.setMonth(now.getFullYear(), now.getMonth());
  }

  // --- 1) Genera el documento COMPLETO a imprimir (HTML + <script> print)
  private buildPrintDocCaja(opts: {
    rows: any[];
    summary: { ym: string; ingresos: number; egresos: number; saldo: number }[];
    tot: { ingresos: number; egresos: number; saldo: number };
  }): string {
    const esc = (v: any) =>
      (v ?? '')
        .toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    const { rows, summary, tot } = opts;

    const filtros: string[] = [];
    if (this.q) filtros.push(`Buscar: "${esc(this.q)}"`);
    if (this.tipo) filtros.push(`Tipo: ${esc(this.tipo)}`);
    if (this.from) filtros.push(`Desde: ${esc(this.from)}`);
    if (this.to) filtros.push(`Hasta: ${esc(this.to)}`);
    const filtrosLine = filtros.length ? ` · ${filtros.join(' · ')}` : '';

    const thead = `
    <tr>
      <th>Fecha</th>
      <th>Concepto</th>
      <th>Tipo</th>
      <th style="text-align:right;">Importe</th>
      <th>Método</th>
      <th>Origen</th>
      <th>Categoría</th>
    </tr>`;

    const tbody = rows
      .map(
        (r) => `
    <tr>
      <td>${esc(r.fecha)}</td>
      <td style="max-width:320px;">${esc(r.concepto)}</td>
      <td style="text-transform:capitalize;">${esc(r.tipo)}</td>
      <td style="text-align:right;">${Number(r.monto || 0).toLocaleString(
        'es-AR',
        { minimumFractionDigits: 2, maximumFractionDigits: 2 }
      )}</td>
      <td>${esc(r.metodo_pago || '—')}</td>
      <td>${r.origen_type === 'mov' ? 'Automático (mov)' : 'Manual'}</td>
      <td style="max-width:220px;">${esc(r.categoria_nombre || '—')}</td>
    </tr>
  `
      )
      .join('');

    const sumTable = summary.length
      ? `
    <h3 style="margin:18px 0 6px;">Resumen mensual</h3>
    <table>
      <thead>
        <tr><th>Mes</th><th>Ingresos</th><th>Egresos</th><th>Saldo</th></tr>
      </thead>
      <tbody>
        ${summary
          .map(
            (s) => `
          <tr>
            <td>${esc(s.ym)}</td>
            <td>${Number(s.ingresos).toLocaleString('es-AR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}</td>
            <td>${Number(s.egresos).toLocaleString('es-AR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}</td>
            <td>${Number(s.saldo).toLocaleString('es-AR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}</td>
          </tr>`
          )
          .join('')}
      </tbody>
    </table>`
      : '';

    const now = new Date();
    const when =
      now.toLocaleDateString('es-AR') + ' ' + now.toLocaleTimeString('es-AR');

    return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8"/>
<title>Caja de la inmobiliaria</title>
<style>
  :root { --fg:#111827; --muted:#6b7280; --line:#e5e7eb; }
  body { font-family: system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif; color:var(--fg); margin:24px; }
  h1 { font-size:20px; margin:0 0 2px; }
  .meta { color:var(--muted); font-size:12px; margin:0 0 14px; }
  .totals { display:flex; gap:18px; margin:10px 0 12px; }
  table { width:100%; border-collapse:collapse; font-size:12px; }
  th, td { border:1px solid var(--line); padding:6px 8px; vertical-align:top; }
  th { background:#f9fafb; }
  @media print { @page{ size:A4 portrait; margin:10mm; } body{ margin:0; } }
</style>
</head>
<body>
  <h1>Caja de la inmobiliaria</h1>
  <div class="meta">Generado: ${esc(when)}${filtrosLine}</div>

  <div class="totals">
    <div><strong>Ingresos:</strong> ${Number(tot.ingresos).toLocaleString(
      'es-AR',
      { minimumFractionDigits: 2, maximumFractionDigits: 2 }
    )}</div>
    <div><strong>Egresos:</strong> ${Number(tot.egresos).toLocaleString(
      'es-AR',
      { minimumFractionDigits: 2, maximumFractionDigits: 2 }
    )}</div>
    <div><strong>Saldo:</strong> ${Number(tot.saldo).toLocaleString('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}</div>
  </div>

  ${sumTable}

  <h3 style="margin:18px 0 6px;">Asientos</h3>
  <table>
    <thead>${thead}</thead>
    <tbody>${tbody}</tbody>
  </table>

  <script>
    window.addEventListener('load', () => {
      setTimeout(() => { window.focus(); window.print(); }, 50);
    });
  </script>
</body>
</html>`;
  }

  // --- 2) Botón de imprimir: ABRE EL POPUP PRIMERO (sincrónico), luego trae datos y escribe el HTML
  async printCaja() {
    // Abrimos el popup inmediatamente (sincrónico al click) => no lo bloquea
    const popup = window.open('', '_blank');
    if (!popup) {
      alert('El navegador bloqueó la ventana de impresión. Permití popups.');
      return;
    }
    // Escribimos un loader provisorio
    popup.document.open();
    popup.document
      .write(`<!doctype html><html><head><meta charset="utf-8"><title>Cargando…</title>
  <style>body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;padding:24px;color:#111} .muted{color:#6b7280}</style>
  </head><body><h2>Preparando impresión…</h2><p class="muted">Un instante…</p></body></html>`);
    popup.document.close();

    try {
      // Traemos datos con los FILTROS actuales (lo mismo que la grilla)
      const list$ = this.svc.list({
        q: this.q || undefined,
        tipo: this.tipo || '',
        from: this.from || undefined,
        to: this.to || undefined,
        page: 1,
        pageSize: 5000,
      });
      const sum$ = this.svc.summary({
        from: this.from || undefined,
        to: this.to || undefined,
      });

      const [listRes, sumRes] = await lastValueFrom(forkJoin([list$, sum$]));
      const rows = listRes?.rows ?? [];
      const tot = listRes?.totales ?? { ingresos: 0, egresos: 0, saldo: 0 };
      const summary = sumRes?.rows ?? [];

      // Armamos documento final y lo escribimos en el popup ya abierto
      const html = this.buildPrintDocCaja({
        rows,
        summary,
        tot: {
          ingresos: +(tot.ingresos ?? 0),
          egresos: +(tot.egresos ?? 0),
          saldo: +(tot.saldo ?? 0),
        },
      });

      popup.document.open();
      popup.document.write(html);
      popup.document.close();
      // No cerramos el popup: si el usuario cancela el diálogo, la pestaña del popup queda abierta
    } catch (e) {
      popup.document.open();
      popup.document.write('<p>Error al generar la impresión.</p>');
      popup.document.close();
    }
  }
}
