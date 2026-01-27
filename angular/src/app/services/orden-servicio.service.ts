import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from './api.config';

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
  detalles: OrdenServicioDetalle[];
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
}

export interface CreateOrdenServicioDto {
  vehiculoId: string;
  estado: string;
  observaciones: string;
  detalles: CreateDetalleDto[];
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
}

export interface UpdateOrdenServicioDto {
  estado: string;
  observaciones: string;
  descuento: number;
  fechaSalida?: string;
}

export interface AgregarDetalleDto {
  servicioId?: string;
  productoId?: string;
  tipo: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  observaciones: string;
}

@Injectable({
  providedIn: 'root'
})
export class OrdenServicioService {
  private apiUrl = API_CONFIG.ORDENES_SERVICIO;

  constructor(private http: HttpClient) { }

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
    return this.http.get<{ success: boolean; data: OrdenServicio[] }>(`${this.apiUrl}/vehiculo/${vehiculoId}`);
  }

  // GET por Estado
  getByEstado(estado: string): Observable<{ success: boolean; data: OrdenServicio[] }> {
    return this.http.get<{ success: boolean; data: OrdenServicio[] }>(`${this.apiUrl}/estado/${estado}`);
  }

  // POST crear orden
  create(orden: CreateOrdenServicioDto): Observable<{ success: boolean; message: string; data: OrdenServicio }> {
    return this.http.post<{ success: boolean; message: string; data: OrdenServicio }>(this.apiUrl, orden);
  }

  // PUT actualizar orden
  update(id: string, orden: UpdateOrdenServicioDto): Observable<{ success: boolean; message: string; data: OrdenServicio }> {
    return this.http.put<{ success: boolean; message: string; data: OrdenServicio }>(`${this.apiUrl}/${id}`, orden);
  }

  // POST agregar detalle
  agregarDetalle(id: string, detalle: AgregarDetalleDto): Observable<{ success: boolean; message: string; data: OrdenServicio }> {
    return this.http.post<{ success: boolean; message: string; data: OrdenServicio }>(`${this.apiUrl}/${id}/detalles`, detalle);
  }

  // DELETE remover detalle
  removerDetalle(id: string, detalleId: string): Observable<{ success: boolean; message: string; data: OrdenServicio }> {
    return this.http.delete<{ success: boolean; message: string; data: OrdenServicio }>(`${this.apiUrl}/${id}/detalles/${detalleId}`);
  }

  // POST cambiar estado
  cambiarEstado(id: string, estado: string): Observable<{ success: boolean; message: string; data: OrdenServicio }> {
    return this.http.post<{ success: boolean; message: string; data: OrdenServicio }>(`${this.apiUrl}/${id}/cambiar-estado/${estado}`, {});
  }

  // DELETE orden
  delete(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/${id}`);
  }
}