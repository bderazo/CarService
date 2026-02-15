// services/role.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, catchError, Observable, throwError } from 'rxjs';
import { API_CONFIG } from './api.config';

export interface Role {
    id: string;
    name: string;
    isDefault: boolean;
    isPublic: boolean;
    concurrencyStamp?: string;
    isStatic?: boolean;
    description?: string;
    extraProperties?: { [key: string]: any };
}

export interface CreateRoleDto {
    name: string;
    isDefault: boolean;
    isPublic: boolean;
    description?: string;
}

export interface UpdateRoleDto {
    name: string;
    isDefault: boolean;
    isPublic: boolean;
    concurrencyStamp?: string;
    description?: string;
}

@Injectable({
    providedIn: 'root'
})
export class RoleService {
    private apiUrl = API_CONFIG.ROLES;

    constructor(private http: HttpClient) { }

    // GET /api/identity/roles/all
    getAll(): Observable<{ success: boolean; data: Role[] }> {
        return this.http.get<any>(`${this.apiUrl}/all`)
            .pipe(
                map(response => {
                    // Transformar respuesta ABP a tu estructura esperada
                    if (response && typeof response === 'object') {
                        if ('items' in response) {
                            // Es estructura ABP { totalCount, items }
                            return {
                                success: true,
                                data: response.items || []
                            };
                        } else if (Array.isArray(response)) {
                            // Es directamente un array
                            return {
                                success: true,
                                data: response
                            };
                        }
                    }
                    return { success: false, data: [] };
                }),
                catchError(error => {
                    const errorMessage = this.getErrorMessage(error);
                    return throwError(() => new Error(errorMessage));
                })
            );
    }

    // GET /api/identity/roles (paginated)
    getPaginated(skipCount: number = 0, maxResultCount: number = 10): 
        Observable<{ success: boolean; data: Role[]; totalCount: number }> {
        const params = {
            SkipCount: skipCount.toString(),
            MaxResultCount: maxResultCount.toString()
        };

        return this.http.get<any>(this.apiUrl, { params })
            .pipe(
                map(response => {
                    if (response && 'items' in response) {
                        return {
                            success: true,
                            data: response.items || [],
                            totalCount: response.totalCount || 0
                        };
                    }
                    return { success: false, data: [], totalCount: 0 };
                }),
                catchError(error => {
                    const errorMessage = this.getErrorMessage(error);
                    return throwError(() => new Error(errorMessage));
                })
            );
    }

    // GET /api/identity/roles/{id}
    getById(id: string): Observable<{ success: boolean; data: Role }> {
        return this.http.get<Role>(`${this.apiUrl}/${id}`)
            .pipe(
                map(role => ({ 
                    success: true, 
                    data: role 
                })),
                catchError(error => {
                    const errorMessage = this.getErrorMessage(error);
                    return throwError(() => new Error(errorMessage));
                })
            );
    }

    // POST /api/identity/roles
    create(role: CreateRoleDto): Observable<{ success: boolean; message: string; data: Role }> {
        return this.http.post<Role>(this.apiUrl, role)
            .pipe(
                map(createdRole => ({
                    success: true,
                    message: 'Rol creado exitosamente',
                    data: createdRole
                })),
                catchError(error => {
                    const errorMessage = this.getErrorMessage(error);
                    return throwError(() => new Error(errorMessage));
                })
            );
    }

    // PUT /api/identity/roles/{id}
    update(id: string, role: UpdateRoleDto): Observable<{ success: boolean; message: string; data: Role }> {
        return this.http.put<Role>(`${this.apiUrl}/${id}`, role)
            .pipe(
                map(updatedRole => ({
                    success: true,
                    message: 'Rol actualizado exitosamente',
                    data: updatedRole
                })),
                catchError(error => {
                    const errorMessage = this.getErrorMessage(error);
                    return throwError(() => new Error(errorMessage));
                })
            );
    }

    // DELETE /api/identity/roles/{id}
    delete(id: string): Observable<{ success: boolean; message: string }> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`)
            .pipe(
                map(() => ({
                    success: true,
                    message: 'Rol eliminado exitosamente'
                })),
                catchError(error => {
                    const errorMessage = this.getErrorMessage(error);
                    return throwError(() => new Error(errorMessage));
                })
            );
    }

    // GET /api/identity/roles/{id}/permissions (opcional)
    getRolePermissions(id: string): Observable<{ success: boolean; data: any }> {
        return this.http.get<any>(`${this.apiUrl}/${id}/permissions`)
            .pipe(
                map(response => ({
                    success: true,
                    data: response
                })),
                catchError(error => {
                    const errorMessage = this.getErrorMessage(error);
                    return throwError(() => new Error(errorMessage));
                })
            );
    }

    // PUT /api/identity/roles/{id}/permissions (opcional)
    updateRolePermissions(id: string, permissions: any): Observable<{ success: boolean; message: string }> {
        return this.http.put<void>(`${this.apiUrl}/${id}/permissions`, permissions)
            .pipe(
                map(() => ({
                    success: true,
                    message: 'Permisos actualizados exitosamente'
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
            return 'Rol no encontrado';
        } else if (error.status === 409) {
            return 'El nombre del rol ya existe';
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