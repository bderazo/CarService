import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
import { API_CONFIG } from './api.config';

export interface Cliente {
    id: string;
    cedula: string;
    nombre: string;
    telefono: string;
    email: string;
    direccion: string;
}

export interface CreateClienteDto {
    cedula: string;
    nombre: string;
    telefono: string;
    email: string;
    direccion: string;
}

export interface UpdateClienteDto {
    nombre: string;
    telefono: string;
    email: string;
    direccion: string;
}

@Injectable({
    providedIn: 'root'
})
export class ClienteService {
    private apiUrl = API_CONFIG.CLIENTES;

    constructor(private http: HttpClient) { }

    getAll(): Observable<{ success: boolean; data: Cliente[] }> {
        return this.http.get<{ success: boolean; data: Cliente[] }>(this.apiUrl);
    }

    getById(id: string): Observable<{ success: boolean; data: Cliente }> {
        return this.http.get<{ success: boolean; data: Cliente }>(`${this.apiUrl}/${id}`);
    }

    create(cliente: CreateClienteDto): Observable<{ success: boolean; message: string; data: Cliente }> {
        return this.http.post<{ success: boolean; message: string; data: Cliente }>(this.apiUrl, cliente)
            .pipe(
                catchError(error => {
                    // Manejar errores específicos
                    let errorMessage = 'Error desconocido';

                    if (error.status === 400) {
                        errorMessage = error.error?.error || 'Datos inválidos';
                    } else if (error.status === 500) {
                        errorMessage = error.error?.error || 'Error interno del servidor. Verifique que la cédula no esté duplicada.';
                    }

                    return throwError(() => new Error(errorMessage));
                })
            );
    }

    update(id: string, cliente: UpdateClienteDto): Observable<{ success: boolean; message: string; data: Cliente }> {
        return this.http.put<{ success: boolean; message: string; data: Cliente }>(`${this.apiUrl}/${id}`, cliente);
    }

    delete(id: string): Observable<{ success: boolean; message: string }> {
        return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/${id}`);
    }
}