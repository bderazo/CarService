// services/orden-servicio.service.ts - Interfaces actualizadas
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from './api.config';

export interface UsuarioAsignado {
  id: string;
  ordenServicioId: string;
  usuarioId: string;
  usuarioNombre: string;
  usuarioUserName: string;
  rol: string;
  estado: string;
  fechaAsignacion: string;
  fechaCompletado?: string;
  observaciones?: string;
}

export interface OrdenServicio {
  id: string;
  codigo: string;
  vehiculoId: string;
  placaVehiculo: string;
  clienteId?: string;
  clienteNombre: string;
  fechaEntrada: string;
  fechaSalida?: string;
  estado: string;
  observaciones: string;
  subtotalServicios: number;
  subtotalProductos: number;
  descuento: number;
  impuesto: number;
  total: number;
  duracionTotalEstimada: number;
  detalles: OrdenServicioDetalle[];
  usuariosAsignados?: UsuarioAsignado[];
  creationTime: string;
}

export interface OrdenServicioDetalle {
  id: string;
  servicioId?: string;
  productoId?: string;
  tipo: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  observaciones: string;
  duracionEstimada?: number;
  usuariosAsignadosIds?: string[];
}

export interface CreateOrdenServicioDto {
  vehiculoId: string;
  estado: string;
  observaciones: string;
  detalles: CreateDetalleDto[];
  usuariosAsignados?: Array<{
    usuarioId: string;
    rol: string;
    observaciones?: string;
  }>;
}

export interface CreateDetalleDto {
  servicioId?: string;
  productoId?: string;
  tipo: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  observaciones: string;
  subtotal: number;
  usuariosAsignadosIds?: string[];
}

export interface UpdateOrdenServicioDto {
  estado: string;
  observaciones: string;
  descuento: number;
  fechaSalida?: string;
  usuariosAsignadosIds?: string[];
}

export interface AgregarDetalleDto {
  servicioId?: string;
  productoId?: string;
  tipo: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  observaciones: string;
  usuariosAsignadosIds?: string[];
}

export interface AsignarUsuarioDto {
  usuarioId: string;
  rol: string;
  observaciones?: string;
}

export interface ActualizarAsignacionDto {
  estado: 'ASIGNADO' | 'COMPLETADO' | 'CANCELADO';
  observaciones?: string;
}

@Injectable({
  providedIn: 'root',
})
export class OrdenServicioService {
  private apiUrl = API_CONFIG.ORDENES_SERVICIO;

  constructor(private http: HttpClient) {}

  // GET todas las órdenes
  getAll(): Observable<{ success: boolean; data: OrdenServicio[] }> {
    return this.http.get<{ success: boolean; data: OrdenServicio[] }>(this.apiUrl);
  }

  // GET por ID
  getById(id: string): Observable<{ success: boolean; data: OrdenServicio }> {
    return this.http.get<{ success: boolean; data: OrdenServicio }>(`${this.apiUrl}/${id}`);
  }

  // GET por Vehículo
  getByVehiculo(vehiculoId: string): Observable<{ success: boolean; data: OrdenServicio[] }> {
    return this.http.get<{ success: boolean; data: OrdenServicio[] }>(
      `${this.apiUrl}/vehiculo/${vehiculoId}`,
    );
  }

  // GET por Estado
  getByEstado(estado: string): Observable<{ success: boolean; data: OrdenServicio[] }> {
    return this.http.get<{ success: boolean; data: OrdenServicio[] }>(
      `${this.apiUrl}/estado/${estado}`,
    );
  }

  // POST crear orden
  create(
    orden: CreateOrdenServicioDto,
  ): Observable<{ success: boolean; message: string; data: OrdenServicio }> {
    return this.http.post<{ success: boolean; message: string; data: OrdenServicio }>(
      this.apiUrl,
      orden,
    );
  }

  // PUT actualizar orden
  update(
    id: string,
    orden: UpdateOrdenServicioDto,
  ): Observable<{ success: boolean; message: string; data: OrdenServicio }> {
    return this.http.put<{ success: boolean; message: string; data: OrdenServicio }>(
      `${this.apiUrl}/${id}`,
      orden,
    );
  }

  // POST agregar detalle
  agregarDetalle(
    id: string,
    detalle: AgregarDetalleDto,
  ): Observable<{ success: boolean; message: string; data: OrdenServicio }> {
    return this.http.post<{ success: boolean; message: string; data: OrdenServicio }>(
      `${this.apiUrl}/${id}/detalles`,
      detalle,
    );
  }

  // DELETE remover detalle
  removerDetalle(
    id: string,
    detalleId: string,
  ): Observable<{ success: boolean; message: string; data: OrdenServicio }> {
    return this.http.delete<{ success: boolean; message: string; data: OrdenServicio }>(
      `${this.apiUrl}/${id}/detalles/${detalleId}`,
    );
  }

  // POST cambiar estado
  cambiarEstado(
    id: string,
    estado: string,
  ): Observable<{ success: boolean; message: string; data: OrdenServicio }> {
    return this.http.post<{ success: boolean; message: string; data: OrdenServicio }>(
      `${this.apiUrl}/${id}/cambiar-estado/${estado}`,
      {},
    );
  }

  // DELETE orden
  delete(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/${id}`);
  }

  // --- NUEVOS MÉTODOS PARA GESTIÓN DE ASIGNACIONES ---

  // POST asignar usuario a orden
  asignarUsuario(
    ordenId: string,
    asignacion: AsignarUsuarioDto,
  ): Observable<{ success: boolean; message: string; data: UsuarioAsignado }> {
    return this.http.post<{ success: boolean; message: string; data: UsuarioAsignado }>(
      `${this.apiUrl}/${ordenId}/asignar-usuario`,
      asignacion,
    );
  }

  // PUT actualizar asignación de usuario
  actualizarAsignacion(
    id: string,
    usuarioId: string,
    actualizacion: ActualizarAsignacionDto,
  ): Observable<{ success: boolean; message: string; data: OrdenServicio }> {
    return this.http.put<{ success: boolean; message: string; data: OrdenServicio }>(
      `${this.apiUrl}/${id}/asignaciones/${usuarioId}`,
      actualizacion,
    );
  }

  // DELETE remover asignación
  removerAsignacion(
    id: string,
    usuarioId: string,
  ): Observable<{ success: boolean; message: string; data: OrdenServicio }> {
    return this.http.delete<{ success: boolean; message: string; data: OrdenServicio }>(
      `${this.apiUrl}/${id}/asignaciones/${usuarioId}`,
    );
  }

  // GET usuarios asignados a orden
  getUsuariosAsignados(ordenId: string): Observable<{ success: boolean; data: UsuarioAsignado[] }> {
    return this.http.get<{ success: boolean; data: UsuarioAsignado[] }>(
      `${this.apiUrl}/${ordenId}/usuarios-asignados`,
    );
  }

  // GET órdenes por usuario asignado
  getByUsuarioAsignado(usuarioId: string): Observable<{ success: boolean; data: OrdenServicio[] }> {
    return this.http.get<{ success: boolean; data: OrdenServicio[] }>(
      `${this.apiUrl}/usuario/${usuarioId}`,
    );
  }
}
