import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OrdenServicioService, CreateOrdenServicioDto, CreateDetalleDto } from '../../services/orden-servicio.service';
import { VehiculoService, Vehiculo } from '../../services/vehiculo.service';
import { ServicioService, Servicio } from '../../services/servicio.service';
import { ProductoService, Producto } from '../../services/producto.service';

@Component({
  selector: 'app-orden-nueva',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="container mt-4">
      <!-- Header -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>Nueva Orden de Servicio</h2>
          <nav aria-label="breadcrumb">
            <ol class="breadcrumb">
              <li class="breadcrumb-item"><a routerLink="/ordenes">Órdenes</a></li>
              <li class="breadcrumb-item active">Nueva</li>
            </ol>
          </nav>
        </div>
        <button class="btn btn-outline-secondary" routerLink="/ordenes">
          <i class="fas fa-arrow-left"></i> Volver
        </button>
      </div>

      <!-- Mensajes de error/éxito -->
      <div *ngIf="error" class="alert alert-danger">
        {{ error }}
      </div>

      <div *ngIf="successMessage" class="alert alert-success">
        {{ successMessage }}
      </div>

      <div class="row">
        <!-- Formulario principal -->
        <div class="col-md-8">
          <div class="card mb-4">
            <div class="card-header">
              <h5 class="mb-0">Información de la Orden</h5>
            </div>
            <div class="card-body">
              <form #ordenForm="ngForm">
                <div class="row g-3">
                  <!-- Selección de vehículo -->
                  <div class="col-md-12 mb-3">
                    <label class="form-label">Vehículo *</label>
                    <select class="form-select" 
                            [(ngModel)]="nuevaOrden.vehiculoId" 
                            name="vehiculoId" 
                            required
                            (change)="onVehiculoChange()">
                      <option value="">Seleccionar vehículo...</option>
                      <option *ngFor="let vehiculo of vehiculos" [value]="vehiculo.id">
                        {{ vehiculo.placa }} - {{ vehiculo.marca }} {{ vehiculo.modelo }} 
                        ({{ vehiculo.clienteNombre || 'Sin cliente' }})
                      </option>
                    </select>
                    <small class="text-muted">Si no encuentra el vehículo, <a routerLink="/vehiculos">agréguelo primero</a></small>
                  </div>

                  <!-- Observaciones -->
                  <div class="col-12">
                    <label class="form-label">Observaciones</label>
                    <textarea class="form-control" 
                              [(ngModel)]="nuevaOrden.observaciones" 
                              name="observaciones" 
                              rows="3"
                              placeholder="Describa el problema o servicio requerido..."></textarea>
                  </div>

                  <!-- Estado inicial -->
                  <div class="col-md-6">
                    <label class="form-label">Estado Inicial</label>
                    <select class="form-select" 
                            [(ngModel)]="nuevaOrden.estado" 
                            name="estado">
                      <option value="COTIZACION">Cotización</option>
                      <option value="APROBADA">Aprobada</option>
                      <option value="EN_PROGRESO">En Progreso</option>
                    </select>
                  </div>
                </div>
              </form>
            </div>
          </div>

          <!-- Sección de detalles -->
          <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h5 class="mb-0">Detalles de la Orden</h5>
              <button type="button" class="btn btn-sm btn-outline-primary" (click)="mostrarSelectorDetalle()">
                <i class="fas fa-plus"></i> Agregar Item
              </button>
            </div>

            <!-- Selector de tipo de detalle -->
            <div class="card-body border-bottom" *ngIf="mostrandoSelector">
              <div class="row g-3">
                <div class="col-md-6">
                  <div class="list-group">
                    <button class="list-group-item list-group-item-action" 
                            *ngFor="let servicio of serviciosDisponibles"
                            (click)="agregarServicio(servicio)">
                      <div class="d-flex justify-content-between align-items-center">
                        <div>
                          <strong>{{ servicio.nombre }}</strong>
                          <small class="d-block text-muted">{{ servicio.descripcion | slice:0:50 }}{{ servicio.descripcion?.length > 50 ? '...' : '' }}</small>
                        </div>
                        <span class="badge bg-primary">{{ servicio.precio.toFixed(2) }}</span>
                      </div>
                    </button>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="list-group">
                    <button class="list-group-item list-group-item-action" 
                            *ngFor="let producto of productosDisponibles"
                            (click)="agregarProducto(producto)"
                            [disabled]="producto.stock === 0">
                      <div class="d-flex justify-content-between align-items-center">
                        <div>
                          <strong>{{ producto.nombre }}</strong>
                          <small class="d-block text-muted">Stock: {{ producto.stock }}</small>
                        </div>
                        <div>
                          <span class="badge" [ngClass]="producto.stock === 0 ? 'bg-danger' : 'bg-success'">
                            {{ producto.precioVenta.toFixed(2) }}
                          </span>
                          <span *ngIf="producto.stock === 0" class="badge bg-danger ms-1">Agotado</span>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
                <div class="col-12 mt-3">
                  <button class="btn btn-secondary" (click)="mostrandoSelector = false">
                    <i class="fas fa-times"></i> Cancelar
                  </button>
                </div>
              </div>
            </div>

            <!-- Lista de detalles agregados -->
            <div class="card-body">
              <div *ngIf="detalles.length === 0" class="text-center text-muted py-4">
                <i class="fas fa-clipboard-list fa-3x mb-3"></i>
                <p>No hay detalles agregados. Haga clic en "Agregar Item" para comenzar.</p>
              </div>

              <div class="table-responsive" *ngIf="detalles.length > 0">
                <table class="table table-hover">
                  <thead>
                    <tr>
                      <th>Tipo</th>
                      <th>Descripción</th>
                      <th class="text-end">Cantidad</th>
                      <th class="text-end">Precio Unit.</th>
                      <th class="text-end">Subtotal</th>
                      <th>Observaciones</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let detalle of detalles; let i = index">
                      <td>
                        <span class="badge" [ngClass]="detalle.tipo === 'SERVICIO' ? 'bg-info' : 'bg-warning'">
                          {{ detalle.tipo }}
                        </span>
                      </td>
                      <td>{{ detalle.descripcion }}</td>
                      <td class="text-end">
                        <input type="number" class="form-control form-control-sm" 
                               style="width: 80px;" 
                               [(ngModel)]="detalle.cantidad"
                               min="1"
                               (change)="actualizarSubtotal(i)">
                      </td>
                      <td class="text-end">
                        <input type="number" class="form-control form-control-sm" 
                               style="width: 100px;" 
                               [(ngModel)]="detalle.precioUnitario"
                               min="0" step="0.01"
                               (change)="actualizarSubtotal(i)">
                      </td>
                      <td class="text-end">
                        <strong>{{ detalle.subtotal?.toFixed(2) || '0.00' }}</strong>
                      </td>
                      <td>
                        <input type="text" class="form-control form-control-sm" 
                               [(ngModel)]="detalle.observaciones"
                               placeholder="Observaciones...">
                      </td>
                      <td>
                        <button class="btn btn-sm btn-outline-danger" (click)="eliminarDetalle(i)">
                          <i class="fas fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr class="table-secondary">
                      <td colspan="4" class="text-end"><strong>Totales:</strong></td>
                      <td class="text-end"><strong>{{ calcularTotal().toFixed(2) }}</strong></td>
                      <td colspan="2"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- Panel de resumen y acciones -->
        <div class="col-md-4">
          <!-- Resumen financiero -->
          <div class="card mb-4">
            <div class="card-header">
              <h5 class="mb-0">Resumen</h5>
            </div>
            <div class="card-body">
              <div class="d-flex justify-content-between mb-2">
                <span>Subtotal Servicios:</span>
                <strong>{{ calcularSubtotalServicios().toFixed(2) }}</strong>
              </div>
              <div class="d-flex justify-content-between mb-2">
                <span>Subtotal Productos:</span>
                <strong>{{ calcularSubtotalProductos().toFixed(2) }}</strong>
              </div>
              <div class="d-flex justify-content-between mb-2">
                <span>Total:</span>
                <strong class="text-success fs-5">{{ calcularTotal().toFixed(2) }}</strong>
              </div>
              <hr>
              <div class="text-muted small">
                <p class="mb-1">Items: {{ detalles.length }}</p>
                <p class="mb-0">Servicios: {{ contarServicios() }}</p>
                <p class="mb-0">Productos: {{ contarProductos() }}</p>
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
                <button class="btn btn-success" 
                        (click)="crearOrden()"
                        [disabled]="!ordenForm.valid || detalles.length === 0 || loading">
                  <i class="fas fa-save"></i> 
                  {{ loading ? 'Creando...' : 'Crear Orden' }}
                </button>
                <button class="btn btn-outline-secondary" (click)="limpiarFormulario()">
                  <i class="fas fa-broom"></i> Limpiar
                </button>
                <button class="btn btn-outline-danger" routerLink="/ordenes">
                  <i class="fas fa-times"></i> Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class OrdenNuevaComponent implements OnInit {
  // Datos para formulario
  nuevaOrden: CreateOrdenServicioDto = {
    vehiculoId: '',
    estado: 'COTIZACION',
    observaciones: '',
    detalles: []
  };

  detalles: CreateDetalleDto[] = [];
  
  // Datos de consulta
  vehiculos: Vehiculo[] = [];
  serviciosDisponibles: Servicio[] = [];
  productosDisponibles: Producto[] = [];
  
  // Estados UI
  loading = false;
  error: string | null = null;
  successMessage: string | null = null;
  mostrandoSelector = false;

  constructor(
    private ordenService: OrdenServicioService,
    private vehiculoService: VehiculoService,
    private servicioService: ServicioService,
    private productoService: ProductoService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.loading = true;
    
    // Cargar vehículos
    this.vehiculoService.getAll().subscribe({
      next: (response) => {
        if (response.success) {
          this.vehiculos = response.data;
        }
      }
    });

    // Cargar servicios
    this.servicioService.getAll().subscribe({
      next: (response) => {
        if (response.success) {
          this.serviciosDisponibles = response.data;
        }
      }
    });

    // Cargar productos
    this.productoService.getAll().subscribe({
      next: (response) => {
        if (response.success) {
          this.productosDisponibles = response.data.filter(p => p.stock > 0);
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar datos: ' + err.message;
        this.loading = false;
      }
    });
  }

  onVehiculoChange(): void {
    // Podríamos cargar información adicional del vehículo aquí
    console.log('Vehículo seleccionado:', this.nuevaOrden.vehiculoId);
  }

  mostrarSelectorDetalle(): void {
    this.mostrandoSelector = true;
  }

  agregarServicio(servicio: Servicio): void {
    const nuevoDetalle: CreateDetalleDto = {
        servicioId: servicio.id,
        productoId: undefined,
        tipo: 'SERVICIO',
        descripcion: servicio.nombre,
        cantidad: 1,
        precioUnitario: servicio.precio,
        observaciones: '',
        subtotal: 0
    };
    
    nuevoDetalle.subtotal = nuevoDetalle.cantidad * nuevoDetalle.precioUnitario;
    
    this.detalles.push(nuevoDetalle);
    this.mostrandoSelector = false;
  }

  agregarProducto(producto: Producto): void {
    if (producto.stock === 0) {
      alert('Este producto está agotado');
      return;
    }

    const nuevoDetalle: CreateDetalleDto = {
        servicioId: undefined,
        productoId: producto.id,
        tipo: 'PRODUCTO',
        descripcion: producto.nombre,
        cantidad: 1,
        precioUnitario: producto.precioVenta,
        observaciones: '',
        subtotal: 0
    };
    
    nuevoDetalle.subtotal = nuevoDetalle.cantidad * nuevoDetalle.precioUnitario;
    
    this.detalles.push(nuevoDetalle);
    this.mostrandoSelector = false;
  }

  eliminarDetalle(index: number): void {
    this.detalles.splice(index, 1);
  }

  actualizarSubtotal(index: number): void {
    const detalle = this.detalles[index];
    if (detalle.cantidad > 0 && detalle.precioUnitario >= 0) {
      detalle.subtotal = detalle.cantidad * detalle.precioUnitario;
    } else {
      detalle.subtotal = 0;
    }
  }

  calcularSubtotalServicios(): number {
    return this.detalles
      .filter(d => d.tipo === 'SERVICIO')
      .reduce((sum, d) => sum + (d.subtotal || 0), 0);
  }

  calcularSubtotalProductos(): number {
    return this.detalles
      .filter(d => d.tipo === 'PRODUCTO')
      .reduce((sum, d) => sum + (d.subtotal || 0), 0);
  }

  calcularTotal(): number {
    return this.calcularSubtotalServicios() + this.calcularSubtotalProductos();
  }

  contarServicios(): number {
    return this.detalles.filter(d => d.tipo === 'SERVICIO').length;
  }

  contarProductos(): number {
    return this.detalles.filter(d => d.tipo === 'PRODUCTO').length;
  }

  limpiarFormulario(): void {
    this.nuevaOrden = {
      vehiculoId: '',
      estado: 'COTIZACION',
      observaciones: '',
      detalles: []
    };
    this.detalles = [];
    this.error = null;
    this.successMessage = null;
  }

  crearOrden(): void {
    if (!this.nuevaOrden.vehiculoId) {
      this.error = 'Debe seleccionar un vehículo';
      return;
    }

    if (this.detalles.length === 0) {
      this.error = 'Debe agregar al menos un detalle (servicio o producto)';
      return;
    }

    // Asignar los detalles a la orden
    this.nuevaOrden.detalles = this.detalles;

    this.loading = true;
    this.error = null;
    
    this.ordenService.create(this.nuevaOrden).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success) {
          this.successMessage = `Orden creada exitosamente: ${response.data.codigo}`;
          this.limpiarFormulario();
          
          setTimeout(() => {
            this.router.navigate(['/ordenes', response.data.id]);
          }, 2000);
        } else {
          this.error = 'Error al crear la orden: ' + response.message;
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = 'Error al crear la orden: ' + (err.error?.error || err.message);
      }
    });
  }
}