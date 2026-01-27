import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ClienteService, Cliente } from '../../services/cliente.service';

@Component({
  selector: 'app-clientes-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="container mt-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h2>Clientes</h2>
        <button class="btn btn-primary" (click)="mostrarFormulario()">
          <i class="fas fa-plus"></i> Nuevo Cliente
        </button>
      </div>

      <!-- Formulario para crear/editar -->
      <div class="card mb-4" *ngIf="mostrandoFormulario">
        <div class="card-header">
          <h5 class="mb-0">{{ clienteEditando ? 'Editar' : 'Nuevo' }} Cliente</h5>
        </div>
        <div class="card-body">
          <form #clienteForm="ngForm" (ngSubmit)="guardarCliente()">
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label">Cédula/RUC *</label>
                <input type="text" class="form-control" 
                       [(ngModel)]="nuevoCliente.cedula" 
                       name="cedula" 
                       required
                       [readonly]="clienteEditando">
              </div>
              <div class="col-md-6">
                <label class="form-label">Nombre *</label>
                <input type="text" class="form-control" 
                       [(ngModel)]="nuevoCliente.nombre" 
                       name="nombre" required>
              </div>
              <div class="col-md-6">
                <label class="form-label">Teléfono</label>
                <input type="text" class="form-control" 
                       [(ngModel)]="nuevoCliente.telefono" 
                       name="telefono">
              </div>
              <div class="col-md-6">
                <label class="form-label">Email</label>
                <input type="email" class="form-control" 
                       [(ngModel)]="nuevoCliente.email" 
                       name="email">
              </div>
              <div class="col-12">
                <label class="form-label">Dirección</label>
                <textarea class="form-control" 
                          [(ngModel)]="nuevoCliente.direccion" 
                          name="direccion" 
                          rows="2"></textarea>
              </div>
              <div class="col-12">
                <div class="d-flex gap-2">
                  <button type="submit" class="btn btn-success" [disabled]="!clienteForm.valid">
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

      <!-- Tabla de clientes -->
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
                  <th>Cédula/RUC</th>
                  <th>Nombre</th>
                  <th>Teléfono</th>
                  <th>Email</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let cliente of clientes">
                  <td>{{ cliente.cedula }}</td>
                  <td>{{ cliente.nombre }}</td>
                  <td>{{ cliente.telefono || '-' }}</td>
                  <td>{{ cliente.email || '-' }}</td>
                  <td>
                    <div class="btn-group btn-group-sm">
                      <button class="btn btn-outline-warning" (click)="editarCliente(cliente)">
                        <i class="fas fa-edit"></i>
                      </button>
                      <button class="btn btn-outline-danger" (click)="eliminarCliente(cliente.id)">
                        <i class="fas fa-trash"></i>
                      </button>
                      <button class="btn btn-outline-info" [routerLink]="['/vehiculos']" [queryParams]="{clienteId: cliente.id}">
                        <i class="fas fa-car"></i>
                      </button>
                    </div>
                  </td>
                </tr>
                <tr *ngIf="clientes.length === 0">
                  <td colspan="5" class="text-center text-muted py-4">
                    No hay clientes registrados
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ClientesListComponent implements OnInit {
  clientes: Cliente[] = [];
  loading = false;
  error: string | null = null;
  
  mostrandoFormulario = false;
  clienteEditando: Cliente | null = null;
  
  nuevoCliente = {
    cedula: '',
    nombre: '',
    telefono: '',
    email: '',
    direccion: ''
  };

  constructor(private clienteService: ClienteService) {}

  ngOnInit(): void {
    this.cargarClientes();
  }

  cargarClientes(): void {
    this.loading = true;
    this.clienteService.getAll().subscribe({
      next: (response) => {
        if (response.success) {
          this.clientes = response.data;
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar clientes: ' + err.message;
        this.loading = false;
      }
    });
  }

  mostrarFormulario(): void {
    this.mostrandoFormulario = true;
    this.clienteEditando = null;
    this.resetFormulario();
  }

  editarCliente(cliente: Cliente): void {
    this.clienteEditando = cliente;
    this.nuevoCliente = { ...cliente };
    this.mostrandoFormulario = true;
  }

  cancelarFormulario(): void {
    this.mostrandoFormulario = false;
    this.clienteEditando = null;
    this.resetFormulario();
  }

  resetFormulario(): void {
    this.nuevoCliente = {
      cedula: '',
      nombre: '',
      telefono: '',
      email: '',
      direccion: ''
    };
  }

  guardarCliente(): void {
    if (this.clienteEditando) {
      // Actualizar
      this.clienteService.update(this.clienteEditando.id, this.nuevoCliente).subscribe({
        next: (response) => {
          if (response.success) {
            const index = this.clientes.findIndex(c => c.id === this.clienteEditando!.id);
            if (index !== -1) {
              this.clientes[index] = response.data;
            }
            this.cancelarFormulario();
            alert('Cliente actualizado correctamente');
          }
        },
        error: (err) => {
          alert('Error al actualizar cliente: ' + err.message);
        }
      });
    } else {
      // Crear nuevo
      this.clienteService.create(this.nuevoCliente).subscribe({
        next: (response) => {
          if (response.success) {
            this.clientes.push(response.data);
            this.cancelarFormulario();
            alert('Cliente creado correctamente');
          }
        },
        error: (err) => {
          alert('Error al crear cliente: ' + err.message);
        }
      });
    }
  }

  eliminarCliente(id: string): void {
    if (confirm('¿Está seguro de eliminar este cliente?')) {
      this.clienteService.delete(id).subscribe({
        next: (response) => {
          if (response.success) {
            this.clientes = this.clientes.filter(c => c.id !== id);
            alert('Cliente eliminado correctamente');
          }
        },
        error: (err) => {
          alert('Error al eliminar cliente: ' + err.message);
        }
      });
    }
  }
}