import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-home-cards',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="container mt-4">
      <h2 class="mb-4 text-center">Sistema de Taller Mecánico</h2>
      <p class="text-muted text-center mb-5">Seleccione un módulo para gestionar</p>
      
      <div class="row g-4">
        <!-- Ordenes -->
        <div class="col-md-4">
          <div class="card border-primary h-100 shadow-sm hover-card">
            <div class="card-body text-center">
              <div class="mb-3">
                <i class="fas fa-clipboard-list fa-3x text-primary"></i>
              </div>
              <h4 class="card-title">Órdenes</h4>
              <p class="card-text text-muted">Gestione órdenes de servicio, cotizaciones y facturación.</p>
              <div class="d-grid gap-2">
                <a routerLink="/ordenes/nueva" class="btn btn-primary">
                  <i class="fas fa-plus"></i> Nueva Orden
                </a>
                <a routerLink="/ordenes" class="btn btn-outline-primary">
                  <i class="fas fa-list"></i> Ver Todas
                </a>
              </div>
            </div>
            <div class="card-footer text-muted">
              {{ getStats('ordenes') }} órdenes activas
            </div>
          </div>
        </div>

        <!-- Clientes -->
        <div class="col-md-4">
          <div class="card border-success h-100 shadow-sm hover-card">
            <div class="card-body text-center">
              <div class="mb-3">
                <i class="fas fa-users fa-3x text-success"></i>
              </div>
              <h4 class="card-title">Clientes</h4>
              <p class="card-text text-muted">Administre la información de clientes y su historial.</p>
              <div class="d-grid gap-2">
                <a routerLink="/clientes" class="btn btn-success" (click)="showCreateForm = true">
                  <i class="fas fa-user-plus"></i> Nuevo Cliente
                </a>
                <a routerLink="/clientes" class="btn btn-outline-success">
                  <i class="fas fa-list"></i> Ver Todos
                </a>
              </div>
            </div>
            <div class="card-footer text-muted">
              {{ getStats('clientes') }} clientes registrados
            </div>
          </div>
        </div>

        <!-- Vehículos -->
        <div class="col-md-4">
          <div class="card border-warning h-100 shadow-sm hover-card">
            <div class="card-body text-center">
              <div class="mb-3">
                <i class="fas fa-car fa-3x text-warning"></i>
              </div>
              <h4 class="card-title">Vehículos</h4>
              <p class="card-text text-muted">Registre y gestione vehículos de los clientes.</p>
              <div class="d-grid gap-2">
                <a routerLink="/vehiculos" class="btn btn-warning">
                  <i class="fas fa-car"></i> Nuevo Vehículo
                </a>
                <a routerLink="/vehiculos" class="btn btn-outline-warning">
                  <i class="fas fa-list"></i> Ver Todos
                </a>
              </div>
            </div>
            <div class="card-footer text-muted">
              {{ getStats('vehiculos') }} vehículos registrados
            </div>
          </div>
        </div>

        <!-- Servicios -->
        <div class="col-md-4">
          <div class="card border-info h-100 shadow-sm hover-card">
            <div class="card-body text-center">
              <div class="mb-3">
                <i class="fas fa-tools fa-3x text-info"></i>
              </div>
              <h4 class="card-title">Servicios</h4>
              <p class="card-text text-muted">Catálogo de servicios ofrecidos por el taller.</p>
              <div class="d-grid gap-2">
                <a routerLink="/servicios" class="btn btn-info">
                  <i class="fas fa-plus"></i> Nuevo Servicio
                </a>
                <a routerLink="/servicios" class="btn btn-outline-info">
                  <i class="fas fa-list"></i> Ver Todos
                </a>
              </div>
            </div>
            <div class="card-footer text-muted">
              {{ getStats('servicios') }} servicios disponibles
            </div>
          </div>
        </div>

        <!-- Productos -->
        <div class="col-md-4">
          <div class="card border-danger h-100 shadow-sm hover-card">
            <div class="card-body text-center">
              <div class="mb-3">
                <i class="fas fa-box fa-3x text-danger"></i>
              </div>
              <h4 class="card-title">Productos</h4>
              <p class="card-text text-muted">Inventario de repuestos y productos para venta.</p>
              <div class="d-grid gap-2">
                <a routerLink="/productos" class="btn btn-danger">
                  <i class="fas fa-plus"></i> Nuevo Producto
                </a>
                <a routerLink="/productos" class="btn btn-outline-danger">
                  <i class="fas fa-list"></i> Ver Inventario
                </a>
              </div>
            </div>
            <div class="card-footer text-muted">
              {{ getStats('productos') }} productos en stock
            </div>
          </div>
        </div>

        <!-- Reportes -->
        <div class="col-md-4">
          <div class="card border-secondary h-100 shadow-sm hover-card">
            <div class="card-body text-center">
              <div class="mb-3">
                <i class="fas fa-chart-bar fa-3x text-secondary"></i>
              </div>
              <h4 class="card-title">Reportes</h4>
              <p class="card-text text-muted">Estadísticas, reportes y análisis del taller.</p>
              <div class="d-grid gap-2">
                <button class="btn btn-secondary" disabled>
                  <i class="fas fa-chart-pie"></i> Ver Reportes
                </button>
                <button class="btn btn-outline-secondary" disabled>
                  <i class="fas fa-download"></i> Exportar Datos
                </button>
              </div>
            </div>
            <div class="card-footer text-muted">
              Próximamente
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .hover-card {
      transition: transform 0.3s, box-shadow 0.3s;
      cursor: pointer;
    }
    .hover-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 20px rgba(0,0,0,0.1) !important;
    }
    .card-footer {
      background-color: rgba(0,0,0,0.02);
      border-top: 1px solid rgba(0,0,0,0.1);
    }
  `]
})
export class HomeCardsComponent {
  showCreateForm = false;
  
  // Estadísticas de ejemplo (luego se pueden conectar a servicios reales)
  getStats(modulo: string): string {
    const stats = {
      'ordenes': '15',
      'clientes': '8',
      'vehiculos': '12',
      'servicios': '10',
      'productos': '25'
    };
    return stats[modulo as keyof typeof stats] || '0';
  }
}