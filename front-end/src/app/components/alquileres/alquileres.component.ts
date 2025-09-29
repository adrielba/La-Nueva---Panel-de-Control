import { Component, OnInit } from '@angular/core';
import { AlquileresService } from '../../services/alquileres.service';
import { PropietariosService } from '../../services/propietarios.service';
import { InquilinosService } from '../../services/inquilinos.service';
import { EmailService } from '../../services/email.service';
import { ElementRef, ViewChild, HostListener } from '@angular/core';
import { PropiedadesService } from '../../services/propiedades.service';

@Component({
  selector: 'app-alquileres',
  templateUrl: './alquileres.component.html',
  styleUrls: ['./alquileres.component.css'],
})
export class AlquileresComponent implements OnInit {
  colsOpen = false;
  filtroMes = '';
  q = '';
  sort = 'id';
  dir: 'asc' | 'desc' = 'desc';
  page = 1;
  pageSize = 20;

  rows: any[] = [];
  total = 0;
  loading = false;
  errorMsg = '';

  // = false;
  form: any = {
    propietario: '',
    inquilino: '',
    direccion: '',
    alquiler_prop: null,
    adm: null,
    neto_propietario: null,
    vencimiento_montos: null,
    fecha_pago_inquilino: null,
    venc_monto: null,
    notas: '',
    mes: '',
  };
  editingId: number | null = null;

  propTerm = '';
  propLoading = false;
  propSugs: { id: number; nombre: string }[] = [];
  propietario_id: number | null = null; // lo que vas a enviar al backend a futuro
  propietario_nombre: string = ''; // para mostrar

  private propTimer: any = null;

  inqTerm: string = '';
  inqLoading: boolean = false;
  inqSugs: { id: number; nombre: string }[] = [];
  inquilino_id: number | null = null;
  inquilino_nombre: string = '';
  private inqTimer: any = null;

  showPropModal = false;
  showInqModal = false;
  savingProp = false;
  savingInq = false;
  modalError = '';

  propNew = {
    nombre: '',
    telefono: '',
    email: '',
    // (si querés: cuit_cuil: '', banco_alias: '', notas: '')
  };

  inqNew = {
    nombre: '',
    dni_cuit: '',
    telefono: '',
    email: '',
    // (si querés: notas: '')
  };

  // ====== TABS DE MESES ======
  years: number[] = []; // ej. [2024, 2025, 2026]
  selectedYear!: number; // ej. 2025
  months = [
    // índice 0..11
    { num: 1, label: 'Ene' },
    { num: 2, label: 'Feb' },
    { num: 3, label: 'Mar' },
    { num: 4, label: 'Abr' },
    { num: 5, label: 'May' },
    { num: 6, label: 'Jun' },
    { num: 7, label: 'Jul' },
    { num: 8, label: 'Ago' },
    { num: 9, label: 'Sep' },
    { num: 10, label: 'Oct' },
    { num: 11, label: 'Nov' },
    { num: 12, label: 'Dic' },
  ];

  // ====== CALCULADORA ADM/NETO ======
  showCalc = false;
  calcMode: 'porcentaje' | 'monto' | 'sin' = 'porcentaje';
  calcPorcentaje = 7; // preset 7%
  calcMonto: number | null = 0;

  calcPreview = { alquiler: 0, adm: 0, neto: 0 };

  // ====== OVERLAYS ======
  detailOpen = false;
  detailRow: any | null = null;

  // Reutilizamos tu form de crear/editar, pero ahora como modal
  formOpen = false; // reemplaza showForm si lo usabas

  postCreateOpen = false;
  postCreateInfo = {
    propietario_nombre: '',
    propietario_email: '',
    inquilino_nombre: '',
    inquilino_email: '',
  };

  // email (simple)
  emailOpen = false;
  emailForm = {
    to_email: '',
    to_name: '',
    subject: 'Información de su alquiler',
    body_html: '<p>Hola,</p><p>Adjuntamos la información.</p>',
  };

  emailSending = false;
  emailBothSending = false;

  // email (ambos)
  emailBothOpen = false;
  emailBothForm = {
    prop_email: '',
    prop_name: '',
    inq_email: '',
    inq_name: '',
    subject: 'Información de su alquiler',
    body_html: '<p>Hola,</p><p>Adjuntamos la información.</p>',
  };

  printMenuOpen = false;

  emailAttachments: Array<{
    name: string;
    size: number;
    type: string;
    base64: string;
  }> = [];

  dirTerm = '';
  dirSugs: Array<{
    id: number;
    direccion: string;
    propietario_id?: number | null;
    propietario_nombre?: string | null;
    domicilio_tipo?: string | null;
  }> = [];
  dirLoading = false;
  showDirPanel = false;
  private dirDebounce: any = null;

  showPropPanel = false;
  showInqPanel = false;

  stats = {
    activos: 0, // inquilino !== 'LIBRE'
    totalAlquiler: 0, // suma alquiler_prop
    totalAdm: 0, // suma adm
    libres: 0, // cantidad de filas con inquilino === 'LIBRE'
  };

  // Filtro de "LIBRE": 'all' | 'only' | 'hide'
  libreFilter: 'all' | 'only' | 'hide' = 'all';

  // Columnas visibles
  showCols = {
    propietario: true,
    inquilino: true,
    alta: true,
    direccion: true,
    alquiler: true,
    adm: true,
    adm_text: true,
    neto: true,
    cambiaMonto: true,
    pagoInq: true,
    finContrato: true,
    indexacion: true,
    domicilio: true,
    estado: true,
    notas: true,
    mes: true,
    acciones: true,
  };

  advOpen = false;

  fAlqMin: number | null = null;
  fAlqMax: number | null = null;
  fAdmMin: number | null = null;
  fAdmMax: number | null = null;
  fNetMin: number | null = null;
  fNetMax: number | null = null;

  // Fechas (YYYY-MM-DD)
  fAltaFrom = '';
  fAltaTo = '';
  fCambFrom = '';
  fCambTo = '';
  fPagoFrom = '';
  fPagoTo = '';
  fFinFrom = '';
  fFinTo = '';

  // Estados (multi)
  fEstados = {
    pagado: false,
    pendiente: false,
    noPagado: false,
    nulo: false,
  };

  @ViewChild('dirBox', { static: false }) dirBox?: ElementRef;
  @ViewChild('propBox', { static: false }) propBox?: ElementRef;
  @ViewChild('inqBox', { static: false }) inqBox?: ElementRef;

  // Cerrar panel si se hace click fuera de dirBox
  @HostListener('document:click', ['$event'])
  onDocClick2(event: MouseEvent) {
    const t = event.target as Node;

    const insideProp = this.propBox?.nativeElement.contains(t);
    const insideInq = this.inqBox?.nativeElement.contains(t);
    const insideDir = this.dirBox?.nativeElement.contains(t); // ya lo tenías

    if (!insideProp) this.showPropPanel = false;
    if (!insideInq) this.showInqPanel = false;
    if (!insideDir) this.closeDirPanel(); // lo que ya usabas
  }

  constructor(
    private svc: AlquileresService,
    private propietariosSvc: PropietariosService,
    private inquilinosSvc: InquilinosService,
    private emailSvc: EmailService,
    private propsSvc: PropiedadesService
  ) {}

  ngOnInit(): void {
    this.initYearTabs();
    this.restoreMesFromStorageOrToday();
    this.applyMesToFilter(false); // setea filtroMes sin recargar aún
    this.load();
  }

  get totalPages(): number {
    const p = Math.ceil(this.total / this.pageSize);
    return p > 0 ? p : 1;
  }

  get showVencMontoCol(): boolean {
    // Mostrar por defecto; ocultar solo si el modal está abierto y es creación
    return !(this.formOpen && !this.editingId);
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

  private computeStats(): void {
    this.svc
      .list({
        mes: this.filtroMes || undefined,
        q: this.q || undefined,
        page: 1,
        pageSize: 200, // tope del backend
        sort: this.sort,
        dir: this.dir,
      })
      .subscribe({
        next: (res) => {
          const all = res?.rows || [];
          let activos = 0,
            libres = 0,
            totalAlq = 0,
            totalAdm = 0;

          for (const r of all) {
            const inq = (r?.inquilino || '').toString().trim().toUpperCase();
            const isLibre = inq === 'LIBRE';
            if (isLibre) libres++;
            else activos++;

            const a = Number(r?.alquiler_prop) || 0;
            const d = Number(r?.adm) || 0;
            totalAlq += a;
            totalAdm += d;
          }

          this.stats = {
            activos,
            totalAlquiler: Math.round(totalAlq * 100) / 100,
            totalAdm: Math.round(totalAdm * 100) / 100,
            libres,
          };
        },
        error: () => {
          // si falla, no bloqueo la UI
          this.stats = { activos: 0, totalAlquiler: 0, totalAdm: 0, libres: 0 };
        },
      });
  }

  // Aplica filtro de "LIBRE" sólo a lo mostrado (no al backend)
  private applyLibreFilterToRows(rows: any[]): any[] {
    if (this.libreFilter === 'all') return rows;
    const isLibre = (s: any) =>
      (s || '').toString().trim().toUpperCase() === 'LIBRE';
    if (this.libreFilter === 'only')
      return rows.filter((r) => isLibre(r.inquilino));
    if (this.libreFilter === 'hide')
      return rows.filter((r) => !isLibre(r.inquilino));
    return rows;
  }

  load(): void {
    this.loading = true;
    this.errorMsg = '';
    this.svc
      .list({
        mes: this.filtroMes || undefined,
        q: this.q || undefined,
        page: this.page,
        pageSize: this.pageSize,
        sort: this.sort,
        dir: this.dir,

        // Montos
        alq_min: this.fAlqMin ?? undefined,
        alq_max: this.fAlqMax ?? undefined,
        adm_min: this.fAdmMin ?? undefined,
        adm_max: this.fAdmMax ?? undefined,
        neto_min: this.fNetMin ?? undefined,
        neto_max: this.fNetMax ?? undefined,

        // Fechas
        alta_from: this.fAltaFrom || undefined,
        alta_to: this.fAltaTo || undefined,
        cambia_from: this.fCambFrom || undefined,
        cambia_to: this.fCambTo || undefined,
        pago_from: this.fPagoFrom || undefined,
        pago_to: this.fPagoTo || undefined,
        fin_from: this.fFinFrom || undefined,
        fin_to: this.fFinTo || undefined,

        // Estados
        estado: this.buildEstadoParam(),
      })
      .subscribe({
        next: (res) => {
          this.loading = false;
          if (res?.success) {
            //this.rows = res.rows || [];
            this.total = res.total || 0;

            const shouldReload = this.clampAndMaybeReload(
              this.total,
              res.rows?.length ?? 0
            );
            if (shouldReload) {
              this.load(); // recarga una sola vez ya con page corregida
              return;
            }
            const baseRows = res.rows || [];
            this.rows = this.applyLibreFilterToRows(baseRows);
            this.computeStats();
          } else {
            this.rows = [];
            this.total = 0;
            this.errorMsg = 'No se pudo cargar el listado.';
          }
        },
        error: () => {
          this.loading = false;
          this.rows = [];
          this.total = 0;
          this.errorMsg = 'Error de servidor al listar.';
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

    this.resetAdvanced();

    // volver al mes actual y persistirlo
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yy = String(now.getFullYear()).slice(-2);
    this.filtroMes = `${mm}-${yy}`;
    this.selectedYear = now.getFullYear();
    localStorage.setItem('alq_mes', this.filtroMes);

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
  sortBy(col: string): void {
    if (this.sort === col) this.dir = this.dir === 'asc' ? 'desc' : 'asc';
    else {
      this.sort = col;
      this.dir = 'asc';
    }
    this.load();
  }

  nuevo() {
    this.editingId = null;
    this.formOpen = true;
    this.form = {
      propietario: '',
      inquilino: '',
      direccion: '',
      mes: this.filtroMes || '',
      mes_fin: '',
      alquiler_prop: null,
      adm: null,
      adm_text: '',
      neto_propietario: null,
      vencimiento_montos: null,
      fecha_pago_inquilino: null,
      venc_monto: null,
      notas: '',
      // NUEVOS
      fecha_alta_contrato: null,
      indexacion_tipo: '',
      domicilio_tipo: '',
      estado_pago: '',
    };
    this.propietario_nombre = '';
    this.inquilino_nombre = '';
    this.propTerm = '';
    this.inqTerm = '';
    this.propSugs = [];
    this.inqSugs = [];
  }

  editar(row: any) {
    this.formOpen = true;
    this.editingId = row.id;
    this.form = { ...row }; // ojo: fechas vienen como 'YYYY-MM-DD' ok para <input type="date">

    // si más adelante la tabla ya tiene propietario_id, setear acá; por ahora usamos texto:
    this.propietario_id = row.propietario_id ?? null;
    this.propietario_nombre = row.propietario ?? '';
    this.propTerm = this.propietario_nombre;
    this.propSugs = [];

    this.inquilino_id = row.inquilino_id ?? null; // si todavía no existe, queda null
    this.inquilino_nombre = row.inquilino || ''; // compatibilidad con tu modelo actual
    this.inqTerm = this.inquilino_nombre;
    this.inqSugs = [];
    this.form.adm_text = row.adm_text || '';
  }

  // Cerrar form modal
  cancelarForm() {
    this.formOpen = false;
    this.editingId = null;
  }

  guardar() {
    this.errorMsg = '';

    // 1) Normalizar propietario / inquilino (como ya hacías)
    const propName = (this.propietario_nombre || this.propTerm || '').trim();
    const inqName = (this.inquilino_nombre || this.inqTerm || '').trim();
    if (!propName || !inqName) {
      this.errorMsg = 'Debés seleccionar o crear propietario e inquilino.';
      return;
    }
    this.form.propietario = propName;
    this.form.inquilino = inqName;

    // 2) 🔴 FIX DIRECCIÓN:
    // Si el usuario NO clickeó una sugerencia, 'form.direccion' puede venir vacío.
    // Copiamos lo tipeado en dirTerm.
    const dirTyped = (this.dirTerm || '').trim();
    if (!this.form.direccion?.trim() && dirTyped) {
      this.form.direccion = dirTyped;
    }

    const creating = !this.editingId;

    // 3) Payload: en creación quitamos venc_monto
    const payload: any = { ...this.form };
    if (creating) delete payload.venc_monto;

    if ((payload.estado_pago || '').toLowerCase() === 'pendiente') {
      const n = Number(
        String(payload.pendiente_pagado ?? '')
          .toString()
          .replace(',', '.')
      );
      if (!isNaN(n) && n > 0) {
        payload.pendiente_pagado = n; // el backend lo empaqueta en "pendiente:xxx"
      } else {
        delete payload.pendiente_pagado; // sin monto => sólo 'pendiente'
      }
    } else {
      // si no es pendiente, no mandamos "pendiente_pagado"
      delete payload.pendiente_pagado;
    }

    // 4) Llamada según alta/edición
    const req$ = creating
      ? this.svc.create(payload)
      : this.svc.update(this.editingId!, payload);

    req$.subscribe({
      next: async (res) => {
        if (res?.success) {
          this.formOpen = false;
          const newId = res.id || this.editingId || null;
          this.editingId = null;

          // Recargar listado con los filtros vigentes
          this.load();

          // 5) (Opcional pero recomendado) Sincronizar PROPIEDADES post-alta
          // para que la nueva dirección aparezca enseguida en el autocompletar.
          if (creating) {
            this.propsSvc.sync().subscribe({
              next: () => {},
              error: () =>
                console.warn('No se pudo sincronizar propiedades ahora.'),
            });

            // Prefill nombres para overlays de email post-creación
            this.postCreateInfo.propietario_nombre = propName;
            this.postCreateInfo.inquilino_nombre = inqName;

            try {
              const [propEmail, inqEmail] = await Promise.all([
                this.propietario_id
                  ? this.fetchPropEmail(this.propietario_id)
                  : Promise.resolve(''),
                this.inquilino_id
                  ? this.fetchInqEmail(this.inquilino_id)
                  : Promise.resolve(''),
              ]);
              this.postCreateInfo.propietario_email = propEmail || '';
              this.postCreateInfo.inquilino_email = inqEmail || '';
            } catch {
              this.postCreateInfo.propietario_email = '';
              this.postCreateInfo.inquilino_email = '';
            }

            this.postCreateOpen = true;
          }
        } else {
          this.errorMsg = 'No se pudo guardar.';
        }
      },
      error: () => (this.errorMsg = 'Error de servidor al guardar.'),
    });
  }

  private async fetchPropEmail(id: number): Promise<string> {
    try {
      const r: any = await this.propietariosSvc.detalle(id).toPromise();
      return r?.propietario?.email || '';
    } catch {
      return '';
    }
  }
  private async fetchInqEmail(id: number): Promise<string> {
    try {
      const r: any = await this.inquilinosSvc.detail({ id }).toPromise();
      return r?.inquilino?.email || '';
    } catch {
      return '';
    }
  }

  eliminar(row: any) {
    if (!confirm(`¿Eliminar alquiler #${row.id}?`)) return;

    this.svc.remove(row.id).subscribe({
      next: (res) => {
        if (res?.success) {
          this.closeDetail();
          // 👇 si era el único de la página y no estamos en la primera, retrocedemos una
          const isLastOnPage = this.rows.length === 1 && this.page > 1;
          if (isLastOnPage) this.page--;
          this.load();
        } else {
          alert('No se pudo eliminar.');
        }
      },
      error: () => alert('Error de servidor al eliminar.'),
    });
  }

  onPropTermInput() {
    // debounce
    if (this.propTimer) clearTimeout(this.propTimer);
    const term = this.propTerm.trim();
    if (term.length < 2) {
      this.propSugs = [];
      return;
    }
    this.propLoading = true;
    this.propTimer = setTimeout(() => {
      this.propietariosSvc.list({ q: term, page: 1, pageSize: 10 }).subscribe({
        next: (res) => {
          this.propLoading = false;
          if (res?.success) {
            this.propSugs = (res.rows || []).map((r: any) => ({
              id: r.id,
              nombre: r.nombre,
            }));
          } else {
            this.propSugs = [];
          }
        },
        error: () => {
          this.propLoading = false;
          this.propSugs = [];
        },
      });
    }, 300);
  }

  seleccionarProp(p: { id: number; nombre: string }) {
    this.propietario_id = p.id;
    this.propietario_nombre = p.nombre;
    this.propTerm = p.nombre;
    this.propSugs = [];
  }

  limpiarProp() {
    this.propietario_id = null;
    this.propietario_nombre = '';
    this.propTerm = '';
    this.propSugs = [];
  }

  onInqTermInput() {
    if (this.inqTimer) clearTimeout(this.inqTimer);
    const term = this.inqTerm.trim();
    if (term.length < 2) {
      this.inqSugs = [];
      return;
    }

    this.inqLoading = true;
    this.inqTimer = setTimeout(() => {
      this.inquilinosSvc.list({ q: term, page: 1, pageSize: 10 }).subscribe({
        next: (res) => {
          this.inqLoading = false;
          if (res?.success) {
            this.inqSugs = (res.rows || []).map((i: any) => ({
              id: i.id,
              nombre: i.nombre,
            }));
          } else {
            this.inqSugs = [];
          }
        },
        error: () => {
          this.inqLoading = false;
          this.inqSugs = [];
        },
      });
    }, 300);
  }

  seleccionarInq(i: { id: number; nombre: string }) {
    this.inquilino_id = i.id;
    this.inquilino_nombre = i.nombre;
    this.inqTerm = i.nombre;
    this.inqSugs = [];
  }

  limpiarInq() {
    this.inquilino_id = null;
    this.inquilino_nombre = '';
    this.inqTerm = '';
    this.inqSugs = [];
  }

  openPropModal() {
    this.modalError = '';
    this.propNew = { nombre: '', telefono: '', email: '' };
    this.showPropModal = true;
  }

  openInqModal() {
    this.modalError = '';
    this.inqNew = { nombre: '', dni_cuit: '', telefono: '', email: '' };
    this.showInqModal = true;
  }

  closePropModal() {
    this.showPropModal = false;
  }
  closeInqModal() {
    this.showInqModal = false;
  }

  /** -------- Guardar “nuevo propietario” -------- */
  savePropModal() {
    if (!this.propNew.nombre.trim()) {
      this.modalError = 'El nombre es obligatorio';
      return;
    }
    this.savingProp = true;
    this.modalError = '';
    this.propietariosSvc
      .create({
        nombre: this.propNew.nombre,
        telefono: this.propNew.telefono || undefined,
        email: this.propNew.email || undefined,
      })
      .subscribe({
        next: (res) => {
          this.savingProp = false;
          if (res?.success && res.id) {
            // seleccionar automáticamente en el autocomplete
            this.propietario_id = res.id;
            this.propietario_nombre = this.propNew.nombre;
            this.propTerm = this.propNew.nombre;
            this.propSugs = [];
            this.closePropModal();
          } else {
            this.modalError = 'No se pudo crear el propietario.';
          }
        },
        error: () => {
          this.savingProp = false;
          this.modalError = 'Error de servidor al crear propietario.';
        },
      });
  }

  /** -------- Guardar “nuevo inquilino” -------- */
  saveInqModal() {
    if (!this.inqNew.nombre.trim()) {
      this.modalError = 'El nombre es obligatorio';
      return;
    }
    this.savingInq = true;
    this.modalError = '';
    this.inquilinosSvc
      .create({
        nombre: this.inqNew.nombre,
        dni_cuit: this.inqNew.dni_cuit || undefined,
        telefono: this.inqNew.telefono || undefined,
        email: this.inqNew.email || undefined,
      })
      .subscribe({
        next: (res) => {
          this.savingInq = false;
          if (res?.success && res.id) {
            // seleccionar automáticamente en el autocomplete
            this.inquilino_id = res.id;
            this.inquilino_nombre = this.inqNew.nombre;
            this.inqTerm = this.inqNew.nombre;
            this.inqSugs = [];
            this.closeInqModal();
          } else {
            this.modalError = 'No se pudo crear el inquilino.';
          }
        },
        error: () => {
          this.savingInq = false;
          this.modalError = 'Error de servidor al crear inquilino.';
        },
      });
  }

  /** Inicializa rango de años (actual ±1, ajustalo si querés) */
  initYearTabs() {
    const y = new Date().getFullYear();
    this.years = [y - 1, y, y + 1];
    this.selectedYear = y;
  }

  /** Restaura el mes desde storage o usa el actual (MM-YY) */
  restoreMesFromStorageOrToday() {
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yy = String(now.getFullYear()).slice(-2);
    this.filtroMes = `${mm}-${yy}`;
    this.selectedYear = now.getFullYear();
    localStorage.setItem('alq_mes', this.filtroMes);
  }

  /** Click en una pestaña de mes */
  selectMes(m: { num: number; label: string }) {
    const mm = String(m.num).padStart(2, '0');
    const yy = String(this.selectedYear).slice(-2);
    this.filtroMes = `${mm}-${yy}`;
    localStorage.setItem('alq_mes', this.filtroMes);
    this.page = 1;
    this.load();
  }

  /** Cambiar año con flechas */
  prevYear() {
    this.selectedYear--;
    if (!this.years.includes(this.selectedYear))
      this.years.unshift(this.selectedYear);
    // mantener el mismo mes seleccionado (de filtroMes) pero con nuevo año
    this.applyMesToFilter(true);
  }
  nextYear() {
    this.selectedYear++;
    if (!this.years.includes(this.selectedYear))
      this.years.push(this.selectedYear);
    this.applyMesToFilter(true);
  }

  /** Aplica el mes actual (MM de filtroMes) con el selectedYear */
  applyMesToFilter(reload: boolean) {
    const mm = this.filtroMes?.split('-')[0] || '01';
    const yy = String(this.selectedYear).slice(-2);
    this.filtroMes = `${mm}-${yy}`;
    localStorage.setItem('alq_mes', this.filtroMes);
    if (reload) {
      this.page = 1;
      this.load();
    }
  }

  /** Helper para marcar el tab activo */
  isActiveMonth(m: { num: number }) {
    if (!this.filtroMes) return false;
    const [mm, yy] = this.filtroMes.split('-');
    return (
      parseInt(mm, 10) === m.num &&
      2000 + parseInt(yy, 10) === this.selectedYear
    );
  }

  openCalc() {
    // toma el alquiler actual del form
    this.calcPorcentaje = 7;
    this.calcMode = 'porcentaje';

    // si ya hay un ADM cargado, lo propone como "monto" al alternar
    const admActual = this.parseMoney(this.form?.adm);
    this.calcMonto = isNaN(admActual) ? 0 : admActual;

    this.showCalc = true;
    this.recomputeCalc();
  }
  closeCalc() {
    this.showCalc = false;
  }

  recomputeCalc() {
    const alquiler = this.parseMoney(this.form?.alquiler_prop);
    if (!isFinite(alquiler) || alquiler < 0) {
      this.calcPreview = { alquiler: 0, adm: 0, neto: 0 };
      return;
    }

    let adm = 0;
    if (this.calcMode === 'porcentaje') {
      const p = isFinite(this.calcPorcentaje) ? this.calcPorcentaje : 0;
      adm = this.round2(alquiler * (p / 100));
    } else if (this.calcMode === 'monto') {
      const m = this.parseMoney(this.calcMonto);
      adm = isFinite(m) && m >= 0 ? this.round2(m) : 0;
    } else {
      adm = 0;
    }

    let neto = this.round2(alquiler - adm);
    if (neto < 0) neto = 0; // prevenimos negativos

    this.calcPreview = { alquiler: this.round2(alquiler), adm, neto };
  }

  applyCalc() {
    // pega los valores calculados en el form (LO QUE SE GUARDA)
    this.form.adm = this.calcPreview.adm;
    this.form.neto_propietario = this.calcPreview.neto;
    this.closeCalc();
  }

  // Helpers
  parseMoney(v: any): number {
    if (v === null || v === undefined) return NaN;
    if (typeof v === 'number') return v;
    // limpia $ . , y espacios comunes
    const s = String(v)
      .replace(/\s+/g, '')
      .replace(/[^0-9,.\-]/g, '');
    // si tiene coma como decimal, cambiamos a punto
    const normalized =
      s.includes(',') && !s.includes('.')
        ? s.replace(',', '.')
        : s.replace(/,/g, '');
    const n = parseFloat(normalized);
    return isNaN(n) ? NaN : n;
  }
  round2(n: number): number {
    return Math.round(n * 100) / 100;
  }

  // Abrir detalle (click en fila)
  openDetail(r: any) {
    this.detailRow = r;
    this.detailOpen = true;
  }

  // Cerrar detalle
  closeDetail() {
    this.detailOpen = false;
    this.detailRow = null;
  }

  // Abrir edición desde el detalle o desde un botón de acciones
  openEdit(r: any) {
    this.closeDetail();
    this.editingId = r.id;
    this.formOpen = true;

    // Cargar datos al form (ajustá a tus campos reales)
    this.form = {
      propietario: r.propietario || '',
      inquilino: r.inquilino || '',
      direccion: r.direccion || '',
      mes: r.mes || '',
      mes_fin: '',
      alquiler_prop: r.alquiler_prop,
      adm: r.adm,
      adm_text: r.adm_text || '',
      neto_propietario: r.neto_propietario,
      vencimiento_montos: r.vencimiento_montos || null,
      fecha_pago_inquilino: r.fecha_pago_inquilino || null,
      venc_monto: r.venc_monto || null,
      notas: r.notas || '',
      fecha_alta_contrato: r.fecha_alta_contrato || null,
      indexacion_tipo: r.indexacion_tipo || '',
      domicilio_tipo: r.domicilio_tipo || '',
      estado_pago: r.estado_pago || '',
    };

    // Sincronizá autocompletes (si usás)
    this.propietario_nombre = r.propietario || '';
    this.propTerm = r.propietario || '';
    this.inquilino_nombre = r.inquilino || '';
    this.inqTerm = r.inquilino || '';
    this.propSugs = [];
    this.inqSugs = [];
    this.form.estado_pago = r.estado_pago_clean || r.estado_pago || ''; // usa el limpio si viene
    this.form.pendiente_pagado = r.pendiente_pagado ?? null; // precargar si existía
  }

  closePostCreate() {
    this.postCreateOpen = false;
  }

  // Email simple (uno)
  openEmailSimple(who: 'prop' | 'inq') {
    const isProp = who === 'prop';
    this.emailForm = {
      to_email: isProp
        ? this.postCreateInfo.propietario_email || ''
        : this.postCreateInfo.inquilino_email || '',
      to_name: isProp
        ? this.postCreateInfo.propietario_nombre || ''
        : this.postCreateInfo.inquilino_nombre || '',
      subject: 'Información de su alquiler',
      body_html: '<p>Hola,</p><p>Adjuntamos la información.</p>',
    };
    this.postCreateOpen = false;
    this.emailSending = false;
    this.emailOpen = true;
  }

  sendEmailSimple() {
    const { to_email, subject, body_html, to_name } = this.emailForm;
    if (!to_email || !subject || !body_html) {
      alert('Para, asunto y mensaje son obligatorios.');
      return;
    }
    if (this.emailSending) return;
    this.emailSending = true;

    const attachments = this.emailAttachments.map((f) => ({
      filename: f.name,
      content_base64: f.base64, // puede llevar el prefijo data:
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
            this.emailAttachments = []; // limpiar
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

  // Email doble (ambos)
  openEmailBoth() {
    this.emailBothForm = {
      prop_email: this.postCreateInfo.propietario_email || '',
      prop_name: this.postCreateInfo.propietario_nombre || '',
      inq_email: this.postCreateInfo.inquilino_email || '',
      inq_name: this.postCreateInfo.inquilino_nombre || '',
      subject: 'Información de su alquiler',
      body_html:
        '<p>Hola a ambos,</p><p>Adjuntamos la información del alquiler.</p>',
    };
    this.postCreateOpen = false;
    this.emailBothSending = false;
    this.emailBothOpen = true;
  }

  sendEmailBoth() {
    const f = this.emailBothForm;
    if (!f.subject || !f.body_html) {
      alert('Asunto y mensaje son obligatorios.');
      return;
    }
    if (!f.prop_email && !f.inq_email) {
      alert('Cargá al menos un destinatario.');
      return;
    }
    if (this.emailBothSending) return;
    this.emailBothSending = true;

    const attachments = this.emailBothAttachments.map((f) => ({
      filename: f.name,
      content_base64: f.base64,
      mime: f.type,
    }));

    // armamos promesas por destinatario (se envía el mismo contenido con adjuntos)
    const calls: Promise<any>[] = [];
    if (f.prop_email) {
      calls.push(
        this.emailSvc
          .sendEmail({
            to_email: f.prop_email,
            to_name: f.prop_name || '',
            subject: f.subject,
            body_html: f.body_html,
            attachments,
          })
          .toPromise()
      );
    }
    if (f.inq_email) {
      calls.push(
        this.emailSvc
          .sendEmail({
            to_email: f.inq_email,
            to_name: f.inq_name || '',
            subject: f.subject,
            body_html: f.body_html,
            attachments,
          })
          .toPromise()
      );
    }

    Promise.all(calls)
      .then((results) => {
        this.emailBothSending = false;
        const ok = results.every((r) => r && r.success);
        if (ok) {
          alert('Email(s) enviado(s).');
          this.emailBothOpen = false;
          this.emailBothAttachments = []; // limpiar
        } else {
          alert('Algunos envíos fallaron. Revisá el backend.');
        }
      })
      .catch(() => {
        this.emailBothSending = false;
        alert('Error de servidor al enviar.');
      });
  }

  togglePrintMenu(ev: MouseEvent) {
    ev.stopPropagation(); // evita que el click global lo cierre
    this.printMenuOpen = !this.printMenuOpen;
  }

  @HostListener('document:click', ['$event'])
  onDocClick() {
    // Cierra el menú si clickean fuera
    if (this.printMenuOpen) this.printMenuOpen = false;
  }

  private formatMoney(n: any): string {
    const num = Number(n || 0);
    if (!isFinite(num)) return '';
    return new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  }

  private buildPrintHtml(title: string, subtitle: string, rows: any[]): string {
    const now = new Date();
    const when =
      now.toLocaleDateString('es-AR') + ' ' + now.toLocaleTimeString('es-AR');

    // Armamos filas de tabla
    const trs = rows
      .map(
        (r, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td>${r.propietario || ''}</td>
      <td>${r.inquilino || ''}</td>
      <td>${r.direccion || ''}</td>
      <td>${r.mes || ''}</td>
      <td style="text-align:right;">${this.formatMoney(r.alquiler_prop)}</td>
      <td style="text-align:right;">${this.formatMoney(r.adm)}</td>
      <td style="text-align:right;">${this.formatMoney(r.neto_propietario)}</td>
      <td>${r.vencimiento_montos || ''}</td>
      <td>${r.venc_monto || ''}</td>
      <td>${r.fecha_pago_inquilino || ''}</td>
      <td>${r.notas ? ('' + r.notas).replace(/</g, '&lt;') : ''}</td>
    </tr>
  `
      )
      .join('');

    // Estilos simples y amigables para A4
    return `
<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8"/>
<title>${title}</title>
<style>
  :root { --fg:#111827; --muted:#6b7280; --line:#e5e7eb; }
  body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; color:var(--fg); margin: 24px; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  .subtitle { color: var(--muted); margin: 0 0 12px; }
  .meta { color: var(--muted); font-size: 12px; margin-bottom: 12px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th, td { border-bottom: 1px solid var(--line); padding: 6px 8px; vertical-align: top; }
  thead th { background: #f9fafb; text-align: left; }
  @media print {
    @page { size: A4 portrait; margin: 12mm; }
    body { margin: 0; }
    .meta { margin-bottom: 8px; }
  }
</style>
</head>
<body>
  <h1>${title}</h1>
  <div class="subtitle">${subtitle}</div>
  <div class="meta">Generado: ${when}</div>

  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Propietario</th>
        <th>Inquilino</th>
        <th>Dirección</th>
        <th>Mes</th>
        <th style="text-align:right;">Alquiler</th>
        <th style="text-align:right;">ADM</th>
        <th style="text-align:right;">Neto</th>
        <th>Cambia Monto</th>
        <th>Finalización Contrato</th>
        <th>Fecha pago</th>
        <th>Notas</th>
      </tr>
    </thead>
    <tbody>
      ${trs || `<tr><td colspan="12">Sin registros.</td></tr>`}
    </tbody>
  </table>

  <script>window.onload = () => { setTimeout(() => { window.print(); }, 50); };</script>
</body>
</html>`;
  }

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

  printCurrentPage() {
    this.printMenuOpen = false;
    if (!this.rows?.length) {
      alert('No hay registros en esta página.');
      return;
    }
    const title = 'Alquileres — Página actual';
    const subtitle = `Mes: ${this.filtroMes || '—'} · Búsqueda: ${
      this.q || '—'
    } · Página ${this.page}/${this.totalPages}`;
    const html = this.buildPrintHtml(title, subtitle, this.rows);
    this.openPrintWindow(html);
  }

  printCurrentMonth() {
    this.printMenuOpen = false;

    // Reutilizamos el servicio con los filtros actuales
    this.svc
      .list({
        mes: this.filtroMes || undefined,
        q: this.q || undefined,
        page: 1,
        pageSize: 200, // tope del backend
        sort: this.sort,
        dir: this.dir,
      })
      .subscribe({
        next: (res) => {
          const all = res?.rows || [];
          if (!all.length) {
            alert('No hay registros para imprimir con los filtros actuales.');
            return;
          }
          const title = 'Alquileres — Todo el mes filtrado';
          const total = res?.total ?? all.length;
          const subtitle = `Mes: ${this.filtroMes || '—'} · Búsqueda: ${
            this.q || '—'
          } · Total filas: ${total}${
            total > all.length ? ' (mostrando primeras ' + all.length + ')' : ''
          }`;
          const html = this.buildPrintHtml(title, subtitle, all);
          this.openPrintWindow(html);
        },
        error: () =>
          alert('No se pudo cargar el listado completo para imprimir.'),
      });
  }

  printDetail(ev?: Event) {
    ev?.stopPropagation();
    const r = this.detailRow;
    if (!r) {
      alert('No hay datos del alquiler para imprimir.');
      return;
    }

    const title = `Alquiler #${r.id}`;
    const subtitle = [
      r.propietario ? `Propietario: ${r.propietario}` : '',
      r.inquilino ? `Inquilino: ${r.inquilino}` : '',
    ]
      .filter(Boolean)
      .join(' · ');

    const html = this.buildPrintHtmlDetail(title, subtitle, r);
    this.openPrintWindow(html);
  }

  private buildPrintHtmlDetail(
    title: string,
    subtitle: string,
    r: any
  ): string {
    const now = new Date();
    const when =
      now.toLocaleDateString('es-AR') + ' ' + now.toLocaleTimeString('es-AR');

    const safe = (v: any) =>
      (v ?? '')
        .toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    const money = (n: any) => this.formatMoney(n) || '—';
    const text = (v: any) => (v && String(v).trim() !== '' ? safe(v) : '—');

    return `
<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8"/>
<title>${safe(title)}</title>
<style>
  :root { --fg:#111827; --muted:#6b7280; --line:#e5e7eb; }
  body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; color:var(--fg); margin: 24px; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  .subtitle { color: var(--muted); margin: 0 0 10px; }
  .meta { color: var(--muted); font-size: 12px; margin: 0 0 16px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px; font-size: 13px; }
  .span2 { grid-column: 1 / -1; }
  .label { color: var(--muted); font-weight: 600; margin-right: 6px; }
  .box { border: 1px solid var(--line); border-radius: 8px; padding: 12px; }
  @media print {
    @page { size: A4 portrait; margin: 12mm; }
    body { margin: 0; }
  }
</style>
</head>
<body>
  <h1>${safe(title)}</h1>
  <div class="subtitle">${safe(subtitle)}</div>
  <div class="meta">Generado: ${safe(when)}</div>

  <div class="box">
    <div class="grid">
      <div><span class="label">Propietario:</span>${text(r.propietario)}</div>
      <div><span class="label">Inquilino:</span>${text(r.inquilino)}</div>

      <div class="span2"><span class="label">Dirección:</span>${text(
        r.direccion
      )}</div>

      <div><span class="label">Alta contrato:</span>${text(
        r.fecha_alta_contrato
      )}</div>
      <div><span class="label">Indexación:</span>${text(
        r.indexacion_tipo
      )}</div>
      <div><span class="label">Domicilio:</span>${text(r.domicilio_tipo)}</div>
      <div><span class="label">Estado:</span>${text(r.estado_pago)}</div>
      <div><span class="label">Mes:</span>${text(r.mes)}</div>

      <div><span class="label">Alquiler:</span>${money(r.alquiler_prop)}</div>
      <div><span class="label">ADM:</span>${money(r.adm)}</div>
      <div class="span2"><span class="label">ADM (texto):</span>${text(
        r.adm_text
      )}</div>
      <div><span class="label">Neto Prop.:</span>${money(
        r.neto_propietario
      )}</div>

      <div><span class="label">Cambia Monto:</span>${text(
        r.vencimiento_montos
      )}</div>
      <div><span class="label">Pago Inquilino:</span>${text(
        r.fecha_pago_inquilino
      )}</div>
      <div><span class="label">Finalizacion Contrato:</span>${text(
        r.venc_monto
      )}</div>

      <div class="span2"><span class="label">Notas:</span>${text(r.notas)}</div>
    </div>
  </div>

  <script>window.onload = () => { setTimeout(() => { window.print(); }, 50); };</script>
</body>
</html>`;
  }

  onEmailFilesSelected(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    if (!files.length) return;

    const maxTotal = 18 * 1024 * 1024; // ~18MB, margen para cabeceras
    const currentTotal = this.emailAttachments.reduce((a, f) => a + f.size, 0);
    const newTotal = currentTotal + files.reduce((a, f) => a + f.size, 0);
    if (newTotal > maxTotal) {
      alert('Tamaño total de adjuntos excede ~18MB. Quitá alguno.');
      return;
    }

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string) || '';
        this.emailAttachments.push({
          name: file.name,
          size: file.size,
          type: file.type || 'application/octet-stream',
          base64, // data:*/*;base64,....
        });
      };
      reader.readAsDataURL(file);
    });

    // limpiar para poder volver a seleccionar los mismos archivos si hace falta
    input.value = '';
  }

  removeEmailAttachment(i: number) {
    this.emailAttachments.splice(i, 1);
  }

  // ===== Email (ambos)
  emailBothAttachments: Array<{
    name: string;
    size: number;
    type: string;
    base64: string;
  }> = [];

  onEmailBothFilesSelected(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    if (!files.length) return;

    const maxTotal = 18 * 1024 * 1024;
    const currentTotal = this.emailBothAttachments.reduce(
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
        this.emailBothAttachments.push({
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

  removeEmailBothAttachment(i: number) {
    this.emailBothAttachments.splice(i, 1);
  }

  onDirTermInput() {
    this.showDirPanel = true;
    const q = (this.dirTerm || '').trim();

    clearTimeout(this.dirDebounce);
    this.dirDebounce = setTimeout(() => {
      if (!q) {
        this.dirSugs = [];
        this.dirLoading = false;
        return;
      }
      this.dirLoading = true;
      this.propsSvc.list({ q, page: 1, pageSize: 8 }).subscribe({
        next: (res) => {
          this.dirLoading = false;
          this.dirSugs = res?.rows || [];
        },
        error: () => {
          this.dirLoading = false;
          this.dirSugs = [];
        },
      });
    }, 200);
  }

  seleccionarDir(p: any) {
    this.form.direccion = p?.direccion || '';
    this.dirTerm = this.form.direccion;

    if (!this.form.domicilio_tipo && p?.domicilio_tipo) {
      this.form.domicilio_tipo = p.domicilio_tipo;
    }
    if (!this.propietario_id && p?.propietario_id) {
      this.propietario_id = p.propietario_id;
      this.propietario_nombre =
        p.propietario_nombre || this.propietario_nombre || '';
    }

    this.closeDirPanel();
  }

  limpiarDir() {
    this.dirTerm = '';
    this.form.direccion = '';
    this.dirSugs = [];
    this.closeDirPanel();
  }

  closeDirPanel() {
    this.showDirPanel = false;
  }

  onDirBlur() {
    // delay para permitir hacer click en un item antes de cerrar
    setTimeout(() => this.closeDirPanel(), 150);
  }

  onPropBlur() {
    setTimeout(() => (this.showPropPanel = false), 150);
  }
  onInqBlur() {
    setTimeout(() => (this.showInqPanel = false), 150);
  }

  private buildEstadoParam(): string[] {
    const s: string[] = [];
    if (this.fEstados.pagado) s.push('pagado');
    if (this.fEstados.pendiente) s.push('pendiente');
    if (this.fEstados.noPagado) s.push('no pagado');
    if (this.fEstados.nulo) s.push('nulo');
    return s;
  }

  resetAdvanced() {
    this.fAlqMin = this.fAlqMax = null;
    this.fAdmMin = this.fAdmMax = null;
    this.fNetMin = this.fNetMax = null;

    this.fAltaFrom = this.fAltaTo = '';
    this.fCambFrom = this.fCambTo = '';
    this.fPagoFrom = this.fPagoTo = '';
    this.fFinFrom = this.fFinTo = '';

    this.fEstados = {
      pagado: false,
      pendiente: false,
      noPagado: false,
      nulo: false,
    };
  }
}
