import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PropiedadesService } from '../../services/propiedades.service';
import { PropServiciosService } from '../../services/prop-servicios.service';

@Component({
  selector: 'app-detalle-propiedad',
  templateUrl: './detalle-propiedad.component.html',
  styleUrls: ['./detalle-propiedad.component.css'],
})
export class DetallePropiedadComponent implements OnInit {
  loading = false;
  errorMsg = '';

  prop: any = null;
  propietarioNombre = '—';
  tieneAlquiler = false;
  inquilinoActual: string | null = null;
  alquilerActual: number | null = null;

  // === Servicios (tabla CRUD) ===
  propId = 0;
  servLoading = false;
  servError = '';
  servRows: any[] = [];
  servPage = 1;
  servPageSize = 10;
  servTotal = 0;
  servQ = '';

  // Modal crear/editar
  servFormOpen = false;
  servEditingId: number | null = null;
  servForm = { servicio: '', cliente_numero: '', notas: '' };

  constructor(
    private route: ActivatedRoute,
    private propsSvc: PropiedadesService,
    private propServSvc: PropServiciosService
  ) {}

  ngOnInit(): void {
    this.propId = Number(this.route.snapshot.paramMap.get('id') || 0);
    if (!this.propId) {
      this.errorMsg = 'ID inválido';
      return;
    }

    this.loading = true;
    this.propsSvc.detail(this.propId).subscribe({
      next: (res) => {
        this.loading = false;
        if (!res?.success) {
          this.errorMsg = 'No se pudo cargar el detalle';
          return;
        }
        this.prop = res.prop || null;
        this.propietarioNombre =
          (this.prop?.propietario_nombre || '').trim() ||
          (this.prop?.propietario_id ? `#${this.prop.propietario_id}` : '—');

        const alq = res.alquiler || {};
        this.tieneAlquiler = !!alq.active;
        this.inquilinoActual = alq.active ? alq.inquilino || '—' : null;
        this.alquilerActual = alq.active ? Number(alq.monto || 0) : null;

        this.loadServicios(); // << carga la tabla
      },
      error: () => {
        this.loading = false;
        this.errorMsg = 'Error de servidor';
      },
    });
  }

  // ====== Servicios: listado ======
  get servTotalPages(): number {
    const p = Math.ceil(this.servTotal / this.servPageSize);
    return p > 0 ? p : 1;
  }
  loadServicios(): void {
    this.servLoading = true;
    this.servError = '';
    this.propServSvc
      .list(this.propId, {
        q: this.servQ || undefined,
        page: this.servPage,
        pageSize: this.servPageSize,
      })
      .subscribe({
        next: (res) => {
          this.servLoading = false;
          if (res?.success) {
            this.servRows = res.rows || [];
            this.servTotal = res.total || 0;
          } else {
            this.servRows = [];
            this.servTotal = 0;
            this.servError = 'No se pudo cargar servicios.';
          }
        },
        error: () => {
          this.servLoading = false;
          this.servRows = [];
          this.servTotal = 0;
          this.servError = 'Error de servidor.';
        },
      });
  }
  servPrev() {
    if (this.servPage > 1) {
      this.servPage--;
      this.loadServicios();
    }
  }
  servNext() {
    if (this.servPage < this.servTotalPages) {
      this.servPage++;
      this.loadServicios();
    }
  }
  servApply() {
    this.servPage = 1;
    this.loadServicios();
  }
  servClear() {
    this.servQ = '';
    this.servPage = 1;
    this.loadServicios();
  }

  // ====== Servicios: ABM ======
  openNewServ() {
    this.servFormOpen = true;
    this.servEditingId = null;
    this.servForm = { servicio: '', cliente_numero: '', notas: '' };
  }
  openEditServ(r: any) {
    this.servFormOpen = true;
    this.servEditingId = r.id;
    this.servForm = {
      servicio: r.servicio || '',
      cliente_numero: r.cliente_numero || '',
      notas: r.notas || '',
    };
  }
  closeServForm() {
    this.servFormOpen = false;
    this.servEditingId = null;
  }
  guardarServ() {
    const { servicio, cliente_numero, notas } = this.servForm;
    if (!servicio || !servicio.trim()) {
      alert('Ingresá el nombre del servicio.');
      return;
    }

    const obs = this.servEditingId
      ? this.propServSvc.update(this.servEditingId, {
          servicio,
          cliente_numero,
          notas,
        })
      : this.propServSvc.create({
          propiedad_id: this.propId,
          servicio,
          cliente_numero,
          notas,
        });

    obs.subscribe({
      next: (res) => {
        if (res?.success !== false) {
          this.closeServForm();
          this.servPage = 1;
          this.loadServicios();
        } else {
          alert('No se pudo guardar.');
        }
      },
      error: () => alert('Error de servidor al guardar.'),
    });
  }
  eliminarServ(r: any) {
    if (!r?.id) return;
    if (!confirm(`¿Eliminar servicio "${r.servicio}"?`)) return;
    this.propServSvc.delete(r.id).subscribe({
      next: (res) => {
        if (res?.success) {
          this.servPage = 1;
          this.loadServicios();
        } else alert('No se pudo eliminar.');
      },
      error: () => alert('Error de servidor al eliminar.'),
    });
  }
}
