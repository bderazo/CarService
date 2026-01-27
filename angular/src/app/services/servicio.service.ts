import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from './api.config';

export interface Servicio {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  precio: number;
}

export interface CreateServicioDto {
  codigo: string;
  nombre: string;
  descripcion: string;
  precio: number;
}

export interface UpdateServicioDto {
  codigo: string;
  nombre: string;
  descripcion: string;
  precio: number;
}

@Injectable({
  providedIn: 'root'
})
export class ServicioService {
  private apiUrl = API_CONFIG.SERVICIOS;

  constructor(private http: HttpClient) { }

  getAll(): Observable<{ success: boolean; data: Servicio[] }> {
    return this.http.get<{ success: boolean; data: Servicio[] }>(this.apiUrl);
  }

  getById(id: string): Observable<{ success: boolean; data: Servicio }> {
    return this.http.get<{ success: boolean; data: Servicio }>(`${this.apiUrl}/${id}`);
  }

  create(servicio: CreateServicioDto): Observable<{ success: boolean; message: string; data: Servicio }> {
    return this.http.post<{ success: boolean; message: string; data: Servicio }>(this.apiUrl, servicio);
  }

  update(id: string, servicio: UpdateServicioDto): Observable<{ success: boolean; message: string; data: Servicio }> {
    return this.http.put<{ success: boolean; message: string; data: Servicio }>(`${this.apiUrl}/${id}`, servicio);
  }

  delete(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/${id}`);
  }
}