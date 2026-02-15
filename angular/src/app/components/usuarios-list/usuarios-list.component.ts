import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UserService, User, Role, CreateUserDto, UpdateUserDto } from '../../services/user.service';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="container mt-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h2>Usuarios</h2>
        <button class="btn btn-primary" (click)="mostrarFormulario()">
          <i class="fas fa-plus"></i> Nuevo Usuario
        </button>
      </div>

      <!-- Formulario para crear/editar usuario -->
      <div class="card mb-4" *ngIf="mostrandoFormulario">
        <div class="card-header">
          <h5 class="mb-0">{{ usuarioEditando ? 'Editar' : 'Nuevo' }} Usuario</h5>
        </div>
        <div class="card-body">
          <form #userForm="ngForm" (ngSubmit)="guardarUsuario()">
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label">Nombre de usuario *</label>
                <input
                  type="text"
                  class="form-control"
                  [(ngModel)]="nuevoUsuario.userName"
                  name="userName"
                  required
                  [readonly]="!!usuarioEditando"
                />
                <small class="text-muted" *ngIf="usuarioEditando"
                  >No se puede cambiar después de creado</small
                >
              </div>

              <div class="col-md-6">
                <label class="form-label">Correo electrónico *</label>
                <input
                  type="email"
                  class="form-control"
                  [(ngModel)]="nuevoUsuario.email"
                  name="email"
                  required
                />
              </div>

              <div class="col-md-6" *ngIf="!usuarioEditando">
                <label class="form-label">Contraseña *</label>
                <input
                  type="password"
                  class="form-control"
                  [(ngModel)]="password"
                  name="password"
                  [required]="!usuarioEditando"
                  minlength="6"
                />
                <small class="text-muted">Mínimo 6 caracteres</small>
              </div>

              <div class="col-md-6" *ngIf="!usuarioEditando">
                <label class="form-label">Confirmar contraseña *</label>
                <input
                  type="password"
                  class="form-control"
                  [(ngModel)]="confirmPassword"
                  name="confirmPassword"
                  [required]="!usuarioEditando"
                />
              </div>

              <div class="col-md-6">
                <label class="form-label">Nombre</label>
                <input
                  type="text"
                  class="form-control"
                  [(ngModel)]="nuevoUsuario.name"
                  name="name"
                />
              </div>

              <div class="col-md-6">
                <label class="form-label">Apellido</label>
                <input
                  type="text"
                  class="form-control"
                  [(ngModel)]="nuevoUsuario.surname"
                  name="surname"
                />
              </div>

              <div class="col-md-6">
                <label class="form-label">Teléfono</label>
                <input
                  type="text"
                  class="form-control"
                  [(ngModel)]="nuevoUsuario.phoneNumber"
                  name="phoneNumber"
                />
              </div>

              <div class="col-md-6">
                <div class="form-check mt-4">
                  <input
                    class="form-check-input"
                    type="checkbox"
                    [(ngModel)]="nuevoUsuario.isActive"
                    name="isActive"
                  />
                  <label class="form-check-label">Usuario activo</label>
                </div>
              </div>

              <!-- Roles asignables -->
              <div class="col-12" *ngIf="rolesDisponibles.length > 0">
                <label class="form-label">Roles</label>
                <div class="row">
                  <div class="col-md-4" *ngFor="let rol of rolesDisponibles">
                    <div class="form-check">
                      <input
                        class="form-check-input"
                        type="checkbox"
                        [id]="'rol_' + rol.name"
                        [checked]="rolesSeleccionados.includes(rol.name)"
                        (change)="toggleRol(rol.name)"
                      />
                      <label class="form-check-label" [for]="'rol_' + rol.name">
                        {{ rol.name }}
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div class="col-12">
                <div class="d-flex gap-2">
                  <button
                    type="submit"
                    class="btn btn-success"
                    [disabled]="!userForm.valid || (!usuarioEditando && !passwordsMatch())"
                  >
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

      <!-- Tabla de usuarios -->
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
                  <th>Usuario</th>
                  <th>Email</th>
                  <th>Nombre</th>
                  <th>Teléfono</th>
                  <th>Estado</th>
                  <th>Roles</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let usuario of usuarios">
                  <td>{{ usuario.userName }}</td>
                  <td>{{ usuario.email }}</td>
                  <td>{{ (usuario.name || '') + ' ' + (usuario.surname || '') }}</td>
                  <td>{{ usuario.phoneNumber || '-' }}</td>
                  <td>
                    <span class="badge" [ngClass]="usuario.isActive ? 'bg-success' : 'bg-danger'">
                      {{ usuario.isActive ? 'Activo' : 'Inactivo' }}
                    </span>
                  </td>
                  <td>
                    <span *ngIf="usuario.roles && usuario.roles.length > 0">
                      {{ usuario.roles.join(', ') }}
                    </span>
                    <span *ngIf="!usuario.roles || usuario.roles.length === 0" class="text-muted">
                      Sin roles
                    </span>
                  </td>
                  <td>
                    <div class="btn-group btn-group-sm">
                      <button class="btn btn-outline-warning" (click)="editarUsuario(usuario)">
                        <i class="fas fa-edit"></i>
                      </button>
                      <button class="btn btn-outline-danger" (click)="eliminarUsuario(usuario.id!)">
                        <i class="fas fa-trash"></i>
                      </button>
                      <button class="btn btn-outline-info" (click)="cambiarEstadoUsuario(usuario)">
                        <i
                          class="fas"
                          [ngClass]="usuario.isActive ? 'fa-user-slash' : 'fa-user-check'"
                        ></i>
                      </button>
                    </div>
                  </td>
                </tr>
                <tr *ngIf="usuarios.length === 0">
                  <td colspan="7" class="text-center text-muted py-4">
                    No hay usuarios registrados
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class UsersListComponent implements OnInit {
  usuarios: User[] = [];
  loading = false;
  error: string | null = null;

  mostrandoFormulario = false;
  usuarioEditando: User | null = null;
  password: string = '';
  confirmPassword: string = '';

  rolesDisponibles: Role[] = [];
  rolesSeleccionados: string[] = [];

  // Usamos Partial<User> para que id sea opcional al crear
  nuevoUsuario: Partial<User> & { userName: string; email: string } = {
    userName: '',
    email: '',
    name: '',
    surname: '',
    phoneNumber: '',
    isActive: true,
    lockoutEnabled: true,
    twoFactorEnabled: false,
  };

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.cargarUsuarios();
    this.cargarRolesDisponibles();
  }

  cargarUsuarios(): void {
    this.loading = true;
    this.userService.getAll().subscribe({
      next: response => {
        if (response.success) {
          this.usuarios = response.data;
        }
        this.loading = false;
      },
      error: err => {
        this.error = 'Error al cargar usuarios: ' + err.message;
        this.loading = false;
      },
    });
  }

  cargarRolesDisponibles(): void {
    // Opción 1: Usar el servicio de usuarios (si ya tienes el endpoint)
    this.userService.getAssignableRoles().subscribe({
      next: response => {
        if (response.success) {
          this.rolesDisponibles = response.data;
        }
      },
      error: err => {
        console.error('Error al cargar roles:', err);
      },
    });

    // Opción 2: Usar el nuevo servicio de roles
    // this.roleService.getAll().subscribe({
    //   next: (response) => {
    //     if (response.success) {
    //       this.rolesDisponibles = response.data;
    //     }
    //   },
    //   error: (err) => {
    //     console.error('Error al cargar roles:', err);
    //   }
    // });
  }

  mostrarFormulario(): void {
    this.mostrandoFormulario = true;
    this.usuarioEditando = null;
    this.resetFormulario();
  }

  editarUsuario(usuario: User): void {
    this.loading = true;
    this.userService.getById(usuario.id).subscribe({
      next: response => {
        if (response.success) {
          this.usuarioEditando = response.data;
          this.nuevoUsuario = { ...this.usuarioEditando };

          // Cargar roles del usuario
          this.userService.getUserRoles(usuario.id).subscribe({
            next: rolesResponse => {
              if (rolesResponse.success) {
                this.rolesSeleccionados = rolesResponse.data;
              }
              this.mostrandoFormulario = true;
              this.loading = false;
            },
            error: err => {
              this.error = 'Error al cargar roles del usuario: ' + err.message;
              this.loading = false;
            },
          });
        }
      },
      error: err => {
        this.error = 'Error al cargar datos del usuario: ' + err.message;
        this.loading = false;
      },
    });
  }

  cancelarFormulario(): void {
    this.mostrandoFormulario = false;
    this.usuarioEditando = null;
    this.resetFormulario();
  }

  resetFormulario(): void {
    this.nuevoUsuario = {
      userName: '',
      email: '',
      name: '',
      surname: '',
      phoneNumber: '',
      isActive: true,
      lockoutEnabled: true,
      twoFactorEnabled: false,
    };
    this.password = '';
    this.confirmPassword = '';
    this.rolesSeleccionados = [];
  }

  passwordsMatch(): boolean {
    return this.password === this.confirmPassword;
  }

  toggleRol(rolName: string): void {
    const index = this.rolesSeleccionados.indexOf(rolName);
    if (index === -1) {
      this.rolesSeleccionados.push(rolName);
    } else {
      this.rolesSeleccionados.splice(index, 1);
    }
  }

  guardarUsuario(): void {
    if (this.usuarioEditando) {
      // Actualizar usuario existente
      const updateDto: UpdateUserDto = {
        email: this.nuevoUsuario.email!,
        name: this.nuevoUsuario.name!,
        surname: this.nuevoUsuario.surname!,
        phoneNumber: this.nuevoUsuario.phoneNumber!,
        isActive: this.nuevoUsuario.isActive!,
        lockoutEnabled: this.nuevoUsuario.lockoutEnabled!,
        twoFactorEnabled: this.nuevoUsuario.twoFactorEnabled!,
        concurrencyStamp: this.usuarioEditando.concurrencyStamp,
      };

      this.userService.update(this.usuarioEditando.id, updateDto).subscribe({
        next: response => {
          if (response.success) {
            // Actualizar roles
            this.userService
              .updateUserRoles(this.usuarioEditando!.id, this.rolesSeleccionados)
              .subscribe({
                next: rolesResponse => {
                  if (rolesResponse.success) {
                    // Actualizar en la lista
                    const index = this.usuarios.findIndex(u => u.id === this.usuarioEditando!.id);
                    if (index !== -1) {
                      const updatedUser = response.data;
                      updatedUser.roles = this.rolesSeleccionados;
                      this.usuarios[index] = updatedUser;
                    }
                    this.cancelarFormulario();
                    alert('Usuario actualizado correctamente');
                  }
                },
                error: err => {
                  alert('Error al actualizar roles: ' + err.message);
                },
              });
          }
        },
        error: err => {
          alert('Error al actualizar usuario: ' + err.message);
        },
      });
    } else {
      // Crear nuevo usuario
      const createDto: CreateUserDto = {
        userName: this.nuevoUsuario.userName!,
        email: this.nuevoUsuario.email!,
        name: this.nuevoUsuario.name!,
        surname: this.nuevoUsuario.surname!,
        phoneNumber: this.nuevoUsuario.phoneNumber!,
        password: this.password,
        isActive: this.nuevoUsuario.isActive!,
        lockoutEnabled: this.nuevoUsuario.lockoutEnabled!,
        twoFactorEnabled: this.nuevoUsuario.twoFactorEnabled!,
      };

      this.userService.create(createDto).subscribe({
        next: response => {
          if (response.success) {
            const nuevoUsuario = response.data;

            // Asignar roles al nuevo usuario
            if (this.rolesSeleccionados.length > 0) {
              this.userService.updateUserRoles(nuevoUsuario.id, this.rolesSeleccionados).subscribe({
                next: rolesResponse => {
                  if (rolesResponse.success) {
                    nuevoUsuario.roles = this.rolesSeleccionados;
                    this.usuarios.push(nuevoUsuario);
                    this.cancelarFormulario();
                    alert('Usuario creado correctamente');
                  }
                },
                error: err => {
                  alert('Error al asignar roles: ' + err.message);
                },
              });
            } else {
              this.usuarios.push(nuevoUsuario);
              this.cancelarFormulario();
              alert('Usuario creado correctamente');
            }
          }
        },
        error: err => {
          alert('Error al crear usuario: ' + err.message);
        },
      });
    }
  }

  eliminarUsuario(id: string): void {
    if (confirm('¿Está seguro de eliminar este usuario?')) {
      this.userService.delete(id).subscribe({
        next: response => {
          if (response.success) {
            this.usuarios = this.usuarios.filter(u => u.id !== id);
            alert('Usuario eliminado correctamente');
          }
        },
        error: err => {
          alert('Error al eliminar usuario: ' + err.message);
        },
      });
    }
  }

  cambiarEstadoUsuario(usuario: User): void {
    const nuevoEstado = !usuario.isActive;
    const updateDto: UpdateUserDto = {
      email: usuario.email,
      name: usuario.name,
      surname: usuario.surname,
      phoneNumber: usuario.phoneNumber,
      isActive: nuevoEstado,
      lockoutEnabled: usuario.lockoutEnabled,
      twoFactorEnabled: usuario.twoFactorEnabled,
      concurrencyStamp: usuario.concurrencyStamp,
    };

    this.userService.update(usuario.id, updateDto).subscribe({
      next: response => {
        if (response.success) {
          const index = this.usuarios.findIndex(u => u.id === usuario.id);
          if (index !== -1) {
            this.usuarios[index].isActive = nuevoEstado;
          }
          alert(`Usuario ${nuevoEstado ? 'activado' : 'desactivado'} correctamente`);
        }
      },
      error: err => {
        alert('Error al cambiar estado del usuario: ' + err.message);
      },
    });
  }
}
