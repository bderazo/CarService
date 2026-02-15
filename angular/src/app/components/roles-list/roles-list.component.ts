import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RoleService, Role, CreateRoleDto, UpdateRoleDto } from '../../services/role.service';

@Component({
  selector: 'app-roles-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container mt-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h2>Roles del Sistema</h2>
        <button class="btn btn-primary" (click)="mostrarFormulario()">
          <i class="fas fa-plus"></i> Nuevo Rol
        </button>
      </div>

      <!-- Formulario para crear/editar rol -->
      <div class="card mb-4" *ngIf="mostrandoFormulario">
        <div class="card-header">
          <h5 class="mb-0">{{ rolEditando ? 'Editar' : 'Nuevo' }} Rol</h5>
        </div>
        <div class="card-body">
          <form #roleForm="ngForm" (ngSubmit)="guardarRol()">
            <div class="row g-3">
              <div class="col-md-8">
                <label class="form-label">Nombre del Rol *</label>
                <input type="text" class="form-control" 
                       [(ngModel)]="nuevoRol.name" 
                       name="name" 
                       required
                       [readonly]="!!rolEditando?.isStatic">
                <small class="text-muted" *ngIf="rolEditando?.isStatic">
                  Este es un rol estático del sistema y no se puede editar
                </small>
              </div>
              
              <div class="col-md-6">
                <div class="form-check">
                  <input class="form-check-input" type="checkbox" 
                         [(ngModel)]="nuevoRol.isDefault" 
                         name="isDefault"
                         [disabled]="!!rolEditando?.isStatic">
                  <label class="form-check-label">
                    Rol por defecto para nuevos usuarios
                  </label>
                </div>
              </div>
              
              <div class="col-md-6">
                <div class="form-check">
                  <input class="form-check-input" type="checkbox" 
                         [(ngModel)]="nuevoRol.isPublic" 
                         name="isPublic"
                         [disabled]="!!rolEditando?.isStatic">
                  <label class="form-check-label">
                    Rol público
                  </label>
                </div>
              </div>

              <div class="col-12">
                <label class="form-label">Descripción (opcional)</label>
                <textarea class="form-control" 
                          [(ngModel)]="descripcion" 
                          name="descripcion" 
                          rows="2"
                          [readonly]="!!rolEditando?.isStatic"></textarea>
              </div>

              <div class="col-12">
                <div class="d-flex gap-2">
                  <button type="submit" class="btn btn-success" 
                          [disabled]="!roleForm.valid || (rolEditando?.isStatic)">
                    <i class="fas fa-save"></i> Guardar
                  </button>
                  <button type="button" class="btn btn-secondary" (click)="cancelarFormulario()">
                    <i class="fas fa-times"></i> Cancelar
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>

      <!-- Tabla de roles -->
      <div *ngIf="loading" class="text-center">
        <div class="spinner-border" role="status">
          <span class="visually-hidden">Cargando...</span>
        </div>
      </div>

      <div *ngIf="error" class="alert alert-danger">
        {{ error }}
      </div>

      <div class="card" *ngIf="!loading">
        <div class="card-body">
          <div class="table-responsive">
            <table class="table table-hover">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Descripción</th>
                  <th>Por Defecto</th>
                  <th>Público</th>
                  <th>Tipo</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let rol of roles">
                  <td>
                    {{ rol.name }}
                    <span *ngIf="rol.isStatic" class="badge bg-info ms-1">Sistema</span>
                  </td>
                  <td>{{ rol.description || '-' }}</td>
                  <td>
                    <span class="badge" [ngClass]="rol.isDefault ? 'bg-success' : 'bg-secondary'">
                      {{ rol.isDefault ? 'Sí' : 'No' }}
                    </span>
                  </td>
                  <td>
                    <span class="badge" [ngClass]="rol.isPublic ? 'bg-primary' : 'bg-secondary'">
                      {{ rol.isPublic ? 'Sí' : 'No' }}
                    </span>
                  </td>
                  <td>
                    <span class="badge" [ngClass]="rol.isStatic ? 'bg-warning' : 'bg-success'">
                      {{ rol.isStatic ? 'Estático' : 'Personalizado' }}
                    </span>
                  </td>
                  <td>
                    <div class="btn-group btn-group-sm">
                      <button class="btn btn-outline-warning" 
                              (click)="editarRol(rol)"
                              [disabled]="rol.isStatic">
                        <i class="fas fa-edit"></i>
                      </button>
                      <button class="btn btn-outline-danger" 
                              (click)="eliminarRol(rol.id)"
                              [disabled]="rol.isStatic">
                        <i class="fas fa-trash"></i>
                      </button>
                      <button class="btn btn-outline-info" (click)="verPermisos(rol)">
                        <i class="fas fa-key"></i>
                      </button>
                    </div>
                  </td>
                </tr>
                <tr *ngIf="roles.length === 0">
                  <td colspan="6" class="text-center text-muted py-4">
                    No hay roles registrados
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Modal para permisos (opcional) -->
      <div class="modal fade" [class.show]="mostrandoPermisos" [style.display]="mostrandoPermisos ? 'block' : 'none'">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Permisos del Rol: {{ rolSeleccionado?.name }}</h5>
              <button type="button" class="btn-close" (click)="cerrarPermisos()"></button>
            </div>
            <div class="modal-body">
              <div *ngIf="cargandoPermisos" class="text-center">
                <div class="spinner-border" role="status">
                  <span class="visually-hidden">Cargando permisos...</span>
                </div>
              </div>
              <div *ngIf="permisos && !cargandoPermisos">
                <!-- Aquí puedes mostrar/editar permisos si tu API lo permite -->
                <p class="text-muted">
                  La gestión de permisos requiere configuración adicional en el backend.
                  Consulta la documentación de ABP Identity para más detalles.
                </p>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="cerrarPermisos()">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
      <div *ngIf="mostrandoPermisos" class="modal-backdrop fade show"></div>
    </div>
  `,
  styles: [`
    .modal { background: rgba(0,0,0,0.5); }
  `]
})
export class RolesListComponent implements OnInit {
  roles: Role[] = [];
  loading = false;
  error: string | null = null;
  
  mostrandoFormulario = false;
  rolEditando: Role | null = null;
  
  // Para el modal de permisos
  mostrandoPermisos = false;
  cargandoPermisos = false;
  rolSeleccionado: Role | null = null;
  permisos: any = null;
  
  descripcion: string = '';
  
  nuevoRol: Partial<CreateRoleDto> = {
    name: '',
    isDefault: false,
    isPublic: false
  };

  constructor(private roleService: RoleService) {}

  ngOnInit(): void {
    this.cargarRoles();
  }

  cargarRoles(): void {
    this.loading = true;
    this.roleService.getAll().subscribe({
      next: (response) => {
        if (response.success) {
          this.roles = response.data;
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar roles: ' + err.message;
        this.loading = false;
      }
    });
  }

  mostrarFormulario(): void {
    this.mostrandoFormulario = true;
    this.rolEditando = null;
    this.resetFormulario();
  }

  editarRol(rol: Role): void {
    if (rol.isStatic) {
      alert('Los roles estáticos del sistema no se pueden editar');
      return;
    }

    this.loading = true;
    this.roleService.getById(rol.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.rolEditando = response.data;
          this.nuevoRol = {
            name: this.rolEditando.name,
            isDefault: this.rolEditando.isDefault,
            isPublic: this.rolEditando.isPublic
          };
          this.descripcion = this.rolEditando.description || '';
          this.mostrandoFormulario = true;
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar datos del rol: ' + err.message;
        this.loading = false;
      }
    });
  }

  cancelarFormulario(): void {
    this.mostrandoFormulario = false;
    this.rolEditando = null;
    this.resetFormulario();
  }

  resetFormulario(): void {
    this.nuevoRol = {
      name: '',
      isDefault: false,
      isPublic: false
    };
    this.descripcion = '';
  }

  guardarRol(): void {
    if (this.rolEditando) {
      // Actualizar rol existente
      if (this.rolEditando.isStatic) {
        alert('No se pueden editar roles estáticos del sistema');
        return;
      }

      const updateDto: UpdateRoleDto = {
        name: this.nuevoRol.name!,
        isDefault: this.nuevoRol.isDefault!,
        isPublic: this.nuevoRol.isPublic!,
        concurrencyStamp: this.rolEditando.concurrencyStamp,
        description: this.descripcion
      };
      
      this.roleService.update(this.rolEditando.id, updateDto).subscribe({
        next: (response) => {
          if (response.success) {
            // Actualizar en la lista
            const index = this.roles.findIndex(r => r.id === this.rolEditando!.id);
            if (index !== -1) {
              this.roles[index] = response.data;
            }
            this.cancelarFormulario();
            alert('Rol actualizado correctamente');
          }
        },
        error: (err) => {
          alert('Error al actualizar rol: ' + err.message);
        }
      });
    } else {
      // Crear nuevo rol
      const createDto: CreateRoleDto = {
        name: this.nuevoRol.name!,
        isDefault: this.nuevoRol.isDefault!,
        isPublic: this.nuevoRol.isPublic!,
        description: this.descripcion
      };
      
      this.roleService.create(createDto).subscribe({
        next: (response) => {
          if (response.success) {
            this.roles.push(response.data);
            this.cancelarFormulario();
            alert('Rol creado correctamente');
          }
        },
        error: (err) => {
          alert('Error al crear rol: ' + err.message);
        }
      });
    }
  }

  eliminarRol(id: string): void {
    const rol = this.roles.find(r => r.id === id);
    if (rol?.isStatic) {
      alert('No se pueden eliminar roles estáticos del sistema');
      return;
    }

    if (confirm('¿Está seguro de eliminar este rol? Los usuarios perderán estos permisos.')) {
      this.roleService.delete(id).subscribe({
        next: (response) => {
          if (response.success) {
            this.roles = this.roles.filter(r => r.id !== id);
            alert('Rol eliminado correctamente');
          }
        },
        error: (err) => {
          alert('Error al eliminar rol: ' + err.message);
        }
      });
    }
  }

  verPermisos(rol: Role): void {
    this.rolSeleccionado = rol;
    this.mostrandoPermisos = true;
    this.cargandoPermisos = true;
    
    // Opcional: Cargar permisos si tu API lo soporta
    this.roleService.getRolePermissions(rol.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.permisos = response.data;
        }
        this.cargandoPermisos = false;
      },
      error: (err) => {
        console.error('Error al cargar permisos:', err);
        this.cargandoPermisos = false;
      }
    });
  }

  cerrarPermisos(): void {
    this.mostrandoPermisos = false;
    this.rolSeleccionado = null;
    this.permisos = null;
  }
}