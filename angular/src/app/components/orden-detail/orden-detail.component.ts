import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrdenServicioService, OrdenServicio } from '../../services/orden-servicio.service';
import { UsuariosRolesService } from '../../services/usuarios-roles.service'; // Nuevo servicio
import { ServicioService } from '../../services/servicio.service';
import { AuthService } from '../../auth/services/auth.service';

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
                  <p><strong>Trabajadores Asignados:</strong> {{ contarUsuariosAsignados() }}</p>
                </div>
                <div class="col-md-6">
                  <p><strong>Fecha Entrada:</strong> {{ orden.fechaEntrada | date: 'medium' }}</p>
                  <p>
                    <strong>Fecha Salida:</strong>
                    {{ orden.fechaSalida ? (orden.fechaSalida | date: 'medium') : 'Pendiente' }}
                  </p>
                  <p><strong>Observaciones:</strong> {{ orden.observaciones || 'Ninguna' }}</p>
                  <p><strong>Creada:</strong> {{ orden.creationTime | date: 'short' }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Sección de trabajadores asignados -->
          <div class="card mb-4" *ngIf="usuariosAsignados.length > 0">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h5 class="mb-0">Trabajadores Asignados</h5>
              <button class="btn btn-sm btn-outline-primary" (click)="gestionarAsignaciones()">
                <i class="fas fa-user-cog"></i> Gestionar
              </button>
            </div>
            <div class="card-body">
              <div class="row row-cols-1 row-cols-md-2 g-3">
                <div class="col" *ngFor="let usuario of usuariosAsignados">
                  <div class="card h-100">
                    <div class="card-body">
                      <div class="d-flex align-items-center">
                        <div class="flex-shrink-0">
                          <div class="avatar-circle" [ngClass]="getRolBadgeClass(usuario.rol)">
                            {{ getIniciales(usuario.nombre, usuario.apellido) }}
                          </div>
                        </div>
                        <div class="flex-grow-1 ms-3">
                          <h6 class="mb-1">
                            {{ usuario.nombre }} {{ usuario.apellido }}
                            <span class="badge ms-2" [ngClass]="getRolBadgeClass(usuario.rol)">
                              {{ usuario.rol }}
                            </span>
                          </h6>
                          <small class="text-muted d-block">
                            <i class="fas fa-user"></i> {{ usuario.userName }}
                          </small>
                          <small class="text-muted d-block" *ngIf="usuario.estado">
                            <i
                              class="fas fa-circle"
                              [ngClass]="getEstadoIconClass(usuario.estado)"
                            ></i>
                            {{ usuario.estado }}
                          </small>
                          <small class="text-muted d-block" *ngIf="usuario.fechaAsignacion">
                            <i class="fas fa-calendar-alt"></i>
                            Asignado: {{ usuario.fechaAsignacion | date: 'shortDate' }}
                          </small>
                        </div>
                        <div class="flex-shrink-0">
                          <div class="dropdown">
                            <button
                              class="btn btn-sm btn-outline-secondary"
                              type="button"
                              data-bs-toggle="dropdown"
                            >
                              <i class="fas fa-ellipsis-v"></i>
                            </button>
                            <ul class="dropdown-menu">
                              <li>
                                <button
                                  class="dropdown-item"
                                  (click)="cambiarEstadoUsuario(usuario.id, 'COMPLETADO')"
                                  *ngIf="usuario.estado === 'ASIGNADO'"
                                >
                                  <i class="fas fa-check text-success"></i> Marcar como completado
                                </button>
                              </li>
                              <li>
                                <button
                                  class="dropdown-item"
                                  (click)="removerUsuarioAsignado(usuario.id)"
                                >
                                  <i class="fas fa-trash text-danger"></i> Remover asignación
                                </button>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Detalles -->
          <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h5 class="mb-0">Detalles de Servicios/Productos</h5>
              <button
                *ngIf="puedeModificarDetalles"
                class="btn btn-sm btn-primary"
                (click)="mostrarAgregarDetalle = true"
              >
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
                    <select
                      class="form-select"
                      [(ngModel)]="nuevoDetalle.tipo"
                      name="tipo"
                      required
                    >
                      <option value="">Seleccionar</option>
                      <option value="SERVICIO">Servicio</option>
                      <option value="PRODUCTO">Producto</option>
                    </select>
                  </div>
                  <div class="col-md-8">
                    <label class="form-label">Descripción</label>
                    <input
                      type="text"
                      class="form-control"
                      [(ngModel)]="nuevoDetalle.descripcion"
                      name="descripcion"
                      required
                    />
                  </div>
                  <div class="col-md-3">
                    <label class="form-label">Cantidad</label>
                    <input
                      type="number"
                      class="form-control"
                      [(ngModel)]="nuevoDetalle.cantidad"
                      name="cantidad"
                      min="1"
                      required
                    />
                  </div>
                  <div class="col-md-3">
                    <label class="form-label">Precio Unitario</label>
                    <input
                      type="number"
                      class="form-control"
                      [(ngModel)]="nuevoDetalle.precioUnitario"
                      name="precioUnitario"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Observaciones</label>
                    <input
                      type="text"
                      class="form-control"
                      [(ngModel)]="nuevoDetalle.observaciones"
                      name="observaciones"
                    />
                  </div>
                  <div class="col-12">
                    <div class="d-flex gap-2">
                      <button type="submit" class="btn btn-success" [disabled]="!detalleForm.valid">
                        <i class="fas fa-check"></i> Agregar
                      </button>
                      <button
                        type="button"
                        class="btn btn-secondary"
                        (click)="mostrarAgregarDetalle = false"
                      >
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
                      <th class="text-end">Precio Unit.</th>
                      <th class="text-center">Duración</th>
                      <th class="text-end">Subtotal</th>
                      <th>Trabajadores</th>
                      <th>Observaciones</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let detalle of orden.detalles">
                      <td>
                        <span
                          class="badge"
                          [ngClass]="detalle.tipo === 'SERVICIO' ? 'bg-info' : 'bg-warning'"
                        >
                          {{ detalle.tipo }}
                        </span>
                      </td>
                      <td>{{ detalle.descripcion }}</td>
                      <td class="text-end">{{ detalle.cantidad }}</td>
                      <td class="text-end">{{ detalle.precioUnitario.toFixed(2) }}</td>
                      <td class="text-center align-middle">
                        <span
                          *ngIf="detalle.tipo === 'SERVICIO'"
                          class="badge fs-6"
                          [ngClass]="
                            getDuracionBadgeClass(obtenerDuracionServicio(detalle.servicioId))
                          "
                        >
                          <i
                            class="fas {{
                              getDuracionIconClass(obtenerDuracionServicio(detalle.servicioId))
                            }} me-1"
                          ></i>
                          {{ formatearDuracion(obtenerDuracionServicio(detalle.servicioId)) }}
                        </span>
                        <span *ngIf="detalle.tipo === 'PRODUCTO'" class="text-muted">
                          <i class="fas fa-minus-circle"></i> N/A
                        </span>
                      </td>
                      <td class="text-end">
                        <strong>{{ detalle.subtotal.toFixed(2) }}</strong>
                      </td>
                      <td>
                        <div
                          *ngIf="
                            detalle.usuariosAsignadosIds && detalle.usuariosAsignadosIds.length > 0
                          "
                        >
                          <span
                            class="badge bg-secondary"
                            *ngFor="let usuarioId of detalle.usuariosAsignadosIds"
                            [title]="obtenerNombreUsuario(usuarioId)"
                          >
                            {{ obtenerInicialUsuario(usuarioId) }}
                          </span>
                        </div>
                        <span
                          *ngIf="
                            !detalle.usuariosAsignadosIds ||
                            detalle.usuariosAsignadosIds.length === 0
                          "
                          class="text-muted small"
                        >
                          Sin asignar
                        </span>
                      </td>
                      <td>{{ detalle.observaciones || '-' }}</td>
                      <td>
                        <button
                          class="btn btn-sm btn-outline-danger"
                          (click)="removerDetalle(detalle.id)"
                        >
                          <i class="fas fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                    <tr *ngIf="orden.detalles.length === 0">
                      <td colspan="8" class="text-center text-muted py-4">
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
              <hr />
              <div class="d-flex justify-content-between fs-5">
                <<span *ngIf="!puedeVerCostos" class="text-muted">[Restringido]</span>
                <span *ngIf="puedeVerCostos">{{ orden.total.toFixed(2) }}</span>
              </div>
            </div>
          </div>

          <!-- ✅ NUEVO: Tarjeta de Duración Estimada -->
          <div class="card mb-4">
            <div class="card-header">
              <h5 class="mb-0"><i class="fas fa-clock"></i> Tiempo Estimado</h5>
            </div>
            <div class="card-body">
              <div class="text-center">
                <!-- Duración en grande -->
                <div
                  class="display-4 mb-2"
                  [ngClass]="getDuracionColorClass(orden.duracionTotalEstimada)"
                >
                  {{ formatearDuracion(orden.duracionTotalEstimada) }}
                </div>

                <!-- Barra de progreso visual -->
                <div class="progress mt-3" style="height: 10px;">
                  <div
                    class="progress-bar"
                    [ngClass]="getDuracionProgressClass(orden.duracionTotalEstimada)"
                    [style.width.%]="calcularPorcentajeDuracion(orden.duracionTotalEstimada)"
                  ></div>
                </div>

                <div class="d-flex justify-content-between mt-2 small text-muted">
                  <span>0 min</span>
                  <span>2h</span>
                  <span>4h+</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Resumen de asignaciones -->
          <div class="card mb-4">
            <div class="card-header">
              <h5 class="mb-0">Resumen de Trabajadores</h5>
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
                    <i class="fas fa-user-circle text-primary"></i> {{ usuario.nombre }}
                    <span class="badge bg-secondary float-end">{{
                      usuario.estado || 'ASIGNADO'
                    }}</span>
                  </div>
                </div>
              </div>

              <div class="mb-3">
                <h6 class="text-success">
                  <i class="fas fa-tools"></i> Mecanicos
                  <span class="badge bg-success float-end">{{ contarPorRol('Mecanico') }}</span>
                </h6>
                <div *ngIf="contarPorRol('Mecanico') > 0" class="small">
                  <div *ngFor="let usuario of usuariosPorRol('Mecanico')" class="mb-1">
                    <i class="fas fa-user-circle text-success"></i> {{ usuario.nombre }}
                    <span class="badge bg-secondary float-end">{{
                      usuario.estado || 'ASIGNADO'
                    }}</span>
                  </div>
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
                    <i class="fas fa-user-circle text-warning"></i> {{ usuario.nombre }}
                    <span class="badge bg-secondary float-end">{{
                      usuario.estado || 'ASIGNADO'
                    }}</span>
                  </div>
                </div>
              </div>

              <div class="text-center mt-3">
                <div class="progress" style="height: 10px;">
                  <div class="progress-bar bg-success" [style.width.%]="calcularProgreso()"></div>
                </div>
                <small class="text-muted">
                  {{ calcularCompletados() }} de {{ usuariosAsignados.length }} trabajadores
                  completaron su tarea
                </small>
              </div>
            </div>
          </div>

          <!-- Cambiar estado -->
          <div class="card mb-4">
            <div class="card-header">
              <h5 class="mb-0">Cambiar Estado de Orden</h5>
            </div>
            <div class="card-body">
              <div class="d-grid gap-2">
                <button
                  *ngFor="let estado of estadosDisponibles"
                  class="btn btn-outline-primary"
                  (click)="cambiarEstado(estado)"
                >
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
                <button
                  *ngIf="puedeCompletarTarea && esMiOrdenAsignada"
                  class="btn btn-success"
                  (click)="completarMiTarea()"
                >
                  <i class="fas fa-check-circle"></i> Marcar como Completado
                </button>
                <button
                  *ngIf="puedeEditar"
                  class="btn btn-warning"
                  [routerLink]="['/ordenes/editar', orden.id]"
                >
                  <i class="fas fa-edit"></i> Editar
                </button>
                <button
                  *ngIf="puedeAsignarTrabajadores"
                  class="btn btn-primary"
                  (click)="gestionarAsignaciones()"
                >
                  <i class="fas fa-user-plus"></i> Gestionar Trabajadores
                </button>
                <button *ngIf="puedeEliminar" class="btn btn-danger" (click)="deleteOrden()">
                  <i class="fas fa-trash"></i> Eliminar
                </button>
                <button
                  *ngIf="puedeCompletarTarea && esMiOrdenAsignada"
                  class="btn btn-success"
                  (click)="completarMiTarea()"
                >
                  <i class="fas fa-check-circle"></i> Marcar como Completado
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

    <!-- Modal para gestionar asignaciones -->
    <div
      class="modal fade"
      [class.show]="mostrarModalAsignaciones"
      [style.display]="mostrarModalAsignaciones ? 'block' : 'none'"
    >
      <div class="modal-dialog modal-xl">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Gestionar Trabajadores - Orden {{ orden?.codigo }}</h5>
            <button type="button" class="btn-close" (click)="cerrarModalAsignaciones()"></button>
          </div>
          <div class="modal-body">
            <div class="row">
              <!-- Usuarios actualmente asignados -->
              <div class="col-md-6">
                <div class="card h-100">
                  <div class="card-header">
                    <h6 class="mb-0">Usuarios Asignados ({{ usuariosAsignados.length }})</h6>
                  </div>
                  <div class="card-body">
                    <div *ngIf="usuariosAsignados.length === 0" class="text-center text-muted py-4">
                      <i class="fas fa-users-slash fa-2x mb-3"></i>
                      <p>No hay trabajadores asignados a esta orden</p>
                    </div>

                    <div class="list-group">
                      <div class="list-group-item" *ngFor="let usuario of usuariosAsignados">
                        <div class="d-flex justify-content-between align-items-center">
                          <div>
                            <strong>{{ usuario.nombre }} {{ usuario.apellido }}</strong>
                            <div class="small text-muted">
                              <span class="badge" [ngClass]="getRolBadgeClass(usuario.rol)">
                                {{ usuario.rol }}
                              </span>
                              <span
                                class="badge ms-2"
                                [ngClass]="getEstadoBadgeClass(usuario.estado || '')"
                              >
                                {{ usuario.estado || 'ASIGNADO' }}
                              </span>
                            </div>
                          </div>
                          <div class="btn-group btn-group-sm">
                            <button
                              class="btn btn-outline-success"
                              (click)="cambiarEstadoUsuario(usuario.id, 'COMPLETADO')"
                              *ngIf="usuario.estado === 'ASIGNADO'"
                            >
                              <i class="fas fa-check"></i>
                            </button>
                            <button
                              class="btn btn-outline-danger"
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
              </div>

              <!-- Agregar nuevos usuarios -->
              <div class="col-md-6">
                <div class="card h-100">
                  <div class="card-header">
                    <h6 class="mb-0">Agregar Nuevos Trabajadores</h6>
                  </div>
                  <div class="card-body">
                    <form (ngSubmit)="agregarNuevoUsuario()">
                      <div class="mb-3">
                        <label class="form-label">Seleccionar Usuario</label>
                        <select
                          class="form-select"
                          [(ngModel)]="nuevoUsuario.usuarioId"
                          name="usuarioId"
                          required
                        >
                          <option value="">Seleccionar usuario...</option>
                          <option *ngFor="let usuario of usuariosDisponibles" [value]="usuario.id">
                            {{ usuario.name }} {{ usuario.surname }} ({{ usuario.userName }})
                          </option>
                        </select>
                      </div>

                      <div class="mb-3">
                        <label class="form-label">Rol</label>
                        <select
                          class="form-select"
                          [(ngModel)]="nuevoUsuario.rol"
                          name="rol"
                          required
                        >
                          <option value="">Seleccionar rol...</option>
                          <option value="Recepcionista">Recepcionista</option>
                          <option value="Mecanico">Mecanico</option>
                          <option value="lavacoches">lavacoches</option>
                        </select>
                      </div>

                      <div class="mb-3">
                        <label class="form-label">Observaciones</label>
                        <textarea
                          class="form-control"
                          [(ngModel)]="nuevoUsuario.observaciones"
                          name="observaciones"
                          rows="2"
                        ></textarea>
                      </div>

                      <div class="d-grid">
                        <button
                          type="submit"
                          class="btn btn-primary"
                          [disabled]="!nuevoUsuario.usuarioId || !nuevoUsuario.rol"
                        >
                          <i class="fas fa-user-plus"></i> Asignar Trabajador
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="cerrarModalAsignaciones()">
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
    <div *ngIf="mostrarModalAsignaciones" class="modal-backdrop fade show"></div>
  `,
  styles: [
    `
      .badge {
        padding: 0.5em 1em;
        font-size: 0.9em;
      }
      .badge-cotizacion {
        background-color: #6c757d;
        color: white;
      }
      .badge-aprobada {
        background-color: #0d6efd;
        color: white;
      }
      .badge-en_progreso {
        background-color: #ffc107;
        color: black;
      }
      .badge-completada {
        background-color: #198754;
        color: white;
      }
      .badge-facturada {
        background-color: #6f42c1;
        color: white;
      }
      .badge-cancelada {
        background-color: #dc3545;
        color: white;
      }

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

      .avatar-circle {
        width: 45px;
        height: 45px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 16px;
        color: white;
      }

      .avatar-circle.badge-rol-recepcionista {
        background-color: #0dcaf0;
      }
      .avatar-circle.badge-rol-mecanico {
        background-color: #198754;
      }
      .avatar-circle.badge-rol-lavador {
        background-color: #fd7e14;
      }

      .fa-circle.text-success {
        color: #198754;
      }
      .fa-circle.text-warning {
        color: #ffc107;
      }
      .fa-circle.text-secondary {
        color: #6c757d;
      }

      .modal {
        background: rgba(0, 0, 0, 0.5);
      }
    `,
  ],
})
export class OrdenDetailComponent implements OnInit {
  orden: OrdenServicio | null = null;
  loading = false;
  error: string | null = null;

  mostrarAgregarDetalle = false;

  currentUser: any = null;

  nuevoDetalle = {
    tipo: '',
    descripcion: '',
    cantidad: 1,
    precioUnitario: 0,
    observaciones: '',
  };

  // Datos de ejemplo para usuarios asignados (deberías obtenerlo de tu backend)
  usuariosAsignados: Array<{
    id: string;
    userName: string;
    nombre: string;
    apellido: string;
    rol: string;
    estado?: 'ASIGNADO' | 'COMPLETADO' | 'CANCELADO';
    fechaAsignacion?: string;
  }> = [];

  estadosDisponibles = ['APROBADA', 'EN_PROGRESO', 'COMPLETADA', 'FACTURADA', 'CANCELADA'];

  mapaServicios: Map<string, any> = new Map();

  // Cargar todos los servicios al iniciar
  cargarCatalogoServicios(): void {
    this.servicioService.getAll().subscribe({
      next: response => {
        if (response.success) {
          // Crear mapa para búsqueda rápida por ID
          response.data.forEach((servicio: any) => {
            this.mapaServicios.set(servicio.id, servicio);
          });
          console.log('✅ Servicios cargados en catálogo:', this.mapaServicios.size);
        }
      },
      error: err => {
        console.error('❌ Error cargando servicios:', err);
      },
    });
  }

  // Obtener duración de un servicio por ID
  obtenerDuracionServicio(servicioId: string | null): number {
    if (!servicioId) return 0;

    const servicio = this.mapaServicios.get(servicioId);
    if (!servicio) {
      console.warn(`⚠️ Servicio no encontrado en catálogo: ${servicioId}`);
      return 0;
    }

    return servicio.duracionEstimada || 0;
  }

  // Obtener nombre del servicio (opcional, para tooltips)
  obtenerNombreServicio(servicioId: string | null): string {
    if (!servicioId) return '';
    const servicio = this.mapaServicios.get(servicioId);
    return servicio?.nombre || 'Servicio';
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private ordenServicioService: OrdenServicioService,
    private usuariosRolesService: UsuariosRolesService,
    private servicioService: ServicioService,
    public authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.cargarCatalogoServicios();
    this.cargarUsuarioActual();
    this.loadOrden();
  }

  cargarUsuarioActual(): void {
    this.currentUser = this.authService.getCurrentUser();
    console.log('👤 Usuario actual:', this.currentUser);
  }

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

  // Calcular porcentaje para barra de progreso (basado en 4 horas = 240 min)
  calcularPorcentajeDuracion(minutos: number): number {
    if (!minutos) return 0;
    return Math.min((minutos / 240) * 100, 100);
  }

  // Obtener clase CSS para el badge de duración
  getDuracionBadgeClass(minutos: number): string {
    if (!minutos) return 'bg-secondary';
    if (minutos < 30) return 'bg-success'; // Rápido
    if (minutos < 60) return 'bg-info'; // Normal
    if (minutos < 120) return 'bg-warning text-dark'; // Largo
    return 'bg-danger'; // Muy largo
  }

  // Obtener clase CSS para el color del texto de duración
  getDuracionColorClass(minutos: number): string {
    if (!minutos) return 'text-secondary';
    if (minutos < 30) return 'text-success';
    if (minutos < 60) return 'text-info';
    if (minutos < 120) return 'text-warning';
    return 'text-danger';
  }

  // Obtener clase CSS para la barra de progreso
  getDuracionProgressClass(minutos: number): string {
    if (!minutos) return 'bg-secondary';
    if (minutos < 30) return 'bg-success';
    if (minutos < 60) return 'bg-info';
    if (minutos < 120) return 'bg-warning';
    return 'bg-danger';
  }

  // Obtener ícono según duración
  getDuracionIconClass(minutos: number): string {
    if (!minutos) return 'fa-clock';
    if (minutos < 30) return 'fa-clock'; // Rápido
    if (minutos < 60) return 'fa-clock'; // Normal
    if (minutos < 120) return 'fa-hourglass-half'; // Largo
    return 'fa-hourglass-end'; // Muy largo
  }

  // Contar servicios en la orden
  contarServicios(): number {
    return this.orden?.detalles?.filter(d => d.tipo === 'SERVICIO').length || 0;
  }

  // Calcular tiempo total de servicios (respaldo si duracionTotalEstimada no está)
  calcularTiempoTotal(): number {
    if (!this.orden?.detalles) return 0;

    return this.orden.detalles
      .filter(d => d.tipo === 'SERVICIO')
      .reduce((total, detalle) => {
        // Aquí necesitas obtener la duración de cada servicio
        // Por ahora, asumimos que viene en el detalle o usamos 0
        return total + (detalle as any).duracionEstimada * detalle.cantidad || 0;
      }, 0);
  }

  cargarUsuariosAsignados(ordenId: string): void {
    // Usa el servicio real en lugar de datos de ejemplo
    this.ordenServicioService.getUsuariosAsignados(ordenId).subscribe({
      next: response => {
        if (response.success) {
          this.usuariosAsignados = response.data.map(usuario => ({
            id: usuario.usuarioId, // O usuario.id dependiendo de tu backend
            userName: usuario.usuarioUserName || usuario.usuarioId,
            nombre: usuario.usuarioNombre || 'Usuario',
            apellido: '', // Si no tienes separado, usa usuarioNombre completo
            rol: usuario.rol,
            estado: usuario.estado as 'ASIGNADO' | 'COMPLETADO' | 'CANCELADO',
            fechaAsignacion: usuario.fechaAsignacion,
          }));
          console.log('✅ Usuarios asignados cargados:', this.usuariosAsignados);
        } else {
          console.warn('⚠️ No se pudieron cargar usuarios asignados');
          // Mantén datos de ejemplo temporalmente
          this.usarDatosDeEjemploTemporalmente();
        }
      },
      error: err => {
        console.error('❌ Error cargando usuarios asignados:', err);
        this.usarDatosDeEjemploTemporalmente();
      },
    });
  }

  private usarDatosDeEjemploTemporalmente(): void {
    // Solo para desarrollo - elimina cuando el backend esté listo
    this.usuariosAsignados = [
      {
        id: 'daa62725-f189-58b1-ec4c-3a1f5602edbb',
        userName: 'Vmejia',
        nombre: 'Viki',
        apellido: 'Mejia',
        rol: 'Recepcionista',
        estado: 'ASIGNADO',
        fechaAsignacion: new Date().toISOString(),
      },
      // ... otros usuarios
    ];
  }

  // Métodos para usuarios asignados
  contarUsuariosAsignados(): number {
    return this.usuariosAsignados.length;
  }

  contarPorRol(rol: string): number {
    return this.usuariosAsignados.filter(u => u.rol === rol).length;
  }

  usuariosPorRol(rol: string): any[] {
    return this.usuariosAsignados.filter(u => u.rol === rol);
  }

  calcularProgreso(): number {
    const completados = this.usuariosAsignados.filter(u => u.estado === 'COMPLETADO').length;
    return this.usuariosAsignados.length > 0
      ? (completados / this.usuariosAsignados.length) * 100
      : 0;
  }

  calcularCompletados(): number {
    return this.usuariosAsignados.filter(u => u.estado === 'COMPLETADO').length;
  }

  getRolBadgeClass(rol: string): string {
    const rolLower = rol.toLowerCase();
    if (rolLower.includes('recepcionista')) return 'badge-rol-recepcionista';
    if (rolLower.includes('mecanico') || rolLower.includes('mecanico')) return 'badge-rol-mecanico';
    if (rolLower.includes('lavacoches')) return 'badge-rol-lavador';
    return 'badge-secondary';
  }

  getEstadoIconClass(estado: string): string {
    switch (estado) {
      case 'COMPLETADO':
        return 'text-success';
      case 'CANCELADO':
        return 'text-danger';
      default:
        return 'text-secondary';
    }
  }

  getIniciales(nombre: string, apellido: string): string {
    return ((nombre?.charAt(0) || '') + (apellido?.charAt(0) || '')).toUpperCase();
  }

  obtenerNombreUsuario(usuarioId: string): string {
    const usuario = this.usuariosAsignados.find(u => u.id === usuarioId);
    return usuario ? `${usuario.nombre} ${usuario.apellido}` : 'Usuario';
  }

  obtenerInicialUsuario(usuarioId: string): string {
    const usuario = this.usuariosAsignados.find(u => u.id === usuarioId);
    return usuario ? this.getIniciales(usuario.nombre, usuario.apellido) : '?';
  }

  cerrarModalAsignaciones(): void {
    this.mostrarModalAsignaciones = false;
  }

  cambiarEstadoUsuario(usuarioId: string, nuevoEstado: 'COMPLETADO' | 'CANCELADO'): void {
    if (!this.orden) return;

    const confirmacion = confirm(`¿Cambiar estado del usuario a ${nuevoEstado}?`);
    if (!confirmacion) return;

    this.loading = true;

    const actualizacion = {
      estado: nuevoEstado,
      observaciones: `Estado cambiado a ${nuevoEstado}`,
    };

    this.ordenServicioService
      .actualizarAsignacion(this.orden.id, usuarioId, actualizacion)
      .subscribe({
        next: response => {
          this.loading = false;
          if (response.success) {
            // Actualizar estado localmente
            const index = this.usuariosAsignados.findIndex(u => u.id === usuarioId);
            if (index !== -1) {
              this.usuariosAsignados[index].estado = nuevoEstado;
            }
            // Refrescar la orden completa
            this.loadOrden();
            alert(`Estado actualizado a ${nuevoEstado}`);
          } else {
            alert('Error: ' + response.message);
          }
        },
        error: err => {
          this.loading = false;
          alert('Error al actualizar estado: ' + (err.error?.message || err.message));
        },
      });
  }

  removerUsuarioAsignado(usuarioId: string): void {
    if (!this.orden) return;

    if (!confirm('¿Está seguro de remover este trabajador de la orden?')) return;

    this.loading = true;

    this.ordenServicioService.removerAsignacion(this.orden.id, usuarioId).subscribe({
      next: response => {
        this.loading = false;
        if (response.success) {
          // Remover localmente
          this.usuariosAsignados = this.usuariosAsignados.filter(u => u.id !== usuarioId);
          alert('Trabajador removido de la orden');
        } else {
          alert('Error: ' + response.message);
        }
      },
      error: err => {
        this.loading = false;
        alert('Error al remover usuario: ' + (err.error?.message || err.message));
      },
    });
  }

  // Métodos existentes (mantener igual)
  getEstadoBadgeClass(estado: string): string {
    switch (estado.toUpperCase()) {
      case 'COTIZACION':
        return 'badge-cotizacion';
      case 'APROBADA':
        return 'badge-aprobada';
      case 'EN_PROGRESO':
        return 'badge-en_progreso';
      case 'COMPLETADA':
        return 'badge-completada';
      case 'FACTURADA':
        return 'badge-facturada';
      case 'CANCELADA':
        return 'badge-cancelada';
      default:
        return 'badge-secondary';
    }
  }

  agregarDetalle(): void {
    if (!this.orden) return;

    this.ordenServicioService.agregarDetalle(this.orden.id, this.nuevoDetalle).subscribe({
      next: response => {
        if (response.success) {
          this.orden = response.data;
          this.mostrarAgregarDetalle = false;
          this.nuevoDetalle = {
            tipo: '',
            descripcion: '',
            cantidad: 1,
            precioUnitario: 0,
            observaciones: '',
          };
          alert('Detalle agregado correctamente');
        } else {
          alert('Error: ' + response.message);
        }
      },
      error: err => {
        alert('Error al agregar detalle: ' + err.message);
      },
    });
  }

  removerDetalle(detalleId: string): void {
    if (!this.orden || !confirm('¿Está seguro de eliminar este detalle?')) return;

    this.ordenServicioService.removerDetalle(this.orden.id, detalleId).subscribe({
      next: response => {
        if (response.success) {
          this.orden = response.data;
          alert('Detalle eliminado correctamente');
        } else {
          alert('Error: ' + response.message);
        }
      },
      error: err => {
        alert('Error al eliminar detalle: ' + err.message);
      },
    });
  }

  cambiarEstado(estado: string): void {
    if (!this.orden || !confirm(`¿Cambiar estado a ${estado}?`)) return;

    this.ordenServicioService.cambiarEstado(this.orden.id, estado).subscribe({
      next: response => {
        if (response.success) {
          this.orden = response.data;
          alert(`Estado cambiado a ${estado} correctamente`);
        } else {
          alert('Error: ' + response.message);
        }
      },
      error: err => {
        alert('Error al cambiar estado: ' + err.message);
      },
    });
  }

  deleteOrden(): void {
    if (!this.orden || !confirm('¿Está seguro de eliminar esta orden?')) return;

    this.ordenServicioService.delete(this.orden.id).subscribe({
      next: response => {
        if (response.success) {
          alert(response.message);
          this.router.navigate(['/ordenes']);
        } else {
          alert('Error: ' + response.message);
        }
      },
      error: err => {
        alert('Error al eliminar: ' + err.message);
      },
    });
  }

  // En tu componente, agrega estas propiedades
  usuariosDisponibles: any[] = [];
  mostrarModalAsignaciones = false;
  nuevoUsuario = {
    usuarioId: '',
    rol: '',
    observaciones: '',
  };

  // Agrega este método para cargar usuarios disponibles
  cargarUsuariosDisponibles(): void {
    // Necesitas un servicio para obtener usuarios asignables
    this.usuariosRolesService.getUsuariosAsignables().subscribe({
      next: response => {
        if (response.success) {
          this.usuariosDisponibles = response.items;
          // Filtrar usuarios que ya están asignados
          this.usuariosDisponibles = this.usuariosDisponibles.filter(
            usuario => !this.usuariosAsignados.some(asignado => asignado.id === usuario.id),
          );
        }
      },
      error: err => {
        console.error('Error cargando usuarios disponibles:', err);
      },
    });
  }

  // Método para abrir el modal
  gestionarAsignaciones(): void {
    this.mostrarModalAsignaciones = true;
    this.cargarUsuariosDisponibles();
  }

  // Método para agregar nuevo usuario
  agregarNuevoUsuario(): void {
    if (!this.orden || !this.nuevoUsuario.usuarioId || !this.nuevoUsuario.rol) return;

    const asignacion = {
      usuarioId: this.nuevoUsuario.usuarioId,
      rol: this.nuevoUsuario.rol,
      observaciones:
        this.nuevoUsuario.observaciones || `Asignado el ${new Date().toLocaleDateString()}`,
    };

    this.ordenServicioService.asignarUsuario(this.orden.id, asignacion).subscribe({
      next: response => {
        if (response.success) {
          // Agregar al array local
          const usuario = this.usuariosDisponibles.find(u => u.id === this.nuevoUsuario.usuarioId);
          if (usuario) {
            this.usuariosAsignados.push({
              id: usuario.id,
              userName: usuario.userName,
              nombre: usuario.name || '',
              apellido: usuario.surname || '',
              rol: this.nuevoUsuario.rol,
              estado: 'ASIGNADO',
              fechaAsignacion: new Date().toISOString(),
            });

            // Limpiar formulario
            this.nuevoUsuario = { usuarioId: '', rol: '', observaciones: '' };

            // Actualizar lista de disponibles
            this.cargarUsuariosDisponibles();

            alert('Trabajador asignado correctamente');
          }
        } else {
          alert('Error: ' + response.message);
        }
      },
      error: err => {
        alert('Error al asignar usuario: ' + (err.error?.message || err.message));
      },
    });
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
      next: response => {
        if (response.success) {
          this.orden = response.data;

          // ✅ Cargar servicios para obtener duraciones
          this.cargarServiciosParaDuracion();
          this.cargarUsuariosAsignados(id);
        } else {
          this.error = 'Error al cargar la orden';
        }
        this.loading = false;
      },
      error: err => {
        this.error = 'Error al cargar la orden: ' + (err.message || 'Error desconocido');
        this.loading = false;
        console.error('Error:', err);
      },
    });
  }

  // ✅ Nuevo método para cargar servicios y sus duraciones
  private cargarServiciosParaDuracion(): void {
    if (!this.orden?.detalles) return;

    // Extraer IDs únicos de servicios
    const servicioIds = this.orden.detalles
      .filter(d => d.tipo === 'SERVICIO' && d.servicioId)
      .map(d => d.servicioId)
      .filter((id): id is string => id !== null && id !== undefined);

    if (servicioIds.length === 0) return;

    // Aquí necesitas inyectar el ServicioService y cargar los servicios
    // Por ahora, mostraremos un placeholder
    console.log('IDs de servicios a cargar:', servicioIds);
  }

  // ============================================
  // CONTROL DE PERMISOS POR ROL
  // ============================================

  // ✅ ¿Puede editar datos generales de la orden?
  get puedeEditar(): boolean {
    return this.authService.hasAnyRole(['admin', 'recepcionista']);
  }

  // ✅ ¿Puede cambiar el estado de la orden?
  get puedeCambiarEstado(): boolean {
    return this.authService.hasAnyRole(['admin', 'recepcionista']);
  }

  // ✅ ¿Puede asignar/remover trabajadores?
  get puedeAsignarTrabajadores(): boolean {
    return this.authService.hasAnyRole(['admin', 'recepcionista']);
  }

  // ✅ ¿Puede agregar/remover detalles (servicios/productos)?
  get puedeModificarDetalles(): boolean {
    return this.authService.hasAnyRole(['admin', 'recepcionista']);
  }

  // ✅ ¿Puede ver los costos/precios?
  get puedeVerCostos(): boolean {
    return this.authService.hasAnyRole(['admin', 'recepcionista']);
  }

  // ✅ ¿Puede eliminar la orden?
  get puedeEliminar(): boolean {
    return this.authService.hasRole('admin');
  }

  // ✅ ¿Puede marcar su propio trabajo como completado?
  get puedeCompletarTarea(): boolean {
    return (
      this.authService.hasAnyRole(['mecanico', 'lavacoches']) &&
      this.orden?.estado === 'EN_PROGRESO'
    );
  }

  // ✅ ¿Es esta orden asignada al usuario actual?
  get esMiOrdenAsignada(): boolean {
    if (!this.orden?.usuariosAsignados || !this.currentUser?.id) return false;
    return this.orden.usuariosAsignados.some(
      u => u.usuarioId === this.currentUser.id && u.estado === 'ASIGNADO',
    );
  }

  // ✅ Obtener mi asignación actual en esta orden
  get miAsignacion(): any {
    if (!this.orden?.usuariosAsignados || !this.currentUser?.id) return null;
    return this.orden.usuariosAsignados.find(u => u.usuarioId === this.currentUser.id);
  }

  completarMiTarea(): void {
    if (!this.orden || !this.miAsignacion) return;

    if (confirm('¿Marcar tu trabajo como completado?')) {
      this.ordenServicioService
        .actualizarAsignacion(this.orden.id, this.miAsignacion.id, {
          estado: 'COMPLETADO',
          observaciones: 'Tarea completada por el trabajador',
        })
        .subscribe({
          next: response => {
            if (response.success) {
              alert('✅ Tarea marcada como completada');
              this.loadOrden(); // Recargar
            }
          },
          error: err => {
            alert('Error al completar tarea: ' + err.message);
          },
        });
    }
  }
}
