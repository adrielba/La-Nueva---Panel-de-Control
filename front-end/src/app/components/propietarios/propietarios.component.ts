import { Component, OnInit } from '@angular/core';
import {
  PropietariosService,
  Propietario,
} from '../../services/propietarios.service';
import { LiquidacionesService } from '../../services/liquidaciones.service';
import { EmailService } from '../../services/email.service';

@Component({
  selector: 'app-propietarios',
  templateUrl: './propietarios.component.html',
  styleUrls: ['./propietarios.component.css'],
})
export class PropietariosComponent implements OnInit {
  // filtros y paginación
  q = '';
  page = 1;
  pageSize = 20;

  // listado
  rows: Propietario[] = [];
  total = 0;
  loading = false;
  errorMsg = '';

  // form CRUD
  showForm = false;
  editingId: number | null = null;
  form: Propietario = this.empty();

  // detalle propietario
  detailOpen = false;
  detalle: { propietario: any; alquileres?: any[] } | null = null;
  tab: 'detalle' | 'propiedades' | 'liquidaciones' = 'detalle';
  props: any[] = []; // propiedades agrupadas

  liqSelectedYear = new Date().getFullYear();
  liqMonth = new Date().getMonth() + 1;

  liqSheet: any = null;
  newItem = {
    inquilino: '',
    domicilio: '',
    categoria: 'cargo',
    monto: null as number | null,
  };
  newPago = {
    fecha: '',
    concepto: 'Entrega parcial',
    monto: null as number | null,
  };

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

  liqLoading = false;
  liqMissing = false; // <-- no existe la hoja de ese período

  liqTemplates: any[] = [];
  selectedTemplateId: number | null = null;

  presetConceptos = [
    'Alquiler',
    'ADM',
    'Servicios',
    'Expensas',
    'Depósito',
    'Cuotas',
    'Ajuste',
  ];

  templateName = '';

  // Estructura de campos de la plantilla actual
  templateFields: Array<{
    key: string;
    label: string;
    type: 'text' | 'number' | 'memo';
  }> = [];

  // Filas que el usuario edita antes de guardar
  tempRows: any[] = [];

  // Fila “nueva”
  newRow: any = { inquilino: '', domicilio: '' };

  // Para saber qué campos numéricos soportamos (coinciden con categorías de ítems)
  numericFieldKeys: Array<
    'alquiler' | 'adm' | 'servicios' | 'expensas' | 'deposito'
  > = ['alquiler', 'adm', 'servicios', 'expensas', 'deposito'];

  // Mapeo: nombre de campo -> categoría del ítem
  fieldToCategoria: Record<string, string> = {
    alquiler: 'alquiler',
    adm: 'adm',
    servicios: 'servicios',
    expensas: 'expensas',
    deposito: 'deposito',
    // si tu plantilla 2 usa “neto”, “actualizacion”, etc., agregalos aquí
  };

  liqList: any[] = [];
  liqListLoading = false;
  templateLocked = false; // <- bloquea selector cuando hay hoja

  private defaultTemplateFields() {
    return [
      { key: 'inquilino', label: 'Inquilino', type: 'text' as const },
      { key: 'domicilio', label: 'Dirección', type: 'text' as const },
      { key: 'alquiler', label: 'Alquiler', type: 'number' as const },
      { key: 'adm', label: 'ADM', type: 'number' as const },
      { key: 'servicios', label: 'Servicios', type: 'number' as const },
      { key: 'expensas', label: 'Expensas', type: 'number' as const },
      { key: 'deposito', label: 'Depósito', type: 'number' as const },
    ];
  }

  displayRows: Array<{
    inquilino?: string;
    domicilio?: string;
    alquiler?: number | null;
    adm?: number | null;
    servicios?: number | null;
    expensas?: number | null;
    deposito?: number | null;
    total?: number;
    _itemIds: number[]; // para borrar la fila completa si querés
  }> = [];

  emailOpen = false;
  emailForm = {
    to_email: '',
    to_name: '',
    subject: '',
    body_html: '',
  };
  emailSending = false;

  propEmailAttachments: Array<{
    name: string;
    size: number;
    type: string;
    base64: string;
  }> = [];

  constructor(
    private svc: PropietariosService,
    private liqSvc: LiquidacionesService,
    private emailSvc: EmailService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  private clampAndMaybeReload(total: number, _rowsCount: number) {
    const totalPages = Math.ceil(total / this.pageSize);
    if (totalPages === 0) {
      if (this.page !== 1) this.page = 1;
      return false;
    }
    if (this.page > totalPages) {
      this.page = totalPages;
      return true;
    }
    return false;
  }

  empty(): Propietario {
    return {
      nombre: '',
      cuit_cuil: '',
      telefono: '',
      email: '',
      banco_alias: '',
      notas: '',
    };
  }

  get totalPages(): number {
    const p = Math.ceil(this.total / this.pageSize);
    return p > 0 ? p : 1;
  }

  /* ===== listado ===== */
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

            const shouldReload = this.clampAndMaybeReload(
              this.total,
              res.rows?.length ?? 0
            );
            if (shouldReload) {
              this.load();
              return;
            }

            this.rows = res.rows ?? [];
          } else {
            this.rows = [];
            this.total = 0;
            this.errorMsg = 'No se pudo cargar el listado.';
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
  applyFilters() {
    this.page = 1;
    this.load();
  }
  clearFilters() {
    this.q = '';
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
    if (this.page < this.totalPages) {
      this.page++;
      this.load();
    }
  }

  /* ===== CRUD propietario ===== */
  nuevo() {
    this.showForm = true;
    this.editingId = null;
    this.form = this.empty();
  }
  editar(r: any) {
    this.showForm = true;
    this.editingId = r.id!;
    this.form = {
      id: r.id,
      nombre: r.nombre || '',
      cuit_cuil: r.cuit_cuil || '',
      telefono: r.telefono || '',
      email: r.email || '',
      banco_alias: r.banco_alias || '',
      notas: r.notas || '',
    };
  }
  cancelar() {
    this.showForm = false;
  }
  guardar() {
    if (!this.form.nombre?.trim()) {
      this.errorMsg = 'El nombre es obligatorio';
      return;
    }
    const obs = this.editingId
      ? this.svc.update(this.editingId, this.form)
      : this.svc.create(this.form);
    obs.subscribe({
      next: (res) => {
        if (res?.success) {
          this.showForm = false;
          this.load();
        } else {
          this.errorMsg = 'No se pudo guardar.';
        }
      },
      error: () => (this.errorMsg = 'Error de servidor al guardar.'),
    });
  }
  eliminar(r: any) {
    if (!confirm(`¿Eliminar propietario "${r.nombre}" (#${r.id})?`)) return;
    this.svc.delete(r.id).subscribe({
      next: (res) => {
        if (res?.success) {
          // 👇 si era el único de la página, retroceder antes de recargar
          const isLastOnPage = this.rows.length === 1 && this.page > 1;
          if (isLastOnPage) this.page--;
          this.load();
        } else {
          this.errorMsg = 'No se pudo eliminar.';
        }
      },
      error: () => (this.errorMsg = 'Error de servidor al eliminar.'),
    });
  }

  /* ===== detalle ===== */
  verDetalle(r: any) {
    this.errorMsg = '';
    this.detalle = null;
    this.props = [];
    this.tab = 'detalle';
    this.detailOpen = true;

    // reset de hoja
    this.liqSheet = null;

    this.svc.detalle(r.id).subscribe({
      next: (res) => {
        if (res?.success) this.detalle = res;
        else this.errorMsg = 'No se pudo cargar el detalle.';
      },
      error: () => (this.errorMsg = 'Error de servidor al cargar detalle.'),
    });

    this.svc.props(r.id).subscribe({
      next: (res) => {
        if (res?.success) this.props = res.rows || [];
      },
    });
  }
  closeDetail() {
    this.detailOpen = false;
    this.detalle = null;
    this.props = [];
  }
  setTab(t: 'detalle' | 'propiedades' | 'liquidaciones') {
    this.tab = t;

    if (t === 'liquidaciones') {
      this.liqSheet = null;
      this.selectedTemplateId = null;
      this.templateLocked = false;

      const y = this.liqSelectedYear;
      const m = String(this.liqMonth).padStart(2, '0');
      this.newPago.fecha = `${y}-${m}-01`;

      // plantillas
      this.liqSvc.templates().subscribe({
        next: (res) => {
          this.liqTemplates = res?.success ? res.rows || [] : [];
          // Depuración
          console.log('liqTemplates:', this.liqTemplates);
        },
        error: (err) => {
          console.error('liq_templates_list error', err);
          this.liqTemplates = [];
        },
      });

      // listado de liquidaciones del propietario
      const propId = this.detalle?.propietario?.id;
      if (propId) {
        this.liqListLoading = true;
        this.liqSvc.list(propId).subscribe({
          next: (res) => {
            this.liqListLoading = false;
            this.liqList = res?.rows || [];
          },
          error: () => {
            this.liqListLoading = false;
            this.liqList = [];
          },
        });
      }
    }
  }

  openFromList(row: any) {
    console.log('[openFromList] abriendo', row);
    this.liqSelectedYear = row.anio;
    this.liqMonth = row.mes;
    this.cargarHojaLiq();
  }

  cargarHojaLiq() {
    const propId = this.detalle?.propietario?.id;
    if (!propId) {
      console.warn('Sin propietario_id');
      return;
    }

    console.log('[cargarHojaLiq] pedir hoja', {
      propId,
      anio: this.liqSelectedYear,
      mes: this.liqMonth,
    });

    this.liqSvc.sheet(propId, this.liqSelectedYear, this.liqMonth).subscribe({
      next: (res) => {
        console.log('[cargarHojaLiq] respuesta', res);
        if (res?.success) {
          this.liqSheet = res;

          const tplId = Number(res.liquidacion?.template_id || 0);
          if (tplId) {
            this.selectedTemplateId = tplId;
            this.templateLocked = true;
            const tpl = this.liqTemplates.find((t: any) => t.id === tplId);
            if (tpl) {
              this.templateName = tpl.nombre;
              this.templateFields =
                tpl.fields && tpl.fields.length
                  ? tpl.fields
                  : this.defaultTemplateFields();
            } else {
              this.templateName = 'Plantilla';
              this.templateFields = this.defaultTemplateFields();
            }
          } else {
            this.templateLocked = false;
          }

          this.rebuildDisplayRowsFromSheet(res);
          const y = this.liqSelectedYear;
          const m = String(this.liqMonth).padStart(2, '0');
          this.newPago.fecha = `${y}-${m}-01`;
        } else {
          this.liqSheet = null;
          this.templateLocked = false;
          this.displayRows = [];
          alert(
            'No existe hoja para ese período. Podés crearla con una plantilla.'
          );
        }
      },
      error: (e) => {
        console.error('[cargarHojaLiq] error', e);
        this.liqSheet = null;
        this.templateLocked = false;
        this.displayRows = [];
        alert('Error de servidor.');
      },
    });
  }

  crearHojaLiq() {
    const propId = this.detalle?.propietario?.id;
    if (!propId) return;

    if (!this.selectedTemplateId) {
      alert('Elegí una plantilla antes de crear la hoja.');
      return;
    }

    this.liqSvc
      .crear(
        propId,
        this.liqSelectedYear,
        this.liqMonth,
        this.selectedTemplateId
      )
      .subscribe({
        next: (res) => {
          if (res?.success) {
            // al crear, cargo la hoja para verla
            this.cargarHojaLiq();
          } else {
            alert('No se pudo crear la liquidación.');
          }
        },
        error: () => alert('Error de servidor al crear liquidación.'),
      });
  }

  delItem(row: any) {
    if (!confirm('Eliminar ítem?')) return;
    this.liqSvc.itemDelete(row.id).subscribe({
      next: (res) => {
        if (res?.success) this.cargarHojaLiq();
      },
      error: () => alert('Error al eliminar ítem.'),
    });
  }

  addPago() {
    if (!this.liqSheet?.liquidacion?.id) {
      alert('Cargá la hoja primero.');
      return;
    }
    const lid = this.liqSheet.liquidacion.id;
    const monto = Number(this.newPago.monto || 0);
    if (!this.newPago.fecha || monto <= 0) {
      alert('Fecha y monto > 0');
      return;
    }

    const body = {
      liquidacion_id: lid,
      fecha: this.newPago.fecha,
      concepto: this.newPago.concepto || 'Entrega parcial',
      monto,
    };
    this.liqSvc.pagoCreate(body).subscribe({
      next: (res) => {
        if (res?.success) {
          this.cargarHojaLiq();
          this.newPago.monto = null;
        } else alert('No se pudo crear el pago.');
      },
      error: () => alert('Error de servidor al crear pago.'),
    });
  }

  delPago(p: any) {
    if (!confirm('Eliminar pago?')) return;
    this.liqSvc.pagoDelete(p.id).subscribe({
      next: (res) => {
        if (res?.success) this.cargarHojaLiq();
      },
      error: () => alert('Error al eliminar pago.'),
    });
  }

  recalcular() {
    if (!this.liqSheet?.liquidacion?.id) return;
    this.liqSvc.recalc(this.liqSheet.liquidacion.id).subscribe({
      next: () => this.cargarHojaLiq(),
    });
  }

  onTemplateChange() {
    const t = this.liqTemplates.find(
      (x: any) => x.id === Number(this.selectedTemplateId)
    );
    if (!t) {
      this.templateFields = [];
      this.templateName = '';
      this.tempRows = [];
      this.newRow = { inquilino: '', domicilio: '' };
      return;
    }
    this.templateName = t.nombre;
    this.templateFields =
      t.fields && t.fields.length ? t.fields : this.defaultTemplateFields();
    this.tempRows = [];
    this.newRow = { inquilino: '', domicilio: '' };
  }

  // util para *ngIf en columnas
  hasField(key: string): boolean {
    return !!this.templateFields.find((f) => f.key === key);
  }

  addRow() {
    const clone = { ...this.newRow };
    this.tempRows.push(clone);
    // limpiar
    this.newRow = { inquilino: '', domicilio: '' };
    // inicializar numéricos si existen en plantilla
    this.numericFieldKeys.forEach((k) => {
      if (this.hasField(k)) this.newRow[k] = null;
    });
    if (this.hasField('cuotas_texto')) this.newRow.cuotas_texto = '';
  }

  removeRow(idx: number) {
    this.tempRows.splice(idx, 1);
  }

  /**
   * Convierte cada fila en varios ítems liq_item_create:
   * - por cada columna numérica con valor > 0, crea un item (categoria = campo)
   * - adjunta inquilino/domicilio si están presentes en la plantilla
   * - si existe “cuotas_texto”, lo guarda como item de categoria “descuento” con monto 0 (o ignorarlo)
   */
  async saveRows() {
    if (!this.liqSheet?.liquidacion?.id) {
      alert('Cargá o creá la hoja primero');
      return;
    }
    const lid = this.liqSheet.liquidacion.id;

    const calls: Array<Promise<any>> = [];
    for (const row of this.tempRows) {
      const base = {
        liquidacion_id: lid,
        inquilino: this.hasField('inquilino') ? row.inquilino || null : null,
        domicilio: this.hasField('domicilio') ? row.domicilio || null : null,
      };

      for (const key of this.numericFieldKeys) {
        if (this.hasField(key)) {
          const val = Number(row[key] || 0);
          if (val > 0) {
            const categoria = this.fieldToCategoria[key] || key;
            const body = { ...base, categoria, monto: val };
            calls.push(this.liqSvc.itemCreate(body).toPromise());
          }
        }
      }

      if (this.hasField('cuotas_texto') && row.cuotas_texto) {
        const body = { ...base, categoria: 'descuento', monto: 0.0 };
        calls.push(this.liqSvc.itemCreate(body).toPromise());
      }
    }

    try {
      const results = await Promise.all(calls);
      const ok = results.every((r) => r && r.success);
      if (!ok) {
        console.error('Alguna inserción falló:', results);
        alert('Algunas filas no se guardaron. Revisá la consola.');
        return;
      }
      await this.recalcular();
      await new Promise((res) => setTimeout(res, 150));
      this.cargarHojaLiq();
      this.tempRows = [];
      this.newRow = { inquilino: '', domicilio: '' };
      this.numericFieldKeys.forEach((k) => {
        if (this.hasField(k)) this.newRow[k] = null;
      });
      if (this.hasField('cuotas_texto')) this.newRow.cuotas_texto = '';
      alert('Filas guardadas.');
    } catch (e) {
      console.error('Error guardando filas', e);
      alert('Error guardando filas.');
    }
  }

  private computeRowTotal(r: any) {
    const a = Number(r.alquiler || 0);
    const adm = Number(r.adm || 0);
    const s = Number(r.servicios || 0);
    const e = Number(r.expensas || 0);
    const d = Number(r.deposito || 0);
    return a - adm + s + e + d; // tu fórmula
  }

  private rebuildDisplayRowsFromSheet(res: any) {
    const items = res?.items || [];
    const map = new Map<string, any>();

    for (const it of items) {
      const key = `${it.inquilino || ''}||${it.domicilio || ''}`;
      if (!map.has(key)) {
        map.set(key, {
          inquilino: it.inquilino || '',
          domicilio: it.domicilio || '',
          alquiler: null,
          adm: null,
          servicios: null,
          expensas: null,
          deposito: null,
          _itemIds: [] as number[],
        });
      }
      const row = map.get(key)!;
      const val = Number(it.monto || 0);

      switch ((it.categoria || '').toLowerCase()) {
        case 'alquiler':
        case 'alquiler_prop':
          row.alquiler = Number(row.alquiler || 0) + val;
          break;

        case 'adm':
        case 'administracion':
          row.adm = Number(row.adm || 0) + val;
          break;

        case 'servicios':
          row.servicios = Number(row.servicios || 0) + val;
          break;

        case 'expensas':
          row.expensas = Number(row.expensas || 0) + val;
          break;

        case 'deposito':
        case 'depósito':
          row.deposito = Number(row.deposito || 0) + val;
          break;
      }

      this.displayRows = Array.from(map.values()).map((r) => ({
        ...r,
        total: this.computeRowTotal(r),
      }));
    }
  }
  deleteDisplayRow(row: any) {
    if (!confirm('Eliminar todos los ítems de esta fila?')) return;
    const calls = (row._itemIds || []).map((id: number) =>
      this.liqSvc.itemDelete(id).toPromise()
    );
    Promise.all(calls)
      .then(() => this.recalcular())
      .then(() => this.cargarHojaLiq());
  }

  openEmail(
    to_email: string,
    to_name?: string,
    subject?: string,
    body?: string
  ) {
    // si abrís desde el detalle, cerramos para evitar doble overlay
    if (this.detailOpen) this.closeDetail();

    if (!to_email) {
      alert('Este propietario no tiene email cargado.');
      return;
    }

    this.emailForm = {
      to_email: to_email || '',
      to_name: to_name || '',
      subject: subject || `Información — ${to_name || 'Propietario'}`,
      body_html:
        body ||
        `<p>Hola ${
          to_name || ''
        },</p><p>Le enviamos la información solicitada.</p>`,
    };
    this.emailSending = false;
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

    const attachments = this.propEmailAttachments.map((f) => ({
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
            this.propEmailAttachments = [];
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

  private async fetchAllPropietarios(): Promise<any[]> {
    const pageSize = 1000; // “chunk” grande para minimizar llamadas
    let page = 1;
    let acc: any[] = [];
    while (true) {
      const res: any = await this.svc
        .list({
          q: this.q || undefined,
          page,
          pageSize,
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

  async printAllPropietarios() {
    try {
      const rows = await this.fetchAllPropietarios();
      if (!rows.length) {
        alert('No hay propietarios para imprimir con el filtro actual.');
        return;
      }
      const html = this.buildPrintHtmlList(rows);
      this.openPrintWindow(html);
    } catch (e) {
      console.error('printAllPropietarios error', e);
      alert('No se pudo generar la impresión.');
    }
  }

  private buildPrintHtmlList(rows: any[]): string {
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
      <th>CUIT/CUIL</th>
      <th>Teléfono</th>
      <th>Email</th>
      <th>Alias bancario</th>
      <th>Notas</th>
      <th>Propiedades</th>
    </tr>
  `;

    const body = rows
      .map(
        (r) => `
      <tr>
        <td style="text-align:left;">${esc(r.nombre)}</td>
        <td>${esc(r.cuit_cuil || '—')}</td>
        <td>${esc(r.telefono || '—')}</td>
        <td>${esc(r.email || '—')}</td>
        <td>${esc(r.banco_alias || '—')}</td>
        <td>${esc(r.notas || '')}</td>
        <td style="text-align:right;">${Number(r.propiedades || 0)}</td>
      </tr>`
      )
      .join('');

    return `
<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8"/>
<title>Propietarios — Lista completa</title>
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
  <h1>Propietarios — Lista completa</h1>
  <div class="meta">Generado: ${esc(when)} · Filtro: ${esc(this.q || '—')}</div>
  <table>
    <thead>${head}</thead>
    <tbody>${body}</tbody>
  </table>
  <script>window.onload=()=>setTimeout(()=>window.print(),50);</script>
</body>
</html>`;
  }

  /* ===== helpers compartidos con otras impresiones ===== */
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

  printPropietarioDetail(ev?: Event) {
    ev?.stopPropagation();
    const p = this.detalle?.propietario;
    if (!p) {
      alert('No hay datos del propietario cargados.');
      return;
    }

    const html = this.buildPrintHtmlPropietario(p, this.props || []);
    this.openPrintWindow(html);
  }

  private buildPrintHtmlPropietario(
    p: any,
    props: Array<{ direccion: string; domicilio_tipo: string }>
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

    const badge = (tipo: string) => {
      const t = (tipo || '').toLowerCase();
      let cls = 'badge-nulo',
        txt = t || 'nulo';
      if (t === 'comercial') cls = 'badge-com';
      if (t === 'privado' || t === 'privada') cls = 'badge-priv';
      return `<span class="badge ${cls}">${esc(txt)}</span>`;
    };

    const propsTable = props.length
      ? `
      <h2>Propiedades</h2>
      <table>
        <thead>
          <tr>
            <th style="text-align:left;">Dirección</th>
            <th style="width:140px;">Tipo</th>
          </tr>
        </thead>
        <tbody>
          ${props
            .map(
              (r) => `
            <tr>
              <td style="text-align:left;">${esc(r.direccion)}</td>
              <td style="text-align:center;">${badge(r.domicilio_tipo)}</td>
            </tr>`
            )
            .join('')}
        </tbody>
      </table>
    `
      : '<div class="muted" style="margin-top:6px;">Sin propiedades registradas.</div>';

    return `
<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8"/>
<title>Propietario — ${esc(p?.nombre || '')}</title>
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
  .badge { display:inline-block; padding:2px 8px; border-radius:999px; font-weight:700; font-size:11px; border:1px solid transparent; }
  .badge-com  { background:#e0f2fe; color:#075985; border-color:#bae6fd; }
  .badge-priv { background:#ecfdf5; color:#065f46; border-color:#a7f3d0; }
  .badge-nulo { background:#f3f4f6; color:#374151; border-color:#e5e7eb; }
  @media print { @page{ size:A4 portrait; margin: 10mm; } body{ margin:0; } }
</style>
</head>
<body>
  <h1>Propietario — ${esc(p?.nombre || '')}</h1>
  <div class="meta">Generado: ${esc(when)}</div>

  <div class="box">
    <div class="grid">
      <div><span class="label">CUIT/CUIL:</span>${esc(
        p?.cuit_cuil || '—'
      )}</div>
      <div><span class="label">Teléfono:</span>${esc(p?.telefono || '—')}</div>
      <div class="span2"><span class="label">Email:</span>${esc(
        p?.email || '—'
      )}</div>
      <div class="span2"><span class="label">Alias bancario:</span>${esc(
        p?.banco_alias || '—'
      )}</div>
      <div class="span2"><span class="label">Notas:</span>${esc(
        p?.notas || ''
      )}</div>
    </div>
  </div>

  ${propsTable}

  <script>window.onload=()=>setTimeout(()=>window.print(),50);</script>
</body>
</html>`;
  }

  onPropEmailFilesSelected(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    if (!files.length) return;

    const maxTotal = 18 * 1024 * 1024; // ~18MB
    const currentTotal = this.propEmailAttachments.reduce(
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
        this.propEmailAttachments.push({
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

  removePropEmailAttachment(i: number) {
    this.propEmailAttachments.splice(i, 1);
  }
}
