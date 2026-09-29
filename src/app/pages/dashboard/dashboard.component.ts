import { Component, inject, OnInit } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { forkJoin } from 'rxjs';
import { ChartModule } from 'primeng/chart';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { MessageModule } from 'primeng/message';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../../core/services/auth.service';
import { CuentaService } from '../../core/services/cuenta.service';
import { IngresoService } from '../../core/services/ingreso.service';
import { GastoService } from '../../core/services/gasto.service';
import { AlertaService } from '../../core/services/alerta.service';
import { AlertaResponse, CuentaResponse, GastoResponse, IngresoResponse } from '../../core/models/api.models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [ChartModule, TableModule, CardModule, TagModule, MessageModule, ButtonModule, CurrencyPipe, DatePipe],
  template: `
    <section class="page">
      <div class="page-header">
        <div>
          <h1>Dashboard</h1>
          <p class="muted">Resumen mensual de tus finanzas.</p>
        </div>
        <div class="month-nav">
          <p-button icon="pi pi-chevron-left" [text]="true" [rounded]="true" (onClick)="changeMonth(-1)" />
          <span class="month-label">{{ selectedMonth | date:'MMMM yyyy' }}</span>
          <p-button icon="pi pi-chevron-right" [text]="true" [rounded]="true" (onClick)="changeMonth(1)" />
        </div>
      </div>

      @if (errorMessage) {
        <p-message severity="warn" styleClass="w-full mb-3">{{ errorMessage }}</p-message>
      }

      <div class="grid grid-4">
        <div class="card">
          <div class="muted">Saldo total</div>
          <div class="stat-value">{{ saldoTotal | currency:'PEN':'symbol':'1.2-2' }}</div>
        </div>
        <div class="card">
          <div class="muted">Ingresos del mes</div>
          <div class="stat-value">{{ totalIngresos | currency:'PEN':'symbol':'1.2-2' }}</div>
        </div>
        <div class="card">
          <div class="muted">Gastos del mes</div>
          <div class="stat-value">{{ totalGastos | currency:'PEN':'symbol':'1.2-2' }}</div>
        </div>
        <div class="card">
          <div class="muted">Balance del mes</div>
          <div class="stat-value">{{ balance | currency:'PEN':'symbol':'1.2-2' }}</div>
        </div>
      </div>

      <div class="grid grid-2" style="margin-top: 1rem">
        <div class="card">
          <h3>Ingresos vs gastos del mes</h3>
          <p-chart type="bar" [data]="balanceChart" [options]="chartOptions" />
        </div>
        <div class="card">
          <h3>Gastos del mes por categoría</h3>
          <p-chart type="doughnut" [data]="categoryChart" [options]="chartOptions" />
        </div>
      </div>

      <div class="card" style="margin-top: 1rem">
        <h3>Alertas activas</h3>
        <p-table [value]="alertas" [tableStyle]="{'min-width':'100%'}">
          <ng-template #header>
            <tr>
              <th>Descripción</th>
              <th>Tipo</th>
              <th>Fecha</th>
            </tr>
          </ng-template>
          <ng-template #body let-alerta>
            <tr>
              <td>{{ alerta.descripcion }}</td>
              <td><p-tag [value]="alerta.tipo" severity="warn" /></td>
              <td>{{ alerta.fechaAlerta | date:'dd/MM/yyyy' }}</td>
            </tr>
          </ng-template>
          <ng-template #emptymessage>
            <tr><td colspan="3">No hay alertas activas.</td></tr>
          </ng-template>
        </p-table>
      </div>
    </section>
  `
})
export class DashboardComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly cuentasService = inject(CuentaService);
  private readonly ingresosService = inject(IngresoService);
  private readonly gastosService = inject(GastoService);
  private readonly alertasService = inject(AlertaService);

  cuentas: CuentaResponse[] = [];
  ingresos: IngresoResponse[] = [];
  gastos: GastoResponse[] = [];
  alertas: AlertaResponse[] = [];
  totalIngresos = 0;
  totalGastos = 0;
  saldoTotal = 0;
  balance = 0;
  errorMessage = '';
  selectedMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  balanceChart: any;
  categoryChart: any;
  chartOptions: any = {
    responsive: true,
    maintainAspectRatio: false
  };

  ngOnInit(): void {
    this.auth.resolveUserId().subscribe(id => {
      if (!id) {
        this.errorMessage = 'No se pudo identificar al usuario autenticado.';
        return;
      }

      this.cuentasService.listarPorUsuario(id).subscribe({
        next: cuentas => {
          this.cuentas = cuentas;
          this.saldoTotal = cuentas.reduce((sum, c) => sum + Number(c.saldoActual || 0), 0);
          if (cuentas.length) {
            forkJoin({
              ingresos: forkJoin(cuentas.map(c => this.ingresosService.listarPorCuenta(c.id))),
              gastos: forkJoin(cuentas.map(c => this.gastosService.listarPorCuenta(c.id)))
            }).subscribe({
              next: result => {
                this.ingresos = result.ingresos.flat();
                this.gastos = result.gastos.flat();
                this.recalculateMonth();
              },
              error: () => this.errorMessage = 'No se pudieron cargar los movimientos.'
            });
          } else {
            this.buildBalanceChart();
          }
        },
        error: () => this.errorMessage = 'No se pudieron cargar las cuentas.'
      });

      this.alertasService.listarPorUsuario(id).subscribe({
        next: data => this.alertas = data,
        error: () => this.errorMessage = 'No se pudieron cargar las alertas.'
      });

    });
  }

  changeMonth(delta: number): void {
    this.selectedMonth = new Date(this.selectedMonth.getFullYear(), this.selectedMonth.getMonth() + delta, 1);
    this.recalculateMonth();
  }

  private recalculateMonth(): void {
    const sameMonth = (date: string) => { const d = new Date(`${date}T00:00:00`); return d.getFullYear() === this.selectedMonth.getFullYear() && d.getMonth() === this.selectedMonth.getMonth(); };
    const ingresosMes = this.ingresos.filter(x => sameMonth(x.fecha));
    const gastosMes = this.gastos.filter(x => sameMonth(x.fecha));
    this.totalIngresos = ingresosMes.reduce((sum, x) => sum + Number(x.monto || 0), 0);
    this.totalGastos = gastosMes.reduce((sum, x) => sum + Number(x.monto || 0), 0);
    this.balance = this.totalIngresos - this.totalGastos;
    const categorias: Record<string, number> = {};
    gastosMes.forEach(g => categorias[g.categoria || 'SIN CATEGORÍA'] = (categorias[g.categoria || 'SIN CATEGORÍA'] || 0) + Number(g.monto || 0));
    this.buildBalanceChart();
    this.buildCategoryChart(categorias);
  }

  private buildBalanceChart(): void {
    this.balanceChart = {
      labels: ['Ingresos', 'Gastos'],
      datasets: [{
        label: 'Monto',
        data: [this.totalIngresos, this.totalGastos]
      }]
    };
  }

  private buildCategoryChart(data: Record<string, number>): void {
    const labels = Object.keys(data);
    this.categoryChart = {
      labels,
      datasets: [{
        data: labels.map(label => data[label])
      }]
    };
  }
}
