// reportes.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ReportesService {
  private baseUrl = '/api/ordenes-servicio/reportes';

  constructor(private http: HttpClient) {}

  getIngresos(fechaInicio?: string, fechaFin?: string): Observable<any> {
    let url = `${this.baseUrl}/ingresos`;
    const params = new URLSearchParams();
    if (fechaInicio) params.set('fechaInicio', fechaInicio);
    if (fechaFin) params.set('fechaFin', fechaFin);
    if (params.toString()) url += `?${params.toString()}`;
    return this.http.get(url);
  }

  getServiciosMasUsados(
    top: number = 10,
    fechaInicio?: string,
    fechaFin?: string,
  ): Observable<any> {
    let url = `${this.baseUrl}/servicios-mas-usados?top=${top}`;
    if (fechaInicio) url += `&fechaInicio=${fechaInicio}`;
    if (fechaFin) url += `&fechaFin=${fechaFin}`;
    return this.http.get(url);
  }

  getRendimientoTecnicos(fechaInicio?: string, fechaFin?: string): Observable<any> {
    let url = `${this.baseUrl}/rendimiento-tecnicos`;
    const params = new URLSearchParams();
    if (fechaInicio) params.set('fechaInicio', fechaInicio);
    if (fechaFin) params.set('fechaFin', fechaFin);
    if (params.toString()) url += `?${params.toString()}`;
    return this.http.get(url);
  }
}
