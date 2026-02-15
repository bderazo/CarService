// services/user.service.ts - Versión completa adaptada a ABP
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, catchError, Observable, throwError } from 'rxjs';
import { API_CONFIG } from './api.config';

export interface User {
    id: string;
    userName: string;
    email: string;
    name: string;
    surname: string;
    phoneNumber: string;
    isActive: boolean;
    lockoutEnabled: boolean;
    twoFactorEnabled: boolean;
    roles?: string[];
    concurrencyStamp?: string;
    emailConfirmed?: boolean;
    phoneNumberConfirmed?: boolean;
}

export interface CreateUserDto {
    userName: string;
    email: string;
    name: string;
    surname: string;
    phoneNumber: string;
    password: string;
    isActive: boolean;
    lockoutEnabled: boolean;
    twoFactorEnabled: boolean;
}

export interface UpdateUserDto {
    email: string;
    name: string;
    surname: string;
    phoneNumber: string;
    isActive: boolean;
    lockoutEnabled: boolean;
    twoFactorEnabled: boolean;
    concurrencyStamp?: string;
}

export interface Role {
    id: string;
    name: string;
    isDefault: boolean;
    isPublic: boolean;
}

// Interfaz para respuestas ABP
interface AbpListResponse<T> {
    totalCount: number;
    items: T[];
}

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private apiUrl = API_CONFIG.USUARIOS;

    constructor(private http: HttpClient) { }

    // Método helper para normalizar respuestas ABP
    private normalizeResponse<T>(data: any): { success: boolean; data: T } {
        // Si es una respuesta de lista ABP
        if (data && typeof data === 'object' && 'items' in data) {
            return {
                success: true,
                data: data.items as T
            };
        }
        // Si ya es la estructura esperada
        if (data && typeof data === 'object' && 'success' in data) {
            return data;
        }
        // Si es un objeto simple
        return {
            success: true,
            data: data as T
        };
    }

    // GET /api/identity/users
    getAll(): Observable<{ success: boolean; data: User[] }> {
        return this.http.get<AbpListResponse<User>>(this.apiUrl)
            .pipe(
                map(response => this.normalizeResponse<User[]>(response)),
                catchError(error => {
                    const errorMessage = this.getErrorMessage(error);
                    return throwError(() => new Error(errorMessage));
                })
            );
    }

    // GET /api/identity/users/{id}
    getById(id: string): Observable<{ success: boolean; data: User }> {
        return this.http.get<User>(`${this.apiUrl}/${id}`)
            .pipe(
                map(user => ({ success: true, data: user })),
                catchError(error => {
                    const errorMessage = this.getErrorMessage(error);
                    return throwError(() => new Error(errorMessage));
                })
            );
    }

    // POST /api/identity/users
    create(user: CreateUserDto): Observable<{ success: boolean; message: string; data: User }> {
        return this.http.post<User>(this.apiUrl, user)
            .pipe(
                map(createdUser => ({
                    success: true,
                    message: 'Usuario creado exitosamente',
                    data: createdUser
                })),
                catchError(error => {
                    const errorMessage = this.getErrorMessage(error);
                    return throwError(() => new Error(errorMessage));
                })
            );
    }

    // PUT /api/identity/users/{id}
    update(id: string, user: UpdateUserDto): Observable<{ success: boolean; message: string; data: User }> {
        return this.http.put<User>(`${this.apiUrl}/${id}`, user)
            .pipe(
                map(updatedUser => ({
                    success: true,
                    message: 'Usuario actualizado exitosamente',
                    data: updatedUser
                })),
                catchError(error => {
                    const errorMessage = this.getErrorMessage(error);
                    return throwError(() => new Error(errorMessage));
                })
            );
    }

    // DELETE /api/identity/users/{id}
    delete(id: string): Observable<{ success: boolean; message: string }> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`)
            .pipe(
                map(() => ({
                    success: true,
                    message: 'Usuario eliminado exitosamente'
                })),
                catchError(error => {
                    const errorMessage = this.getErrorMessage(error);
                    return throwError(() => new Error(errorMessage));
                })
            );
    }

    // GET /api/identity/users/{id}/roles
    getUserRoles(id: string): Observable<{ success: boolean; data: string[] }> {
        return this.http.get<AbpListResponse<string>>(`${this.apiUrl}/${id}/roles`)
            .pipe(
                map(response => ({
                    success: true,
                    data: response.items || []
                })),
                catchError(error => {
                    const errorMessage = this.getErrorMessage(error);
                    return throwError(() => new Error(errorMessage));
                })
            );
    }

    // GET /api/identity/users/assignable-roles
    getAssignableRoles(): Observable<{ success: boolean; data: Role[] }> {
        return this.http.get<AbpListResponse<Role>>(`${this.apiUrl}/assignable-roles`)
            .pipe(
                map(response => ({
                    success: true,
                    data: response.items || []
                })),
                catchError(error => {
                    const errorMessage = this.getErrorMessage(error);
                    return throwError(() => new Error(errorMessage));
                })
            );
    }

    // PUT /api/identity/users/{id}/roles
    updateUserRoles(id: string, roles: string[]): Observable<{ success: boolean; message: string }> {
        return this.http.put<void>(`${this.apiUrl}/${id}/roles`, { roleNames: roles })
            .pipe(
                map(() => ({
                    success: true,
                    message: 'Roles actualizados exitosamente'
                })),
                catchError(error => {
                    const errorMessage = this.getErrorMessage(error);
                    return throwError(() => new Error(errorMessage));
                })
            );
    }

    private getErrorMessage(error: any): string {
        if (error.status === 400) {
            return error.error?.error?.message || error.error?.message || 'Datos inválidos';
        } else if (error.status === 404) {
            return 'Recurso no encontrado';
        } else if (error.status === 409) {
            return 'El nombre de usuario o correo ya existe';
        } else if (error.status === 500) {
            return 'Error interno del servidor';
        } else if (error.error?.error?.message) {
            return error.error.error.message;
        } else if (error.error?.message) {
            return error.error.message;
        }
        return 'Error desconocido';
    }
}