import { Component, OnInit } from '@angular/core';
import {
  AmobladosService,
  AmobladoListOpts,
} from '../../services/amoblados.service';
import { InquilinosService } from '../../services/inquilinos.service';
import { Router } from '@angular/router';
import { AmobDir } from '../../services/amoblados.service';
import {
  AfterViewInit,
  ElementRef,
  QueryList,
  ViewChild,
  ViewChildren,
} from '@angular/core';

@Component({
  selector: 'app-amoblados',
  templateUrl: './amoblados.component.html',
  styleUrls: [
    '../alquileres/alquileres.component.css',
    './amoblados.component.css',
  ], // reutilizamos estilos
})
export class AmobladosComponent implements OnInit {
  @ViewChild('daysScroll') daysScroll!: ElementRef<HTMLDivElement>;
  @ViewChildren('dayItem') dayItems!: QueryList<ElementRef<HTMLDivElement>>;

  // filtros básicos
  q = '';
  fecha = ''; // YYYY-MM-DD (día que se lista)
  fFrom = '';
  fTo = '';

  // paginado/orden
  sort = 'fecha';
  dir: 'asc' | 'desc' = 'desc';
  page = 1;
  pageSize = 20;

  // montos
  fAlqMin: number | null = null;
  fAlqMax: number | null = null;
  fAdmMin: number | null = null;
  fAdmMax: number | null = null;
  fNetMin: number | null = null;
  fNetMax: number | null = null;

  // estados
  fEstados = { pagado: false, pendiente: false, noPagado: false, nulo: false };

  // ui
  advOpen = false;
  rows: any[] = [];
  total = 0;
  loading = false;
  errorMsg = '';

  // ===== Form modal =====
  formOpen = false;
  editingId: number | null = null;
  form: any = {
    inquilino_id: null,
    inquilino: '',
    direccion: '',
    fecha: '', // YYYY-MM-DD
    alquiler_prop: null,
    adm: null,
    adm_text: '',
    neto_propietario: null,
    estado_pago: '',
    fecha_pago_inquilino: null, // OPCIONAL
    notas: '',
  };

  // ===== Día seleccionado / barra de días =====
  selectedDate = new Date();
  daysOfMonth: number[] = [];
  viewYear = 0;
  viewMonth = 0; // 0..11

  // ===== Alta masiva (rango de días) =====
  rangeMode = false;
  fecha_from = ''; // YYYY-MM-DD
  fecha_to = '';

  // ===== Autocomplete Dirección (amoblados) =====
  dirTerm = '';
  dirSugs: { direccion: string }[] = [];
  dirTimer: any = null;
  showDirPanel = false;

  // ===== Autocomplete Inquilino =====
  inqTerm = '';
  inqSugs: { id?: number; nombre: string }[] = [];
  inqTimer: any = null;
  showInqPanel = false;

  showCalc = false;
  calcMode: 'porcentaje' | 'monto' | 'sin' = 'porcentaje';
  calcPorcentaje = 7; // valor por defecto (cámbialo si querés)
  calcMonto: number | null = null;
  calcPreview = { alquiler: 0, adm: 0, neto: 0 };

  detailOpen = false;
  detail: any | null = null;

  // NUEVO: control del campo “pendiente”
  isPendiente = false;
  pendienteText = '';

  // ⬇️ dentro de la clase
  dirs: AmobDir[] = [];
  dirsLoading = false;

  constructor(
    private svc: AmobladosService,
    private inqSvc: InquilinosService,
    private router: Router
  ) {}

  // ------------------------
  // Init: cae siempre en HOY
  // ------------------------
  ngOnInit() {
    this.goToday(); // setea selectedDate y barra
    this.fecha = this.formatDate(this.selectedDate); // día activo => filtro
    this.load();
    this.loadDirs();
  }

  // ------------------------
  // Estado -> CSV array
  // ------------------------
  private buildEstadoParam(): string[] {
    const s: string[] = [];
    if (this.fEstados.pagado) s.push('pagado');
    if (this.fEstados.pendiente) s.push('pendiente');
    if (this.fEstados.noPagado) s.push('no pagado');
    if (this.fEstados.nulo) s.push('nulo');
    return s;
  }

  // ------------------------
  // Listado
  // ------------------------
  load() {
    this.loading = true;
    const opts: AmobladoListOpts = {
      q: this.q || undefined,

      // clave: si hay día activo, priorizamos `fecha` (exacto)
      fecha: this.fecha || undefined,

      // si querés buscar por rango, limpiar `fecha` y setear fFrom/fTo
      fecha_from: this.fFrom || undefined,
      fecha_to: this.fTo || undefined,

      alq_min: this.fAlqMin ?? undefined,
      alq_max: this.fAlqMax ?? undefined,
      adm_min: this.fAdmMin ?? undefined,
      adm_max: this.fAdmMax ?? undefined,
      neto_min: this.fNetMin ?? undefined,
      neto_max: this.fNetMax ?? undefined,

      estado: this.buildEstadoParam(),
      page: this.page,
      pageSize: this.pageSize,
      sort: this.sort,
      dir: this.dir,
    };

    this.svc.list(opts).subscribe({
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

  applyFilters() {
    // si usás rango manual arriba, vaciá el día exacto
    if (this.fFrom || this.fTo) this.fecha = '';
    this.page = 1;
    this.load();
  }
  clearFilters() {
    this.q = '';
    // volvemos al DÍA activo
    this.fecha = this.formatDate(this.selectedDate);
    this.fFrom = '';
    this.fTo = '';
    this.fAlqMin =
      this.fAlqMax =
      this.fAdmMin =
      this.fAdmMax =
      this.fNetMin =
      this.fNetMax =
        null;
    this.fEstados = {
      pagado: false,
      pendiente: false,
      noPagado: false,
      nulo: false,
    };
    this.page = 1;
    this.load();
  }

  changePageSize() {
    this.page = 1;
    this.load();
  }
  prevPage() {
    if (this.page > 1) {
      this.page--;
      this.load();
    }
  }
  nextPage() {
    const totalPages = Math.max(1, Math.ceil(this.total / this.pageSize));
    if (this.page < totalPages) {
      this.page++;
      this.load();
    }
  }
  sortBy(col: string) {
    if (this.sort === col) this.dir = this.dir === 'asc' ? 'desc' : 'asc';
    else {
      this.sort = col;
      this.dir = 'asc';
    }
    this.load();
  }

  // ------------------------
  // CRUD
  // ------------------------
  nuevo() {
    this.editingId = null;
    this.formOpen = true;
    this.rangeMode = false;
    this.fecha_from = '';
    this.fecha_to = '';

    const today = this.formatDate(this.selectedDate);
    this.form = {
      inquilino_id: null,
      inquilino: '',
      direccion: '',
      fecha: today, // por defecto, el día visible
      alquiler_prop: null,
      adm: null,
      adm_text: '',
      neto_propietario: null,
      estado_pago: '',
      fecha_pago_inquilino: null, // OPCIONAL
      notas: '',
    };
    this.isPendiente = false;
    this.pendienteText = '';

    // limpiar autocompletes
    this.inqTerm = '';
    this.inqSugs = [];
    this.dirTerm = '';
    this.dirSugs = [];
  }

  editar(r: any) {
    this.editingId = r.id;
    this.formOpen = true;
    this.rangeMode = false; // edición es 1 día
    this.form = { ...r };
    // precargar términos para que el usuario vea el valor
    this.inqTerm = r.inquilino || '';
    this.dirTerm = r.direccion || '';

    this.pendienteText = this.parsePendienteText(this.form.estado_pago);
    const v = (this.form.estado_pago || '').toLowerCase();
    this.isPendiente = v === 'pendiente' || v.startsWith('pendiente:');
  }

  cancelarForm() {
    this.formOpen = false;
    this.editingId = null;
  }

  guardar() {
    // 1) Normalizar inquilino/dirección desde los inputs visibles
    const inqName = (this.form.inquilino || this.inqTerm || '').trim();
    const dir = (this.form.direccion || this.dirTerm || '').trim();
    if (!inqName || !dir) {
      alert('Inquilino y Dirección son obligatorios.');
      return;
    }
    this.form.inquilino = inqName;
    this.form.direccion = dir;

    // 2) Componer "pendiente" si corresponde
    //    (si el estado es "pendiente" o marcaste el toggle, guardamos como
    //     "pendiente: <detalle>" si hay texto; si no, solo "pendiente")
    const estadoRaw = (this.form.estado_pago || '').toLowerCase();
    if (
      this.isPendiente ||
      estadoRaw === 'pendiente' ||
      estadoRaw.startsWith('pendiente:')
    ) {
      const txt = (this.pendienteText || '').trim();
      this.form.estado_pago = txt ? `pendiente: ${txt}` : 'pendiente';
    }
    // 3) Evitar errores de fecha vacía en backend
    if (!this.form.fecha_pago_inquilino) this.form.fecha_pago_inquilino = null;

    const creating = !this.editingId;

    // 4) UPDATE (una fila)
    if (!creating) {
      this.svc.update(this.editingId!, this.form).subscribe({
        next: (res) => {
          if (res?.success) {
            this.formOpen = false;
            this.editingId = null;
            this.load();
          } else {
            alert('No se pudo guardar.');
          }
        },
        error: () => alert('Error de servidor al guardar.'),
      });
      return;
    }

    // 5) CREATE
    if (this.rangeMode) {
      // Alta masiva por rango de días
      if (!this.fecha_from || !this.fecha_to) {
        alert('Completá el rango de fechas.');
        return;
      }
      const payload = {
        ...this.form,
        fecha_from: this.fecha_from,
        fecha_to: this.fecha_to,
      };
      this.svc.createBulk(payload).subscribe({
        next: (res) => {
          if (res?.success) {
            this.formOpen = false;
            this.load();
            this.loadDirs();
          } else {
            alert('No se pudo crear el rango.');
          }
        },
        error: () => alert('Error de servidor al crear rango.'),
      });
    } else {
      // Un solo día
      if (!this.form.fecha) {
        // si borraron la fecha, usar el día visible/seleccionado
        this.form.fecha = this.formatDate(this.selectedDate);
      }
      this.svc.create(this.form).subscribe({
        next: (res) => {
          if (res?.success) {
            this.formOpen = false;
            this.load();
            this.loadDirs();
          } else {
            alert('No se pudo crear.');
          }
        },
        error: () => alert('Error de servidor al crear.'),
      });
    }
  }

  eliminar(r: any) {
    if (!confirm(`¿Eliminar amoblado #${r.id}?`)) return;
    this.svc.remove(r.id).subscribe({
      next: (res) => {
        if (res?.success) this.load();
        else alert('No se pudo eliminar.');
      },
      error: () => alert('Error de servidor al eliminar.'),
    });
  }

  // ------------------------
  // Barra de días
  // ------------------------
  private formatDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private computeDaysBar(forDate: Date) {
    this.viewYear = forDate.getFullYear();
    this.viewMonth = forDate.getMonth();
    const last = new Date(this.viewYear, this.viewMonth + 1, 0);
    const total = last.getDate();
    this.daysOfMonth = Array.from({ length: total }, (_, i) => i + 1);
  }

  selectDay(dayNum: number) {
    this.selectedDate = new Date(this.viewYear, this.viewMonth, dayNum);
    this.fecha = this.formatDate(this.selectedDate);
    this.fFrom = '';
    this.fTo = '';
    this.page = 1; // 👈 opcional pero cómodo
    this.load(); // 👈 recargar listado
    // centerActive() se ejecuta por .changes si cambió la barra;
    // si no cambió (mismo mes), lo llamamos igual:
    this.centerActive();
  }

  prevDay() {
    const d = new Date(this.selectedDate);
    d.setDate(d.getDate() - 1);
    this.selectedDate = d;
    this.computeDaysBar(d);
    this.fecha = this.formatDate(this.selectedDate); // 🔑
    this.fFrom = '';
    this.fTo = '';
    this.page = 1;
    this.load();
    this.scrollActiveIntoView();
  }

  nextDay() {
    const d = new Date(this.selectedDate);
    d.setDate(d.getDate() + 1);
    this.selectedDate = d;
    this.computeDaysBar(d);
    this.fecha = this.formatDate(this.selectedDate); // 🔑
    this.fFrom = '';
    this.fTo = '';
    this.page = 1;
    this.load();
    this.scrollActiveIntoView();
  }

  goToday() {
    const d = new Date();
    this.selectedDate = d;
    this.computeDaysBar(d); // redibuja la barra (dispara .changes)
    this.fecha = this.formatDate(this.selectedDate);
    this.fFrom = '';
    this.fTo = '';
    this.page = 1; // 👈 volvemos a la 1
    this.load(); // 👈 recargar listado
  }

  isActiveDay(dayNum: number) {
    return (
      this.selectedDate.getFullYear() === this.viewYear &&
      this.selectedDate.getMonth() === this.viewMonth &&
      this.selectedDate.getDate() === dayNum
    );
  }

  // ------------------------
  // Autocomplete INQUILINO
  // ------------------------
  onInqTermInput() {
    if (this.inqTimer) clearTimeout(this.inqTimer);
    const term = this.inqTerm.trim();
    if (term.length < 2) {
      this.inqSugs = [];
      return;
    }
    this.inqTimer = setTimeout(() => {
      this.inqSvc.list({ q: term, page: 1, pageSize: 10 }).subscribe({
        next: (res) => {
          this.inqSugs = (res?.rows || []).map((i: any) => ({
            id: i.id,
            nombre: i.nombre,
          }));
        },
        error: () => (this.inqSugs = []),
      });
    }, 250);
  }

  seleccionarInq(i: { id?: number; nombre: string }) {
    this.form.inquilino_id = i.id ?? null;
    this.form.inquilino = i.nombre;
    this.inqTerm = i.nombre;
    this.inqSugs = [];
    this.showInqPanel = false;
  }

  onInqBlur() {
    setTimeout(() => (this.showInqPanel = false), 150);
  }

  // ------------------------
  // Autocomplete DIRECCIÓN (Amoblados)
  // ------------------------
  onDirInput() {
    if (this.dirTimer) clearTimeout(this.dirTimer);
    const term = this.dirTerm.trim();
    if (!term) {
      this.dirSugs = [];
      return;
    }
    this.dirTimer = setTimeout(() => {
      this.svc.suggestDirecciones(term).subscribe({
        next: (res) => (this.dirSugs = res?.rows || []),
        error: () => (this.dirSugs = []),
      });
    }, 250);
  }

  onDirBlur() {
    setTimeout(() => (this.showDirPanel = false), 120);
  }

  seleccionarDir(s: { direccion: string }) {
    this.form.direccion = s.direccion;
    this.dirTerm = s.direccion;
    this.dirSugs = [];
    this.showDirPanel = false;
  }

  openCalc() {
    if (!this.form.alquiler_prop) return;
    // Si ya había ADM cargado, preselecciono "monto"
    if (this.form.adm && this.form.adm > 0) {
      this.calcMode = 'monto';
      this.calcMonto = this.form.adm;
    } else {
      this.calcMode = 'porcentaje';
      this.calcMonto = null;
    }
    this.showCalc = true;
    this.recomputeCalc();
  }

  closeCalc() {
    this.showCalc = false;
  }

  recomputeCalc() {
    const alquiler = Number(this.form.alquiler_prop) || 0;
    let adm = 0;

    if (this.calcMode === 'porcentaje') {
      const p = Number(this.calcPorcentaje) || 0;
      adm = +(alquiler * (p / 100)).toFixed(2);
    } else if (this.calcMode === 'monto') {
      adm = Number(this.calcMonto) || 0;
    } else {
      adm = 0;
    }

    const neto = +(alquiler - adm).toFixed(2);
    this.calcPreview = { alquiler, adm, neto };
  }

  applyCalc() {
    this.form.adm = this.calcPreview.adm;
    this.form.neto_propietario = this.calcPreview.neto;
    this.closeCalc();
  }

  // Mantener neto actualizado si el usuario escribe a mano
  onAlquilerChange() {
    const alquiler = Number(this.form.alquiler_prop) || 0;
    const adm = Number(this.form.adm) || 0;
    this.form.neto_propietario = +(alquiler - adm).toFixed(2);
    if (this.showCalc) this.recomputeCalc();
  }

  onAdmChange() {
    const alquiler = Number(this.form.alquiler_prop) || 0;
    const adm = Number(this.form.adm) || 0;
    this.form.neto_propietario = +(alquiler - adm).toFixed(2);
  }

  onRowClick(r: any) {
    this.detail = r;
    this.detailOpen = true;
  }
  closeDetail() {
    this.detailOpen = false;
    this.detail = null;
  }
  // Editar desde el overlay (y cerrarlo)
  editarDesdeDetalle() {
    if (!this.detail) return;
    this.editar(this.detail);
    this.closeDetail();
  }

  private parsePendienteText(v: string | null | undefined): string {
    if (!v) return '';
    const s = v.trim().toLowerCase();
    if (!s.startsWith('pendiente')) return '';
    const idx = v.indexOf(':');
    if (idx === -1) return '';
    return v.slice(idx + 1).trim();
  }

  onEstadoChange() {
    const v = (this.form.estado_pago || '').toLowerCase();
    this.isPendiente = v === 'pendiente' || v.startsWith('pendiente:');
    if (this.isPendiente) {
      // si viene con “pendiente: xxx” lo descompongo; si solo es “pendiente”, mantengo lo que el user esté tipeando
      const parsed = this.parsePendienteText(this.form.estado_pago);
      if (parsed && !this.pendienteText) {
        this.pendienteText = parsed;
      }
    } else {
      this.pendienteText = '';
    }
  }

  loadDirs() {
    this.dirsLoading = true;
    this.svc.listDirs().subscribe({
      next: (res) => {
        this.dirsLoading = false;
        this.dirs = res?.rows || [];
      },
      error: () => {
        this.dirsLoading = false;
        this.dirs = [];
      },
    });
  }

  goMovs(d: AmobDir) {
    this.router.navigate(['/amob-movs', d.id]); // /amob-movs/:dirId
  }

  goServicios(d: AmobDir) {
    // si ya tenés el componente de servicios, ajustá la ruta
    this.router.navigate(['/amoblados/direcciones', d.id, 'servicios']); // placeholder
  }

  eliminarDir(d: AmobDir) {
    if (!confirm(`Eliminar la dirección "${d.direccion}" de la lista?`)) return;
    this.svc.deleteDir(d.id).subscribe({
      next: (res) => {
        if (res?.success) this.loadDirs();
        else alert('No se pudo eliminar la dirección.');
      },
      error: () => alert('Error de servidor al eliminar dirección.'),
    });
  }

  scrollActiveIntoView() {
    queueMicrotask(() => {
      const container = this.daysScroll?.nativeElement;
      if (!container) return;
      const active = this.dayItems?.find((el) =>
        el.nativeElement.classList.contains('active')
      )?.nativeElement;
      if (!active) return;
      active.scrollIntoView({
        inline: 'center',
        block: 'nearest',
        behavior: 'instant' as any,
      });
    });
  }

  ngAfterViewInit() {
    // cuando Angular vuelve a renderizar la barra, centramos el activo
    this.dayItems.changes.subscribe(() => this.centerActive());
    // y también una vez al iniciar
    this.centerActive();
  }

  /** Centra el día activo en el contenedor (sin confiar en scrollIntoView) */
  centerActive() {
    // esperamos al siguiente frame para asegurarnos que layout esté listo
    requestAnimationFrame(() => {
      const container = this.daysScroll?.nativeElement;
      if (!container) return;

      const activeEl = this.dayItems?.find((el) =>
        el.nativeElement.classList.contains('active')
      )?.nativeElement;
      if (!activeEl) return;

      const cRect = container.getBoundingClientRect();
      const aRect = activeEl.getBoundingClientRect();

      // delta horizontal desde el centro del contenedor al centro del activo
      const delta =
        aRect.left + aRect.width / 2 - (cRect.left + cRect.width / 2);
      container.scrollLeft += delta; // mueve lo justo para centrar
    });
  }

  // === PRINT SOLO DETALLE AMOBLADO ===
  private esc(v: any): string {
    if (v === null || v === undefined) return '—';
    return String(v).replace(
      /[&<>"']/g,
      (m) =>
        ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;',
        }[m]!)
    );
  }
  private fmt(n: any): string {
    if (n === null || n === undefined || n === '') return '—';
    const x = Number(n);
    if (Number.isNaN(x)) return '—';
    return x.toLocaleString('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  private buildPrintHtmlDetalle(d: any): string {
    const css = `
    @page { size: A4; margin: 14mm; }
    html, body { background:#fff; color:#111; }
    body { font-family: system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,'Helvetica Neue',Arial,sans-serif; }
    .wrap { padding: 0; }
    h1 { font-size: 18pt; margin: 0 0 12pt; }
    .muted { color:#6b7280; }
    .grid {
      display:grid;
      grid-template-columns: 1fr 1fr;
      gap: 8pt 16pt;
    }
    .span2 { grid-column: span 2; }
    .lbl { font-size:10pt; color:#555; margin-bottom: 2pt; }
    .val { font-size:12pt; }
    .val.nowrap { white-space: nowrap; }
    .notes { white-space: pre-wrap; line-height: 1.35; }
    .meta { font-size:10pt; color:#666; margin-bottom: 10pt; }
    hr { border:0; border-top:1px solid #e5e7eb; margin:10pt 0; }
  `;

    const body = `
    <div class="wrap">
      <h1>Detalle amoblado #${this.esc(d?.id ?? '')}</h1>
      <div class="meta">${this.esc(d?.direccion || '—')}</div>
      <div class="grid">
        <div>
          <div class="lbl">Fecha</div>
          <div class="val">${this.esc(d?.fecha || '—')}</div>
        </div>
        <div>
          <div class="lbl">Vencimiento</div>
          <div class="val">${this.esc(d?.vencimiento || '—')}</div>
        </div>

        <div>
          <div class="lbl">Inquilino</div>
          <div class="val">${this.esc(d?.inquilino || '—')}</div>
        </div>
        <div>
          <div class="lbl">Dirección</div>
          <div class="val">${this.esc(d?.direccion || '—')}</div>
        </div>

        <div>
          <div class="lbl">Alquiler</div>
          <div class="val nowrap">${this.fmt(d?.alquiler_prop)}</div>
        </div>
        <div>
          <div class="lbl">ADM</div>
          <div class="val nowrap">${this.fmt(d?.adm)}</div>
        </div>

        <div>
          <div class="lbl">Neto Prop.</div>
          <div class="val nowrap">${this.fmt(d?.neto_propietario)}</div>
        </div>
        <div>
          <div class="lbl">Estado</div>
          <div class="val">${this.esc(d?.estado_pago || '—')}</div>
        </div>

        <div>
          <div class="lbl">Pago Inquilino</div>
          <div class="val">${this.esc(d?.fecha_pago_inquilino || '—')}</div>
        </div>

        <div class="span2">
          <div class="lbl">Notas</div>
          <div class="val notes">${this.esc(d?.notas || '—')}</div>
        </div>
      </div>
    </div>
  `;

    return `<!doctype html>
  <html lang="es">
    <head>
      <meta charset="utf-8">
      <title>Detalle amoblado #${this.esc(d?.id ?? '')}</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>${css}</style>
    </head>
    <body>${body}</body>
  </html>`;
  }

  printAmobladoDetalle() {
    if (!this.detail) {
      alert('No hay detalle para imprimir.');
      return;
    }
    const html = this.buildPrintHtmlDetalle(this.detail);
    const w = window.open('', '_blank', 'width=900,height=700');
    if (!w) {
      alert('Bloqueado por el navegador. Permití pop-ups para imprimir.');
      return;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
    // esperar a que el documento “pinte”
    w.onload = () => {
      w.focus();
      w.print();
      w.close();
    };
  }
}
