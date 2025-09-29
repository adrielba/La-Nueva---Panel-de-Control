import { Component, OnInit } from '@angular/core';
import { AuditService } from '../../services/audit.service';
import { UsersService } from '../../services/users.service';

@Component({
  selector: 'app-administracion',
  templateUrl: './administracion.component.html',
  styleUrls: ['./administracion.component.css'],
})
export class AdministracionComponent implements OnInit {
  user = '';
  entity = '';
  action = '';
  from = '';
  to = '';

  page = 1;
  pageSize = 20;

  rows: any[] = [];
  total = 0;
  loading = false;
  errorMsg = '';

  openId: number | null = null;

  u_q = '';
  u_page = 1;
  u_pageSize = 20;
  u_total = 0;
  u_rows: any[] = [];
  u_loading = false;
  u_error = '';

  get u_totalPages(): number {
    const p = Math.ceil(this.u_total / this.u_pageSize);
    return p > 0 ? p : 1;
  }

  // modal crear/editar
  u_editOpen = false;
  u_editId: number | null = null;
  u_form: any = { username: '', name: '', role: 'superadmin', password: '' };

  // modal cambiar pass
  u_passOpen = false;
  u_target: any = null;
  u_newPass = '';

  constructor(private audit: AuditService, private usersSvc: UsersService) {}

  ngOnInit(): void {
    this.load();
    this.u_apply();
  }

  get totalPages(): number {
    const p = Math.ceil(this.total / this.pageSize);
    return p > 0 ? p : 1;
  }

  load(): void {
    this.loading = true;
    this.errorMsg = '';
    this.audit
      .list({
        user: this.user || undefined,
        entity: this.entity || undefined,
        action: this.action || undefined,
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

  apply() {
    this.page = 1;
    this.load();
  }
  clear() {
    this.user = '';
    this.entity = '';
    this.action = '';
    this.from = '';
    this.to = '';
    this.page = 1;
    this.load();
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

  toggle(r: any) {
    this.openId = this.openId === r.id ? null : r.id;
  }

  u_apply() {
    this.u_loading = true;
    this.u_error = '';
    this.usersSvc
      .list({
        q: this.u_q || undefined,
        page: this.u_page,
        pageSize: this.u_pageSize,
      })
      .subscribe({
        next: (res) => {
          this.u_loading = false;
          if (res?.success) {
            this.u_rows = res.rows || [];
            this.u_total = res.total || 0;
          } else {
            this.u_rows = [];
            this.u_total = 0;
            this.u_error = 'No se pudo cargar usuarios.';
          }
        },
        error: () => {
          this.u_loading = false;
          this.u_rows = [];
          this.u_total = 0;
          this.u_error = 'Error de servidor.';
        },
      });
  }
  u_clear() {
    this.u_q = '';
    this.u_page = 1;
    this.u_apply();
  }
  u_prev() {
    if (this.u_page > 1) {
      this.u_page--;
      this.u_apply();
    }
  }
  u_next() {
    if (this.u_page < this.u_totalPages) {
      this.u_page++;
      this.u_apply();
    }
  }

  u_openNew() {
    this.u_editOpen = true;
    this.u_editId = null;
    this.u_form = { username: '', name: '', role: 'superadmin', password: '' };
  }
  u_openEdit(u: any) {
    this.u_editOpen = true;
    this.u_editId = u.id;
    // no se muestra password
    this.u_form = {
      username: u.username,
      name: u.name,
      role: u.role || 'superadmin',
      password: '',
    };
  }
  u_closeEdit() {
    this.u_editOpen = false;
    this.u_editId = null;
    this.u_form = { username: '', name: '', role: 'superadmin', password: '' };
  }

  u_save() {
    if (!this.u_form.username?.trim() || !this.u_form.name?.trim()) {
      alert('Usuario y Nombre son obligatorios.');
      return;
    }
    if (!this.u_editId) {
      // crear (rol forzado a superadmin en backend)
      if (!this.u_form.password?.trim()) {
        alert('Contraseña es obligatoria al crear.');
        return;
      }
      this.usersSvc
        .create({
          username: this.u_form.username.trim(),
          name: this.u_form.name.trim(),
          role: 'superadmin',
          password: this.u_form.password,
        })
        .subscribe({
          next: (res) => {
            if (res?.success) {
              this.u_closeEdit();
              this.u_page = 1;
              this.u_apply();
            } else alert('No se pudo crear.');
          },
          error: () => alert('Error de servidor al crear.'),
        });
    } else {
      // editar (sin password)
      const payload: any = {
        username: this.u_form.username.trim(),
        name: this.u_form.name.trim(),
        role:
          (this.u_form.role || 'superadmin') === 'master'
            ? 'superadmin'
            : this.u_form.role,
      };
      this.usersSvc.update(this.u_editId, payload).subscribe({
        next: (res) => {
          if (res?.success) {
            this.u_closeEdit();
            this.u_apply();
          } else alert('No se pudo guardar.');
        },
        error: () => alert('Error de servidor al guardar.'),
      });
    }
  }

  u_openSetPass(u: any) {
    this.u_target = u;
    this.u_newPass = '';
    this.u_passOpen = true;
  }
  u_closePass() {
    this.u_passOpen = false;
    this.u_target = null;
    this.u_newPass = '';
  }
  u_setPass() {
    if (!this.u_target?.id) return;
    if (!this.u_newPass?.trim()) {
      alert('Ingrese la nueva contraseña.');
      return;
    }
    this.usersSvc.setPassword(this.u_target.id, this.u_newPass).subscribe({
      next: (res) => {
        if (res?.success) {
          alert('Contraseña actualizada.');
          this.u_closePass();
        } else alert('No se pudo actualizar la contraseña.');
      },
      error: () => alert('Error de servidor al cambiar contraseña.'),
    });
  }

  u_delete(u: any) {
    if (!confirm(`¿Eliminar usuario "${u.username}" (#${u.id})?`)) return;
    this.usersSvc.delete(u.id).subscribe({
      next: (res) => {
        if (res?.success) {
          if (this.u_rows.length === 1 && this.u_page > 1) this.u_page--;
          this.u_apply();
        } else alert('No se pudo eliminar.');
      },
      error: () => alert('Error de servidor al eliminar.'),
    });
  }

  // ==== Mapas de traducción (front) ====
  private ACTION_ES: Record<string, string> = {
    login: 'Ingreso',
    logout: 'Salida',
    create: 'Creación',
    update: 'Actualización',
    delete: 'Borrado',
  };

  private ENTITY_ES: Record<string, string> = {
    auth: 'Autenticación',
    firm_ledger: 'Caja',
    amoblados: 'Amoblados',
    amob_movs: 'Mov. Amoblados',
    amob_dirs: 'Direcciones Amoblados',
    users: 'Usuarios',
    movs: 'Movimientos',
    mov_categorias: 'Categorías de mov.',
    // agregá aquí cualquier otra entidad que uses
  };

  private ROLE_ES: Record<string, string> = {
    master: 'Administrador',
    superadmin: 'Supervisor',
  };

  // opcional: rutas “amigables”
  private ROUTE_ES: Record<string, string> = {
    login: 'Ingreso',
    firm_create: 'Caja: crear',
    firm_update: 'Caja: actualizar',
    firm_delete: 'Caja: borrar',
    alquileres_create: 'Alquiler: crear',
    alquileres_delete: 'Alquiler: borrar',
    alquileres_update: 'Alquiler: actualizar',
    mov_delete: 'Movimiento: borrar',
    mov_create: 'Movimiento: crear',
    mov_set_status: 'Movimiento: estado',
    inquilinos_delete: 'Inquilino: borrar',
    inquilinos_create: 'Inquilino: crear',
    inquilinos_update: 'Inquilino: actualizar',
    propietarios_create: 'Propietario: crear',
    propietarios_delete: 'Propietario: borrar',
    propietarios_update: 'Propietario: actualizar',
    // sumá las que quieras mostrar más legible
  };

  // ==== Helpers para usar en la plantilla ====
  tAction(a?: string) {
    return (a && this.ACTION_ES[a]) || a || '—';
  }
  tEntity(e?: string) {
    return (e && this.ENTITY_ES[e]) || e || '—';
  }
  tRole(r?: string) {
    return (r && this.ROLE_ES[r]) || r || '—';
  }
  tRoute(rt?: string) {
    return (rt && this.ROUTE_ES[rt]) || rt || '—';
  }
}
