import { Component, OnInit } from '@angular/core';
import {
  InquilinosService,
  Inquilino,
} from '../../services/inquilinos.service';
import { EmailService } from '../../services/email.service';

interface InquilinoAlquilerActual {
  direccion: string;
  mes: string; // "YYYY-MM" o "MM-YY" según backend
  alquiler_prop: number | null;
}

interface InquilinoDetallePayload {
  inquilino: any;
  domicilios: string[];
  alquiler_actual?: InquilinoAlquilerActual | null; // opcional
}

export interface Reminder {
  id: number;
  alquiler_id: number;
  due_date: string;
  message: string;
  status: 'pending' | 'done';
  created_at: string;
  updated_at: string;
  inquilino?: string | null;
  propietario?: string | null;
  direccion?: string | null;
  days_left: number; // viene del backend
}

@Component({
  selector: 'app-inquilinos',
  templateUrl: './inquilinos.component.html',
  styleUrls: ['./inquilinos.component.css'],
})
export class InquilinosComponent implements OnInit {
  q = '';
  page = 1;
  pageSize = 20;

  rows: Array<Inquilino & { domicilio?: string | null }> = [];
  total = 0;
  loading = false;
  errorMsg = '';

  // Overlay: detalle (solo lectura)
  detailOpen = false;
  detalle: InquilinoDetallePayload | null = null;

  // Overlay: edición/alta
  editOpen = false;
  editingId: number | null = null;
  editForm: Inquilino = this.empty();

  emailOpen = false;
  emailForm = {
    to_email: '',
    to_name: '',
    subject: '',
    body_html: '',
  };

  // estado del filtro: '' | 'vigente' | 'sin'
  vigFilter: '' | 'vigente' | 'sin' = '';

  inqEmailAttachments: Array<{
    name: string;
    size: number;
    type: string;
    base64: string;
  }> = [];
  emailSending = false; // si no lo tenías

  constructor(private svc: InquilinosService, private emailSvc: EmailService) {}
  ngOnInit(): void {
    this.load();
  }

  private clampAndMaybeReload(total: number, rowsCount: number) {
    const totalPagesRaw = Math.ceil(total / this.pageSize); // 0 si no hay registros
    if (totalPagesRaw === 0) {
      // Sin registros: forzamos page=1 y no volvemos a cargar
      if (this.page !== 1) this.page = 1;
      return false; // no recargar
    }
    if (this.page > totalPagesRaw) {
      this.page = totalPagesRaw;
      // Si pedimos una página que quedó vacía pero hay total>0, recargamos ya en la nueva page
      return true; // recargar
    }
    return false; // no recargar
  }

  empty(): Inquilino {
    return {
      nombre: '',
      dni_cuit: '',
      telefono: '',
      email: '',
      notas: '',
      garantes: '',
      alquiler: null,
    };
  }

  get totalPages(): number {
    const p = Math.ceil(this.total / this.pageSize);
    return p > 0 ? p : 1;
  }

  load(): void {
    this.loading = true;
    this.errorMsg = '';
    this.svc
      .list({
        q: this.q || undefined,
        page: this.page,
        pageSize: this.pageSize,
      })
      .subscribe({
        next: (res) => {
          this.loading = false;
          if (res?.success) {
            this.total = res.total ?? 0;

            // 👇 Ajuste de página si quedó fuera de rango
            const shouldReload = this.clampAndMaybeReload(
              this.total,
              res.rows?.length ?? 0
            );
            if (shouldReload) {
              this.load(); // recarga una sola vez ya con page corregida
              return;
            }

            this.rows = res.rows ?? [];
          } else {
            this.rows = [];
            this.total = 0;
            this.errorMsg = 'No se pudo cargar.';
            // Asegura page=1 cuando no hay registros
            if (this.page !== 1) this.page = 1;
          }
        },
        error: () => {
          this.loading = false;
          this.rows = [];
          this.total = 0;
          this.errorMsg = 'Error de servidor.';
          if (this.page !== 1) this.page = 1;
        },
      });
  }

  applyFilters(): void {
    this.page = 1;
    this.load();
  }
  clearFilters(): void {
    this.q = '';
    this.page = 1;
    this.load();
  }
  changePageSize(): void {
    this.page = 1;
    this.load();
  }
  prevPage(): void {
    if (this.page > 1) {
      this.page--;
      this.load();
    }
  }
  nextPage(): void {
    if (this.page < this.totalPages) {
      this.page++;
      this.load();
    }
  }

  /* ===== Detalle (solo lectura) ===== */
  verDetalle(r: any) {
    this.detalle = null;
    this.detailOpen = true;

    const obs = r.id
      ? this.svc.detail({ id: r.id })
      : this.svc.detail({ nombre: r.nombre });

    obs.subscribe({
      next: (res) => {
        if (res?.success) {
          this.detalle = {
            inquilino: res.inquilino ?? r,
            domicilios: res.domicilios ?? [], // histórico ya filtrado
            alquiler_actual: res.alquiler_actual ?? null, // vigente (si hay)
          };
        } else {
          this.detalle = {
            inquilino: r,
            domicilios: [],
            alquiler_actual: null,
          };
        }
      },
      error: () => {
        this.detalle = { inquilino: r, domicilios: [], alquiler_actual: null };
      },
    });
  }
  closeDetail() {
    this.detailOpen = false;
    this.detalle = null;
  }

  /* ===== Editar / Crear en overlay ===== */
  nuevo(): void {
    this.editOpen = true;
    this.editingId = null;
    this.editForm = this.empty();
  }
  editar(r: any, ev?: MouseEvent): void {
    if (ev) ev.stopPropagation(); // no abrir detalle debajo
    this.editOpen = true;
    this.editingId = r.id ?? null;

    // Pre-carga rápida con lo que hay, para que el modal no quede vacío
    this.editForm = {
      id: r.id ?? undefined,
      nombre: r.nombre || '',
      dni_cuit: r.dni_cuit || '',
      telefono: r.telefono || '',
      email: r.email || '',
      notas: r.notas || '',
      garantes: r.garantes || '',
      alquiler: r.alquiler ?? null,
    };

    // ⚠️ Cargar datos completos desde el backend (garantiza campos faltantes)
    if (this.editingId) {
      this.svc.get(this.editingId).subscribe({
        next: (res) => {
          const row = res?.row;
          if (!row) return;
          this.editForm = {
            id: row.id,
            nombre: row.nombre || '',
            dni_cuit: row.dni_cuit || '',
            telefono: row.telefono || '',
            email: row.email || '',
            notas: row.notas || '',
            garantes: row.garantes || '',
            alquiler:
              row.alquiler !== null && row.alquiler !== undefined
                ? row.alquiler
                : null,
          };
        },
      });
    }
  }
  closeEdit() {
    this.editOpen = false;
    this.editingId = null;
    this.editForm = this.empty();
  }

  guardarEdit(): void {
    if (!this.editForm.nombre?.trim()) {
      alert('El nombre es obligatorio');
      return;
    }
    const obs = this.editingId
      ? this.svc.update(this.editingId, this.editForm)
      : this.svc.create(this.editForm);

    obs.subscribe({
      next: (res) => {
        if (res?.success) {
          this.closeEdit();
          this.load();
          // refrescar overlay de detalle si está abierto sobre el mismo nombre/id
          if (this.detailOpen && this.detalle?.inquilino) {
            const idRef = this.editingId ?? (res.id as number | undefined);
            if (idRef) {
              this.svc.detail({ id: idRef }).subscribe((d) => {
                if (d?.success) this.detalle = d;
              });
            }
          }
        } else {
          alert('No se pudo guardar.');
        }
      },
      error: () => alert('Error de servidor al guardar.'),
    });
  }

  eliminar(r: any, ev?: MouseEvent): void {
    if (ev) ev.stopPropagation();
    if (!r.id) {
      alert('Este inquilino aún no tiene ficha guardada.');
      return;
    }
    if (!confirm(`¿Eliminar inquilino "${r.nombre}" (#${r.id})?`)) return;

    this.svc.delete(r.id).subscribe({
      next: (res) => {
        if (res?.success) {
          const isLastOnPage = this.rows.length === 1 && this.page > 1;
          if (isLastOnPage) this.page--; //  pasamos a la página anterior
          this.load();
        } else {
          this.errorMsg = 'No se pudo eliminar.';
        }
      },
      error: () => (this.errorMsg = 'Error de servidor al eliminar.'),
    });
  }

  importar(): void {
    if (
      !confirm(
        'Esto importará inquilinos únicos desde la tabla de alquileres. ¿Continuar?'
      )
    )
      return;
    this.loading = true;
    this.svc.importFromAlquileres().subscribe({
      next: (res) => {
        this.loading = false;
        if (res?.success) {
          alert(
            `Importación completa. Nuevos inquilinos: ${res.inserted || 0}`
          );
          this.page = 1;
          this.load();
        } else {
          alert('No se pudo importar.');
        }
      },
      error: (e) => {
        this.loading = false;
        console.error('import error', e);
        alert('Error de servidor al importar.');
      },
    });
  }

  openEmail(
    to_email: string,
    to_name?: string,
    subject?: string,
    body?: string
  ) {
    // Cerrar detalle si estaba abierto
    if (this.detailOpen) this.closeDetail();

    // Si no hay email, avisar temprano
    if (!to_email) {
      alert('Este inquilino no tiene email cargado.');
      return;
    }
    this.emailForm = {
      to_email: to_email || '',
      to_name: to_name || '',
      subject: subject || 'Información de su alquiler',
      body_html: body || '<p>Hola,</p><p>Adjuntamos la información.</p>',
    };
    this.emailOpen = true;
  }

  sendEmail() {
    const { to_email, subject, body_html, to_name } = this.emailForm;
    if (!to_email || !subject || !body_html) {
      alert('Para, asunto y mensaje son obligatorios.');
      return;
    }
    if (this.emailSending) return;
    this.emailSending = true;

    const attachments = this.inqEmailAttachments.map((f) => ({
      filename: f.name,
      content_base64: f.base64,
      mime: f.type,
    }));

    this.emailSvc
      .sendEmail({
        to_email,
        to_name: to_name || '',
        subject,
        body_html,
        attachments,
      })
      .subscribe({
        next: (res) => {
          this.emailSending = false;
          if (res?.success) {
            alert('Email enviado');
            this.emailOpen = false;
            this.inqEmailAttachments = [];
          } else {
            alert('No se pudo enviar. Revisá el backend.');
          }
        },
        error: () => {
          this.emailSending = false;
          alert('Error de servidor al enviar.');
        },
      });
  }

  // Prefill del modal de email (reusa tu EmailService + modal actual)
  prefillAndOpenEmail(r: any) {
    const subj = `Recordatorio de vencimiento — ${
      r.direccion || r.inquilino
    } (${r.due_date})`;
    const body = `
    <p>Hola ${r.inquilino || ''},</p>
    <p>Te recordamos el vencimiento del alquiler${
      r.direccion ? ' de <strong>' + r.direccion + '</strong>' : ''
    } con fecha <strong>${r.due_date}</strong>.</p>
    <p>Saludos,</p>
    <p>Administración</p>
  `;
    this.openEmail(
      r.email_inquilino || '',
      r.inquilino || '',
      subj,
      body.trim()
    );
  }

  private async fetchAllInquilinos(): Promise<any[]> {
    const pageSize = 1000; // chunk grande
    let page = 1;
    let acc: any[] = [];
    while (true) {
      const res: any = await this.svc
        .list({
          q: this.q || undefined,
          page,
          pageSize,
          // si tenés include_archived y querés incluirlos, agregá: include_archived: '1'
        })
        .toPromise();

      if (!res?.success) break;

      const rows = res.rows || [];
      acc = acc.concat(rows);
      const total = res.total || acc.length;
      if (acc.length >= total || rows.length < pageSize) break;

      page++;
      if (page > 200) break; // safety
    }
    return acc;
  }

  async printAllInquilinos() {
    try {
      const rows = await this.fetchAllInquilinos();
      if (!rows.length) {
        alert('No hay inquilinos para imprimir con el filtro actual.');
        return;
      }
      const html = this.buildPrintHtmlInqList(rows);
      this.openPrintWindow(html);
    } catch (e) {
      console.error('printAllInquilinos error', e);
      alert('No se pudo generar la impresión.');
    }
  }

  private buildPrintHtmlInqList(rows: any[]): string {
    const esc = (v: any) =>
      (v ?? '')
        .toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    const now = new Date();
    const when =
      now.toLocaleDateString('es-AR') + ' ' + now.toLocaleTimeString('es-AR');

    const head = `
  <tr>
    <th style="text-align:left;">Nombre</th>
    <th>DNI/CUIT</th>
    <th>Teléfono</th>
    <th>Email</th>
    <th>Garantes</th>
    <th>Notas</th>
    <th>Domicilio actual</th>
    <th>Alquiler vigente</th>
    <th>Estado</th>
  </tr>
`;

    const body = rows
      .map(
        (r) => `
      <tr>
        <td style="text-align:left;">${esc(r.nombre)}</td>
        <td>${esc(r.dni_cuit || '—')}</td>
        <td>${esc(r.telefono || '—')}</td>
        <td>${esc(r.email || '—')}</td>
        <td>${esc(r.garantes || '')}</td>
        <td>${esc(r.notas || '')}</td>
        <td>${esc(r.domicilio || '—')}</td>
        <td style="text-align:right;">${
          r.alquiler_vigente != null && r.alquiler_vigente !== ''
            ? esc(r.alquiler_vigente)
            : '—'
        }</td>
        <td style="text-transform:uppercase; text-align:center;">
          ${r.is_active ? 'ACTIVO' : 'ARCHIVADO'}
        </td>
      </tr>`
      )
      .join('');

    return `
<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8"/>
<title>Inquilinos — Lista completa</title>
<style>
  :root { --fg:#111827; --muted:#6b7280; --line:#e5e7eb; }
  body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; color:var(--fg); margin:24px; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  .meta { color: var(--muted); font-size: 12px; margin: 0 0 12px; }
  table { width:100%; border-collapse: collapse; font-size: 12px; }
  th, td { border: 1px solid var(--line); padding: 6px 8px; vertical-align: top; }
  th { background: #f9fafb; }
  @media print { @page{ size:A4 portrait; margin: 10mm; } body{ margin:0; } }
</style>
</head>
<body>
  <h1>Inquilinos — Lista completa</h1>
  <div class="meta">Generado: ${esc(when)} · Filtro: ${esc(this.q || '—')}</div>
  <table>
    <thead>${head}</thead>
    <tbody>${body}</tbody>
  </table>
  <script>window.onload=()=>setTimeout(()=>window.print(),50);</script>
</body>
</html>`;
  }

  /* ===================== IMPRESIÓN: DETALLE (overlay) ===================== */

  printInquilinoDetail(ev?: Event) {
    ev?.stopPropagation();
    const iq = this.detalle?.inquilino;
    if (!iq) {
      alert('No hay datos del inquilino cargados.');
      return;
    }

    const doms = this.detalle?.domicilios || [];
    const alquilerActual = this.detalle?.alquiler_actual || null;

    const html = this.buildPrintHtmlInquilino(iq, doms, alquilerActual);
    this.openPrintWindow(html);
  }

  private buildPrintHtmlInquilino(
    iq: any,
    domicilios: string[],
    alquilerActual: any
  ): string {
    const esc = (v: any) =>
      (v ?? '')
        .toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    const now = new Date();
    const when =
      now.toLocaleDateString('es-AR') + ' ' + now.toLocaleTimeString('es-AR');

    const domActual = alquilerActual
      ? `${esc(alquilerActual.direccion)} <span class="muted">(${esc(
          alquilerActual.mes
        )})</span>`
      : '—';

    const montoActual =
      alquilerActual && alquilerActual.alquiler_prop != null
        ? esc(alquilerActual.alquiler_prop)
        : '—';

    const domHist = domicilios?.length
      ? `
      <h2>Domicilios (histórico)</h2>
      <table>
        <thead><tr><th style="text-align:left;">Dirección</th></tr></thead>
        <tbody>
          ${domicilios
            .map((d) => `<tr><td style="text-align:left;">${esc(d)}</td></tr>`)
            .join('')}
        </tbody>
      </table>
    `
      : '<div class="muted" style="margin-top:6px;">Sin domicilios históricos.</div>';

    return `
<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8"/>
<title>Inquilino — ${esc(iq?.nombre || '')}</title>
<style>
  :root { --fg:#111827; --muted:#6b7280; --line:#e5e7eb; }
  body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; color:var(--fg); margin:24px; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  h2 { font-size: 16px; margin: 14px 0 8px; }
  .meta { color: var(--muted); font-size: 12px; margin: 0 0 12px; }
  .box { border: 1px solid var(--line); border-radius: 8px; padding: 12px; }
  .grid { display:grid; grid-template-columns: 1fr 1fr; gap:8px 16px; font-size:13px; }
  .span2 { grid-column: 1 / -1; }
  .label { color: var(--muted); font-weight:600; margin-right:6px; }
  .muted { color: var(--muted); }
  table { width:100%; border-collapse: collapse; font-size: 12px; margin-top: 8px; }
  th, td { border: 1px solid var(--line); padding: 6px 8px; vertical-align: top; }
  th { background:#f9fafb; }
  @media print { @page{ size:A4 portrait; margin: 10mm; } body{ margin:0; } }
</style>
</head>
<body>
  <h1>Inquilino — ${esc(iq?.nombre || '')}</h1>
  <div class="meta">Generado: ${esc(when)}</div>

  <div class="box">
    <div class="grid">
      <div><span class="label">DNI/CUIT:</span>${esc(iq?.dni_cuit || '—')}</div>
      <div><span class="label">Teléfono:</span>${esc(iq?.telefono || '—')}</div>
      <div class="span2"><span class="label">Email:</span>${esc(
        iq?.email || '—'
      )}</div>
      <div class="span2"><span class="label">Garantes:</span>${esc(
        iq?.garantes || ''
      )}</div>
      <div class="span2"><span class="label">Notas:</span>${esc(
        iq?.notas || ''
      )}</div>
      <div class="span2"><span class="label">Domicilio actual:</span>${domActual}</div>
      <div><span class="label">Alquiler vigente:</span>${montoActual}</div>
    </div>
  </div>

  ${domHist}

  <script>window.onload=()=>setTimeout(()=>window.print(),50);</script>
</body>
</html>`;
  }

  /* ===== helpers (usá el de Propietarios si ya existe) ===== */
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

  onInqEmailFilesSelected(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    if (!files.length) return;

    const maxTotal = 18 * 1024 * 1024; // ~18MB
    const currentTotal = this.inqEmailAttachments.reduce(
      (a, f) => a + f.size,
      0
    );
    const newTotal = currentTotal + files.reduce((a, f) => a + f.size, 0);
    if (newTotal > maxTotal) {
      alert('Tamaño total de adjuntos excede ~18MB. Quitá alguno.');
      return;
    }

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string) || '';
        this.inqEmailAttachments.push({
          name: file.name,
          size: file.size,
          type: file.type || 'application/octet-stream',
          base64,
        });
      };
      reader.readAsDataURL(file);
    });

    input.value = '';
  }

  removeInqEmailAttachment(i: number) {
    this.inqEmailAttachments.splice(i, 1);
  }

  formatPhone(tel: string): string {
    if (!tel) return '';
    // eliminamos todo lo que no sean dígitos
    return tel.replace(/\D/g, '');
  }

  get rowsFiltered(): any[] {
    if (!this.rows || !this.rows.length) return [];
    if (this.vigFilter === '') return this.rows;

    const hasDomicilio = (r: any) =>
      (r?.domicilio ?? '').toString().trim().length > 0;

    if (this.vigFilter === 'vigente') {
      return this.rows.filter(hasDomicilio);
    } else {
      // 'sin'
      return this.rows.filter((r) => !hasDomicilio(r));
    }
  }
}
