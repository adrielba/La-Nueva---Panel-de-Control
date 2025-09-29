import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  AmobServiciosService,
  AmobServ,
} from '../../services/amob-servicios.service';

@Component({
  selector: 'app-amob-servicios',
  templateUrl: './amob-servicios.component.html',
  styleUrls: ['./amob-servicios.component.css'],
})
export class AmobServiciosComponent implements OnInit {
  dirId = 0;
  direccion = ''; // si querés mostrar el texto de la dir (opcional, lo podés pasar por queryParam)
  q = '';
  page = 1;
  pageSize = 20;
  total = 0;
  rows: AmobServ[] = [];
  loading = false;

  // modal
  formOpen = false;
  editingId: number | null = null;
  form: Partial<AmobServ> = {
    servicio: '',
    cliente_numero: '',
    notas: '',
  };

  constructor(
    private route: ActivatedRoute,
    private svc: AmobServiciosService
  ) {}

  ngOnInit() {
    this.dirId = Number(this.route.snapshot.paramMap.get('dirId') || 0);
    if (!this.dirId) return;
    this.load();
  }

  load() {
    this.loading = true;
    this.svc
      .list({
        dir_id: this.dirId,
        q: this.q,
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
          }
        },
        error: () => {
          this.loading = false;
          this.rows = [];
          this.total = 0;
        },
      });
  }

  apply() {
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
    const tp = Math.max(1, Math.ceil(this.total / this.pageSize));
    if (this.page < tp) {
      this.page++;
      this.load();
    }
  }

  nuevo() {
    this.editingId = null;
    this.formOpen = true;
    this.form = { servicio: '', cliente_numero: '', notas: '' };
  }
  editar(r: AmobServ) {
    this.editingId = r.id;
    this.formOpen = true;
    this.form = {
      servicio: r.servicio,
      cliente_numero: r.cliente_numero || '',
      notas: r.notas || '',
    };
  }
  cancelar() {
    this.formOpen = false;
    this.editingId = null;
  }

  guardar() {
    if (!this.form.servicio || !this.form.servicio.trim()) {
      alert('Servicio es obligatorio');
      return;
    }
    const payload = {
      dir_id: this.dirId,
      servicio: this.form.servicio!.trim(),
      cliente_numero: (this.form.cliente_numero || '').trim(),
      notas: (this.form.notas || '').trim(),
    };

    const req$ = this.editingId
      ? this.svc.update(this.editingId, payload)
      : this.svc.create(payload);

    req$.subscribe({
      next: (res: any) => {
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
  }

  eliminar(r: AmobServ) {
    if (!confirm(`¿Eliminar servicio "${r.servicio}"?`)) return;
    this.svc.remove(r.id).subscribe({
      next: (res) => {
        if (res?.success) this.load();
        else alert('No se pudo eliminar.');
      },
      error: () => alert('Error de servidor al eliminar.'),
    });
  }
}
