import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule  } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrdenServicioService, OrdenServicio } from '../../services/orden-servicio.service';

@Component({
  selector: 'app-orden-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="container mt-4" *ngIf="orden">
      <!-- Header -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>Orden: {{ orden.codigo }}</h2>
          <nav aria-label="breadcrumb">
            <ol class="breadcrumb">
              <li class="breadcrumb-item"><a routerLink="/ordenes">Órdenes</a></li>
              <li class="breadcrumb-item active">{{ orden.codigo }}</li>
            </ol>
          </nav>
        </div>
        <div>
          <span class="badge fs-6" [ngClass]="getEstadoBadgeClass(orden.estado)">
            {{ orden.estado }}
          </span>
        </div>
      </div>

      <div *ngIf="loading" class="text-center">
        <div class="spinner-border" role="status">
          <span class="visually-hidden">Cargando...</span>
        </div>
      </div>

      <div *ngIf="error" class="alert alert-danger">
        {{ error }}
        <button class="btn btn-sm btn-outline-danger ms-3" routerLink="/ordenes">Volver</button>
      </div>

      <div *ngIf="!loading && orden" class="row">
        <!-- Información principal -->
        <div class="col-md-8">
          <div class="card mb-4">
            <div class="card-header">
              <h5 class="mb-0">Información de la Orden</h5>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-6">
                  <p><strong>Código:</strong> {{ orden.codigo }}</p>
                  <p><strong>Vehículo:</strong> {{ orden.placaVehiculo }}</p>
                  <p><strong>Cliente:</strong> {{ orden.clienteNombre || 'No asignado' }}</p>
                </div>
                <div class="col-md-6">
                  <p><strong>Fecha Entrada:</strong> {{ orden.fechaEntrada | date:'medium' }}</p>
                  <p><strong>Fecha Salida:</strong> {{ orden.fechaSalida ? (orden.fechaSalida | date:'medium') : 'Pendiente' }}</p>
                  <p><strong>Observaciones:</strong> {{ orden.observaciones || 'Ninguna' }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Detalles -->
          <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h5 class="mb-0">Detalles</h5>
              <button class="btn btn-sm btn-primary" (click)="mostrarAgregarDetalle = !mostrarAgregarDetalle">
                <i class="fas fa-plus"></i> Agregar Detalle
              </button>
            </div>
            
            <!-- Formulario para agregar detalle -->
            <div class="card-body border-bottom" *ngIf="mostrarAgregarDetalle">
              <h6>Nuevo Detalle</h6>
              <form #detalleForm="ngForm" (ngSubmit)="agregarDetalle()">
                <div class="row g-3">
                  <div class="col-md-4">
                    <label class="form-label">Tipo</label>
                    <select class="form-select" [(ngModel)]="nuevoDetalle.tipo" name="tipo" required>
                      <option value="">Seleccionar</option>
                      <option value="SERVICIO">Servicio</option>
                      <option value="PRODUCTO">Producto</option>
                    </select>
                  </div>
                  <div class="col-md-8">
                    <label class="form-label">Descripción</label>
                    <input type="text" class="form-control" [(ngModel)]="nuevoDetalle.descripcion" name="descripcion" required>
                  </div>
                  <div class="col-md-3">
                    <label class="form-label">Cantidad</label>
                    <input type="number" class="form-control" [(ngModel)]="nuevoDetalle.cantidad" name="cantidad" min="1" required>
                  </div>
                  <div class="col-md-3">
                    <label class="form-label">Precio Unitario</label>
                    <input type="number" class="form-control" [(ngModel)]="nuevoDetalle.precioUnitario" name="precioUnitario" min="0" step="0.01" required>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Observaciones</label>
                    <input type="text" class="form-control" [(ngModel)]="nuevoDetalle.observaciones" name="observaciones">
                  </div>
                  <div class="col-12">
                    <div class="d-flex gap-2">
                      <button type="submit" class="btn btn-success" [disabled]="!detalleForm.valid">
                        <i class="fas fa-check"></i> Agregar
                      </button>
                      <button type="button" class="btn btn-secondary" (click)="mostrarAgregarDetalle = false">
                        <i class="fas fa-times"></i> Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>

            <!-- Lista de detalles -->
            <div class="card-body">
              <div class="table-responsive">
                <table class="table table-hover">
                  <thead>
                    <tr>
                      <th>Tipo</th>
                      <th>Descripción</th>
                      <th class="text-end">Cantidad</th>
                      <th class="text-end">Precio Unitario</th>
                      <th class="text-end">Subtotal</th>
                      <th>Observaciones</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let detalle of orden.detalles">
                      <td>
                        <span class="badge" [ngClass]="detalle.tipo === 'SERVICIO' ? 'bg-info' : 'bg-warning'">
                          {{ detalle.tipo }}
                        </span>
                      </td>
                      <td>{{ detalle.descripcion }}</td>
                      <td class="text-end">{{ detalle.cantidad }}</td>
                      <td class="text-end">{{ detalle.precioUnitario.toFixed(2) }}</td>
                      <td class="text-end"><strong>{{ detalle.subtotal.toFixed(2) }}</strong></td>
                      <td>{{ detalle.observaciones || '-' }}</td>
                      <td>
                        <button class="btn btn-sm btn-outline-danger" (click)="removerDetalle(detalle.id)">
                          <i class="fas fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                    <tr *ngIf="orden.detalles.length === 0">
                      <td colspan="7" class="text-center text-muted py-4">
                        No hay detalles agregados
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- Resumen y acciones -->
        <div class="col-md-4">
          <div class="card mb-4">
            <div class="card-header">
              <h5 class="mb-0">Resumen Financiero</h5>
            </div>
            <div class="card-body">
              <div class="d-flex justify-content-between mb-2">
                <span>Subtotal Servicios:</span>
                <strong>{{ orden.subtotalServicios.toFixed(2) }}</strong>
              </div>
              <div class="d-flex justify-content-between mb-2">
                <span>Subtotal Productos:</span>
                <strong>{{ orden.subtotalProductos.toFixed(2) }}</strong>
              </div>
              <div class="d-flex justify-content-between mb-2">
                <span>Descuento:</span>
                <strong class="text-danger">-{{ orden.descuento.toFixed(2) }}</strong>
              </div>
              <div class="d-flex justify-content-between mb-2">
                <span>Impuesto (12%):</span>
                <strong>{{ orden.impuesto.toFixed(2) }}</strong>
              </div>
              <hr>
              <div class="d-flex justify-content-between fs-5">
                <span>Total:</span>
                <strong class="text-success">{{ orden.total.toFixed(2) }}</strong>
              </div>
            </div>
          </div>

          <!-- Cambiar estado -->
          <div class="card mb-4">
            <div class="card-header">
              <h5 class="mb-0">Cambiar Estado</h5>
            </div>
            <div class="card-body">
              <div class="d-grid gap-2">
                <button *ngFor="let estado of estadosDisponibles" 
                        class="btn btn-outline-primary"
                        (click)="cambiarEstado(estado)">
                  Cambiar a {{ estado }}
                </button>
              </div>
            </div>
          </div>

          <!-- Acciones -->
          <div class="card">
            <div class="card-header">
              <h5 class="mb-0">Acciones</h5>
            </div>
            <div class="card-body">
              <div class="d-grid gap-2">
                <a [routerLink]="['/ordenes/editar', orden.id]" class="btn btn-warning">
                  <i class="fas fa-edit"></i> Editar Orden
                </a>
                <button class="btn btn-danger" 
                        (click)="deleteOrden()"
                        [disabled]="orden.estado !== 'COTIZACION' && orden.estado !== 'CANCELADA'">
                  <i class="fas fa-trash"></i> Eliminar Orden
                </button>
                <button class="btn btn-outline-secondary" routerLink="/ordenes">
                  <i class="fas fa-arrow-left"></i> Volver a la lista
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .badge {
      padding: 0.5em 1em;
      font-size: 0.9em;
    }
    .badge-cotizacion { background-color: #6c757d; color: white; }
    .badge-aprobada { background-color: #0d6efd; color: white; }
    .badge-en_progreso { background-color: #ffc107; color: black; }
    .badge-completada { background-color: #198754; color: white; }
    .badge-facturada { background-color: #6f42c1; color: white; }
    .badge-cancelada { background-color: #dc3545; color: white; }
  `]
})
export class OrdenDetailComponent implements OnInit {
  orden: OrdenServicio | null = null;
  loading = false;
  error: string | null = null;
  
  mostrarAgregarDetalle = false;
  nuevoDetalle = {
    tipo: '',
    descripcion: '',
    cantidad: 1,
    precioUnitario: 0,
    observaciones: ''
  };

  estadosDisponibles = ['APROBADA', 'EN_PROGRESO', 'COMPLETADA', 'FACTURADA', 'CANCELADA'];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private ordenServicioService: OrdenServicioService
  ) { }

  ngOnInit(): void {
    this.loadOrden();
  }

  loadOrden(): void {
    this.loading = true;
    const id = this.route.snapshot.paramMap.get('id');
    
    if (!id) {
      this.error = 'ID de orden no proporcionado';
      this.loading = false;
      return;
    }

    this.ordenServicioService.getById(id).subscribe({
      next: (response) => {
        if (response.success) {
          this.orden = response.data;
        } else {
          this.error = 'Error al cargar la orden';
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar la orden: ' + (err.message || 'Error desconocido');
        this.loading = false;
        console.error('Error:', err);
      }
    });
  }

  getEstadoBadgeClass(estado: string): string {
    switch (estado.toUpperCase()) {
      case 'COTIZACION': return 'badge-cotizacion';
      case 'APROBADA': return 'badge-aprobada';
      case 'EN_PROGRESO': return 'badge-en_progreso';
      case 'COMPLETADA': return 'badge-completada';
      case 'FACTURADA': return 'badge-facturada';
      case 'CANCELADA': return 'badge-cancelada';
      default: return 'badge-secondary';
    }
  }

  agregarDetalle(): void {
    if (!this.orden) return;

    this.ordenServicioService.agregarDetalle(this.orden.id, this.nuevoDetalle).subscribe({
      next: (response) => {
        if (response.success) {
          this.orden = response.data;
          this.mostrarAgregarDetalle = false;
          this.nuevoDetalle = {
            tipo: '',
            descripcion: '',
            cantidad: 1,
            precioUnitario: 0,
            observaciones: ''
          };
          alert('Detalle agregado correctamente');
        } else {
          alert('Error: ' + response.message);
        }
      },
      error: (err) => {
        alert('Error al agregar detalle: ' + err.message);
      }
    });
  }

  removerDetalle(detalleId: string): void {
    if (!this.orden || !confirm('¿Está seguro de eliminar este detalle?')) return;

    this.ordenServicioService.removerDetalle(this.orden.id, detalleId).subscribe({
      next: (response) => {
        if (response.success) {
          this.orden = response.data;
          alert('Detalle eliminado correctamente');
        } else {
          alert('Error: ' + response.message);
        }
      },
      error: (err) => {
        alert('Error al eliminar detalle: ' + err.message);
      }
    });
  }

  cambiarEstado(estado: string): void {
    if (!this.orden || !confirm(`¿Cambiar estado a ${estado}?`)) return;

    this.ordenServicioService.cambiarEstado(this.orden.id, estado).subscribe({
      next: (response) => {
        if (response.success) {
          this.orden = response.data;
          alert(`Estado cambiado a ${estado} correctamente`);
        } else {
          alert('Error: ' + response.message);
        }
      },
      error: (err) => {
        alert('Error al cambiar estado: ' + err.message);
      }
    });
  }

  deleteOrden(): void {
    if (!this.orden || !confirm('¿Está seguro de eliminar esta orden?')) return;

    this.ordenServicioService.delete(this.orden.id).subscribe({
      next: (response) => {
        if (response.success) {
          alert(response.message);
          this.router.navigate(['/ordenes']);
        } else {
          alert('Error: ' + response.message);
        }
      },
      error: (err) => {
        alert('Error al eliminar: ' + err.message);
      }
    });
  }
}