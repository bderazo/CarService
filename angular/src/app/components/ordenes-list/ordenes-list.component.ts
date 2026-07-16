// ordenes-list.component.ts - Actualizado
import { Component, OnInit } from '@angular/core';
import { OrdenServicioService, OrdenServicio } from '../../services/orden-servicio.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UsuariosRolesService } from 'src/app/services/usuarios-roles.service';
import { OrdenAsignacionesModalComponent } from './orden-asignaciones-modal.component';
import { AuthService } from '../../auth/services/auth.service';

@Component({
  selector: 'app-ordenes-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, OrdenAsignacionesModalComponent],
  template: `
    <div class="container mt-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>
            <i class="fas fa-clipboard-list me-2"></i>
            {{ getTituloVista() }}
          </h2>
          <nav aria-label="breadcrumb">
            <ol class="breadcrumb">
              <li class="breadcrumb-item"><a routerLink="/dashboard">Dashboard</a></li>
              <li class="breadcrumb-item active">Órdenes</li>
            </ol>
          </nav>
        </div>

        <div class="d-flex gap-2">
          <!-- 🟢 BOTÓN MIS ÓRDENES - SOLO ADMIN + RECEPCIONISTA -->
          <button
            *ngIf="authService.hasAnyRole(['admin', 'recepcionista'])"
            class="btn btn-outline-info"
            (click)="toggleFiltroUsuario()"
          >
            <i class="fas fa-user-check"></i>
            {{ mostrarFiltroUsuario ? 'Ocultar' : 'Mis Órdenes' }}
          </button>

          <!-- 🟢 BOTÓN NUEVA ORDEN - SOLO ADMIN + RECEPCIONISTA -->
          <a
            *ngIf="authService.hasAnyRole(['admin', 'recepcionista'])"
            routerLink="/ordenes/nueva"
            class="btn btn-primary"
          >
            <i class="fas fa-plus"></i> Nueva Orden
          </a>
        </div>
      </div>

      <!-- Filtro para ver mis órdenes asignadas -->
      <div
        *ngIf="authService.hasAnyRole(['admin', 'recepcionista']) && mostrarFiltroUsuario"
        class="card mb-3"
      >
        <div class="card-body">
          <div class="row align-items-center">
            <div class="col-md-8">
              <div class="form-check">
                <input
                  class="form-check-input"
                  type="checkbox"
                  id="filtrarMisOrdenes"
                  [(ngModel)]="filtrarMisOrdenes"
                  (change)="aplicarFiltros()"
                />
                <label class="form-check-label" for="filtrarMisOrdenes">
                  <i class="fas fa-user-check me-1"></i> Mostrar solo órdenes asignadas a mí
                </label>
              </div>
              <small class="text-muted">
                Usuario: {{ usuarioActual?.name || usuarioActual?.username || 'No identificado' }}
              </small>
            </div>
            <div class="col-md-4 text-end">
              <button class="btn btn-sm btn-outline-secondary" (click)="toggleFiltroUsuario()">
                <i class="fas fa-times"></i>
              </button>
            </div>
          </div>
        </div>
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

      <div *ngIf="!loading && ordenesFiltradas.length === 0" class="alert alert-info">
        No hay órdenes de servicio que coincidan con los filtros.
      </div>

      <div class="table-responsive" *ngIf="!loading && ordenesFiltradas.length > 0">
        <table class="table table-hover table-striped">
          <thead class="table-dark">
            <tr>
              <th>Código</th>
              <th>Vehículo</th>
              <th>Cliente</th>
              <th>Estado</th>
              <th>Usuarios Asignados</th>
              <th>Total</th>
              <th>Fecha</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let orden of ordenesFiltradas">
              <td>
                <strong>{{ orden.codigo }}</strong>
                <small class="d-block text-muted"
                  >{{ orden.observaciones | slice: 0 : 30
                  }}{{ orden.observaciones?.length > 30 ? '...' : '' }}</small
                >
              </td>
              <td>
                {{ orden.placaVehiculo }}
                <small class="d-block text-muted">{{ orden.vehiculoId | slice: 0 : 8 }}...</small>
              </td>
              <td>{{ orden.clienteNombre || 'No asignado' }}</td>
              <td>
                <span class="badge" [ngClass]="getEstadoBadgeClass(orden.estado)">
                  {{ orden.estado }}
                </span>
              </td>
              <td>
                <!-- Mostrar usuarios asignados con mejor formato -->
                <div
                  *ngIf="orden.usuariosAsignados && orden.usuariosAsignados.length > 0"
                  class="usuarios-asignados"
                >
                  <!-- Resumen compacto -->
                  <div class="d-flex flex-wrap gap-1 mb-1">
                    <span
                      *ngFor="let usuario of orden.usuariosAsignados | slice: 0 : 3"
                      class="badge"
                      [ngClass]="getRolBadgeClass(usuario.rol)"
                      [title]="
                        usuario.usuarioNombre + ' - ' + usuario.rol + ' (' + usuario.estado + ')'
                      "
                    >
                      {{ getInicialUsuario(usuario.usuarioNombre) }}
                      <i *ngIf="usuario.estado === 'COMPLETADO'" class="fas fa-check ms-1"></i>
                      <i *ngIf="usuario.estado === 'CANCELADO'" class="fas fa-times ms-1"></i>
                    </span>
                    <span *ngIf="orden.usuariosAsignados.length > 3" class="badge bg-secondary">
                      +{{ orden.usuariosAsignados.length - 3 }}
                    </span>
                  </div>

                  <!-- Detalles en tooltip o expandible -->
                  <div class="small text-muted">
                    <span
                      *ngIf="contarPorEstado(orden, 'COMPLETADO') > 0"
                      class="text-success me-2"
                    >
                      <i class="fas fa-check-circle"></i> {{ contarPorEstado(orden, 'COMPLETADO') }}
                    </span>
                    <span *ngIf="contarPorEstado(orden, 'ASIGNADO') > 0" class="text-primary me-2">
                      <i class="fas fa-clock"></i> {{ contarPorEstado(orden, 'ASIGNADO') }}
                    </span>
                    <span *ngIf="contarPorEstado(orden, 'CANCELADO') > 0" class="text-danger">
                      <i class="fas fa-ban"></i> {{ contarPorEstado(orden, 'CANCELADO') }}
                    </span>
                  </div>
                </div>

                <div
                  *ngIf="!orden.usuariosAsignados || orden.usuariosAsignados.length === 0"
                  class="text-muted small"
                >
                  <i class="fas fa-user-slash"></i> Sin asignar
                </div>
              </td>
              <td class="text-end">
                <small class="d-block text-muted"> {{ orden.detalles?.length || 0 }} items </small>
              </td>
              <td>
                {{ orden.fechaEntrada | date: 'shortDate' }}
                <small class="d-block text-muted" *ngIf="orden.fechaSalida">
                  Salida: {{ orden.fechaSalida | date: 'shortDate' }}
                </small>
              </td>
              <td>
                <div class="btn-group btn-group-sm">
                  <!-- 👁️ VER - TODOS LOS ROLES -->
                  <a
                    [routerLink]="['/ordenes', orden.id]"
                    class="btn btn-outline-primary"
                    title="Ver"
                  >
                    <i class="fas fa-eye"></i>
                  </a>

                  <!-- ✏️ EDITAR - SOLO ADMIN + RECEPCIONISTA -->
                  <a
                    *ngIf="authService.hasAnyRole(['admin', 'recepcionista'])"
                    [routerLink]="['/ordenes/editar', orden.id]"
                    class="btn btn-outline-warning"
                    title="Editar"
                  >
                    <i class="fas fa-edit"></i>
                  </a>

                  <!-- 👥 ASIGNAR - SOLO ADMIN + RECEPCIONISTA -->
                  <button
                    *ngIf="authService.hasAnyRole(['admin', 'recepcionista'])"
                    class="btn btn-outline-success"
                    (click)="gestionarAsignaciones(orden)"
                    title="Asignar trabajadores"
                  >
                    <i class="fas fa-user-plus"></i>
                  </button>

                  <!-- 🗑️ ELIMINAR - SOLO ADMIN -->
                  <button
                    *ngIf="authService.hasRole('admin')"
                    class="btn btn-outline-danger"
                    (click)="deleteOrden(orden.id)"
                    [disabled]="orden.estado !== 'COTIZACION' && orden.estado !== 'CANCELADA'"
                    title="Eliminar"
                  >
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
                <small class="d-block text-muted mt-1">
                  {{ orden.creationTime | date: 'short' }}
                </small>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Filtros mejorados -->
      <div class="card mt-4" *ngIf="authService.hasAnyRole(['admin', 'recepcionista'])">
        <div class="card-header">
          <h5 class="mb-0">Filtros</h5>
        </div>
        <div class="card-body">
          <div class="row g-3">
            <div class="col-md-3">
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
            <div class="col-md-3">
              <label class="form-label">Asignación</label>
              <select
                class="form-select"
                [(ngModel)]="filtroAsignacion"
                (change)="aplicarFiltros()"
              >
                <option value="">Todas</option>
                <option value="ASIGNADAS">Con usuarios</option>
                <option value="SIN_ASIGNAR">Sin asignar</option>
                <option value="RECEPCIONISTA">Con recepcionista</option>
                <option value="MECANICO">Con mecanico</option>
                <option value="lavacoches">Con lavacoches</option>
              </select>
            </div>
            <div class="col-md-3">
              <label class="form-label">Ordenar por</label>
              <select class="form-select" [(ngModel)]="ordenarPor" (change)="aplicarFiltros()">
                <option value="fecha">Fecha más reciente</option>
                <option value="codigo">Código</option>
                <option value="total">Total (mayor a menor)</option>
                <option value="estado">Estado</option>
              </select>
            </div>
            <div class="col-md-3 d-flex align-items-end">
              <div class="btn-group w-100">
                <button class="btn btn-outline-secondary w-50" (click)="limpiarFiltros()">
                  <i class="fas fa-filter-circle-xmark"></i> Limpiar
                </button>
                <button class="btn btn-primary w-50" (click)="exportarReporte()">
                  <i class="fas fa-file-export"></i> Exportar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <app-orden-asignaciones-modal
      [visible]="mostrarModalAsignaciones"
      [orden]="ordenSeleccionada"
      (cerrarModal)="cerrarModalAsignaciones()"
      (guardar)="onGuardarAsignaciones($event)"
    >
    </app-orden-asignaciones-modal>
  `,
  styles: [
    `
      .badge {
        padding: 0.5em 0.8em;
        font-size: 0.85em;
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
        background-color: #6f42c1;
        color: white;
      }

      .table td {
        vertical-align: middle;
      }

      .btn-group-sm > .btn {
        padding: 0.25rem 0.5rem;
      }

      .usuarios-asignados {
        max-height: 80px;
        overflow-y: auto;
      }

      .usuario-item {
        font-size: 0.85em;
      }
    `,
  ],
})
export class OrdenesListComponent implements OnInit {
  ordenes: OrdenServicio[] = [];
  ordenesFiltradas: OrdenServicio[] = [];
  loading = false;
  error: string | null = null;

  filtroEstado = '';
  filtroAsignacion = '';
  ordenarPor = 'fecha';
  filtrarMisOrdenes = false;
  mostrarFiltroUsuario = false;

  // Usuario actual (deberías obtenerlo de tu servicio de autenticación)
  usuarioActual: any = null;

  ordenSeleccionada: OrdenServicio | null = null;
  mostrarModalAsignaciones = false;

  constructor(
    private ordenServicioService: OrdenServicioService,
    private usuariosRolesService: UsuariosRolesService,
    public authService: AuthService,
  ) { }

  ngOnInit(): void {
    this.cargarUsuarioActual();

    // ✅ TEMPORAL: Verificar asignaciones después de cargar usuario
    setTimeout(() => {
      if (this.usuarioActual?.id) {
        this.verificarAsignaciones();
      }
    }, 1000);

    this.loadOrdenes();
  }

  getTituloVista(): string {
    if (this.authService.hasRole('mecanico')) {
      return 'Mis Trabajos Asignados';
    }
    if (this.authService.hasRole('lavacoches')) {
      return 'Mis Lavados Asignados';
    }
    return 'Órdenes de Servicio';
  }

  cargarUsuarioActual(): void {
    console.log('🔍 [DEBUG] ========== CARGANDO USUARIO ACTUAL ==========');

    // 1. Intentar desde AuthService
    this.usuarioActual = this.authService.getCurrentUser();
    console.log('🔍 [DEBUG] Usuario desde AuthService:', this.usuarioActual);

    // 2. Fallback: sessionStorage
    if (!this.usuarioActual) {
      console.log('🔍 [DEBUG] No hay usuario en AuthService, buscando en sessionStorage...');
      const usuarioGuardado = sessionStorage.getItem('currentUser');
      console.log('🔍 [DEBUG] sessionStorage["currentUser"]:', usuarioGuardado);

      if (usuarioGuardado) {
        this.usuarioActual = JSON.parse(usuarioGuardado);
        console.log('🔍 [DEBUG] Usuario desde sessionStorage:', this.usuarioActual);
      }
    }

    // 3. Verificar estructura del usuario
    if (this.usuarioActual) {
      console.log('🔍 [DEBUG] Estructura del usuario:', {
        id: this.usuarioActual.id,
        username: this.usuarioActual.username,
        name: this.usuarioActual.name,
        email: this.usuarioActual.email,
        roles: this.usuarioActual.roles,
        tipoDeRoles: typeof this.usuarioActual.roles,
        esArray: Array.isArray(this.usuarioActual.roles),
      });
    } else {
      console.log('🔍 [DEBUG] ⚠️ No se pudo cargar el usuario actual');
    }
  }

  // Método temporal para debug - LLÁMALO DESDE ngOnInit
  verificarAsignaciones(): void {
    console.log('🔍 [DEBUG] ========== VERIFICANDO ASIGNACIONES ==========');

    // Obtener todas las órdenes sin filtrar
    this.ordenServicioService.getAll().subscribe({
      next: response => {
        if (response.success) {
          const todasLasOrdenes = response.data;
          console.log('🔍 [DEBUG] Total órdenes en sistema:', todasLasOrdenes.length);

          const userId = this.usuarioActual?.id;
          if (userId) {
            const ordenesAsignadas = todasLasOrdenes.filter(orden =>
              orden.usuariosAsignados?.some(u => u.usuarioId === userId),
            );

            console.log('🔍 [DEBUG] Órdenes asignadas al usuario:', ordenesAsignadas.length);

            ordenesAsignadas.forEach(orden => {
              console.log(`🔍 [DEBUG] ✅ Asignada: ${orden.codigo}`, {
                estado: orden.estado,
                asignacion: orden.usuariosAsignados?.find(u => u.usuarioId === userId),
              });
            });

            const ordenesNoAsignadas = todasLasOrdenes.filter(
              orden => !orden.usuariosAsignados?.some(u => u.usuarioId === userId),
            );

            console.log('🔍 [DEBUG] Órdenes NO asignadas al usuario:', ordenesNoAsignadas.length);
            ordenesNoAsignadas.slice(0, 3).forEach(orden => {
              console.log(`🔍 [DEBUG] ❌ No asignada: ${orden.codigo}`);
            });
          }
        }
      },
    });
  }

  loadOrdenes(): void {
    this.loading = true;
    this.error = null;

    console.log('🔍 [DEBUG] ========== CARGANDO ÓRDENES ==========');
    console.log('🔍 [DEBUG] Usuario actual:', this.usuarioActual);
    console.log('🔍 [DEBUG] Roles del usuario:', this.authService.getUserRoles());
    console.log('🔍 [DEBUG] ¿Es mecánico?', this.authService.hasRole('mecanico'));
    console.log('🔍 [DEBUG] ¿Es lavacoches?', this.authService.hasRole('lavacoches'));
    console.log('🔍 [DEBUG] ¿Es admin?', this.authService.hasRole('admin'));
    console.log('🔍 [DEBUG] ¿Es recepcionista?', this.authService.hasRole('recepcionista'));

    this.ordenServicioService.getAll().subscribe({
      next: response => {
        console.log('🔍 [DEBUG] Respuesta del servidor:', response);

        if (response.success) {
          this.ordenes = response.data;
          console.log('🔍 [DEBUG] Total órdenes recibidas:', this.ordenes.length);

          // ✅ FILTRO AUTOMÁTICO POR ROL
          if (this.authService.hasAnyRole(['mecanico', 'lavacoches'])) {
            console.log('🔍 [DEBUG] === APLICANDO FILTRO PARA MECÁNICO/LAVACOCHES ===');
            const userId = this.usuarioActual?.id;
            console.log('🔍 [DEBUG] Usuario ID:', userId);

            if (userId) {
              // Mostrar todas las órdenes con sus asignaciones para debug
              // En el método donde se usa usuarioNombre
              this.ordenes.forEach(orden => {
                orden.usuariosAsignados?.forEach(u => {
                  // ✅ CORRECCIÓN
                  const nombreUsuario = u.nombreCompleto || u.userName || 'Sin nombre';
                  console.log(`Usuario: ${nombreUsuario} - Rol: ${u.rol}`);

                  // Si estás construyendo un objeto
                  const usuarioInfo = {
                    id: u.usuarioId,
                    nombre: u.nombreCompleto || u.userName || 'Sin nombre', // ← Aquí la corrección
                    rol: u.rol,
                    estado: u.estado
                  };
                });
              });

              this.ordenes = this.ordenes.filter(orden => {
                const tieneAsignacion = orden.usuariosAsignados?.some(u => u.usuarioId === userId);
                console.log(
                  `🔍 [DEBUG] Orden ${orden.codigo} - ¿Asignada a usuario?`,
                  tieneAsignacion,
                );
                return tieneAsignacion;
              });

              console.log('🔍 [DEBUG] Órdenes después del filtro:', this.ordenes.length);
            } else {
              console.log('🔍 [DEBUG] ⚠️ No hay userId, mostrando 0 órdenes');
              this.ordenes = [];
            }
          } else {
            console.log(
              '🔍 [DEBUG] Usuario no es mecánico/lavacoches, mostrando TODAS las órdenes',
            );
          }

          this.aplicarFiltros();
        } else {
          this.error = 'Error al cargar las órdenes';
        }
        this.loading = false;
      },
      error: err => {
        console.error('🔍 [DEBUG] ❌ Error en la petición:', err);
        this.error = 'Error al cargar las órdenes: ' + (err.message || 'Error desconocido');
        this.loading = false;
      },
    });
  }

  aplicarFiltros(): void {
    let resultado = [...this.ordenes];

    // Filtro por estado
    if (this.filtroEstado) {
      resultado = resultado.filter(o => o.estado === this.filtroEstado);
    }

    // Filtro por asignación
    if (this.filtroAsignacion) {
      switch (this.filtroAsignacion) {
        case 'ASIGNADAS':
          resultado = resultado.filter(o => o.usuariosAsignados && o.usuariosAsignados.length > 0);
          break;
        case 'SIN_ASIGNAR':
          resultado = resultado.filter(
            o => !o.usuariosAsignados || o.usuariosAsignados.length === 0,
          );
          break;
        case 'RECEPCIONISTA':
          resultado = resultado.filter(
            o =>
              o.usuariosAsignados &&
              o.usuariosAsignados.some(u => u.rol.toLowerCase().includes('recepcionista')),
          );
          break;
        case 'MECANICO':
          resultado = resultado.filter(
            o =>
              o.usuariosAsignados &&
              o.usuariosAsignados.some(
                u =>
                  u.rol.toLowerCase().includes('mecanico') ||
                  u.rol.toLowerCase().includes('mecanico'),
              ),
          );
          break;
        case 'lavacoches':
          resultado = resultado.filter(
            o =>
              o.usuariosAsignados &&
              o.usuariosAsignados.some(
                u =>
                  u.rol.toLowerCase().includes('lavacoches') ||
                  u.rol.toLowerCase().includes('lavacoches'),
              ),
          );
          break;
      }
    }

    // Filtro por mis órdenes
    if (this.filtrarMisOrdenes && this.usuarioActual?.id) {
      resultado = resultado.filter(
        o =>
          o.usuariosAsignados &&
          o.usuariosAsignados.some(u => u.usuarioId === this.usuarioActual.id),
      );
    }

    // Ordenamiento
    switch (this.ordenarPor) {
      case 'fecha':
        resultado.sort(
          (a, b) => new Date(b.creationTime).getTime() - new Date(a.creationTime).getTime(),
        );
        break;
      case 'codigo':
        resultado.sort((a, b) => a.codigo.localeCompare(b.codigo));
        break;
      case 'total':
        resultado.sort((a, b) => b.total - a.total);
        break;
      case 'estado':
        const ordenEstados = [
          'COTIZACION',
          'APROBADA',
          'EN_PROGRESO',
          'COMPLETADA',
          'FACTURADA',
          'CANCELADA',
        ];
        resultado.sort((a, b) => ordenEstados.indexOf(a.estado) - ordenEstados.indexOf(b.estado));
        break;
    }

    this.ordenesFiltradas = resultado;
  }

  limpiarFiltros(): void {
    this.filtroEstado = '';
    this.filtroAsignacion = '';
    this.ordenarPor = 'fecha';
    this.filtrarMisOrdenes = false;
    this.ordenesFiltradas = [...this.ordenes];
  }

  toggleFiltroUsuario(): void {
    this.mostrarFiltroUsuario = !this.mostrarFiltroUsuario;
    if (!this.mostrarFiltroUsuario) {
      this.filtrarMisOrdenes = false;
      this.aplicarFiltros();
    }
  }

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

  getRolBadgeClass(rol: string): string {
    const rolLower = rol.toLowerCase();
    if (rolLower.includes('recepcionista')) return 'badge-rol-recepcionista';
    if (rolLower.includes('mecanico') || rolLower.includes('mecanico')) return 'badge-rol-mecanico';
    if (rolLower.includes('lavacoches') || rolLower.includes('lavacoches'))
      return 'badge-rol-lavador';
    return 'badge-secondary';
  }

  getRolAbreviado(rol: string): string {
    const rolLower = rol.toLowerCase();
    if (rolLower.includes('recepcionista')) return 'REC';
    if (rolLower.includes('mecanico') || rolLower.includes('mecanico')) return 'MEC';
    if (rolLower.includes('lavacoches') || rolLower.includes('lavacoches')) return 'LAV';
    return rol.substring(0, 3).toUpperCase();
  }

  // Método para abrir el modal
  gestionarAsignaciones(orden: OrdenServicio): void {
    this.ordenSeleccionada = orden;
    this.mostrarModalAsignaciones = true;
  }

  // Método para cerrar el modal
  cerrarModalAsignaciones(): void {
    this.mostrarModalAsignaciones = false;
    this.ordenSeleccionada = null;
    // Recargar órdenes para ver cambios
    this.loadOrdenes();
  }

  deleteOrden(id: string): void {
    if (confirm('¿Está seguro de eliminar esta orden?')) {
      this.ordenServicioService.delete(id).subscribe({
        next: response => {
          if (response.success) {
            this.ordenes = this.ordenes.filter(o => o.id !== id);
            this.aplicarFiltros();
            alert(response.message);
          } else {
            alert('Error: ' + response.message);
          }
        },
        error: err => {
          alert('Error al eliminar: ' + err.message);
        },
      });
    }
  }

  exportarReporte(): void {
    alert('Funcionalidad de exportación en desarrollo');
  }

  getInicialUsuario(nombreCompleto: string): string {
    if (!nombreCompleto) return '?';
    const partes = nombreCompleto.split(' ');
    return (partes[0]?.charAt(0) || '') + (partes[1]?.charAt(0) || '');
  }

  contarPorEstado(orden: OrdenServicio, estado: string): number {
    return orden.usuariosAsignados?.filter(u => u.estado === estado).length || 0;
  }

  onGuardarAsignaciones(evento: any): void {
    console.log('Cambios guardados para orden:', evento.ordenId);
    // Si necesitas hacer algo después de guardar
    // Por ejemplo, recargar la lista de órdenes
    this.loadOrdenes();
  }
}
