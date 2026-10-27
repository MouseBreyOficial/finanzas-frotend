import { DatePipe, DecimalPipe } from "@angular/common";
import { Component, inject, OnInit } from "@angular/core";
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
import { finalize, forkJoin } from "rxjs";
import { TableModule } from "primeng/table";
import { ButtonModule } from "primeng/button";
import { DialogModule } from "primeng/dialog";
import { InputTextModule } from "primeng/inputtext";
import { InputNumberModule } from "primeng/inputnumber";
import { SelectModule } from "primeng/select";
import { DatePickerModule } from "primeng/datepicker";
import { ChartModule } from "primeng/chart";
import { MessageModule } from "primeng/message";
import { AuthService } from "../../core/services/auth.service";
import { CuentaService } from "../../core/services/cuenta.service";
import { GastoService } from "../../core/services/gasto.service";
import { IngresoService } from "../../core/services/ingreso.service";
import {
  CuentaResponse,
  GastoResponse,
  IngresoResponse,
} from "../../core/models/api.models";
import { MessageService } from "primeng/api";
import { JsonPipe } from "@angular/common";

@Component({
  selector: "app-gastos",
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    DatePipe,
    DecimalPipe,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    DatePickerModule,
    ChartModule,
    MessageModule,
  ],
  template: ` <section class="page">
    <div class="page-header">
      <div class="movement-heading">
        <div class="movement-title-icon expense">
          <i class="pi pi-arrow-down-right"></i>
        </div>
        <div>
          <h1>Gastos</h1>
          <p class="muted">
            Registra gastos y controla su impacto en tus cuentas e ingresos.
          </p>
        </div>
      </div>
      <p-button label="Nuevo gasto" icon="pi pi-plus" (onClick)="openNew()" />
    </div>

    @if (errorMessage) {
      <p-message severity="error" styleClass="w-full mb-3">{{
        errorMessage
      }}</p-message>
    }

    <div class="card movement-filter-card">
      <div class="movement-filters movement-filters-gastos">
        <div class="field">
          <label>Fecha desde</label>
          <p-datepicker
            [(ngModel)]="filterFechaDesde"
            [ngModelOptions]="{ standalone: true }"
            dateFormat="dd/mm/yy"
            [showIcon]="true"
            [showClear]="true"
            appendTo="body"
            placeholder="dd/mm/aaaa"
          />
        </div>

        <div class="field">
          <label>Fecha hasta</label>
          <p-datepicker
            [(ngModel)]="filterFechaHasta"
            [ngModelOptions]="{ standalone: true }"
            dateFormat="dd/mm/yy"
            [showIcon]="true"
            [showClear]="true"
            appendTo="body"
            placeholder="dd/mm/aaaa"
          />
        </div>

        <div class="field">
          <label>Cuenta</label>
          <p-select
            [(ngModel)]="filterCuentaId"
            [ngModelOptions]="{ standalone: true }"
            [options]="cuentas"
            optionLabel="nombreCuenta"
            optionValue="id"
            placeholder="Todas"
            [showClear]="true"
            appendTo="body"
          />
        </div>

        <div class="field">
          <label>Categoría</label>
          <p-select
            [(ngModel)]="filterCategoria"
            [ngModelOptions]="{ standalone: true }"
            [options]="categorias"
            placeholder="Todas"
            [showClear]="true"
            appendTo="body"
          />
        </div>

        <div class="field movement-search-field">
          <label>Descripción</label>
          <span class="p-input-icon-left">
            <i class="pi pi-search"></i>
            <input
              pInputText
              [(ngModel)]="filterDescripcion"
              [ngModelOptions]="{ standalone: true }"
              placeholder="Buscar por descripción"
              (keyup.enter)="applyFilters()"
            />
          </span>
        </div>

        <div class="movement-filter-actions">
          <p-button
            label="Buscar"
            icon="pi pi-search"
            (onClick)="applyFilters()"
          />
          <p-button
            label="Limpiar"
            icon="pi pi-filter-slash"
            severity="secondary"
            [outlined]="true"
            (onClick)="clearFilters()"
          />
        </div>
      </div>
    </div>

    <div class="grid grid-2 movement-summary-grid">
      <div class="card">
        <h3>Promedio mensual por categoría</h3>
        <p-chart type="bar" [data]="averageChart" [options]="chartOptions" />
      </div>
      <div class="card">
        <h3>Resumen</h3>
        <div class="stat-value">S/ {{ total | number: "1.2-2" }}</div>
        <div class="muted">Total de gastos según los filtros aplicados</div>
      </div>
    </div>

    <div class="card movement-table-card">
      <p-table
        [value]="filteredRows"
        [loading]="loading"
        [paginator]="true"
        [rows]="10"
        [rowsPerPageOptions]="[5, 10, 20, 50]"
        sortField="item.fecha"
        [sortOrder]="-1"
        [showCurrentPageReport]="true"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} gastos"
        [tableStyle]="{ 'min-width': '60rem' }"
      >
        <ng-template #header>
          <tr>
            <th pSortableColumn="item.fecha">
              <div class="table-header-sort">
                Fecha
                <p-sortIcon field="item.fecha" />
              </div>
            </th>
            <th>Cuenta</th>
            <th>Categoría</th>
            <th>Monto</th>
            <th>Descripción</th>
            <th>Acciones</th>
          </tr>
        </ng-template>
        <ng-template #body let-row>
          <tr>
            <td>{{ row.item.fecha | date: "dd/MM/yyyy" }}</td>
            <td>{{ accountName(row.item.idCuenta) }}</td>
            <td>{{ row.item.categoria }}</td>
            <td class="expense-amount">S/ {{ row.item.monto | number: "1.2-2" }}</td>
            <td>{{ row.item.descripcion }}</td>
            <td>
              <p-button
                icon="pi pi-pencil"
                [text]="true"
                ariaLabel="Editar gasto"
                (onClick)="edit(row.item)"
              />
            </td>
          </tr>
        </ng-template>
        <ng-template #emptymessage>
          <tr>
            <td colspan="6">
              <div class="movement-empty-state">
                <i class="pi pi-inbox"></i>
                <strong>No hay gastos que coincidan con los filtros.</strong>
                <span>Prueba cambiando o limpiando los criterios de búsqueda.</span>
              </div>
            </td>
          </tr>
        </ng-template>
      </p-table>
    </div>

    <p-dialog
      [(visible)]="dialogVisible"
      [header]="editing ? 'Editar gasto' : 'Nuevo gasto'"
      [modal]="true"
      [style]="{ width: 'min(700px,95vw)' }"
    >
      <form [formGroup]="form" (ngSubmit)="save()">
        <div class="form-grid">
          <div class="field">
            <label>Cuenta</label>

            @if (editing) {
              <div class="form-txt-label">
                {{ selectedAccount?.nombreCuenta ?? "—" }}
              </div>
            } @else {
              <p-select
                formControlName="idCuenta"
                [options]="cuentas"
                optionLabel="nombreCuenta"
                optionValue="id"
                appendTo="body"
              />
            }
          </div>
          <div class="field">
            <label>Fecha</label
            ><p-datepicker
              formControlName="fecha"
              dateFormat="yy-mm-dd"
              [showIcon]="true"
              appendTo="body"
            />
          </div>
          <div class="field">
            <label>Monto</label
            ><p-inputnumber
              formControlName="monto"
              (onFocus)="selectMoneyInput($event)"
              mode="decimal"
              prefix="S/ "
              [minFractionDigits]="2"
            />
          </div>
          <div class="field">
            <label>Categoría</label
            ><input
              pInputText
              formControlName="categoria"
              list="categorias-gasto"
              placeholder="Selecciona o escribe una categoría"
            />
            <datalist id="categorias-gasto">
              @for (c of categorias; track c) {
                <option [value]="c"></option>
              }
            </datalist>
          </div>
          <div class="field full">
            <label>Descripción</label
            ><input
              pInputText
              formControlName="descripcion"
              placeholder="Ingrese una descripcion"
            />
          </div>
        </div>

        @if (insufficientBalance) {
          <div class="pt-2"></div>
          <p-message severity="error" styleClass="w-full mt-3"
            >Saldo insuficiente. El gasto no puede superar los S/
            {{ availableForExpense | number: "1.2-2" }} disponibles en la
            cuenta.</p-message
          >
        }
        @if (selectedAccount) {
          <div class="pt-2"></div>
          <div class="card">
            <strong>{{ selectedAccount.nombreCuenta }}</strong>
            <div class="muted">
              Saldo disponible: S/ {{ availableForExpense | number: "1.2-2" }} ·
              Saldo después del gasto: S/ {{ balanceAfter | number: "1.2-2" }}
            </div>
          </div>
        }
        @if (!editing && monthlyIncome === 0) {
          <div class="pt-2"></div>
          <p-message severity="warn" styleClass="w-full mt-3"
            >No tienes ingresos registrados para el mes seleccionado. Este gasto
            se descontará del saldo acumulado de la cuenta.</p-message
          >
        }
        @if (
          !editing &&
          monthlyIncome > 0 &&
          projectedMonthlyExpenses > monthlyIncome
        ) {
          <div class="pt-2"></div>
          <p-message severity="warn" styleClass="w-full mt-3"
            >Con este gasto superarías tus ingresos del mes en S/
            {{ projectedMonthlyExpenses - monthlyIncome | number: "1.2-2" }}
            <br />Ingreso mensual: S/
            {{ monthlyIncome | number: "1.2-2" }}</p-message
          >
        }
        @if (
          !editing &&
          monthlyIncome > 0 &&
          projectedMonthlyExpenses <= monthlyIncome
        ) {
          <div class="pt-2"></div>
          <p-message severity="success" styleClass="w-full mt-3"
            >El gasto se mantiene dentro de tus ingresos del mes. Disponible
            frente a ingresos: S/
            {{
              monthlyIncome - projectedMonthlyExpenses | number: "1.2-2"
            }}.</p-message
          >
        }
        <div class="actions">
          <p-button
            label="Cancelar"
            [text]="true"
            type="button"
            (onClick)="dialogVisible = false"
          /><p-button
            label="Guardar"
            type="submit"
            [loading]="saving"
            [disabled]="form.invalid || saving || insufficientBalance"
          />
        </div>
      </form>
    </p-dialog>
  </section>`,
})
export class GastosComponent implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private cuentasService = inject(CuentaService);
  private service = inject(GastoService);
  private ingresosService = inject(IngresoService);

  private readonly messages = inject(MessageService);

  cuentas: CuentaResponse[] = [];
  rows: { item: GastoResponse }[] = [];
  filteredRows: { item: GastoResponse }[] = [];
  filterFechaDesde: Date | null = null;
  filterFechaHasta: Date | null = null;
  filterCuentaId: number | null = null;
  filterCategoria: string | null = null;
  filterDescripcion = "";
  ingresos: IngresoResponse[] = [];
  categorias: string[] = [];
  editing: GastoResponse | null = null;
  dialogVisible = false;
  loading = false;
  saving = false;
  errorMessage = "";
  total = 0;
  averageChart: any;
  chartOptions: any = { responsive: true, maintainAspectRatio: false };
  readonly form = this.fb.nonNullable.group({
    idCuenta: [0, Validators.required],
    monto: [0, [Validators.required, Validators.min(0.01)]],
    fecha: [new Date(), Validators.required],
    categoria: ["", Validators.required],
    descripcion: ["", Validators.required],
  });

  ngOnInit() {
    this.loadAccounts();
  }

  loadAccounts() {
    this.auth.resolveUserId().subscribe((id) => {
      if (!id) return;
      this.cuentasService.listarPorUsuario(id).subscribe({
        next: (cuentas) => {
          this.cuentas = cuentas;
          this.loadRows();
          this.loadAverages(id);
          this.loadCategories(id);
          this.loadIncomes();
        },
        error: (e) =>
          (this.errorMessage =
            e?.error?.mensaje ?? "No se pudieron cargar los datos."),
      });
    });
  }

  loadRows() {
    if (!this.cuentas.length) {
      this.rows = [];
      this.filteredRows = [];
      this.total = 0;
      return;
    }
    this.loading = true;
    forkJoin(this.cuentas.map((c) => this.service.listarPorCuenta(c.id)))
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (r) => {
          this.rows = r
            .flat()
            .map((item) => ({ item }))
            .sort((a, b) => b.item.fecha.localeCompare(a.item.fecha));
          this.applyFilters();
        },
        error: () => (this.errorMessage = "No se pudieron cargar los gastos."),
      });
  }

  loadIncomes() {
    if (!this.cuentas.length) {
      this.ingresos = [];
      return;
    }
    forkJoin(
      this.cuentas.map((c) => this.ingresosService.listarPorCuenta(c.id)),
    ).subscribe({
      next: (r) => (this.ingresos = r.flat()),
      error: () => (this.ingresos = []),
    });
  }

  loadCategories(id: number) {
    this.service.categorias(id).subscribe({
      next: (r) => (this.categorias = r.map(this.prettyCategory)),
      error: () => (this.categorias = []),
    });
  }

  loadAverages(id: number) {
    this.service.promedios(id).subscribe({
      next: (d) => {
        const labels = Object.keys(d);
        this.averageChart = {
          labels,
          datasets: [
            { label: "Promedio mensual", data: labels.map((x) => d[x]) },
          ],
        };
      },
      error: () => (this.averageChart = { labels: [], datasets: [] }),
    });
  }



  applyFilters(): void {
    const desde = this.filterFechaDesde ? this.fmt(this.filterFechaDesde) : null;
    const hasta = this.filterFechaHasta ? this.fmt(this.filterFechaHasta) : null;
    const categoria = this.normalize(this.filterCategoria);
    const descripcion = this.normalize(this.filterDescripcion);

    this.filteredRows = this.rows.filter(({ item }) => {
      const matchesDesde = !desde || item.fecha >= desde;
      const matchesHasta = !hasta || item.fecha <= hasta;
      const matchesCuenta =
        !this.filterCuentaId || item.idCuenta === this.filterCuentaId;
      const matchesCategoria =
        !categoria || this.normalize(item.categoria) === categoria;
      const matchesDescripcion =
        !descripcion ||
        this.normalize(item.descripcion).includes(descripcion);

      return (
        matchesDesde &&
        matchesHasta &&
        matchesCuenta &&
        matchesCategoria &&
        matchesDescripcion
      );
    });

    this.total = this.filteredRows.reduce(
      (sum, row) => sum + Number(row.item.monto || 0),
      0,
    );
  }

  clearFilters(): void {
    this.filterFechaDesde = null;
    this.filterFechaHasta = null;
    this.filterCuentaId = null;
    this.filterCategoria = null;
    this.filterDescripcion = "";
    this.applyFilters();
  }

  private normalize(value: string | null | undefined): string {
    return (value ?? "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  }

  accountName(id: number) {
    return (
      this.cuentas.find((c) => c.id === id)?.nombreCuenta ?? `Cuenta #${id}`
    );
  }

  get selectedAccount() {
    return this.cuentas.find((c) => c.id === this.form.getRawValue().idCuenta);
  }

  get availableForExpense() {
    const c = this.selectedAccount;
    if (!c) return 0;

    return (
      Number(c.saldoActual || 0) +
      (this.editing?.idCuenta === c.id ? Number(this.editing.monto || 0) : 0)
    );
  }

  get balanceAfter() {
    return (
      this.availableForExpense - Number(this.form.getRawValue().monto || 0)
    );
  }

  get insufficientBalance() {
    return (
      Number(this.form.getRawValue().monto || 0) > this.availableForExpense
    );
  }

  private selectedMonth() {
    const d = this.form.getRawValue().fecha;
    return { y: d.getFullYear(), m: d.getMonth() };
  }

  get monthlyIncome() {
    const x = this.selectedMonth();
    return this.ingresos
      .filter((i) => {
        const d = new Date(i.fecha + "T00:00:00");
        return d.getFullYear() === x.y && d.getMonth() === x.m;
      })
      .reduce((s, i) => s + Number(i.monto || 0), 0);
  }

  get monthlyExpenses() {
    const x = this.selectedMonth();
    return this.rows
      .filter((r) => {
        const d = new Date(r.item.fecha + "T00:00:00");
        return (
          d.getFullYear() === x.y &&
          d.getMonth() === x.m &&
          r.item.id !== this.editing?.id
        );
      })
      .reduce((s, r) => s + Number(r.item.monto || 0), 0);
  }

  get projectedMonthlyExpenses() {
    return this.monthlyExpenses + Number(this.form.getRawValue().monto || 0);
  }

  openNew() {
    this.editing = null;
    this.form.reset({
      idCuenta: this.cuentas[0]?.id ?? 0,
      monto: 0,
      fecha: new Date(),
      categoria: "",
      descripcion: "",
    });
    this.dialogVisible = true;
  }

  edit(i: GastoResponse) {
    this.editing = i;
    this.form.reset({
      idCuenta: i.idCuenta,
      monto: i.monto,
      fecha: new Date(i.fecha + "T00:00:00"),
      categoria: i.categoria,
      descripcion: i.descripcion,
    });
    this.dialogVisible = true;
  }

  save() {
    if (this.form.invalid || this.insufficientBalance) return;

    const v = this.form.getRawValue(),
      fecha = this.fmt(v.fecha),
      categoria = this.prettyCategory(v.categoria);
    this.saving = true;
    this.errorMessage = "";
    const req = this.editing
      ? this.service.actualizar({
          id: this.editing.id,
          monto: v.monto,
          fecha,
          categoria,
          descripcion: v.descripcion,
          usuarioModificacion: this.auth.getUsername(),
        })
      : this.service.registrar({
          monto: v.monto,
          fecha,
          categoria,
          descripcion: v.descripcion,
          idCuenta: v.idCuenta,
          usuarioCreacion: this.auth.getUsername(),
        });

    req.pipe(finalize(() => console.log(""))).subscribe({
      next: () => {
        this.messages.add({
          severity: "success",
          summary: "Guardado",
          detail: this.editing
            ? "Gasto actualizado."
            : "Gasto registrado correctamente.",
          life: 3000,
        });

        this.dialogVisible = false;
        this.loadAccounts();
        this.saving = false;
      },
      error: (e) => {
        this.messages.add({
          severity: "error",
          summary: "Error",
          detail: "No se pudo guardar el gasto.",
          life: 5000,
        });

        this.saving = false;
      },
    });
  }

  private fmt(d: Date) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  private prettyCategory(v: string) {
    const s = (v || "").trim().replace(/\s+/g, " ");
    return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s;
  }

  selectMoneyInput(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    setTimeout(() => input?.select());
  }
}
