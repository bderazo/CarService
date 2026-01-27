import { Component, OnInit } from '@angular/core';
import { OrdenServicioService, OrdenServicio } from '../../services/orden-servicio.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms'; 

@Component({
  selector: 'app-ordenes-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="container mt-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h2>Órdenes de Servicio</h2>
        <a routerLink="/ordenes/nueva" class="btn btn-primary">
          <i class="fas fa-plus"></i> Nueva Orden
        </a>
      </div>

      <div *ngIf="loading" class="text-center">
        <div class="spinner-border" role="status">
          <span class="visually-hidden">Cargando...</span>
        </div>
      </div>

      <div *ngIf="error" class="alert alert-danger alert-dismissible fade show" role="alert">
        {{ error }}
        <button type="button" class="btn-close" (click)="error = null"></button>
      </div>

      <div *ngIf="!loading && ordenes.length === 0" class="alert alert-info">
        No hay órdenes de servicio registradas.
      </div>

      <div class="table-responsive" *ngIf="!loading && ordenes.length > 0">
        <table class="table table-hover table-striped">
          <thead class="table-dark">
            <tr>
              <th>Código</th>
              <th>Vehículo</th>
              <th>Cliente</th>
              <th>Estado</th>
              <th>Total</th>
              <th>Fecha</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let orden of ordenes">
              <td>
                <strong>{{ orden.codigo }}</strong>
                <small class="d-block text-muted">{{ orden.observaciones | slice:0:50 }}{{ orden.observaciones?.length > 50 ? '...' : '' }}</small>
              </td>
              <td>
                {{ orden.placaVehiculo }}
                <small class="d-block text-muted">{{ orden.vehiculoId | slice:0:8 }}...</small>
              </td>
              <td>{{ orden.clienteNombre || 'No asignado' }}</td>
              <td>
                <span class="badge" [ngClass]="getEstadoBadgeClass(orden.estado)">
                  {{ orden.estado }}
                </span>
              </td>
              <td class="text-end">
                <strong>{{ orden.total.toFixed(2) }}</strong>
                <small class="d-block text-muted">
                  {{ orden.detalles?.length || 0 }} items
                </small>
              </td>
              <td>
                {{ orden.fechaEntrada | date:'shortDate' }}
                <small class="d-block text-muted" *ngIf="orden.fechaSalida">
                  Salida: {{ orden.fechaSalida | date:'shortDate' }}
                </small>
              </td>
              <td>
                <div class="btn-group btn-group-sm">
                  <a [routerLink]="['/ordenes', orden.id]" class="btn btn-outline-primary">
                    <i class="fas fa-eye"></i>
                  </a>
                  <a [routerLink]="['/ordenes/editar', orden.id]" class="btn btn-outline-warning">
                    <i class="fas fa-edit"></i>
                  </a>
                  <button class="btn btn-outline-danger" (click)="deleteOrden(orden.id)" [disabled]="orden.estado !== 'COTIZACION' && orden.estado !== 'CANCELADA'">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
                <small class="d-block text-muted mt-1">
                  {{ orden.creationTime | date:'short' }}
                </small>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Filtros -->
      <div class="card mt-4">
        <div class="card-header">
          <h5 class="mb-0">Filtros</h5>
        </div>
        <div class="card-body">
          <div class="row g-3">
            <div class="col-md-4">
              <label class="form-label">Estado</label>
              <select class="form-select" [(ngModel)]="filtroEstado" (change)="aplicarFiltros()">
                <option value="">Todos</option>
                <option value="COTIZACION">Cotización</option>
                <option value="APROBADA">Aprobada</option>
                <option value="EN_PROGRESO">En Progreso</option>
                <option value="COMPLETADA">Completada</option>
                <option value="FACTURADA">Facturada</option>
                <option value="CANCELADA">Cancelada</option>
              </select>
            </div>
            <div class="col-md-4">
              <label class="form-label">Ordenar por</label>
              <select class="form-select" [(ngModel)]="ordenarPor" (change)="aplicarFiltros()">
                <option value="fecha">Fecha más reciente</option>
                <option value="codigo">Código</option>
                <option value="total">Total (mayor a menor)</option>
              </select>
            </div>
            <div class="col-md-4 d-flex align-items-end">
              <button class="btn btn-outline-secondary w-100" (click)="limpiarFiltros()">
                <i class="fas fa-filter-circle-xmark"></i> Limpiar filtros
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .badge {
      padding: 0.5em 0.8em;
      font-size: 0.85em;
    }
    .badge-cotizacion { background-color: #6c757d; color: white; }
    .badge-aprobada { background-color: #0d6efd; color: white; }
    .badge-en_progreso { background-color: #ffc107; color: black; }
    .badge-completada { background-color: #198754; color: white; }
    .badge-facturada { background-color: #6f42c1; color: white; }
    .badge-cancelada { background-color: #dc3545; color: white; }
    
    .table td {
      vertical-align: middle;
    }
    
    .btn-group-sm > .btn {
      padding: 0.25rem 0.5rem;
    }
  `]
})
export class OrdenesListComponent implements OnInit {
  ordenes: OrdenServicio[] = [];
  ordenesFiltradas: OrdenServicio[] = [];
  loading = false;
  error: string | null = null;
  
  filtroEstado = '';
  ordenarPor = 'fecha';

  constructor(private ordenServicioService: OrdenServicioService) { }

  ngOnInit(): void {
    this.loadOrdenes();
  }

  loadOrdenes(): void {
    this.loading = true;
    this.error = null;
    
    this.ordenServicioService.getAll().subscribe({
      next: (response) => {
        if (response.success) {
          this.ordenes = response.data;
          this.aplicarFiltros();
        } else {
          this.error = 'Error al cargar las órdenes';
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar las órdenes: ' + (err.message || 'Error desconocido');
        this.loading = false;
        console.error('Error:', err);
      }
    });
  }

  aplicarFiltros(): void {
    let resultado = [...this.ordenes];
    
    if (this.filtroEstado) {
      resultado = resultado.filter(o => o.estado === this.filtroEstado);
    }
    
    switch (this.ordenarPor) {
      case 'fecha':
        resultado.sort((a, b) => new Date(b.creationTime).getTime() - new Date(a.creationTime).getTime());
        break;
      case 'codigo':
        resultado.sort((a, b) => a.codigo.localeCompare(b.codigo));
        break;
      case 'total':
        resultado.sort((a, b) => b.total - a.total);
        break;
    }
    
    this.ordenesFiltradas = resultado;
  }

  limpiarFiltros(): void {
    this.filtroEstado = '';
    this.ordenarPor = 'fecha';
    this.ordenesFiltradas = [...this.ordenes];
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

  deleteOrden(id: string): void {
    if (confirm('¿Está seguro de eliminar esta orden?')) {
      this.ordenServicioService.delete(id).subscribe({
        next: (response) => {
          if (response.success) {
            this.ordenes = this.ordenes.filter(o => o.id !== id);
            this.aplicarFiltros();
            alert(response.message);
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
}