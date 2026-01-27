import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from './api.config';

export interface Vehiculo {
  id: string;
  placa: string;
  marca: string;
  modelo: string;
  anio: number;
  color: string;
  clienteId: string;
  clienteNombre?: string;
}

export interface CreateVehiculoDto {
  placa: string;
  marca: string;
  modelo: string;
  anio: number;
  color: string;
  clienteId: string;
}

export interface UpdateVehiculoDto {
  placa: string;
  marca: string;
  modelo: string;
  anio: number;
  color: string;
  clienteId: string;
}

@Injectable({
  providedIn: 'root'
})
export class VehiculoService {
  private apiUrl = API_CONFIG.VEHICULOS;

  constructor(private http: HttpClient) { }

  getAll(): Observable<{ success: boolean; data: Vehiculo[] }> {
    return this.http.get<{ success: boolean; data: Vehiculo[] }>(this.apiUrl);
  }

  getById(id: string): Observable<{ success: boolean; data: Vehiculo }> {
    return this.http.get<{ success: boolean; data: Vehiculo }>(`${this.apiUrl}/${id}`);
  }

  getByCliente(clienteId: string): Observable<{ success: boolean; data: Vehiculo[] }> {
    return this.http.get<{ success: boolean; data: Vehiculo[] }>(`${this.apiUrl}/cliente/${clienteId}`);
  }

  create(vehiculo: CreateVehiculoDto): Observable<{ success: boolean; message: string; data: Vehiculo }> {
    return this.http.post<{ success: boolean; message: string; data: Vehiculo }>(this.apiUrl, vehiculo);
  }

  update(id: string, vehiculo: UpdateVehiculoDto): Observable<{ success: boolean; message: string; data: Vehiculo }> {
    return this.http.put<{ success: boolean; message: string; data: Vehiculo }>(`${this.apiUrl}/${id}`, vehiculo);
  }

  delete(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/${id}`);
  }
}