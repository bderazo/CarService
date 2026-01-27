import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { VehiculoService, Vehiculo } from '../../services/vehiculo.service';
import { ClienteService, Cliente } from '../../services/cliente.service';

@Component({
  selector: 'app-vehiculos-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="container mt-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h2>Vehículos</h2>
        <button class="btn btn-primary" (click)="mostrarFormulario()">
          <i class="fas fa-plus"></i> Nuevo Vehículo
        </button>
      </div>

      <!-- Formulario -->
      <div class="card mb-4" *ngIf="mostrandoFormulario">
        <div class="card-header">
          <h5 class="mb-0">{{ vehiculoEditando ? 'Editar' : 'Nuevo' }} Vehículo</h5>
        </div>
        <div class="card-body">
          <form #vehiculoForm="ngForm" (ngSubmit)="guardarVehiculo()">
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label">Placa *</label>
                <input type="text" class="form-control" 
                       [(ngModel)]="nuevoVehiculo.placa" 
                       name="placa" required
                       [readonly]="vehiculoEditando">
              </div>
              <div class="col-md-6">
                <label class="form-label">Cliente *</label>
                <select class="form-select" 
                        [(ngModel)]="nuevoVehiculo.clienteId" 
                        name="clienteId" required>
                  <option value="">Seleccionar cliente</option>
                  <option *ngFor="let cliente of clientes" [value]="cliente.id">
                    {{ cliente.nombre }} ({{ cliente.cedula }})
                  </option>
                </select>
              </div>
              <div class="col-md-6">
                <label class="form-label">Marca *</label>
                <input type="text" class="form-control" 
                       [(ngModel)]="nuevoVehiculo.marca" 
                       name="marca" required>
              </div>
              <div class="col-md-6">
                <label class="form-label">Modelo *</label>
                <input type="text" class="form-control" 
                       [(ngModel)]="nuevoVehiculo.modelo" 
                       name="modelo" required>
              </div>
              <div class="col-md-4">
                <label class="form-label">Año</label>
                <input type="number" class="form-control" 
                       [(ngModel)]="nuevoVehiculo.anio" 
                       name="anio" min="1900" max="2030">
              </div>
              <div class="col-md-4">
                <label class="form-label">Color</label>
                <input type="text" class="form-control" 
                       [(ngModel)]="nuevoVehiculo.color" 
                       name="color">
              </div>
              <div class="col-12">
                <div class="d-flex gap-2">
                  <button type="submit" class="btn btn-success" [disabled]="!vehiculoForm.valid">
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

      <!-- Tabla -->
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
                  <th>Placa</th>
                  <th>Marca</th>
                  <th>Modelo</th>
                  <th>Año</th>
                  <th>Color</th>
                  <th>Cliente</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let vehiculo of vehiculos">
                  <td><strong>{{ vehiculo.placa }}</strong></td>
                  <td>{{ vehiculo.marca }}</td>
                  <td>{{ vehiculo.modelo }}</td>
                  <td>{{ vehiculo.anio || '-' }}</td>
                  <td>{{ vehiculo.color || '-' }}</td>
                  <td>{{ vehiculo.clienteNombre || 'Sin cliente' }}</td>
                  <td>
                    <div class="btn-group btn-group-sm">
                      <button class="btn btn-outline-warning" (click)="editarVehiculo(vehiculo)">
                        <i class="fas fa-edit"></i>
                      </button>
                      <button class="btn btn-outline-danger" (click)="eliminarVehiculo(vehiculo.id)">
                        <i class="fas fa-trash"></i>
                      </button>
                      <button class="btn btn-outline-info" [routerLink]="['/ordenes']" [queryParams]="{vehiculoId: vehiculo.id}">
                        <i class="fas fa-clipboard-list"></i>
                      </button>
                    </div>
                  </td>
                </tr>
                <tr *ngIf="vehiculos.length === 0">
                  <td colspan="7" class="text-center text-muted py-4">
                    No hay vehículos registrados
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
export class VehiculosListComponent implements OnInit {
  vehiculos: Vehiculo[] = [];
  clientes: Cliente[] = [];
  loading = false;
  error: string | null = null;
  
  mostrandoFormulario = false;
  vehiculoEditando: Vehiculo | null = null;
  
  nuevoVehiculo = {
    placa: '',
    marca: '',
    modelo: '',
    anio: new Date().getFullYear(),
    color: '',
    clienteId: ''
  };

  constructor(
    private vehiculoService: VehiculoService,
    private clienteService: ClienteService
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.loading = true;
    
    // Cargar vehículos y clientes en paralelo
    this.vehiculoService.getAll().subscribe({
      next: (response) => {
        if (response.success) {
          this.vehiculos = response.data;
        }
      },
      error: (err) => {
        this.error = 'Error al cargar vehículos: ' + err.message;
      }
    });

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
    this.vehiculoEditando = null;
    this.resetFormulario();
  }

  editarVehiculo(vehiculo: Vehiculo): void {
    this.vehiculoEditando = vehiculo;
    this.nuevoVehiculo = { ...vehiculo };
    this.mostrandoFormulario = true;
  }

  cancelarFormulario(): void {
    this.mostrandoFormulario = false;
    this.vehiculoEditando = null;
    this.resetFormulario();
  }

  resetFormulario(): void {
    this.nuevoVehiculo = {
      placa: '',
      marca: '',
      modelo: '',
      anio: new Date().getFullYear(),
      color: '',
      clienteId: ''
    };
  }

  guardarVehiculo(): void {
    if (this.vehiculoEditando) {
      // Actualizar
      this.vehiculoService.update(this.vehiculoEditando.id, this.nuevoVehiculo).subscribe({
        next: (response) => {
          if (response.success) {
            const index = this.vehiculos.findIndex(v => v.id === this.vehiculoEditando!.id);
            if (index !== -1) {
              this.vehiculos[index] = response.data;
            }
            this.cancelarFormulario();
            alert('Vehículo actualizado correctamente');
          }
        },
        error: (err) => {
          alert('Error al actualizar vehículo: ' + err.message);
        }
      });
    } else {
      // Crear nuevo
      this.vehiculoService.create(this.nuevoVehiculo).subscribe({
        next: (response) => {
          if (response.success) {
            this.vehiculos.push(response.data);
            this.cancelarFormulario();
            alert('Vehículo creado correctamente');
          }
        },
        error: (err) => {
          alert('Error al crear vehículo: ' + err.message);
        }
      });
    }
  }

  eliminarVehiculo(id: string): void {
    if (confirm('¿Está seguro de eliminar este vehículo?')) {
      this.vehiculoService.delete(id).subscribe({
        next: (response) => {
          if (response.success) {
            this.vehiculos = this.vehiculos.filter(v => v.id !== id);
            alert('Vehículo eliminado correctamente');
          }
        },
        error: (err) => {
          alert('Error al eliminar vehículo: ' + err.message);
        }
      });
    }
  }
}