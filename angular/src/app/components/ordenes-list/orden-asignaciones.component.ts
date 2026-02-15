// orden-asignaciones.component.ts (ejemplo básico)
import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrdenServicioService, UsuarioAsignado } from '../../services/orden-servicio.service';
import { UsuariosRolesService } from '../../services/usuarios-roles.service';

@Component({
  selector: 'app-orden-asignaciones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="card">
      <div class="card-header">
        <h5 class="mb-0">Usuarios Asignados</h5>
      </div>
      <div class="card-body">
        <!-- Lista de usuarios asignados -->
        <div *ngIf="usuariosAsignados.length > 0">
          <div *ngFor="let usuario of usuariosAsignados" class="card mb-2">
            <div class="card-body py-2">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <strong>{{ usuario.usuarioNombre || usuario.usuarioUserName }}</strong>
                  <span class="badge ms-2" [ngClass]="getEstadoBadgeClass(usuario.estado)">
                    {{ usuario.estado }}
                  </span>
                  <small class="d-block text-muted">
                    Rol: {{ usuario.rol }} | 
                    Asignado: {{ usuario.fechaAsignacion | date:'short' }}
                  </small>
                  <small *ngIf="usuario.observaciones" class="d-block">
                    Obs: {{ usuario.observaciones }}
                  </small>
                </div>
                <div class="btn-group btn-group-sm">
                  <button class="btn btn-outline-success" 
                          (click)="cambiarEstado(usuario.usuarioId, 'COMPLETADO')"
                          *ngIf="usuario.estado === 'ASIGNADO'">
                    <i class="fas fa-check"></i>
                  </button>
                  <button class="btn btn-outline-danger" 
                          (click)="cambiarEstado(usuario.usuarioId, 'CANCELADO')"
                          *ngIf="usuario.estado === 'ASIGNADO'">
                    <i class="fas fa-times"></i>
                  </button>
                  <button class="btn btn-outline-secondary" 
                          (click)="removerAsignacion(usuario.usuarioId)">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div *ngIf="usuariosAsignados.length === 0" class="text-center text-muted py-3">
          No hay usuarios asignados a esta orden
        </div>

        <!-- Formulario para asignar nuevo usuario -->
        <div class="mt-4">
          <h6>Asignar Nuevo Usuario</h6>
          <form #asignacionForm="ngForm" (ngSubmit)="asignarUsuario()">
            <div class="row g-2">
              <div class="col-md-6">
                <select class="form-select" [(ngModel)]="nuevoUsuarioId" name="usuarioId" required>
                  <option value="">Seleccionar usuario</option>
                  <option *ngFor="let usuario of usuariosDisponibles" [value]="usuario.id">
                    {{ usuario.name }} {{ usuario.surname }} ({{ usuario.userName }}) - 
                    <small>{{ usuario.roles?.join(', ') }}</small>
                  </option>
                </select>
              </div>
              <div class="col-md-4">
                <select class="form-select" [(ngModel)]="nuevoRol" name="rol" required>
                  <option value="">Seleccionar rol</option>
                  <option value="Recepcionista">Recepcionista</option>
                  <option value="Mecanico">Mecanico</option>
                  <option value="lavacoches">lavacoches</option>
                  <option value="Supervisor">Supervisor</option>
                </select>
              </div>
              <div class="col-md-2">
                <button type="submit" class="btn btn-primary w-100" [disabled]="!asignacionForm.valid">
                  <i class="fas fa-user-plus"></i>
                </button>
              </div>
            </div>
            <div class="row mt-2">
              <div class="col-12">
                <input type="text" class="form-control" 
                       [(ngModel)]="nuevoObservaciones" 
                       name="observaciones"
                       placeholder="Observaciones (opcional)">
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  `
})
export class OrdenAsignacionesComponent implements OnInit {
  @Input() ordenId!: string;
  
  usuariosAsignados: UsuarioAsignado[] = [];
  usuariosDisponibles: any[] = [];
  
  nuevoUsuarioId: string = '';
  nuevoRol: string = '';
  nuevoObservaciones: string = '';

  constructor(
    private ordenServicioService: OrdenServicioService,
    private usuariosRolesService: UsuariosRolesService
  ) {}

  ngOnInit(): void {
    this.cargarUsuariosAsignados();
    this.cargarUsuariosDisponibles();
  }

  cargarUsuariosAsignados(): void {
    this.ordenServicioService.getUsuariosAsignados(this.ordenId).subscribe({
      next: (response) => {
        if (response.success) {
          this.usuariosAsignados = response.data;
        }
      }
    });
  }

  cargarUsuariosDisponibles(): void {
    this.usuariosRolesService.getUsuariosAsignables().subscribe({
      next: (response) => {
        if (response.success) {
          this.usuariosDisponibles = response.data;
        }
      }
    });
  }

  getEstadoBadgeClass(estado: string): string {
    switch (estado) {
      case 'ASIGNADO': return 'bg-warning text-dark';
      case 'COMPLETADO': return 'bg-success';
      case 'CANCELADO': return 'bg-danger';
      default: return 'bg-secondary';
    }
  }

  asignarUsuario(): void {
    if (!this.nuevoUsuarioId || !this.nuevoRol) return;

    const asignacion = {
      usuarioId: this.nuevoUsuarioId,
      rol: this.nuevoRol,
      observaciones: this.nuevoObservaciones
    };

    this.ordenServicioService.asignarUsuario(this.ordenId, asignacion).subscribe({
      next: (response) => {
        if (response.success) {
          this.cargarUsuariosAsignados();
          this.nuevoUsuarioId = '';
          this.nuevoRol = '';
          this.nuevoObservaciones = '';
        }
      }
    });
  }

  cambiarEstado(usuarioId: string, nuevoEstado: 'COMPLETADO' | 'CANCELADO'): void {
    const actualizacion = {
      estado: nuevoEstado,
      observaciones: 'Estado actualizado'
    };

    this.ordenServicioService.actualizarAsignacion(this.ordenId, usuarioId, actualizacion).subscribe({
      next: (response) => {
        if (response.success) {
          this.cargarUsuariosAsignados();
        }
      }
    });
  }

  removerAsignacion(usuarioId: string): void {
    if (confirm('¿Remover esta asignación?')) {
      this.ordenServicioService.removerAsignacion(this.ordenId, usuarioId).subscribe({
        next: (response) => {
          if (response.success) {
            this.cargarUsuariosAsignados();
          }
        }
      });
    }
  }
}