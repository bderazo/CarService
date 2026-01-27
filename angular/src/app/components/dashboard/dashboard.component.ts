import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { OrdenServicioService } from '../../services/orden-servicio.service';
import { ClienteService } from '../../services/cliente.service';
import { VehiculoService } from '../../services/vehiculo.service';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, RouterModule],
    template: `
    <div class="container mt-4">
      <h2>Dashboard - Taller Mecánico</h2>
      <p class="text-muted">Resumen general del sistema</p>

      <div *ngIf="loading" class="text-center">
        <div class="spinner-border" role="status">
          <span class="visually-hidden">Cargando...</span>
        </div>
      </div>

      <div class="row mt-4" *ngIf="!loading">
        <!-- Estadísticas -->
        <div class="col-md-3 mb-4">
          <div class="card text-white bg-primary">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <h6 class="card-title">Total Órdenes</h6>
                  <h2 class="mb-0">{{ estadisticas.totalOrdenes }}</h2>
                </div>
                <i class="fas fa-clipboard-list fa-2x"></i>
              </div>
            </div>
          </div>
        </div>

        <div class="col-md-3 mb-4">
          <div class="card text-white bg-success">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <h6 class="card-title">Total Clientes</h6>
                  <h2 class="mb-0">{{ estadisticas.totalClientes }}</h2>
                </div>
                <i class="fas fa-users fa-2x"></i>
              </div>
            </div>
          </div>
        </div>

        <div class="col-md-3 mb-4">
          <div class="card text-white bg-warning">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <h6 class="card-title">Total Vehículos</h6>
                  <h2 class="mb-0">{{ estadisticas.totalVehiculos }}</h2>
                </div>
                <i class="fas fa-car fa-2x"></i>
              </div>
            </div>
          </div>
        </div>

        <div class="col-md-3 mb-4">
          <div class="card text-white bg-info">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <h6 class="card-title">Ingresos Hoy</h6>
                  <h2 class="mb-0">{{ estadisticas.ingresosHoy.toFixed(2) }}</h2>
                </div>
                <i class="fas fa-dollar-sign fa-2x"></i>
              </div>
            </div>
          </div>
        </div>

        <!-- Órdenes por estado -->
        <div class="col-md-6 mb-4">
          <div class="card">
            <div class="card-header">
              <h5 class="mb-0">Órdenes por Estado</h5>
            </div>
            <div class="card-body">
              <div *ngIf="estadisticas.ordenesPorEstado.length === 0" class="text-muted">
                No hay datos
              </div>
              <div *ngFor="let item of estadisticas.ordenesPorEstado" class="mb-2">
                <div class="d-flex justify-content-between">
                  <span>{{ item.estado }}</span>
                  <span class="badge bg-secondary">{{ item.cantidad }}</span>
                </div>
                <div class="progress" style="height: 10px;">
                  <div class="progress-bar" [ngClass]="getProgressBarClass(item.estado)" 
                       [style.width]="getPorcentaje(item.cantidad) + '%'"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="col-md-6 mb-4">
            <div class="card h-100">
                <div class="card-header">
                <h5 class="mb-0">Acciones Rápidas</h5>
                </div>
                <div class="card-body">
                <div class="row g-2">
                    <!-- Fila 1 -->
                    <div class="col-6">
                    <button class="btn btn-primary w-100 h-100 py-3" routerLink="/ordenes/nueva">
                        <i class="fas fa-plus-circle fa-2x mb-2"></i><br>
                        Nueva Orden
                    </button>
                    </div>
                    <div class="col-6">
                    <button class="btn btn-success w-100 h-100 py-3" routerLink="/clientes">
                        <i class="fas fa-user-plus fa-2x mb-2"></i><br>
                        Nuevo Cliente
                    </button>
                    </div>
                    <!-- Fila 2 -->
                    <div class="col-6">
                    <button class="btn btn-warning w-100 h-100 py-3" routerLink="/servicios">
                        <i class="fas fa-tools fa-2x mb-2"></i><br>
                        Servicios
                    </button>
                    </div>
                    <div class="col-6">
                    <button class="btn btn-info w-100 h-100 py-3" routerLink="/productos">
                        <i class="fas fa-box fa-2x mb-2"></i><br>
                        Productos
                    </button>
                    </div>
                    <!-- Fila 3 -->
                    <div class="col-12 mt-2">
                    <div class="btn-group w-100">
                        <button class="btn btn-outline-secondary" routerLink="/ordenes">
                        <i class="fas fa-clipboard-list"></i> Ver Órdenes
                        </button>
                        <button class="btn btn-outline-secondary" routerLink="/vehiculos">
                        <i class="fas fa-car"></i> Ver Vehículos
                        </button>
                    </div>
                    </div>
                </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .progress-bar-cotizacion { background-color: #6c757d; }
    .progress-bar-aprobada { background-color: #0d6efd; }
    .progress-bar-en_progreso { background-color: #ffc107; }
    .progress-bar-completada { background-color: #198754; }
    .progress-bar-facturada { background-color: #6f42c1; }
  `]
})
export class DashboardComponent implements OnInit {
    loading = true;
    estadisticas = {
        totalOrdenes: 0,
        totalClientes: 0,
        totalVehiculos: 0,
        ingresosHoy: 0,
        ordenesPorEstado: [] as { estado: string, cantidad: number }[]
    };

    constructor(
        private ordenService: OrdenServicioService,
        private clienteService: ClienteService,
        private vehiculoService: VehiculoService
    ) { }

    ngOnInit(): void {
        this.cargarEstadisticas();
    }

    cargarEstadisticas(): void {
        this.loading = true;

        // Cargar todos los datos en paralelo
        this.ordenService.getAll().subscribe({
            next: (ordenesRes) => {
                if (ordenesRes.success) {
                    const ordenes = ordenesRes.data;
                    this.estadisticas.totalOrdenes = ordenes.length;

                    // Calcular ingresos de hoy
                    const hoy = new Date().toISOString().split('T')[0];
                    this.estadisticas.ingresosHoy = ordenes
                        .filter(o => o.fechaEntrada.split('T')[0] === hoy)
                        .reduce((sum, o) => sum + o.total, 0);

                    // Agrupar por estado
                    const estados = ['COTIZACION', 'APROBADA', 'EN_PROGRESO', 'COMPLETADA', 'FACTURADA', 'CANCELADA'];
                    this.estadisticas.ordenesPorEstado = estados.map(estado => ({
                        estado,
                        cantidad: ordenes.filter(o => o.estado === estado).length
                    }));
                }
            }
        });

        this.clienteService.getAll().subscribe({
            next: (clientesRes) => {
                if (clientesRes.success) {
                    this.estadisticas.totalClientes = clientesRes.data.length;
                }
            }
        });

        this.vehiculoService.getAll().subscribe({
            next: (vehiculosRes) => {
                if (vehiculosRes.success) {
                    this.estadisticas.totalVehiculos = vehiculosRes.data.length;
                    this.loading = false;
                }
            },
            error: () => this.loading = false
        });
    }

    getProgressBarClass(estado: string): string {
        switch (estado.toUpperCase()) {
            case 'COTIZACION': return 'progress-bar-cotizacion';
            case 'APROBADA': return 'progress-bar-aprobada';
            case 'EN_PROGRESO': return 'progress-bar-en_progreso';
            case 'COMPLETADA': return 'progress-bar-completada';
            case 'FACTURADA': return 'progress-bar-facturada';
            default: return 'bg-secondary';
        }
    }

    getPorcentaje(cantidad: number): number {
        if (this.estadisticas.totalOrdenes === 0) return 0;
        return (cantidad / this.estadisticas.totalOrdenes) * 100;
    }
}