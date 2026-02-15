import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  OrdenServicioService,
  CreateOrdenServicioDto,
  CreateDetalleDto,
} from '../../services/orden-servicio.service';
import { VehiculoService, Vehiculo } from '../../services/vehiculo.service';
import { ServicioService, Servicio } from '../../services/servicio.service';
import { ProductoService, Producto } from '../../services/producto.service';
import { UsuariosRolesService } from '../../services/usuarios-roles.service';
import { HttpErrorResponse } from '@angular/common/http';

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
                    <select
                      class="form-select"
                      [(ngModel)]="nuevaOrden.vehiculoId"
                      name="vehiculoId"
                      required
                      (change)="onVehiculoChange()"
                    >
                      <option value="">Seleccionar vehículo...</option>
                      <option *ngFor="let vehiculo of vehiculos" [value]="vehiculo.id">
                        {{ vehiculo.placa }} - {{ vehiculo.marca }} {{ vehiculo.modelo }} ({{
                          vehiculo.clienteNombre || 'Sin cliente'
                        }})
                      </option>
                    </select>
                    <small class="text-muted"
                      >Si no encuentra el vehículo,
                      <a routerLink="/vehiculos">agréguelo primero</a></small
                    >
                  </div>

                  <!-- Observaciones -->
                  <div class="col-12">
                    <label class="form-label">Observaciones</label>
                    <textarea
                      class="form-control"
                      [(ngModel)]="nuevaOrden.observaciones"
                      name="observaciones"
                      rows="3"
                      placeholder="Describa el problema o servicio requerido..."
                    ></textarea>
                  </div>

                  <!-- Estado inicial -->
                  <div class="col-md-6">
                    <label class="form-label">Estado Inicial</label>
                    <select class="form-select" [(ngModel)]="nuevaOrden.estado" name="estado">
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
          <div class="card mb-4">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h5 class="mb-0">Detalles de la Orden (Servicios y Productos)</h5>
              <button
                type="button"
                class="btn btn-sm btn-outline-primary"
                (click)="mostrarSelectorDetalle()"
              >
                <i class="fas fa-plus"></i> Agregar Item
              </button>
            </div>

            <!-- Selector de tipo de detalle -->
            <div class="card-body border-bottom" *ngIf="mostrandoSelector">
              <div class="row g-3">
                <div class="col-md-6">
                  <h6 class="text-center mb-3">Servicios</h6>
                  <div class="list-group" style="max-height: 300px; overflow-y: auto;">
                    <button
                      class="list-group-item list-group-item-action"
                      *ngFor="let servicio of serviciosDisponibles"
                      (click)="agregarServicio(servicio)"
                    >
                      <div class="d-flex justify-content-between align-items-center">
                        <div>
                          <strong>{{ servicio.nombre }}</strong>
                          <small class="d-block text-muted"
                            >{{ servicio.descripcion | slice: 0 : 50
                            }}{{ servicio.descripcion?.length > 50 ? '...' : '' }}</small
                          >
                          <small class="d-block mt-1">
                            <span [class]="getClaseDuracion(servicio.duracionEstimada || 0)">
                              <i
                                class="fas {{
                                  getIconoDuracion(servicio.duracionEstimada || 0)
                                }} me-1"
                              ></i>
                              {{ formatearDuracion(servicio.duracionEstimada || 0) }}
                            </span>
                          </small>
                        </div>
                        <span class="badge bg-primary">{{ servicio.precio.toFixed(2) }}</span>
                      </div>
                    </button>
                  </div>
                </div>
                <div class="col-md-6">
                  <h6 class="text-center mb-3">Productos</h6>
                  <div class="list-group" style="max-height: 300px; overflow-y: auto;">
                    <button
                      class="list-group-item list-group-item-action"
                      *ngFor="let producto of productosDisponibles"
                      (click)="agregarProducto(producto)"
                      [disabled]="producto.stock === 0"
                    >
                      <div class="d-flex justify-content-between align-items-center">
                        <div>
                          <strong>{{ producto.nombre }}</strong>
                          <small class="d-block text-muted">Stock: {{ producto.stock }}</small>
                        </div>
                        <div>
                          <span
                            class="badge"
                            [ngClass]="producto.stock === 0 ? 'bg-danger' : 'bg-success'"
                          >
                            {{ producto.precioVenta.toFixed(2) }}
                          </span>
                          <span *ngIf="producto.stock === 0" class="badge bg-danger ms-1"
                            >Agotado</span
                          >
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
                      <th class="text-center">Duración</th>
                      <th class="text-end">Subtotal</th>
                      <th>Observaciones</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let detalle of detalles; let i = index">
                      <td>
                        <span
                          class="badge"
                          [ngClass]="detalle.tipo === 'SERVICIO' ? 'bg-info' : 'bg-warning'"
                        >
                          {{ detalle.tipo }}
                        </span>
                      </td>
                      <td>{{ detalle.descripcion }}</td>
                      <td class="text-end">
                        <input
                          type="number"
                          class="form-control form-control-sm"
                          style="width: 80px;"
                          [(ngModel)]="detalle.cantidad"
                          min="1"
                          (change)="actualizarSubtotal(i)"
                        />
                      </td>

                      <td class="text-end">
                        <input
                          type="number"
                          class="form-control form-control-sm"
                          style="width: 100px;"
                          [(ngModel)]="detalle.precioUnitario"
                          min="0"
                          step="0.01"
                          (change)="actualizarSubtotal(i)"
                        />
                      </td>
                      <td class="text-center align-middle">
                        <span
                          *ngIf="detalle.tipo === 'SERVICIO'"
                          [class]="
                            getClaseDuracion(obtenerDuracionServicio(detalle.servicioId || null))
                          "
                        >
                          <i
                            class="fas {{
                              getIconoDuracion(obtenerDuracionServicio(detalle.servicioId || null))
                            }} me-1"
                          ></i>
                          {{
                            formatearDuracion(obtenerDuracionServicio(detalle.servicioId || null))
                          }}
                        </span>
                        <span *ngIf="detalle.tipo === 'PRODUCTO'" class="text-muted">
                          <i class="fas fa-minus"></i>
                        </span>
                      </td>
                      <td class="text-end">
                        <strong>{{ detalle.subtotal?.toFixed(2) || '0.00' }}</strong>
                      </td>
                      <td>
                        <input
                          type="text"
                          class="form-control form-control-sm"
                          [(ngModel)]="detalle.observaciones"
                          placeholder="Observaciones..."
                        />
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
                      <td class="text-end">
                        <strong>{{ calcularTotal().toFixed(2) }}</strong>
                      </td>
                      <td colspan="2"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

          <!-- Sección de asignación de trabajadores -->
          <div class="card">
            <div class="card-header">
              <h5 class="mb-0">Asignación de Trabajadores</h5>
            </div>
            <div class="card-body">
              <div class="row g-3">
                <!-- Recepcionistas -->
                <div class="col-md-12 mb-4">
                  <h6>Recepcionistas</h6>
                  <div class="row row-cols-1 row-cols-md-2 g-3">
                    <div class="col" *ngFor="let usuario of recepcionistas">
                      <div
                        class="card h-100"
                        [class.border-primary]="usuarioSeleccionado(usuario.id)"
                      >
                        <div class="card-body">
                          <div class="form-check">
                            <input
                              class="form-check-input"
                              type="checkbox"
                              [id]="'recepcionista-' + usuario.id"
                              [checked]="usuarioSeleccionado(usuario.id)"
                              (change)="toggleUsuarioAsignado(usuario.id, 'Recepcionista')"
                            />
                            <label
                              class="form-check-label w-100"
                              [for]="'recepcionista-' + usuario.id"
                            >
                              <strong>{{ usuario.name }} {{ usuario.surname }}</strong>
                              <small class="d-block text-muted">{{ usuario.userName }}</small>
                              <small class="d-block">
                                <i class="fas fa-phone"></i>
                                {{ usuario.phoneNumber || 'Sin teléfono' }}
                              </small>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div *ngIf="recepcionistas.length === 0" class="text-center text-muted py-3">
                    No hay recepcionistas disponibles
                  </div>
                </div>

                <!-- Mecanicos -->
                <div class="col-md-12 mb-4">
                  <h6>Mecanicos</h6>
                  <div class="row row-cols-1 row-cols-md-3 g-3">
                    <div class="col" *ngFor="let usuario of mecanicos">
                      <div
                        class="card h-100"
                        [class.border-success]="usuarioSeleccionado(usuario.id)"
                      >
                        <div class="card-body">
                          <div class="form-check">
                            <input
                              class="form-check-input"
                              type="checkbox"
                              [id]="'mecanico-' + usuario.id"
                              [checked]="usuarioSeleccionado(usuario.id)"
                              (change)="toggleUsuarioAsignado(usuario.id, 'Mecanico')"
                            />
                            <label class="form-check-label w-100" [for]="'mecanico-' + usuario.id">
                              <strong>{{ usuario.name }} {{ usuario.surname }}</strong>
                              <small class="d-block text-muted">{{ usuario.userName }}</small>
                              <small class="d-block">
                                <i class="fas fa-phone"></i>
                                {{ usuario.phoneNumber || 'Sin teléfono' }}
                              </small>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div *ngIf="mecanicos.length === 0" class="text-center text-muted py-3">
                    No hay mecanicos disponibles
                  </div>
                </div>

                <!-- Lavadores -->
                <div class="col-md-12">
                  <h6>Lavadores</h6>
                  <div class="row row-cols-1 row-cols-md-3 g-3">
                    <div class="col" *ngFor="let usuario of lavadores">
                      <div
                        class="card h-100"
                        [class.border-warning]="usuarioSeleccionado(usuario.id)"
                      >
                        <div class="card-body">
                          <div class="form-check">
                            <input
                              class="form-check-input"
                              type="checkbox"
                              [id]="'lavacoches-' + usuario.id"
                              [checked]="usuarioSeleccionado(usuario.id)"
                              (change)="toggleUsuarioAsignado(usuario.id, 'lavacoches')"
                            />
                            <label
                              class="form-check-label w-100"
                              [for]="'lavacoches-' + usuario.id"
                            >
                              <strong>{{ usuario.name }} {{ usuario.surname }}</strong>
                              <small class="d-block text-muted">{{ usuario.userName }}</small>
                              <small class="d-block">
                                <i class="fas fa-phone"></i>
                                {{ usuario.phoneNumber || 'Sin teléfono' }}
                              </small>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div *ngIf="lavadores.length === 0" class="text-center text-muted py-3">
                    No hay lavadores disponibles
                  </div>
                </div>
              </div>

              <!-- Usuarios asignados -->
              <div class="mt-4 pt-4 border-top">
                <h6>Usuarios Asignados a esta Orden</h6>
                <div *ngIf="usuariosAsignados.length > 0" class="mt-3">
                  <div class="row row-cols-1 row-cols-md-2 g-3">
                    <div class="col" *ngFor="let usuario of usuariosAsignados">
                      <div class="card">
                        <div class="card-body py-2">
                          <div class="d-flex align-items-center justify-content-between">
                            <div>
                              <span class="badge me-2" [ngClass]="getRolBadgeClass(usuario.rol)">
                                {{ usuario.rol }}
                              </span>
                              <strong>{{ usuario.nombre }} {{ usuario.apellido }}</strong>
                              <small class="d-block text-muted">{{ usuario.userName }}</small>
                            </div>
                            <button
                              type="button"
                              class="btn btn-sm btn-outline-danger"
                              (click)="removerUsuarioAsignado(usuario.id)"
                            >
                              <i class="fas fa-times"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div *ngIf="usuariosAsignados.length === 0" class="text-center text-muted py-3">
                  <i class="fas fa-users-slash fa-2x mb-2"></i>
                  <p>No hay usuarios asignados a esta orden</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Panel de resumen y acciones -->
        <div class="col-md-4">
          <!-- Resumen financiero -->
          <div class="card mb-4">
            <div class="card-header">
              <h5 class="mb-0">Resumen de Orden</h5>
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
              <hr />
              <div class="d-flex justify-content-between mb-2">
                <span>Total:</span>
                <strong class="text-success fs-5">{{ calcularTotal().toFixed(2) }}</strong>
              </div>
              <hr />
              <div class="d-flex justify-content-between align-items-center">
                <span>
                  <i class="fas fa-hourglass-half me-1"></i>
                  <strong>Tiempo estimado:</strong>
                </span>
                <div class="text-end">
                  <span
                    [class]="getClaseDuracion(calcularDuracionTotal())"
                    style="font-size: 1.1rem; padding: 0.5rem 1rem;"
                  >
                    <i class="fas {{ getIconoDuracion(calcularDuracionTotal()) }} me-1"></i>
                    {{ formatearDuracion(calcularDuracionTotal()) }}
                  </span>
                </div>
              </div>
              <!-- BARRA DE PROGRESO VISUAL (OPCIONAL) -->
              <div class="mt-3" *ngIf="calcularDuracionTotal() > 0">
                <small class="text-muted">Tiempo total de taller</small>
                <div class="progress mt-1" style="height: 8px;">
                  <div
                    class="progress-bar bg-info"
                    role="progressbar"
                    [style.width]="(calcularDuracionTotal() / 240) * 100 + '%'"
                    [attr.aria-valuenow]="calcularDuracionTotal()"
                    aria-valuemin="0"
                    aria-valuemax="240"
                  ></div>
                </div>
                <small class="text-muted">Máx: 4 horas (240 min)</small>
              </div>

              <hr />
              <div class="text-muted small">
                <p class="mb-1"><strong>Items:</strong> {{ detalles.length }}</p>
                <p class="mb-0"><strong>Servicios:</strong> {{ contarServicios() }}</p>
                <p class="mb-0"><strong>Productos:</strong> {{ contarProductos() }}</p>
              </div>
            </div>
          </div>

          <!-- Resumen de asignaciones -->
          <div class="card mb-4">
            <div class="card-header">
              <h5 class="mb-0">Resumen de Asignaciones</h5>
            </div>
            <div class="card-body">
              <div class="mb-3">
                <h6 class="text-primary">
                  <i class="fas fa-user-tie"></i> Recepcionistas
                  <span class="badge bg-primary float-end">{{
                    contarPorRol('Recepcionista')
                  }}</span>
                </h6>
                <div *ngIf="contarPorRol('Recepcionista') > 0" class="small">
                  <div *ngFor="let usuario of usuariosPorRol('Recepcionista')" class="mb-1">
                    • {{ usuario.nombre }}
                  </div>
                </div>
                <div *ngIf="contarPorRol('Recepcionista') === 0" class="text-muted small">
                  Sin recepcionistas asignados
                </div>
              </div>

              <div class="mb-3">
                <h6 class="text-success">
                  <i class="fas fa-tools"></i> Mecanicos
                  <span class="badge bg-success float-end">{{ contarPorRol('Mecanico') }}</span>
                </h6>
                <div *ngIf="contarPorRol('Mecanico') > 0" class="small">
                  <div *ngFor="let usuario of usuariosPorRol('Mecanico')" class="mb-1">
                    • {{ usuario.nombre }}
                  </div>
                </div>
                <div *ngIf="contarPorRol('Mecanico') === 0" class="text-muted small">
                  Sin mecanicos asignados
                </div>
              </div>

              <div class="mb-3">
                <h6 class="text-warning">
                  <i class="fas fa-car-wash"></i> Lavadores
                  <span class="badge bg-warning text-dark float-end">{{
                    contarPorRol('lavacoches')
                  }}</span>
                </h6>
                <div *ngIf="contarPorRol('lavacoches') > 0" class="small">
                  <div *ngFor="let usuario of usuariosPorRol('lavacoches')" class="mb-1">
                    • {{ usuario.nombre }}
                  </div>
                </div>
                <div *ngIf="contarPorRol('lavacoches') === 0" class="text-muted small">
                  Sin lavadores asignados
                </div>
              </div>

              <div class="text-center">
                <small class="text-muted">
                  Total trabajadores: {{ usuariosAsignados.length }}
                </small>
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
                <button
                  class="btn btn-success"
                  (click)="crearOrden()"
                  [disabled]="!ordenForm.valid || detalles.length === 0 || loading"
                >
                  <i class="fas fa-save"></i>
                  {{ loading ? 'Creando...' : 'Crear Orden' }}
                </button>

                <div class="btn-group">
                  <button
                    class="btn btn-outline-warning"
                    (click)="limpiarAsignaciones()"
                    [disabled]="usuariosAsignados.length === 0"
                  >
                    <i class="fas fa-user-times"></i> Limpiar trabajadores
                  </button>
                  <button
                    class="btn btn-outline-danger"
                    (click)="limpiarDetalles()"
                    [disabled]="detalles.length === 0"
                  >
                    <i class="fas fa-trash"></i> Limpiar detalles
                  </button>
                </div>

                <button class="btn btn-outline-secondary" (click)="limpiarFormulario()">
                  <i class="fas fa-broom"></i> Limpiar todo
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
  `,
  styles: [
    `
      .badge-rol-recepcionista {
        background-color: #0dcaf0;
        color: black;
      }
      .badge-rol-mecanico {
        background-color: #198754;
        color: white;
      }
      .badge-rol-lavador {
        background-color: #fd7e14;
        color: white;
      }

      .form-check-input:checked {
        background-color: #198754;
        border-color: #198754;
      }

      .card.border-primary {
        border-width: 2px !important;
      }

      .card.border-success {
        border-width: 2px !important;
      }

      .card.border-warning {
        border-width: 2px !important;
      }

      .list-group-item {
        cursor: pointer;
      }

      .list-group-item:hover {
        background-color: #f8f9fa;
      }
    `,
  ],
})
export class OrdenNuevaComponent implements OnInit {
  // Datos para formulario
  nuevaOrden: CreateOrdenServicioDto = {
    vehiculoId: '',
    estado: 'COTIZACION',
    observaciones: '',
    detalles: [],
  };

  detalles: CreateDetalleDto[] = [];

  // Datos de consulta
  vehiculos: Vehiculo[] = [];
  serviciosDisponibles: Servicio[] = [];
  productosDisponibles: Producto[] = [];

  // Usuarios por rol
  recepcionistas: any[] = [];
  mecanicos: any[] = [];
  lavadores: any[] = [];

  // Usuarios asignados a la orden
  usuariosAsignados: Array<{
    id: string;
    userName: string;
    nombre: string;
    apellido: string;
    rol: string;
  }> = [];

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
    private usuariosRolesService: UsuariosRolesService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.loading = true;
    let cargasCompletadas = 0;
    const totalCargas = 4;

    const verificarCargaCompleta = () => {
      cargasCompletadas++;
      if (cargasCompletadas === totalCargas) {
        this.loading = false;
      }
    };

    // Cargar vehículos
    this.vehiculoService.getAll().subscribe({
      next: response => {
        if (response.success) this.vehiculos = response.data;
        verificarCargaCompleta();
      },
      error: () => verificarCargaCompleta(),
    });

    // Cargar servicios
    this.servicioService.getAll().subscribe({
      next: response => {
        if (response.success) this.serviciosDisponibles = response.data;
        verificarCargaCompleta();
      },
      error: () => verificarCargaCompleta(),
    });

    // Cargar productos
    this.productoService.getAll().subscribe({
      next: response => {
        if (response.success) this.productosDisponibles = response.data;
        verificarCargaCompleta();
      },
      error: () => verificarCargaCompleta(),
    });

    // Cargar usuarios
    this.usuariosRolesService.getUsuariosDisponibles().subscribe({
      next: response => {
        console.log('1️⃣ RESPUESTA RECIBIDA:', response);

        if (response.totalCount > 0) {
          const usuarios = response.items || response.data;
          console.log('2️⃣ USUARIOS ENCONTRADOS:', usuarios?.length || 0);

          if (!usuarios || usuarios.length === 0) {
            console.log('3️⃣ NO HAY USUARIOS');
            verificarCargaCompleta();
            return;
          }

          console.log('4️⃣ CREANDO PROMESAS PARA', usuarios.length, 'USUARIOS');

          const promises = usuarios.map(usuario => {
            console.log('5️⃣ PROMESA PARA USUARIO:', usuario.id, usuario.email);

            return new Promise<any>(resolve => {
              this.usuariosRolesService.getUsuarioById(usuario.id).subscribe({
                next: userResponse => {
                  console.log('6️⃣ USUARIO CARGADO:', usuario.id, userResponse.data?.email);
                  resolve(userResponse.data || usuario);
                },
                error: err => {
                  console.log('7️⃣ ERROR AL CARGAR USUARIO:', usuario.id, err);
                  resolve(usuario); // Resolvemos con el usuario original
                },
              });
            });
          });

          console.log('8️⃣ ESPERANDO PROMESAS...');

          Promise.all(promises)
            .then(usuariosConInfo => {
              console.log('9️⃣ TODAS LAS PROMESAS RESUELTAS:', usuariosConInfo.length);

              this.recepcionistas = usuariosConInfo.filter(u => {
                const es = this.esRecepcionista(u);
                console.log('🔟 RECEPCIONISTA?', u.email, es);
                return es;
              });

              this.mecanicos = usuariosConInfo.filter(u => {
                const es = this.esMecanico(u);
                console.log('1️⃣1️⃣ MECANICO?', u.email, es);
                return es;
              });

              this.lavadores = usuariosConInfo.filter(u => {
                const es = this.esLavador(u);
                console.log('1️⃣2️⃣ LAVADOR?', u.email, es);
                return es;
              });

              console.log('1️⃣3️⃣ RESULTADOS:', {
                recepcionistas: this.recepcionistas.length,
                mecanicos: this.mecanicos.length,
                lavadores: this.lavadores.length,
              });

              verificarCargaCompleta();
            })
            .catch(error => {
              console.log('❌ ERROR EN PROMISE.ALL:', error);
              verificarCargaCompleta();
            });
        } else {
          console.log('❌ RESPONSE.SUCCESS = FALSE');
          verificarCargaCompleta();
        }
      },
      error: err => {
        console.log('❌ ERROR EN SUSCRIPCIÓN:', err);
        verificarCargaCompleta();
      },
    });
  }

  esRecepcionista(usuario: any): boolean {
    if (!usuario?.email) return false;
    return usuario.email.toLowerCase().includes('recepcionista');
  }

  esMecanico(usuario: any): boolean {
    if (!usuario?.email) return false;
    return usuario.email.toLowerCase().includes('mecanico');
  }

  esLavador(usuario: any): boolean {
    if (!usuario?.email) return false;
    const email = usuario.email.toLowerCase();
    return email.includes('lavacoches') || email.includes('lava');
  }

  onVehiculoChange(): void {
    console.log('Vehículo seleccionado:', this.nuevaOrden.vehiculoId);
  }

  // Métodos para asignación manual de usuarios
  toggleUsuarioAsignado(usuarioId: string, rol: string): void {
    const usuario = this.obtenerUsuarioPorIdYRol(usuarioId, rol);
    if (!usuario) return;

    const index = this.usuariosAsignados.findIndex(u => u.id === usuarioId);

    if (index === -1) {
      // Agregar usuario
      this.usuariosAsignados.push({
        id: usuario.id,
        userName: usuario.userName,
        nombre: usuario.name || '',
        apellido: usuario.surname || '',
        rol: rol,
      });
    } else {
      // Remover usuario
      this.usuariosAsignados.splice(index, 1);
    }
  }

  usuarioSeleccionado(usuarioId: string): boolean {
    return this.usuariosAsignados.some(u => u.id === usuarioId);
  }

  removerUsuarioAsignado(usuarioId: string): void {
    this.usuariosAsignados = this.usuariosAsignados.filter(u => u.id !== usuarioId);
  }

  obtenerUsuarioPorIdYRol(usuarioId: string, rol: string): any {
    switch (rol) {
      case 'Recepcionista':
        return this.recepcionistas.find(u => u.id === usuarioId);
      case 'Mecanico':
        return this.mecanicos.find(u => u.id === usuarioId);
      case 'lavacoches':
        return this.lavadores.find(u => u.id === usuarioId);
      default:
        return null;
    }
  }

  contarPorRol(rol: string): number {
    return this.usuariosAsignados.filter(u => u.rol === rol).length;
  }

  usuariosPorRol(rol: string): any[] {
    return this.usuariosAsignados.filter(u => u.rol === rol);
  }

  // Métodos para detalles de orden
  mostrarSelectorDetalle(): void {
    this.mostrandoSelector = true;
  }

  agregarServicio(servicio: Servicio): void {
    const nuevoDetalle: CreateDetalleDto = {
      servicioId: servicio.id,
      productoId: null, // ← EXPLÍCITAMENTE null
      tipo: 'SERVICIO',
      descripcion: servicio.nombre,
      cantidad: 1,
      precioUnitario: servicio.precio,
      observaciones: '',
      subtotal: servicio.precio,
      usuariosAsignadosIds: [], // ← Array vacío inicial
    };

    this.detalles.push(nuevoDetalle);
    this.mostrandoSelector = false;
  }

  agregarProducto(producto: Producto): void {
    if (producto.stock === 0) {
      alert('Este producto está agotado');
      return;
    }

    const nuevoDetalle: CreateDetalleDto = {
      servicioId: null, // ← EXPLÍCITAMENTE null
      productoId: producto.id,
      tipo: 'PRODUCTO',
      descripcion: producto.nombre,
      cantidad: 1,
      precioUnitario: producto.precioVenta,
      observaciones: '',
      subtotal: producto.precioVenta,
      usuariosAsignadosIds: [], // ← Array vacío inicial
    };

    this.detalles.push(nuevoDetalle);
    this.mostrandoSelector = false;
  }

  eliminarDetalle(index: number): void {
    this.detalles.splice(index, 1);
  }

  limpiarDetalles(): void {
    this.detalles = [];
  }

  limpiarAsignaciones(): void {
    this.usuariosAsignados = [];
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

  // Métodos para badges y estilos
  getRolBadgeClass(rol: string): string {
    const rolLower = rol.toLowerCase();
    if (rolLower.includes('recepcionista')) return 'badge-rol-recepcionista';
    if (rolLower.includes('mecanico') || rolLower.includes('mecanico')) return 'badge-rol-mecanico';
    if (rolLower.includes('lavacoches')) return 'badge-rol-lavador';
    return 'badge-secondary';
  }

  limpiarFormulario(): void {
    this.nuevaOrden = {
      vehiculoId: '',
      estado: 'COTIZACION',
      observaciones: '',
      detalles: [],
    };
    this.detalles = [];
    this.usuariosAsignados = [];
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

    // 1. Preparar detalles
    const detallesConUsuarios = this.detalles.map(detalle => {
      const usuariosParaEsteDetalle = this.getUsuariosAsignadosParaDetalle(detalle);

      return {
        ...detalle,
        productoId: detalle.tipo === 'SERVICIO' ? null : detalle.productoId,
        servicioId: detalle.tipo === 'SERVICIO' ? detalle.servicioId : null,
        usuariosAsignadosIds: usuariosParaEsteDetalle.map(u => u.id),
      };
    });

    // 2. Preparar usuarios
    const usuariosAsignadosDto = this.usuariosAsignados.map(usuario => ({
      usuarioId: usuario.id,
      rol: usuario.rol,
      observaciones: `Asignado al crear la orden`,
    }));

    // 3. Construir payload
    const payload: CreateOrdenServicioDto = {
      vehiculoId: this.nuevaOrden.vehiculoId,
      estado: this.nuevaOrden.estado,
      observaciones: this.nuevaOrden.observaciones,
      detalles: detallesConUsuarios,
      usuariosAsignados: usuariosAsignadosDto,
    };

    console.log('📦 Payload:', JSON.stringify(payload, null, 2));
    console.log('⏱️ Duración total estimada:', this.calcularDuracionTotal(), 'minutos');

    this.loading = true;
    this.error = null;

    this.ordenService.create(payload).subscribe({
      next: response => {
        if (response.success) {
          this.successMessage = `✅ Orden creada: ${response.data.codigo} | Tiempo: ${this.formatearDuracion(response.data.duracionTotalEstimada || this.calcularDuracionTotal())}`;
          this.loading = false;

          setTimeout(() => {
            this.router.navigate(['/ordenes', response.data.id]);
          }, 2000);
        } else {
          this.loading = false;
          this.error = 'Error al crear la orden: ' + response.message;
        }
      },
      error: err => {
        this.loading = false;
        this.error = 'Error al crear la orden: ' + (err.message || 'Error desconocido');
      },
    });
  }

  // Agrega este método para determinar qué usuarios van a cada detalle
  private getUsuariosAsignadosParaDetalle(detalle: CreateDetalleDto): any[] {
    if (detalle.tipo === 'SERVICIO') {
      // Para servicios, asignar mecanicos
      return this.usuariosAsignados.filter(u => u.rol === 'Mecanico');
    } else if (detalle.tipo === 'PRODUCTO') {
      // Para productos, podrías asignar recepcionistas o nadie
      return this.usuariosAsignados.filter(u => u.rol === 'Recepcionista');
    }
    return [];
  }

  private asignarUsuariosALaOrden(ordenId: string): void {
    const asignacionesPromesas = this.usuariosAsignados.map(usuario => {
      const asignacionDto = {
        usuarioId: usuario.id,
        rol: usuario.rol,
        observaciones: `Asignado automáticamente al crear la orden`,
      };

      return new Promise<void>((resolve, reject) => {
        this.ordenService.asignarUsuario(ordenId, asignacionDto).subscribe({
          next: response => {
            if (response.success) {
              console.log(`Usuario ${usuario.nombre} asignado correctamente`);
              resolve();
            } else {
              console.error(`Error al asignar usuario ${usuario.nombre}:`, response.message);
              resolve(); // Resolvemos igual para continuar con los demás
            }
          },
          error: err => {
            console.error(`Error al asignar usuario ${usuario.nombre}:`, err);
            resolve(); // Resolvemos igual para continuar con los demás
          },
        });
      });
    });

    // Esperar a que todas las asignaciones se completen
    Promise.all(asignacionesPromesas)
      .then(() => {
        this.loading = false;
        setTimeout(() => {
          this.router.navigate(['/ordenes', ordenId]);
        }, 2000);
      })
      .catch(() => {
        this.loading = false;
        // Aún así redirigimos, pero mostramos un mensaje
        this.successMessage += ' (Algunos usuarios no pudieron ser asignados)';
        setTimeout(() => {
          this.router.navigate(['/ordenes', ordenId]);
        }, 2000);
      });
  }

  // Obtener duración de un servicio por ID
  obtenerDuracionServicio(servicioId: string | null): number {
    if (!servicioId) return 0;
    const servicio = this.serviciosDisponibles.find(s => s.id === servicioId);
    return servicio?.duracionEstimada || 0;
  }

  // Calcular duración total de TODOS los servicios en la orden
  calcularDuracionTotal(): number {
    return this.detalles
      .filter(d => d.tipo === 'SERVICIO')
      .reduce((total, detalle) => {
        const duracion = this.obtenerDuracionServicio(detalle.servicioId || null);
        return total + duracion * (detalle.cantidad || 1);
      }, 0);
  }

  // Formatear minutos a formato legible (ej: 90 min → 1h 30min)
  formatearDuracion(minutos: number): string {
    if (!minutos || minutos === 0) return '0 min';

    if (minutos < 60) {
      return `${minutos} min`;
    }

    const horas = Math.floor(minutos / 60);
    const minsRestantes = minutos % 60;

    if (minsRestantes === 0) {
      return `${horas}h`;
    }

    return `${horas}h ${minsRestantes}min`;
  }

  // Obtener ícono según duración (para UI)
  getIconoDuracion(minutos: number): string {
    if (minutos < 30) return 'fa-clock'; // Rápido
    if (minutos < 60) return 'fa-clock'; // Normal
    if (minutos < 120) return 'fa-hourglass-half'; // Largo
    return 'fa-hourglass-end'; // Muy largo
  }

  // Obtener clase CSS según duración
  getClaseDuracion(minutos: number): string {
    if (minutos < 30) return 'badge bg-success'; // Verde
    if (minutos < 60) return 'badge bg-info'; // Azul
    if (minutos < 120) return 'badge bg-warning text-dark'; // Amarillo
    return 'badge bg-danger'; // Rojo
  }
}
