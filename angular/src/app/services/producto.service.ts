import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from './api.config';

export interface Producto {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  precioCompra: number;
  precioVenta: number;
  stock: number;
  stockMinimo: number;
}

export interface CreateProductoDto {
  codigo: string;
  nombre: string;
  descripcion: string;
  precioCompra: number;
  precioVenta: number;
  stock: number;
  stockMinimo: number;
}

export interface UpdateProductoDto {
  codigo: string;
  nombre: string;
  descripcion: string;
  precioCompra: number;
  precioVenta: number;
  stock: number;
  stockMinimo: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProductoService {
  private apiUrl = API_CONFIG.PRODUCTOS;

  constructor(private http: HttpClient) { }

  getAll(): Observable<{ success: boolean; data: Producto[] }> {
    return this.http.get<{ success: boolean; data: Producto[] }>(this.apiUrl);
  }

  getById(id: string): Observable<{ success: boolean; data: Producto }> {
    return this.http.get<{ success: boolean; data: Producto }>(`${this.apiUrl}/${id}`);
  }

  getByStockBajo(): Observable<{ success: boolean; data: Producto[] }> {
    return this.http.get<{ success: boolean; data: Producto[] }>(`${this.apiUrl}/stock-bajo`);
  }

  create(producto: CreateProductoDto): Observable<{ success: boolean; message: string; data: Producto }> {
    return this.http.post<{ success: boolean; message: string; data: Producto }>(this.apiUrl, producto);
  }

  update(id: string, producto: UpdateProductoDto): Observable<{ success: boolean; message: string; data: Producto }> {
    return this.http.put<{ success: boolean; message: string; data: Producto }>(`${this.apiUrl}/${id}`, producto);
  }

  delete(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/${id}`);
  }

  ajustarStock(id: string, cantidad: number, tipo: 'entrada' | 'salida'): Observable<{ success: boolean; message: string; data: Producto }> {
    return this.http.post<{ success: boolean; message: string; data: Producto }>(`${this.apiUrl}/${id}/ajustar-stock`, {
      cantidad,
      tipo
    });
  }
}