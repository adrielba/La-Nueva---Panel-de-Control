import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MovimientosService } from '../../services/movimientos.service';
import { AlquileresService } from '../../services/alquileres.service';
import { PropietariosService } from '../../services/propietarios.service';

@Component({
  selector: 'app-movimientos',
  templateUrl: './movimientos.component.html',
  styleUrls: ['./movimientos.component.css'],
})
export class MovimientosComponent implements OnInit {
  propietarioId!: number;
  propietarioNombre = '—';

  // Mes seleccionado (YYYY-MM)
  selectedMes = this.currentMonthYYYYMM();

  // Barra de meses
  selectedYear = new Date().getFullYear();
  selectedMonth = new Date().getMonth() + 1;
  months = [
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

  // Rango enorme de meses para chooser
  monthOptions: string[] = [];
  private MONTHS_BACK = 30 * 12;
  private MONTHS_FWD = 30 * 12;

  categorias: any[] = [];

  // filtros
  q = '';
  estado: 'pendiente' | 'confirmado' | 'anulado' | 'all' = 'confirmado';
  categoria_id = 0;
  from: string | null = null;
  to: string | null = null;
  page = 1;
  pageSize = 10000;

  rows: any[] = [];
  total = 0;
  loading = false;
  errorMsg = '';
  totals = { creditos: 0, debitos: 0, saldo: 0 };

  // ===== Modal (solo movimiento libre) =====
  modalOpen = false;
  form: any = {
    fecha: this.today(),
    categoria_id: null,
    tipo: 'credito',
    monto: null,
    detalle: '',
    estado: 'confirmado',
    direccion_snapshot: '',
  };
  modo: 'monto' | 'porcentaje' = 'monto';

  // ===== Chooser de contratos (lo dejamos disponible) =====
  chooserOpen = false;
  chooserRows: any[] = [];
  chooserPage = 1;
  chooserPageSize = 10;
  chooserTotal = 0;
  chooserQ = '';
  chosenSummary = '';

  chooserBaseDate = new Date();
  chooserMonths: string[] = [];

  private monthNames = [
    'Ene',
    'Feb',
    'Mar',
    'Abr',
    'May',
    'Jun',
    'Jul',
    'Ago',
    'Sep',
    'Oct',
    'Nov',
    'Dic',
  ];

  // ====== Planilla (tabla superior) ======
  private readonly CAT_ALQUILER = 1; // Alquiler cobrado
  private readonly CAT_ADM = 2; // Comisión/ADM

  alqIndex: Record<
    number,
    {
      inquilino?: string;
      direccion?: string;
      alquiler_prop?: number;
      venc_monto?: string;
      vencimiento_montos?: string;
    }
  > = {};

  contractSummary: Array<{
    alquiler_id: number;
    direccion: string;
    inquilino: string;
    alquiler: number;
    adm: number;
    neto: number; // alquiler - adm
    fin_contrato: string; // viene de a.venc_monto
    cambia_monto: string; // viene de a.vencimiento_montos
  }> = [];

  get totalAlquilerPlanilla(): number {
    return (this.contractSummary || []).reduce(
      (s, a) => s + Number(a.alquiler || 0),
      0
    );
  }
  get totalAdmPlanilla(): number {
    return (this.contractSummary || []).reduce(
      (s, a) => s + Number(a.adm || 0),
      0
    );
  }
  get totalNetoPlanilla(): number {
    return (this.contractSummary || []).reduce(
      (s, a) => s + Number(a.neto || 0),
      0
    );
  }

  // ====== Ajustes (tabla inferior) ======
  ajustes: any[] = [];
  ajustesTotales = { creditos: 0, debitos: 0, saldo: 0 };

  get netoFinal(): number {
    return this.totalNetoPlanilla + this.ajustesTotales.saldo;
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private svc: MovimientosService,
    private alquileresSvc: AlquileresService,
    private propsSvc: PropietariosService
  ) {}

  // Helper seguro para plantillas
  asNum(v: any): number {
    const n = Number(v ?? 0);
    return Number.isFinite(n) ? n : 0;
  }

  get prettySelectedMes(): string {
    const p = this.parseMesFlexible(this.selectedMes);
    if (!p) return this.selectedMes;
    return `${this.monthNames[p.month - 1]} ${p.year}`;
  }

  private toMMYY(yyyyMM: string): string {
    const p = this.parseMesFlexible(yyyyMM);
    if (!p) return yyyyMM;
    const mm = String(p.month).padStart(2, '0');
    const yy = String(p.year).slice(-2);
    return `${mm}-${yy}`;
  }

  private seedAndApply(): void {
    const mesMMYY = this.toMMYY(this.selectedMes);
    this.loading = true;
    this.svc
      .seedOwner({ propietario_id: this.propietarioId, mes: mesMMYY })
      .subscribe({ next: () => this.apply(), error: () => this.apply() });
  }

  ngOnInit(): void {
    this.rebuildChooserOptions(this.selectedMes);

    this.route.paramMap.subscribe((pm) => {
      this.propietarioId = Number(pm.get('propId') || 0);
      if (!this.propietarioId) {
        this.router.navigate(['/movimientos']);
        return;
      }

      this.propsSvc.get(this.propietarioId).subscribe((r) => {
        if (r?.success && r.row)
          this.propietarioNombre = r.row.nombre || `#${this.propietarioId}`;
      });

      this.route.queryParamMap.subscribe((qp) => {
        const mes = qp.get('mes');
        if (mes) {
          const parsed = this.parseMesFlexible(mes);
          if (parsed) {
            this.selectedYear = parsed.year;
            this.selectedMonth = parsed.month;
            this.selectedMes = this.toYYYYMM(parsed.year, parsed.month);
          } else {
            this.selectedMes = mes;
            const p2 = this.parseMesFlexible(this.selectedMes);
            if (p2) {
              this.selectedYear = p2.year;
              this.selectedMonth = p2.month;
            }
          }
        } else {
          const p = this.parseMesFlexible(this.selectedMes);
          if (p) {
            this.selectedYear = p.year;
            this.selectedMonth = p.month;
          }
        }
        this.ensureMesInChooserOptions(this.selectedMes);
        this.loadCategorias();
        this.seedAndApply();
      });
    });

    this.buildChooserMonths();
  }

  // ====== util fecha ======
  today(): string {
    return new Date().toISOString().slice(0, 10);
  }
  currentMonthYYYYMM(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }
  toYYYYMM(y: number, m: number): string {
    return `${y}-${String(m).padStart(2, '0')}`;
  }
  parseMesFlexible(s: string): { year: number; month: number } | null {
    const s2 = (s || '').trim();
    const m1 = /^(\d{4})-(\d{2})$/.exec(s2);
    if (m1) {
      const y = +m1[1],
        m = +m1[2];
      if (m >= 1 && m <= 12) return { year: y, month: m };
    }
    const m2 = /^(\d{2})-(\d{2})$/.exec(s2);
    if (m2) {
      const m = +m2[1],
        y = 2000 + +m2[2];
      if (m >= 1 && m <= 12) return { year: y, month: m };
    }
    return null;
  }
  private rebuildChooserOptions(centerYYYYMM: string) {
    const p = this.parseMesFlexible(centerYYYYMM) || {
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
    };
    const base = new Date(p.year, p.month - 1, 1);
    const out: string[] = [];
    for (let i = this.MONTHS_BACK; i > 0; i--)
      out.push(this.toYYYYMM(base.getFullYear(), base.getMonth() - i + 1));
    out.push(this.toYYYYMM(base.getFullYear(), base.getMonth() + 1));
    for (let i = 1; i <= this.MONTHS_FWD; i++)
      out.push(this.toYYYYMM(base.getFullYear(), base.getMonth() + i + 1));
    this.monthOptions = out;
  }
  private ensureMesInChooserOptions(yyyyMM: string) {
    if (!this.monthOptions?.length || !this.monthOptions.includes(yyyyMM))
      this.rebuildChooserOptions(yyyyMM);
  }

  // ====== barra meses ======
  isActiveMonth(m: { num: number }) {
    return this.selectedMonth === m.num;
  }
  selectMes(m: { num: number; label: string }) {
    this.selectedMonth = m.num;
    this.selectedMes = this.toYYYYMM(this.selectedYear, this.selectedMonth);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { mes: this.selectedMes },
      queryParamsHandling: 'merge',
    });
    this.ensureMesInChooserOptions(this.selectedMes);
    this.page = 1;
    this.seedAndApply();
  }
  prevYear() {
    this.selectedYear -= 1;
    this.selectedMes = this.toYYYYMM(this.selectedYear, this.selectedMonth);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { mes: this.selectedMes },
      queryParamsHandling: 'merge',
    });
    this.ensureMesInChooserOptions(this.selectedMes);
    this.page = 1;
    this.seedAndApply();
  }
  nextYear() {
    this.selectedYear += 1;
    this.selectedMes = this.toYYYYMM(this.selectedYear, this.selectedMonth);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { mes: this.selectedMes },
      queryParamsHandling: 'merge',
    });
    this.ensureMesInChooserOptions(this.selectedMes);
    this.page = 1;
    this.seedAndApply();
  }

  // ====== categorías ======
  loadCategorias() {
    this.svc.categorias().subscribe((res) => {
      this.categorias = res?.rows || [];
      if (!this.form.categoria_id && this.categorias.length)
        this.form.categoria_id = this.categorias[0].id;
    });
  }

  // ====== listado + construcción planilla/ajustes ======
  apply(): void {
    this.loading = true;
    this.errorMsg = '';
    this.svc
      .list({
        q: this.q || undefined,
        estado: this.estado,
        categoria_id: this.categoria_id || undefined,
        from: this.from || undefined,
        to: this.to || undefined,
        page: 1,
        pageSize: this.pageSize,
        propietario_id: this.propietarioId,
        mes: this.selectedMes,
      } as any)
      .subscribe({
        next: async (res) => {
          this.loading = false;
          if (res?.success) {
            this.rows = res.rows ?? [];
            this.total = this.rows.length;
            this.totals = res.totales ?? { creditos: 0, debitos: 0, saldo: 0 };

            await this.loadAlqIndex();
            this.buildContractSummary(); // congela neto = alquiler - adm
            this.buildAjustes(); // sólo otros movimientos
          } else {
            this.rows = [];
            this.total = 0;
            this.contractSummary = [];
            this.ajustes = [];
            this.ajustesTotales = { creditos: 0, debitos: 0, saldo: 0 };
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

  // botón Limpiar
  clear(): void {
    this.q = '';
    this.estado = 'confirmado';
    this.categoria_id = 0;
    this.from = null;
    this.to = null;
    this.page = 1;
    this.apply();
  }

  // ===== Planilla =====
  private loadAlqIndex(): Promise<void> {
    return new Promise((resolve) => {
      this.alquileresSvc
        .list({
          mes: this.selectedMes,
          propietario_id: this.propietarioId as any,
          page: 1,
          pageSize: 1000,
          sort: 'id',
          dir: 'desc',
        } as any)
        .subscribe({
          next: (res) => {
            this.alqIndex = {};
            const rows = res?.rows || [];
            for (const a of rows) {
              this.alqIndex[Number(a.id)] = {
                inquilino: a.inquilino || '',
                direccion: a.direccion || '',
                alquiler_prop: Number(a.alquiler_prop || 0),
                venc_monto: a.venc_monto || '', // <- NUEVO
                vencimiento_montos: a.vencimiento_montos || '', // <- NUEVO
              };
            }
            resolve();
          },
          error: () => {
            this.alqIndex = {};
            resolve();
          },
        });
    });
  }

  private buildContractSummary(): void {
    const map = new Map<
      number,
      {
        alquiler_id: number;
        direccion: string;
        inquilino: string;
        alquiler: number;
        adm: number;
        neto: number;
        fin_contrato: string; // 👈 NUEVO
        cambia_monto: string; // 👈 NUEVO
      }
    >();

    for (const r of this.rows) {
      const id = Number(r.alquiler_id || 0);
      if (!id) continue; // libres no cuentan para planilla

      if (!map.has(id)) {
        const idx = this.alqIndex[id] || {};
        map.set(id, {
          alquiler_id: id,
          direccion: (r.direccion_snapshot || idx.direccion || '').trim(),
          inquilino: (idx.inquilino || '').trim(),
          alquiler: 0,
          adm: 0,
          neto: 0,
          fin_contrato: idx.venc_monto || '',
          cambia_monto: idx.vencimiento_montos || '',
        });
      }
      const acc = map.get(id)!;
      const monto = Number(r.monto || 0);

      if (Number(r.categoria_id) === this.CAT_ALQUILER && r.tipo === 'credito')
        acc.alquiler += monto;
      if (Number(r.categoria_id) === this.CAT_ADM && r.tipo === 'debito')
        acc.adm += monto;
    }

    // Congelar neto
    for (const acc of map.values()) acc.neto = acc.alquiler - acc.adm;

    this.contractSummary = Array.from(map.values()).sort((a, b) =>
      a.direccion.localeCompare(b.direccion, 'es', { sensitivity: 'base' })
    );
  }

  // ===== Ajustes =====
  private buildAjustes(): void {
    const isBaseCat = (r: any) =>
      Number(r.categoria_id) === this.CAT_ALQUILER ||
      Number(r.categoria_id) === this.CAT_ADM;

    const items = (this.rows || []).filter((r) => !isBaseCat(r));
    this.ajustes = items;

    let c = 0,
      d = 0;
    for (const r of items) {
      const m = Number(r.monto || 0);
      if (r.tipo === 'credito') c += m;
      else d += m;
    }
    this.ajustesTotales = { creditos: c, debitos: d, saldo: c - d };
  }

  // ===== crear movimiento (libre) =====
  openNew(): void {
    this.modalOpen = true;
    if (!this.categorias?.length) this.loadCategorias();
    this.form = {
      fecha: this.today(),
      categoria_id: this.categorias[0]?.id ?? null,
      tipo: 'credito',
      monto: null,
      detalle: '',
      estado: 'confirmado',
      direccion_snapshot: '',
    };
    this.modo = 'monto';
    this.chosenSummary = '';
  }
  closeModal(): void {
    this.modalOpen = false;
  }

  onCategoriaChange(): void {
    const cat = this.categorias.find((c) => c.id == this.form.categoria_id);
    if (!cat) return;
    this.form.tipo = cat.signo === '+' ? 'credito' : 'debito';
  }

  save(): void {
    // Validaciones
    if (!this.form.categoria_id) {
      alert('Elegí una categoría');
      return;
    }
    if (!this.form.direccion_snapshot || !this.form.direccion_snapshot.trim()) {
      alert('Ingresá "Propiedad / motivo"');
      return;
    }
    const montoNum = Number(this.form.monto);
    if (!montoNum || montoNum <= 0) {
      alert('Ingrese un monto > 0');
      return;
    }

    // Payload para backend (movimiento LIBRE)
    const payload: any = {
      fecha: this.form.fecha,
      categoria_id: Number(this.form.categoria_id),
      tipo: this.form.tipo, // 'credito' | 'debito' (se ajusta con onCategoriaChange)
      detalle: this.form.detalle || '',
      estado: this.form.estado || 'confirmado',

      mov_kind: 'libre',
      alquiler_id: 0,
      propietario_id: this.propietarioId,
      direccion_snapshot: this.form.direccion_snapshot.trim(),
      monto: montoNum,
    };

    this.svc.create(payload).subscribe({
      next: (res) => {
        if (res?.success) {
          // Construyo la fila local para la tabla de AJUSTES
          const nueva = {
            id: res.id, // si el backend devuelve id
            fecha: payload.fecha,
            categoria_id: payload.categoria_id,
            categoria_nombre:
              this.categorias.find((c) => c.id == payload.categoria_id)
                ?.nombre || payload.categoria_id,
            tipo: payload.tipo,
            monto: payload.monto,
            detalle: payload.detalle,
            estado: payload.estado,
            alquiler_id: 0,
            propietario_id: this.propietarioId,
            direccion_snapshot: payload.direccion_snapshot,
          };

          // Agrego al arreglo general y refresco AJUSTES (abajo)
          this.rows = [...this.rows, nueva];
          this.refreshAjustes();

          // Cierro modal y limpio form
          this.closeModal();
          this.apply();
        } else {
          alert('No se pudo crear el movimiento.');
        }
      },
      error: () => alert('Error de servidor al crear el movimiento.'),
    });
  }
  setStatus(r: any, estado: 'pendiente' | 'confirmado' | 'anulado') {
    if (!r?.id) return;
    this.svc.setStatus(r.id, estado).subscribe({
      next: (res) => {
        if (res?.success) {
          // recargo listado -> se recalculan ajustes y totales
          this.apply();
        } else {
          alert('No se pudo cambiar el estado.');
        }
      },
      error: () => alert('Error de servidor al cambiar estado.'),
    });

    const payload: any = {
      fecha: this.form.fecha,
      categoria_id: Number(this.form.categoria_id),
      tipo: this.form.tipo,
      monto: Number(this.form.monto),
      detalle: this.form.detalle || '',
      estado: this.form.estado || 'confirmado',
      mov_kind: 'libre',
      alquiler_id: 0,
      propietario_id: this.propietarioId,
      direccion_snapshot: (this.form.direccion_snapshot || '').trim(),
    };

    this.svc.create(payload).subscribe({
      next: (res) => {
        if (res?.success) {
          this.closeModal();
          this.page = 1;
          this.apply();
        } else alert('No se pudo crear');
      },
      error: () => alert('Error de servidor'),
    });
  }
  del(r: any) {
    if (!r?.id) return;
    if (!confirm('¿Eliminar movimiento?')) return;

    this.svc.delete(r.id).subscribe({
      next: (res) => {
        if (res?.success) {
          // recargo listado -> se recalculan ajustes y totales
          this.apply();
        } else {
          alert('No se pudo eliminar.');
        }
      },
      error: () => alert('Error de servidor al eliminar.'),
    });
  }

  private refreshAjustes(): void {
    let c = 0,
      d = 0;
    for (const r of this.rows) {
      if (!r || !r.tipo) continue;
      if (r.tipo === 'credito') {
        c += Number(r.monto || 0);
      } else if (r.tipo === 'debito') {
        d += Number(r.monto || 0);
      }
    }
    this.ajustesTotales = { creditos: c, debitos: d, saldo: c - d };
  }

  // ===== Acciones chooser (dejadas por compatibilidad) =====
  get chooserLabel(): string {
    const p = this.parseMesFlexible(this.selectedMes);
    if (!p) return this.selectedMes;
    return `${this.monthNames[p.month - 1]} ${p.year}`;
  }
  chooserShift(deltaMonths: number) {
    const p = this.parseMesFlexible(this.selectedMes) || {
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
    };
    const d = new Date(p.year, p.month - 1 + deltaMonths, 1);
    this.selectedMes = this.toYYYYMM(d.getFullYear(), d.getMonth() + 1);
    this.chooserPage = 1;
    this.loadChooser();
  }
  buildChooserMonths(n: number = 18) {
    this.chooserMonths = [];
    for (let i = 0; i < n; i++) {
      const d = new Date(
        this.chooserBaseDate.getFullYear(),
        this.chooserBaseDate.getMonth() - i,
        1
      );
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      this.chooserMonths.push(`${y}-${m}`);
    }
  }
  closeChooser() {
    this.chooserOpen = false;
  }
  openChooser() {
    this.chooserOpen = true;
    this.chooserPage = 1;
    this.chooserQ = '';
    this.loadChooser();
  }
  get chooserTotalPages(): number {
    const p = Math.ceil(this.chooserTotal / this.chooserPageSize);
    return p > 0 ? p : 1;
  }
  chooserPrev() {
    if (this.chooserPage > 1) {
      this.chooserPage--;
      this.loadChooser();
    }
  }
  chooserNext() {
    if (this.chooserPage < this.chooserTotalPages) {
      this.chooserPage++;
      this.loadChooser();
    }
  }
  choose(a: any) {
    // hoy el modal no vincula contratos, pero dejamos esto por si lo reutilizás
    this.chosenSummary = `${a.inquilino || '—'} · ${a.direccion || '—'} · ${
      a.mes || ''
    }`;
    this.closeChooser();
  }
  loadChooser() {
    this.alquileresSvc
      .list({
        mes: this.selectedMes,
        q: this.chooserQ || undefined,
        page: this.chooserPage,
        pageSize: this.chooserPageSize,
        sort: 'id',
        dir: 'desc',
        propietario_id: this.propietarioId as any,
      } as any)
      .subscribe({
        next: (res) => {
          if (res?.success) {
            this.chooserRows = res.rows || [];
            this.chooserTotal = res.total || 0;
          } else {
            this.chooserRows = [];
            this.chooserTotal = 0;
          }
        },
        error: () => {
          this.chooserRows = [];
          this.chooserTotal = 0;
        },
      });
  }

  // ===== impresión (igual que antes) =====
  private getSelectedMonthYYYYMM(): string {
    const s = (this.selectedMes || '').trim();
    if (/^\d{4}-\d{2}$/.test(s)) return s;
    return this.currentMonthYYYYMM();
  }
  private async fetchAllMovimientosMes(): Promise<{
    rows: any[];
    totales: any;
  }> {
    const mesYYYYMM = this.getSelectedMonthYYYYMM();
    const chunk = 500;
    let page = 1;
    let acc: any[] = [];
    let totalesRef: any = null;
    while (true) {
      const res: any = await this.svc
        .list({
          mes: mesYYYYMM,
          estado: this.estado || undefined,
          categoria_id: this.categoria_id || undefined,
          q: this.q || undefined,
          propietario_id: this.propietarioId,
          page,
          pageSize: chunk,
        } as any)
        .toPromise();
      if (!res?.success) break;
      const rows = res.rows || [];
      acc = acc.concat(rows);
      if (!totalesRef && res.totales) totalesRef = res.totales;
      const total = res.total || acc.length;
      if (acc.length >= total || rows.length < chunk) break;
      page++;
      if (page > 100) break;
    }
    if (!totalesRef) {
      const creditos = acc
        .filter((r) => r.tipo === 'credito')
        .reduce((s, r) => s + Number(r.monto || 0), 0);
      const debitos = acc
        .filter((r) => r.tipo === 'debito')
        .reduce((s, r) => s + Number(r.monto || 0), 0);
      totalesRef = { creditos, debitos, saldo: creditos - debitos };
    }
    return { rows: acc, totales: totalesRef };
  }
  async printMovimientosMes() {
    try {
      // Trae TODO el mes con filtros actuales
      const mesYYYYMM = this.getSelectedMonthYYYYMM();
      const { rows } = await this.fetchAllMovimientosMes();
      if (!rows.length) {
        alert('No hay movimientos para imprimir en el mes seleccionado.');
        return;
      }

      // Aseguro índice de alquileres del mes (para inquilino/dirección/fechas)
      await this.loadAlqIndex();

      // Arriba: misma planilla que en pantalla
      const planilla = this.buildContractSummaryFrom(rows);
      const totalAlq = planilla.reduce(
        (s, a) => s + Number(a.alquiler || 0),
        0
      );
      const totalAdm = planilla.reduce((s, a) => s + Number(a.adm || 0), 0);
      const totalNeto = planilla.reduce((s, a) => s + Number(a.neto || 0), 0);

      // Abajo: AJUSTES (todo lo que NO es alquiler/adm)
      const { items: ajustes, tot: ajTot } = this.buildAjustesFrom(rows);

      // Neto final (igual que pantalla): neto planilla + saldo ajustes
      const netoFinal = totalNeto + ajTot.saldo;

      const html = this.buildPrintHtmlPlanillaCompleta(
        mesYYYYMM,
        planilla,
        { totalAlq, totalAdm, totalNeto },
        ajustes,
        ajTot,
        netoFinal
      );
      this.openPrintWindow(html);
    } catch {
      alert('No se pudo generar la impresión.');
    }
  }
  private buildPrintHtmlMovMes(
    mesYYYYMM: string,
    rows: any[],
    tot: any
  ): string {
    const esc = (v: any) =>
      (v ?? '')
        .toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    const fmt = (n: any) => {
      const x = Number(n ?? 0);
      return isFinite(x)
        ? x.toLocaleString('es-AR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })
        : '0,00';
    };
    const parsed = this.parseMesFlexible(mesYYYYMM);
    const prettyMes = parsed
      ? `${this.monthNames[parsed.month - 1]} ${parsed.year}`
      : mesYYYYMM;
    const now = new Date();
    const when =
      now.toLocaleDateString('es-AR') + ' ' + now.toLocaleTimeString('es-AR');
    const head = `
      <tr>
        <th style="text-align:left;">Fecha</th>
        <th style="text-align:left;">Detalle</th>
        <th>Categoría</th>
        <th>Tipo</th>
        <th style="text-align:right;">Monto</th>
        <th>Estado</th>
        <th style="text-align:left;">Dirección / Motivo</th>
      </tr>`;
    const body = rows
      .map(
        (r) => `
      <tr>
        <td style="text-align:left;">${esc(r.fecha || '')}</td>
        <td style="text-align:left;">${esc(r.detalle || '')}</td>
        <td style="text-align:center;">${esc(
          r.categoria_nombre || r.categoria_id || ''
        )}</td>
        <td style="text-transform:uppercase; text-align:center;">${esc(
          r.tipo || ''
        )}</td>
        <td style="text-align:right;">${fmt(r.monto)}</td>
        <td style="text-align:center;">${esc(r.estado || '')}</td>
        <td style="text-align:left;">${esc(r.direccion_snapshot || '')}</td>
      </tr>`
      )
      .join('');
    const totCred = fmt(tot?.creditos ?? 0);
    const totDeb = fmt(tot?.debitos ?? 0);
    const saldo = fmt(tot?.saldo ?? 0);
    const owner = esc(
      this.propietarioNombre || `Propietario #${this.propietarioId}`
    );
    return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8"/>
<title>Movimientos — ${owner} — ${esc(prettyMes)}</title>
<style>
  :root { --fg:#111827; --muted:#6b7280; --line:#e5e7eb; }
  body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; color:var(--fg); margin:24px; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  .meta { color: var(--muted); font-size: 12px; margin: 0 0 12px; }
  .totals { display:flex; gap:12px; margin: 8px 0 12px; font-size: 13px; }
  .pill { border:1px solid var(--line); border-radius:999px; padding:4px 10px; }
  .pill strong{ margin-right:6px; }
  table { width:100%; border-collapse: collapse; font-size: 12px; }
  th, td { border: 1px solid var(--line); padding: 6px 8px; vertical-align: top; }
  th { background:#f9fafb; }
  @media print { @page{ size:A4 portrait; margin: 10mm; } body{ margin:0; } }
</style>
</head>
<body>
  <h1>Movimientos — ${owner}</h1>
  <div class="meta">Mes: ${esc(prettyMes)} · Generado: ${esc(
      when
    )} · Estado: ${esc(this.estado)} · Categoría: ${esc(
      String(this.categoria_id || 0)
    )}</div>
  <div class="totals">
    <div class="pill"><strong>Créditos:</strong> ${esc(totCred)}</div>
    <div class="pill"><strong>Débitos:</strong> ${esc(totDeb)}</div>
    <div class="pill"><strong>Saldo:</strong> ${esc(saldo)}</div>
  </div>
  <table>
    <thead>${head}</thead>
    <tbody>${body}</tbody>
  </table>
  <script>window.onload=()=>setTimeout(()=>window.print(),50);</script>
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

  async printPlanilla() {
    try {
      // Traigo todos los movimientos del mes para que la planilla
      // se arme completa (sin depender de la página actual)
      const { rows } = await this.fetchAllMovimientosMes();

      // Aseguro índice de alquileres del mes
      await this.loadAlqIndex();

      // Construyo un resumen "como el de pantalla"
      const summary = this.buildContractSummaryFrom(rows);

      const html = this.buildPrintHtmlPlanilla(summary);
      this.openPrintWindow(html);
    } catch {
      alert('No se pudo generar la impresión de planilla.');
    }
  }

  /** Igual que buildContractSummary(), pero puro: devuelve el array armado a partir de "rows" */
  private buildContractSummaryFrom(rows: any[]): Array<{
    alquiler_id: number;
    direccion: string;
    inquilino: string;
    alquiler: number;
    adm: number;
    neto: number;
    fin_contrato: string;
    cambia_monto: string;
  }> {
    const map = new Map<
      number,
      {
        alquiler_id: number;
        direccion: string;
        inquilino: string;
        alquiler: number;
        adm: number;
        neto: number;
        fin_contrato: string;
        cambia_monto: string;
      }
    >();

    const CAT_ALQUILER = this.CAT_ALQUILER;
    const CAT_ADM = this.CAT_ADM;

    for (const r of rows) {
      const id = Number(r.alquiler_id || 0);
      if (!id) continue;

      if (!map.has(id)) {
        const idx = this.alqIndex[id] || {};
        map.set(id, {
          alquiler_id: id,
          direccion: (r.direccion_snapshot || idx.direccion || '').trim(),
          inquilino: (idx.inquilino || '').trim(),
          alquiler: 0,
          adm: 0,
          neto: 0,
          fin_contrato: idx.venc_monto || '',
          cambia_monto: idx.vencimiento_montos || '',
        });
      }
      const acc = map.get(id)!;
      const monto = Number(r.monto || 0);
      if (Number(r.categoria_id) === CAT_ALQUILER && r.tipo === 'credito')
        acc.alquiler += monto;
      if (Number(r.categoria_id) === CAT_ADM && r.tipo === 'debito')
        acc.adm += monto;
    }

    for (const acc of map.values()) acc.neto = acc.alquiler - acc.adm;

    return Array.from(map.values()).sort((a, b) =>
      (a.direccion || '').localeCompare(b.direccion || '', 'es', {
        sensitivity: 'base',
      })
    );
  }

  private buildAjustesFrom(rows: any[]): {
    items: any[];
    tot: { creditos: number; debitos: number; saldo: number };
  } {
    const isBaseCat = (r: any) =>
      Number(r.categoria_id) === this.CAT_ALQUILER ||
      Number(r.categoria_id) === this.CAT_ADM;

    const items = (rows || []).filter((r) => !isBaseCat(r));

    let creditos = 0,
      debitos = 0;
    for (const r of items) {
      const m = Number(r.monto || 0);
      if (r.tipo === 'credito') creditos += m;
      else if (r.tipo === 'debito') debitos += m;
    }
    return { items, tot: { creditos, debitos, saldo: creditos - debitos } };
  }

  private buildPrintHtmlPlanillaCompleta(
    mesYYYYMM: string,
    planilla: Array<{
      direccion: string;
      inquilino: string;
      alquiler: number;
      adm: number;
      neto: number;
      fin_contrato: string;
      cambia_monto: string;
    }>,
    totalsPlanilla: { totalAlq: number; totalAdm: number; totalNeto: number },
    ajustes: any[],
    ajTot: { creditos: number; debitos: number; saldo: number },
    netoFinal: number
  ): string {
    const esc = (v: any) =>
      (v ?? '')
        .toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    const fmt = (n: any) => {
      const x = Number(n ?? 0);
      return isFinite(x)
        ? x.toLocaleString('es-AR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })
        : '0,00';
    };
    const p = this.parseMesFlexible(mesYYYYMM);
    const prettyMes = p
      ? `${this.monthNames[p.month - 1]} ${p.year}`
      : mesYYYYMM;
    const now = new Date();
    const when =
      now.toLocaleDateString('es-AR') + ' ' + now.toLocaleTimeString('es-AR');
    const owner = esc(
      this.propietarioNombre || `Propietario #${this.propietarioId}`
    );

    const planillaHead = `
    <tr>
      <th style="text-align:left;">Dirección</th>
      <th style="text-align:left;">Inquilino</th>
      <th style="width:120px; text-align:right;">Alquiler</th>
      <th style="width:120px; text-align:right;">ADM</th>
      <th style="width:140px; text-align:right;">NETO</th>
      <th style="width:160px;">Finalización Contrato</th>
      <th style="width:140px;">Cambia Monto</th>
    </tr>`;
    const planillaBody = (planilla || [])
      .map(
        (r) => `
      <tr>
        <td>${esc(r.direccion || '')}</td>
        <td>${esc(r.inquilino || '')}</td>
        <td style="text-align:right;">${fmt(r.alquiler)}</td>
        <td style="text-align:right;">${fmt(r.adm)}</td>
        <td style="text-align:right;"><strong>${fmt(r.neto)}</strong></td>
        <td>${esc(r.fin_contrato || '')}</td>
        <td>${esc(r.cambia_monto || '')}</td>
      </tr>`
      )
      .join('');

    const ajustesHead = `
    <tr>
      <th style="width:110px;">Fecha</th>
      <th>Motivo / Propiedad</th>
      <th>Detalle</th>
      <th style="width:160px;">Categoría</th>
      <th style="width:80px;">Tipo</th>
      <th style="width:140px; text-align:right;">Monto</th>
      <th style="width:140px;">Estado</th>
    </tr>`;
    const ajustesBody = (ajustes || [])
      .map(
        (r) => `
      <tr>
        <td>${esc(r.fecha || '')}</td>
        <td>${esc(r.direccion_snapshot || '—')}</td>
        <td>${esc(r.detalle || '—')}</td>
        <td>${esc(r.categoria_nombre || r.categoria_id || '')}</td>
        <td style="text-transform:uppercase;">${esc(r.tipo || '')}</td>
        <td style="text-align:right;">${fmt(r.monto)}</td>
        <td>${esc(r.estado || '')}</td>
      </tr>`
      )
      .join('');

    return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8"/>
<title>Planilla — ${owner} — ${esc(prettyMes)}</title>
<style>
  :root { --fg:#111827; --muted:#6b7280; --line:#e5e7eb; }
  body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; color:var(--fg); margin:24px; }
  h1 { font-size:20px; margin:0 0 4px; }
  .meta { color:var(--muted); font-size:12px; margin:0 0 12px; }
  .section-title { font-size:13px; font-weight:700; margin:16px 0 6px; }
  table { width:100%; border-collapse:collapse; font-size:12px; }
  th, td { border:1px solid var(--line); padding:6px 8px; vertical-align:top; }
  th { background:#f9fafb; }
  tfoot td { font-weight:700; background:#fbfcfe; }
  .totals { display:flex; justify-content:flex-end; margin:8px 0; font-size:13px; }
  .pill { border:1px solid var(--line); padding:4px 10px; border-radius:999px; }
  @media print { @page { size:A4 portrait; margin:10mm; } body{ margin:0; } }
</style>
</head>
<body>
  <h1>Planilla — ${owner}</h1>
  <div class="meta">Mes: ${esc(prettyMes)} · Generado: ${esc(when)}</div>

  <!-- ===== PLANILLA (arriba) ===== -->
  <table>
    <thead>${planillaHead}</thead>
    <tbody>${
      planillaBody || `<tr><td colspan="7">Sin registros.</td></tr>`
    }</tbody>
    <tfoot>
      <tr>
        <td colspan="2" style="text-align:right;">Totales</td>
        <td style="text-align:right;">${fmt(totalsPlanilla.totalAlq)}</td>
        <td style="text-align:right;">${fmt(totalsPlanilla.totalAdm)}</td>
        <td style="text-align:right;">${fmt(totalsPlanilla.totalNeto)}</td>
        <td colspan="2"></td>
      </tr>
    </tfoot>
  </table>

  <div class="section-title">Liquidación · ${esc(prettyMes)}</div>

  <!-- ===== AJUSTES (abajo) ===== -->
  <table>
    <thead>${ajustesHead}</thead>
    <tbody>${
      ajustesBody || `<tr><td colspan="7">Sin ajustes.</td></tr>`
    }</tbody>
    <tfoot>
      <tr>
        <td colspan="5" style="text-align:right;">Totales ajustes</td>
        <td style="text-align:right;">${fmt(ajTot.saldo)}</td>
        
      </tr>
    </tfoot>
  </table>

  <div class="totals">
    <div class="pill"><strong>NETO FINAL:</strong> ${fmt(netoFinal)}</div>
  </div>

  <script>window.onload = () => setTimeout(() => window.print(), 50);</script>
</body>
</html>`;
  }

  private buildPrintHtmlPlanilla(summary: any[]): string {
    const fmt = (n: any) =>
      Number(n ?? 0).toLocaleString('es-AR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    const esc = (v: any) =>
      (v ?? '')
        .toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    const totAlq = summary.reduce((s, r) => s + Number(r.alquiler || 0), 0);
    const totAdm = summary.reduce((s, r) => s + Number(r.adm || 0), 0);
    const totNet = summary.reduce((s, r) => s + Number(r.neto || 0), 0);

    const p = this.parseMesFlexible(this.selectedMes);
    const prettyMes = p
      ? `${this.monthNames[p.month - 1]} ${p.year}`
      : this.selectedMes;

    const rowsHtml = summary
      .map(
        (r) => `
      <tr>
        <td style="text-align:left;">${esc(r.direccion || '')}</td>
        <td style="text-align:left;">${esc(r.inquilino || '')}</td>
        <td style="text-align:right;">${fmt(r.alquiler)}</td>
        <td style="text-align:right;">${fmt(r.adm)}</td>
        <td style="text-align:right;"><strong>${fmt(r.neto)}</strong></td>
        <td style="text-align:center;">${esc(r.fin_contrato || '')}</td>
        <td style="text-align:center;">${esc(r.cambia_monto || '')}</td>
      </tr>`
      )
      .join('');

    return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8"/>
<title>Planilla — ${esc(this.propietarioNombre)} — ${esc(prettyMes)}</title>
<style>
  :root { --fg:#111827; --muted:#6b7280; --line:#e5e7eb; }
  body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; color:var(--fg); margin: 24px; }
  h1 { font-size: 20px; margin: 0 0 6px; }
  .meta { color: var(--muted); font-size: 12px; margin: 0 0 12px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th, td { border: 1px solid var(--line); padding: 6px 8px; vertical-align: top; }
  th { background: #f9fafb; }
  tfoot td { font-weight: 700; background: #fafafa; }
  @media print { @page { size: A4 portrait; margin: 10mm; } body{ margin:0; } }
</style>
</head>
<body>
  <h1>Planilla — ${esc(this.propietarioNombre)}</h1>
  <div class="meta">Mes: ${esc(prettyMes)}</div>

  <table>
    <thead>
      <tr>
        <th style="text-align:left;">Dirección</th>
        <th style="text-align:left;">Inquilino</th>
        <th style="text-align:right;">Alquiler</th>
        <th style="text-align:right;">ADM</th>
        <th style="text-align:right;">NETO</th>
        <th style="text-align:center;">Finalización Contrato</th>
        <th style="text-align:center;">Cambia Monto</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml || `<tr><td colspan="7">Sin registros.</td></tr>`}
    </tbody>
    <tfoot>
      <tr>
        <td colspan="2" style="text-align:right;">Totales</td>
        <td style="text-align:right;">${fmt(totAlq)}</td>
        <td style="text-align:right;">${fmt(totAdm)}</td>
        <td style="text-align:right;">${fmt(totNet)}</td>
        <td colspan="2"></td>
      </tr>
    </tfoot>
  </table>

  <script>window.onload=()=>setTimeout(()=>window.print(),50);</script>
</body>
</html>`;
  }
}
