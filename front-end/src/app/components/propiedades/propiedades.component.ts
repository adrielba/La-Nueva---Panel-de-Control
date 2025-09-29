import { Component, OnInit } from '@angular/core';
import { PropiedadesService } from '../../services/propiedades.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-propiedades',
  templateUrl: './propiedades.component.html',
  styleUrls: ['./propiedades.component.css'],
})
export class PropiedadesComponent implements OnInit {
  q = '';
  page = 1;
  pageSize = 20;
  rows: any[] = [];
  total = 0;
  loading = false;
  errorMsg = '';
  syncing = false;
  cleaning = false;

  constructor(private propsSvc: PropiedadesService, private router: Router) {}

  ngOnInit(): void {
    this.load(); // ✅ solo listar, nada de sync al entrar
  }

  private async autoRefresh(): Promise<void> {
    try {
      this.syncing = true;
      await this.propsSvc.sync().toPromise();
    } catch {
      /* no interrumpir */
    } finally {
      this.syncing = false;
    }

    try {
      this.cleaning = true;
      await this.propsSvc.cleanup().toPromise();
    } catch {
      /* no interrumpir */
    } finally {
      this.cleaning = false;
    }
  }

  load(): void {
    this.loading = true;
    this.errorMsg = '';
    this.propsSvc
      .list({ q: this.q, page: this.page, pageSize: this.pageSize })
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
          this.rows = [];
          this.total = 0;
          this.errorMsg = 'Error de servidor.';
        },
      });
  }

  openDetalle(r: any) {
    if (!r?.id) return;
    this.router.navigate(['/detalle-propiedad', r.id]);
  }

  sync(): void {
    if (!confirm('Sincronizar propiedades desde alquileres?')) return;
    this.syncing = true; // ✅ activar loader
    this.propsSvc.sync().subscribe({
      next: (r) => {
        alert(
          `Listo.\nNuevas: ${r?.inserted ?? 0}\nActualizadas: ${
            r?.updated ?? 0
          }`
        );
        this.page = 1;
        this.load();
        this.syncing = false; // ✅ desactivar loader
      },
      error: () => {
        alert('Error de servidor al sincronizar.');
        this.syncing = false; // ✅ desactivar loader aunque falle
      },
    });
  }

  cleanup(): void {
    if (!confirm('¿Eliminar propiedades que ya no existen en alquileres?'))
      return;
    this.cleaning = true; // ✅ activar loader
    this.propsSvc.cleanup().subscribe({
      next: (r) => {
        alert(`Limpieza completa. Eliminadas: ${r?.deleted ?? 0}`);
        this.page = 1;
        this.load();
        this.cleaning = false; // ✅ desactivar loader
      },
      error: () => {
        alert('Error de servidor al limpiar.');
        this.cleaning = false; // ✅ desactivar loader aunque falle
      },
    });
  }

  get totalPages(): number {
    const p = Math.ceil(this.total / this.pageSize);
    return p > 0 ? p : 1;
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

  eliminar(r: any) {
    if (!r?.id) return;
    if (!confirm(`¿Eliminar propiedad "${r.direccion}" (#${r.id})?`)) return;
    this.propsSvc.delete(r.id).subscribe({
      next: (res) => {
        if (res?.success) {
          this.page = 1;
          this.load();
        } else {
          alert('No se pudo eliminar.');
        }
      },
      error: () => alert('Error de servidor al eliminar.'),
    });
  }
  private async fetchAllPropiedades(): Promise<any[]> {
    const chunk = 500; // tamaño del lote
    let page = 1;
    let acc: any[] = [];

    while (true) {
      const res: any = await this.propsSvc
        .list({
          q: (this.q || '').trim() || undefined,
          page,
          pageSize: chunk,
        })
        .toPromise();

      if (!res?.success) break;

      const rows = res.rows || [];
      acc = acc.concat(rows);

      const total = res.total ?? acc.length;
      if (acc.length >= total || rows.length < chunk) break;

      page++;
      if (page > 200) break; // safety
    }

    return acc;
  }

  /** Arma el HTML imprimible de la lista de propiedades. */
  private buildPrintHtmlPropiedades(rows: any[]): string {
    const esc = (v: any) =>
      (v ?? '')
        .toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    // Tratá de resolver nombre de propietario si viene alguna variante
    const getPropName = (r: any) => {
      const name =
        r.propietario_nombre ?? r.propietario ?? r.owner_nombre ?? '';
      if (name && String(name).trim() !== '') return String(name);
      const pid = r.propietario_id ?? r.owner_id ?? null;
      return pid ? `#${pid}` : '—';
    };

    const thead = `
    <tr>
      <th style="text-align:left;">Dirección</th>
      <th style="text-align:left;">Propietario</th>
      <th style="text-align:center;">Tipo domicilio</th>
    </tr>
  `;

    const tbody = rows
      .map((r) => {
        const dir = esc(r.direccion ?? '');
        const prop = esc(getPropName(r));
        const tipo = esc((r.domicilio_tipo ?? '—') || '—');
        const id = esc(r.id ?? '');
        return `
        <tr>
          <td style="text-align:left;">${dir}</td>
          <td style="text-align:left;">${prop}</td>
          <td style="text-align:center; text-transform:capitalize;">${tipo}</td>
        </tr>
      `;
      })
      .join('');

    const now = new Date();
    const when =
      now.toLocaleDateString('es-AR') + ' ' + now.toLocaleTimeString('es-AR');

    const resumenFiltro =
      (this.q || '').trim() !== '' ? ` · Filtro: "${esc(this.q)}"` : '';

    return `
<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8"/>
<title>Propiedades — Listado completo</title>
<style>
  :root { --fg:#111827; --muted:#6b7280; --line:#e5e7eb; }
  body { font-family: system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif; color:var(--fg); margin:24px; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  .meta { color: var(--muted); font-size: 12px; margin: 0 0 12px; }
  table { width:100%; border-collapse: collapse; font-size: 12px; }
  th, td { border: 1px solid var(--line); padding: 6px 8px; vertical-align: top; }
  th { background:#f9fafb; }
  @media print { @page{ size:A4 portrait; margin: 10mm; } body{ margin:0; } }
</style>
</head>
<body>
  <h1>Propiedades — Listado completo</h1>
  <div class="meta">Generado: ${esc(when)}${resumenFiltro}</div>

  <table>
    <thead>${thead}</thead>
    <tbody>${tbody}</tbody>
  </table>

  <script>window.onload=()=>setTimeout(()=>window.print(),50);</script>
</body>
</html>`;
  }

  /** Abre ventana y dispara print. */
  private openPrintWindow(html: string) {
    const w = window.open('', '_blank');
    if (!w) {
      alert('El navegador bloqueó la ventana de impresión. Permití popups.');
      return;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
  }

  /** Acción principal del botón. */
  async printPropiedadesFull() {
    try {
      const rows = await this.fetchAllPropiedades();
      if (!rows.length) {
        alert('No hay propiedades para imprimir.');
        return;
      }
      const html = this.buildPrintHtmlPropiedades(rows);
      this.openPrintWindow(html);
    } catch (e) {
      console.error('printPropiedadesFull error', e);
      alert('No se pudo generar la impresión.');
    }
  }
}
