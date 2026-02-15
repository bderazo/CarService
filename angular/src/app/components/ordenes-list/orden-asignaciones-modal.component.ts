import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActualizarAsignacionDto, OrdenServicioService } from '../../services/orden-servicio.service';
import { UsuariosRolesService } from '../../services/usuarios-roles.service';

@Component({
  selector: 'app-orden-asignaciones-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal fade" [class.show]="visible" [style.display]="visible ? 'block' : 'none'">
      <div class="modal-dialog modal-xl">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="fas fa-users me-2"></i>
              Gestionar Trabajadores - Orden {{ orden?.codigo }}
            </h5>
            <button type="button" class="btn-close" (click)="cerrar()"></button>
          </div>

          <div class="modal-body">
            <!-- Contenido del modal -->
            <div *ngIf="cargando" class="text-center py-5">
              <div class="spinner-border" role="status">
                <span class="visually-hidden">Cargando...</span>
              </div>
              <p class="mt-2">Cargando asignaciones...</p>
            </div>

            <div *ngIf="!cargando" class="row">
              <!-- Panel izquierdo: Usuarios asignados -->
              <div class="col-md-6">
                <div class="card h-100">
                  <div class="card-header d-flex justify-content-between align-items-center">
                    <h6 class="mb-0">Trabajadores Asignados ({{ usuariosAsignados.length }})</h6>
                    <span class="badge bg-info"> {{ contarCompletados() }} completado(s) </span>
                  </div>
                  <div class="card-body">
                    <div *ngIf="usuariosAsignados.length === 0" class="text-center text-muted py-5">
                      <i class="fas fa-user-slash fa-3x mb-3"></i>
                      <p>No hay trabajadores asignados a esta orden</p>
                      <small>Agrega trabajadores usando el panel de la derecha</small>
                    </div>

                    <div class="list-group">
                      <div
                        *ngFor="let usuario of usuariosAsignados"
                        class="list-group-item list-group-item-action"
                      >
                        <div class="d-flex justify-content-between align-items-center">
                          <div>
                            <div class="d-flex align-items-center mb-1">
                              <div
                                class="avatar-circle-sm me-2"
                                [ngClass]="getRolBadgeClass(usuario.rol)"
                              >
                                {{ getIniciales(usuario.nombre, usuario.apellido) }}
                              </div>
                              <div>
                                <strong>{{ usuario.nombre }} {{ usuario.apellido }}</strong>
                                <div class="small text-muted">
                                  {{ usuario.userName }}
                                </div>
                              </div>
                            </div>

                            <div class="d-flex gap-2 mt-2">
                              <span class="badge" [ngClass]="getRolBadgeClass(usuario.rol)">
                                {{ usuario.rol }}
                              </span>
                              <span class="badge" [ngClass]="getEstadoBadgeClass(usuario.estado)">
                                {{ usuario.estado }}
                              </span>
                              <small class="text-muted ms-2">
                                <i class="fas fa-calendar-alt me-1"></i>
                                {{ usuario.fechaAsignacion | date: 'shortDate' }}
                              </small>
                            </div>

                            <div *ngIf="usuario.observaciones" class="small text-muted mt-2">
                              <i class="fas fa-comment me-1"></i>
                              {{ usuario.observaciones }}
                            </div>
                          </div>

                          <div class="btn-group btn-group-sm">
                            <!-- Cambiar estado -->
                            <button
                              *ngIf="usuario.estado === 'ASIGNADO'"
                              class="btn btn-outline-success"
                              (click)="cambiarEstadoUsuario(usuario, 'COMPLETADO')"
                              title="Marcar como completado"
                            >
                              <i class="fas fa-check"></i>
                            </button>
                            <button
                              *ngIf="usuario.estado === 'ASIGNADO'"
                              class="btn btn-outline-warning"
                              (click)="cambiarEstadoUsuario(usuario, 'CANCELADO')"
                              title="Cancelar asignación"
                            >
                              <i class="fas fa-ban"></i>
                            </button>
                            <!-- Remover -->
                            <button
                              class="btn btn-outline-danger"
                              (click)="removerUsuario(usuario)"
                              title="Remover trabajador"
                            >
                              <i class="fas fa-times"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Panel derecho: Agregar trabajadores -->
              <div class="col-md-6">
                <div class="card h-100">
                  <div class="card-header">
                    <h6 class="mb-0">Agregar Nuevos Trabajadores</h6>
                  </div>
                  <div class="card-body">
                    <!-- Búsqueda de usuarios -->
                    <div class="mb-3">
                      <label class="form-label">Buscar trabajadores</label>
                      <div class="input-group">
                        <span class="input-group-text">
                          <i class="fas fa-search"></i>
                        </span>
                        <input
                          type="text"
                          class="form-control"
                          placeholder="Buscar por nombre, usuario o rol..."
                          [(ngModel)]="terminoBusqueda"
                          (input)="filtrarUsuariosDisponibles()"
                        />
                      </div>
                    </div>

                    <!-- Filtro por rol -->
                    <div class="mb-3">
                      <label class="form-label">Filtrar por rol</label>
                      <div class="btn-group w-100" role="group">
                        <button
                          type="button"
                          class="btn btn-outline-primary btn-sm"
                          [class.active]="filtroRol === ''"
                          (click)="filtroRol = ''; filtrarUsuariosDisponibles()"
                        >
                          Todos
                        </button>
                        <button
                          type="button"
                          class="btn btn-outline-info btn-sm"
                          [class.active]="filtroRol === 'Recepcionista'"
                          (click)="filtroRol = 'Recepcionista'; filtrarUsuariosDisponibles()"
                        >
                          Recepcionistas
                        </button>
                        <button
                          type="button"
                          class="btn btn-outline-success btn-sm"
                          [class.active]="filtroRol === 'Mecanico'"
                          (click)="filtroRol = 'Mecanico'; filtrarUsuariosDisponibles()"
                        >
                          Mecanicos
                        </button>
                        <button
                          type="button"
                          class="btn btn-outline-warning btn-sm"
                          [class.active]="filtroRol === 'lavacoches'"
                          (click)="filtroRol = 'lavacoches'; filtrarUsuariosDisponibles()"
                        >
                          Lavadores
                        </button>
                      </div>
                    </div>

                    <!-- Lista de usuarios disponibles -->
                    <div class="usuarios-disponibles" style="max-height: 300px; overflow-y: auto;">
                      <div
                        *ngIf="usuariosFiltrados.length === 0"
                        class="text-center text-muted py-3"
                      >
                        <i class="fas fa-user-times fa-2x mb-2"></i>
                        <p>No hay trabajadores disponibles</p>
                      </div>

                      <div *ngFor="let usuario of usuariosFiltrados" class="card mb-2">
                        <div class="card-body py-2">
                          <div class="d-flex justify-content-between align-items-center">
                            <div>
                              <div class="d-flex align-items-center">
                                <div
                                  class="avatar-circle-xs me-2"
                                  [ngClass]="getRolBadgeClass(usuario.rol || '')"
                                >
                                  {{ getIniciales(usuario.name, usuario.surname) }}
                                </div>
                                <div>
                                  <strong>{{ usuario.name }} {{ usuario.surname }}</strong>
                                  <div class="small text-muted">
                                    {{ usuario.userName }}
                                    <span class="ms-2">
                                      <i class="fas fa-envelope"></i> {{ usuario.email }}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div *ngIf="usuario.rol" class="mt-1">
                                <span class="badge bg-secondary">{{ usuario.rol }}</span>
                              </div>
                            </div>

                            <div>
                              <button
                                class="btn btn-sm btn-primary"
                                (click)="seleccionarUsuario(usuario)"
                                [disabled]="estaAsignado(usuario.id)"
                              >
                                <i class="fas fa-user-plus"></i>
                                Asignar
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Formulario para asignar usuario seleccionado -->
                    <div *ngIf="usuarioSeleccionado" class="mt-4 pt-3 border-top">
                      <h6>
                        Asignar: {{ usuarioSeleccionado.name }} {{ usuarioSeleccionado.surname }}
                      </h6>
                      <form (ngSubmit)="asignarUsuario()">
                        <div class="mb-3">
                          <label class="form-label">Rol para esta orden</label>
                          <select class="form-select" [(ngModel)]="nuevoRol" name="rol" required>
                            <option value="">Seleccionar rol...</option>
                            <option value="Recepcionista">Recepcionista</option>
                            <option value="Mecanico">Mecanico</option>
                            <option value="lavacoches">lavacoches</option>
                          </select>
                        </div>

                        <div class="mb-3">
                          <label class="form-label">Observaciones (opcional)</label>
                          <textarea
                            class="form-control"
                            [(ngModel)]="nuevasObservaciones"
                            name="observaciones"
                            rows="2"
                            placeholder="Notas sobre la asignación..."
                          ></textarea>
                        </div>

                        <div class="d-grid gap-2">
                          <button type="submit" class="btn btn-success" [disabled]="!nuevoRol">
                            <i class="fas fa-user-check"></i> Confirmar Asignación
                          </button>
                          <button
                            type="button"
                            class="btn btn-outline-secondary"
                            (click)="cancelarSeleccion()"
                          >
                            <i class="fas fa-times"></i> Cancelar
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="cerrar()">
              <i class="fas fa-times"></i> Cerrar
            </button>
            <button type="button" class="btn btn-primary" (click)="guardarCambios()">
              <i class="fas fa-save"></i> Guardar Cambios
            </button>
          </div>
        </div>
      </div>
    </div>
    <div *ngIf="visible" class="modal-backdrop fade show"></div>
  `,
  styles: [
    `
      .avatar-circle-sm {
        width: 35px;
        height: 35px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 14px;
        color: white;
      }

      .avatar-circle-xs {
        width: 30px;
        height: 30px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 12px;
        color: white;
      }

      .badge-rol-recepcionista {
        background-color: #0dcaf0;
        color: black;
      }
      .badge-rol-mecanico {
        background-color: #198754;
        color: white;
      }
      .badge-rol-lavador {
        background-color: #6f42c1;
        color: white;
      }

      .badge-estado-asignado {
        background-color: #0d6efd;
        color: white;
      }
      .badge-estado-completado {
        background-color: #198754;
        color: white;
      }
      .badge-estado-cancelado {
        background-color: #dc3545;
        color: white;
      }

      .list-group-item:hover {
        background-color: #f8f9fa;
      }

      .btn-group .btn.active {
        background-color: #0d6efd;
        color: white;
        border-color: #0d6efd;
      }
    `,
  ],
})
export class OrdenAsignacionesModalComponent implements OnInit {
  @Input() visible = false;
  @Input() orden: any;
  @Output() cerrarModal = new EventEmitter<void>();
  @Output() guardar = new EventEmitter<any>();

  cargando = false;
  usuariosAsignados: any[] = [];
  usuariosDisponibles: any[] = [];
  usuariosFiltrados: any[] = [];

  terminoBusqueda = '';
  filtroRol = '';

  usuarioSeleccionado: any = null;
  nuevoRol = '';
  nuevasObservaciones = '';

  constructor(
    private ordenService: OrdenServicioService,
    private usuariosService: UsuariosRolesService,
  ) {}

  ngOnInit(): void {
    if (this.orden && this.visible) {
      this.cargarDatos();
    }
  }

  ngOnChanges(): void {
    if (this.orden && this.visible) {
      this.cargarDatos();
    }
  }

  cargarDatos(): void {
    if (!this.orden) return;

    this.cargando = true;

    // Cargar usuarios asignados a esta orden
    this.ordenService.getUsuariosAsignados(this.orden.id).subscribe({
      next: response => {
        if (response.success) {
          this.usuariosAsignados = response.data.map((usuario: any) => ({
            id: usuario.usuarioId,
            userName: usuario.usuarioUserName,
            nombre: usuario.usuarioNombre?.split(' ')[0] || 'Usuario',
            apellido: usuario.usuarioNombre?.split(' ').slice(1).join(' ') || '',
            rol: usuario.rol,
            estado: usuario.estado,
            fechaAsignacion: usuario.fechaAsignacion,
            observaciones: usuario.observaciones,
          }));
        }

        // Cargar usuarios disponibles
        this.cargarUsuariosDisponibles();
      },
      error: err => {
        console.error('Error cargando usuarios asignados:', err);
        this.cargarUsuariosDisponibles();
      },
    });
  }

  cargarUsuariosDisponibles(): void {
    this.usuariosService.getUsuariosAsignables().subscribe({
      next: response => {
        this.cargando = false;
        if (response.success) {
          this.usuariosDisponibles = response.data;
          this.filtrarUsuariosDisponibles();
        }
      },
      error: err => {
        this.cargando = false;
        console.error('Error cargando usuarios disponibles:', err);
      },
    });
  }

  filtrarUsuariosDisponibles(): void {
    let filtrados = [...this.usuariosDisponibles];

    // Filtrar por término de búsqueda
    if (this.terminoBusqueda) {
      const term = this.terminoBusqueda.toLowerCase();
      filtrados = filtrados.filter(
        u =>
          u.name?.toLowerCase().includes(term) ||
          u.surname?.toLowerCase().includes(term) ||
          u.userName?.toLowerCase().includes(term) ||
          u.email?.toLowerCase().includes(term),
      );
    }

    // Filtrar por rol
    if (this.filtroRol) {
      filtrados = filtrados.filter(u =>
        u.rol?.toLowerCase().includes(this.filtroRol.toLowerCase()),
      );
    }

    // Filtrar usuarios que ya están asignados
    filtrados = filtrados.filter(u => !this.estaAsignado(u.id));

    this.usuariosFiltrados = filtrados;
  }

  estaAsignado(usuarioId: string): boolean {
    return this.usuariosAsignados.some(u => u.id === usuarioId);
  }

  contarCompletados(): number {
    return this.usuariosAsignados.filter(u => u.estado === 'COMPLETADO').length;
  }

  // Métodos de utilidad para estilos
  getRolBadgeClass(rol: string): string {
    const rolLower = rol.toLowerCase();
    if (rolLower.includes('recepcionista')) return 'badge-rol-recepcionista';
    if (rolLower.includes('mecanico') || rolLower.includes('mecanico')) return 'badge-rol-mecanico';
    if (rolLower.includes('lavacoches')) return 'badge-rol-lavador';
    return 'badge-secondary';
  }

  getEstadoBadgeClass(estado: string): string {
    switch (estado) {
      case 'ASIGNADO':
        return 'badge-estado-asignado';
      case 'COMPLETADO':
        return 'badge-estado-completado';
      case 'CANCELADO':
        return 'badge-estado-cancelado';
      default:
        return 'badge-secondary';
    }
  }

  getIniciales(nombre: string, apellido: string): string {
    return ((nombre?.charAt(0) || '') + (apellido?.charAt(0) || '')).toUpperCase();
  }

  // Métodos de interacción
  cerrar(): void {
    this.cerrarModal.emit();
  }

  guardarCambios(): void {
    this.guardar.emit({
      ordenId: this.orden.id,
      usuariosAsignados: this.usuariosAsignados,
    });
  }

  seleccionarUsuario(usuario: any): void {
    this.usuarioSeleccionado = usuario;
    this.nuevoRol = '';
    this.nuevasObservaciones = '';
  }

  cancelarSeleccion(): void {
    this.usuarioSeleccionado = null;
    this.nuevoRol = '';
    this.nuevasObservaciones = '';
  }

  asignarUsuario(): void {
    if (!this.usuarioSeleccionado || !this.nuevoRol || !this.orden) return;

    const asignacionDto = {
      usuarioId: this.usuarioSeleccionado.id,
      rol: this.nuevoRol,
      observaciones: this.nuevasObservaciones || `Asignado el ${new Date().toLocaleDateString()}`,
    };

    this.ordenService.asignarUsuario(this.orden.id, asignacionDto).subscribe({
      next: response => {
        if (response.success) {
          // Agregar al array local
          this.usuariosAsignados.push({
            id: this.usuarioSeleccionado.id,
            userName: this.usuarioSeleccionado.userName,
            nombre: this.usuarioSeleccionado.name || '',
            apellido: this.usuarioSeleccionado.surname || '',
            rol: this.nuevoRol,
            estado: 'ASIGNADO',
            fechaAsignacion: new Date().toISOString(),
            observaciones: this.nuevasObservaciones,
          });

          // Limpiar formulario
          this.cancelarSeleccion();

          // Actualizar lista de disponibles
          this.filtrarUsuariosDisponibles();

          alert('Trabajador asignado correctamente');
        } else {
          alert('Error: ' + response.message);
        }
      },
      error: err => {
        alert('Error al asignar usuario: ' + (err.error?.message || err.message));
      },
    });
  }

  cambiarEstadoUsuario(usuario: any, nuevoEstado: 'ASIGNADO' | 'COMPLETADO' | 'CANCELADO'): void {
    const confirmacion = confirm(`¿Cambiar estado a ${nuevoEstado}?`);
    if (!confirmacion) return;

    const actualizacion: ActualizarAsignacionDto = {
      estado: nuevoEstado, // <-- Aquí ya es del tipo correcto
      observaciones: `Estado cambiado a ${nuevoEstado}`,
    };

    this.ordenService.actualizarAsignacion(this.orden.id, usuario.id, actualizacion).subscribe({
      next: response => {
        if (response.success) {
          // Actualizar estado localmente
          usuario.estado = nuevoEstado;
          alert(`Estado actualizado a ${nuevoEstado}`);
        } else {
          alert('Error: ' + response.message);
        }
      },
      error: err => {
        alert('Error al actualizar estado: ' + (err.error?.message || err.message));
      },
    });
  }

  removerUsuario(usuario: any): void {
    if (!confirm('¿Remover este trabajador de la orden?')) return;

    this.ordenService.removerAsignacion(this.orden.id, usuario.id).subscribe({
      next: response => {
        if (response.success) {
          // Remover localmente
          this.usuariosAsignados = this.usuariosAsignados.filter(u => u.id !== usuario.id);

          // Actualizar lista de disponibles
          this.filtrarUsuariosDisponibles();

          alert('Trabajador removido de la orden');
        } else {
          alert('Error: ' + response.message);
        }
      },
      error: err => {
        alert('Error al remover usuario: ' + (err.error?.message || err.message));
      },
    });
  }
}
