// reportes.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportesService } from '../../services/reportes.service';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container mt-4">
      <h2>Reportes Administrativos</h2>
      <p class="text-muted">Análisis de ingresos y rendimiento</p>

      <!-- Filtros -->
      <div class="card mb-4">
        <div class="card-body">
          <div class="row g-3">
            <div class="col-md-4">
              <label class="form-label">Fecha Inicio</label>
              <input type="date" class="form-control" [(ngModel)]="filtros.fechaInicio" />
            </div>
            <div class="col-md-4">
              <label class="form-label">Fecha Fin</label>
              <input type="date" class="form-control" [(ngModel)]="filtros.fechaFin" />
            </div>
            <div class="col-md-4 d-flex align-items-end">
              <button class="btn btn-primary w-100" (click)="cargarReportes()">
                <i class="fas fa-sync-alt"></i> Actualizar
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div *ngIf="loading" class="text-center py-5">
        <div class="spinner-border text-primary"></div>
      </div>

      <!-- Contenido -->
      <div *ngIf="!loading">
        <!-- Gráfico de ingresos -->
        <div class="card mb-4">
          <div class="card-header">
            <h5 class="mb-0">Ingresos por Día</h5>
          </div>
          <div class="card-body">
            <canvas id="ingresosChart"></canvas>
          </div>
        </div>

        <div class="row">
          <!-- Servicios más usados -->
          <div class="col-md-6 mb-4">
            <div class="card h-100">
              <div class="card-header">
                <h5 class="mb-0">Servicios Más Usados</h5>
              </div>
              <div class="card-body">
                <canvas id="serviciosChart"></canvas>
              </div>
            </div>
          </div>

          <!-- Rendimiento de técnicos -->
          <div class="col-md-6 mb-4">
            <div class="card h-100">
              <div class="card-header">
                <h5 class="mb-0">Rendimiento de Técnicos</h5>
              </div>
              <div class="card-body">
                <div class="table-responsive">
                  <table class="table table-sm">
                    <thead>
                      <tr>
                        <th>Técnico</th>
                        <th class="text-end">Órdenes</th>
                        <th class="text-end">Facturado</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let item of rendimientoTecnicos">
                        <td>{{ item.nombre || 'N/A' }}</td>
                        <td class="text-end">{{ item.ordenesCompletadas }}</td>
                        <td class="text-end">{{ item.totalFacturado | currency }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tabla resumen -->
        <div class="card">
          <div class="card-header">
            <h5 class="mb-0">Resumen del Período</h5>
          </div>
          <div class="card-body">
            <div class="row">
              <div class="col-md-3">
                <div class="border p-3 text-center">
                  <h6>Total Ingresos</h6>
                  <h3>{{ totalIngresos | currency }}</h3>
                </div>
              </div>
              <div class="col-md-3">
                <div class="border p-3 text-center">
                  <h6>Órdenes Completadas</h6>
                  <h3>{{ totalOrdenes }}</h3>
                </div>
              </div>
              <div class="col-md-3">
                <div class="border p-3 text-center">
                  <h6>Servicio Más Usado</h6>
                  <h6>{{ servicioTop?.nombre || 'N/A' }}</h6>
                  <small>{{ servicioTop?.cantidad || 0 }} veces</small>
                </div>
              </div>
              <div class="col-md-3">
                <div class="border p-3 text-center">
                  <h6>Mejor Técnico</h6>
                  <h6>{{ mejorTecnico?.nombre || 'N/A' }}</h6>
                  <small>{{ mejorTecnico?.ordenesCompletadas || 0 }} órdenes</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ReportesComponent implements OnInit {
  loading = false;

  filtros = {
    fechaInicio: new Date(new Date().setDate(new Date().getDate() - 30))
      .toISOString()
      .split('T')[0],
    fechaFin: new Date().toISOString().split('T')[0],
  };

  ingresosData: any[] = [];
  serviciosData: any[] = [];
  rendimientoTecnicos: any[] = [];

  // Gráficos
  ingresosChart: any;
  serviciosChart: any;

  constructor(private reportesService: ReportesService) {}

  ngOnInit(): void {
    this.cargarReportes();
  }

  cargarReportes(): void {
    this.loading = true;

    console.log('📊 Cargando reportes...');

    Promise.all([
      this.reportesService.getIngresos(this.filtros.fechaInicio, this.filtros.fechaFin).toPromise(),
      this.reportesService
        .getServiciosMasUsados(10, this.filtros.fechaInicio, this.filtros.fechaFin)
        .toPromise(),
      this.reportesService
        .getRendimientoTecnicos(this.filtros.fechaInicio, this.filtros.fechaFin)
        .toPromise(),
    ])
      .then(([ingresos, servicios, tecnicos]) => {
        console.log('📦 Ingresos:', ingresos);
        console.log('📦 Servicios:', servicios);
        console.log('📦 Técnicos:', tecnicos);

        if (ingresos?.success) {
          this.ingresosData = ingresos.data || [];
          console.log('✅ Ingresos data:', this.ingresosData);
        }

        if (servicios?.success) {
          this.serviciosData = servicios.data || [];
          console.log('✅ Servicios data:', this.serviciosData);
        }

        if (tecnicos?.success) {
          this.rendimientoTecnicos = tecnicos.data || [];
          console.log('✅ Técnicos data:', this.rendimientoTecnicos);
        }

        setTimeout(() => {
          if (this.ingresosData.length > 0 || this.serviciosData.length > 0) {
            this.crearGraficos();
          }
        }, 100);

        this.loading = false;
      })
      .catch(error => {
        console.error('❌ Error:', error);
        this.loading = false;
      });
  }

  crearGraficos(): void {
    // Destruir gráficos existentes
    if (this.ingresosChart) this.ingresosChart.destroy();
    if (this.serviciosChart) this.serviciosChart.destroy();

    // Gráfico de ingresos
    const ingresosCtx = document.getElementById('ingresosChart') as HTMLCanvasElement;
    if (ingresosCtx && this.ingresosData.length) {
      this.ingresosChart = new Chart(ingresosCtx, {
        type: 'line',
        data: {
          labels: this.ingresosData.map(d => d.fecha),
          datasets: [
            {
              label: 'Ingresos',
              data: this.ingresosData.map(d => d.total),
              borderColor: 'rgb(75, 192, 192)',
              tension: 0.1,
            },
          ],
        },
      });
    }

    // Gráfico de servicios
    const serviciosCtx = document.getElementById('serviciosChart') as HTMLCanvasElement;
    if (serviciosCtx && this.serviciosData.length) {
      this.serviciosChart = new Chart(serviciosCtx, {
        type: 'bar',
        data: {
          labels: this.serviciosData.map(s => s.nombre),
          datasets: [
            {
              label: 'Cantidad',
              data: this.serviciosData.map(s => s.cantidad),
              backgroundColor: 'rgba(54, 162, 235, 0.5)',
            },
          ],
        },
        options: {
          indexAxis: 'y',
        },
      });
    }
  }

  get totalIngresos(): number {
    return this.ingresosData.reduce((sum, d) => sum + d.total, 0);
  }

  get totalOrdenes(): number {
    return this.ingresosData.reduce((sum, d) => sum + d.cantidad, 0);
  }

  get servicioTop(): any {
    return this.serviciosData[0];
  }

  get mejorTecnico(): any {
    return this.rendimientoTecnicos[0];
  }
}
