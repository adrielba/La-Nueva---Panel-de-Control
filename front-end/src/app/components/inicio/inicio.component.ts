import { Component, OnInit } from '@angular/core';
import { RemindersService } from '../../services/reminders.service';

@Component({
  selector: 'app-inicio',
  templateUrl: './inicio.component.html',
  styleUrls: ['./inicio.component.css'],
})
export class InicioComponent implements OnInit {
  horizonDays = 31;

  remindersOpen = false;
  reminders: any[] = [];
  stats: { total: number; pending: number } | null = null;

  loading = false;

  expanded = new Set<number | string>();

  remLoading = false;
  remSuccess = false;

  constructor(private remSvc: RemindersService) {}

  ngOnInit(): void {}

  private rowKey(r: any): number | string {
    // Usa r.id si existe. Si no, armá una key estable:
    return (
      r.id ??
      `${r.kind || ''}-${r.alquiler_id || ''}-${r.due_date || ''}-${
        r.direccion || ''
      }`
    );
  }

  isExpanded(r: any): boolean {
    return this.expanded.has(this.rowKey(r));
  }

  toggleExpand(r: any): void {
    const key = this.rowKey(r);
    if (this.expanded.has(key)) this.expanded.delete(key);
    else this.expanded.add(key);
  }

  copyMsg(text: string) {
    if (!text) return;
    navigator.clipboard?.writeText(text).then(
      () => alert('Mensaje copiado'),
      () => alert('No se pudo copiar')
    );
  }

  openReminders() {
    this.remindersOpen = true;
    this.reloadReminders();
  }
  closeReminders() {
    this.remindersOpen = false;
    this.reminders = [];
    this.stats = null;
  }

  reloadReminders() {
    this.loading = true;
    this.remSvc.list(this.horizonDays).subscribe({
      next: (res) => {
        this.reminders = res?.rows || [];
        this.loading = false;
      },
      error: () => {
        this.reminders = [];
        this.loading = false;
      },
    });
    this.remSvc.stats().subscribe({
      next: (s) => (this.stats = s || null),
      error: () => (this.stats = null),
    });
  }

  generateReminders() {
    this.remLoading = true;
    this.remSuccess = false;

    // tu llamada al servicio:
    this.remSvc.generate().subscribe({
      next: (res) => {
        this.remLoading = false;
        if (res?.success) {
          this.remSuccess = true;
          // ocultar después de 3s
          setTimeout(() => (this.remSuccess = false), 3000);
        }
      },
      error: () => {
        this.remLoading = false;
        alert('No se pudo generar recordatorios');
      },
    });
  }

  markDone(r: any) {
    if (!confirm(`¿Marcar recordatorio #${r.id} como hecho?`)) return;
    this.remSvc.markDone(r.id).subscribe({
      next: (res) => {
        if (res?.success) {
          r.status = 'done';
          this.reloadReminders();
        } else {
          alert('No se pudo actualizar el recordatorio.');
        }
      },
      error: () => alert('Error de servidor al actualizar.'),
    });
  }

  dismiss(r: any) {
    if (!confirm(`¿Descartar recordatorio #${r.id}?`)) return;
    this.remSvc.dismiss(r.id).subscribe({
      next: () => this.reloadReminders(),
      error: () => alert('No se pudo descartar.'),
    });
  }

  snooze(r: any, days = 3) {
    this.remSvc.snooze(r.id, days).subscribe({
      next: () => this.reloadReminders(),
      error: () => alert('No se pudo posponer.'),
    });
  }
}
