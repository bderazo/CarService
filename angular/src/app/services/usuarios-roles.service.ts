// services/usuarios-roles.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, catchError, Observable, throwError } from 'rxjs';
import { API_CONFIG } from './api.config';

export interface UsuarioInfo {
  id: string;
  userName: string;
  name: string;
  surname: string;
  email: string;
  phoneNumber: string;
  roles: string[];
}

@Injectable({
  providedIn: 'root',
})
export class UsuariosRolesService {
  private apiUrl = API_CONFIG.USUARIOS;
  private url = '';

  constructor(private http: HttpClient) {}

  // Obtener usuarios por rol
  getUsuariosPorRol(rolNombre: string): Observable<{ success: boolean; data: UsuarioInfo[] }> {
    return this.http.get<any>(`${this.apiUrl}`).pipe(
      map(response => {
        if (response && 'items' in response) {
          // Filtrar usuarios que tienen el rol específico
          const usuarios = response.items || [];
          const usuariosConRol = usuarios.filter(
            (usuario: any) => usuario.roles && usuario.roles.includes(rolNombre),
          );

          return {
            success: true,
            data: usuariosConRol.map((u: any) => ({
              id: u.id,
              userName: u.userName,
              name: u.name,
              surname: u.surname,
              email: u.email,
              phoneNumber: u.phoneNumber,
              roles: u.roles || [],
            })),
          };
        }
        return { success: false, data: [] };
      }),
      catchError(this.handleError),
    );
  }

  getUsuariosAsignables(): Observable<{
    success: boolean;
    data: any[];
    items?: any[];
    totalCount?: number;
  }> {
    return this.http.get<{ success: boolean; data: any[]; items?: any[]; totalCount?: number }>(
      `${this.apiUrl}`,
    );
  }

  getUsuariosDisponibles(
    ordenId?: string,
  ): Observable<{ success: boolean; data: any[]; items?: any[]; totalCount?: number }> {
    this.url = `${this.apiUrl}/usuarios-disponibles`; // ✅ CAMBIADO

    // Si apiUrl es '/api/identity/users', necesitas cambiarlo
    // Mejor usa la URL del controlador de órdenes:
    const baseUrl = '/api/ordenes-servicio'; // ✅ NUEVA URL

    this.url = `${baseUrl}/usuarios-disponibles`;

    if (ordenId) {
      this.url += `?ordenId=${ordenId}`;
    }

    return this.http.get<{ success: boolean; data: any[]; items?: any[]; totalCount?: number }>(
      this.url,
    );
  }

  // Obtener usuario por ID
  getUsuarioById(id: string): Observable<{ success: boolean; data: UsuarioInfo }> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(response => ({
        success: true,
        data: {
          id: response.id,
          userName: response.userName,
          name: response.name,
          surname: response.surname,
          email: response.email,
          phoneNumber: response.phoneNumber,
          roles: response.roles || [],
        },
      })),
      catchError(this.handleError),
    );
  }

  private handleError(error: any): Observable<never> {
    let errorMessage = 'Error desconocido';

    if (error.status === 400) {
      errorMessage = error.error?.error?.message || 'Datos inválidos';
    } else if (error.status === 404) {
      errorMessage = 'Recurso no encontrado';
    } else if (error.status === 500) {
      errorMessage = 'Error interno del servidor';
    }

    return throwError(() => new Error(errorMessage));
  }
}
