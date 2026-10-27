import { Component, inject, OnInit } from "@angular/core";
import { DatePipe, DecimalPipe } from "@angular/common";
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
import { finalize } from "rxjs";
import { TableModule } from "primeng/table";
import { ButtonModule } from "primeng/button";
import { DialogModule } from "primeng/dialog";
import { InputTextModule } from "primeng/inputtext";
import { InputNumberModule } from "primeng/inputnumber";
import { SelectModule } from "primeng/select";
import { DatePickerModule } from "primeng/datepicker";
import { MessageModule } from "primeng/message";
import { AuthService } from "../../core/services/auth.service";
import { CuentaService } from "../../core/services/cuenta.service";
import { IngresoService } from "../../core/services/ingreso.service";
import { CuentaResponse, IngresoResponse } from "../../core/models/api.models";
import { MessageService } from "primeng/api";

@Component({
  selector: "app-ingresos",
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
    MessageModule,
  ],
  template: `
    <section class="page">
      <div class="page-header">
        <div class="movement-heading">
          <div class="movement-title-icon income">
            <i class="pi pi-arrow-up-right"></i>
          </div>
          <div>
            <h1>Ingresos</h1>
            <p class="muted">Registra y consulta ingresos por cuenta.</p>
          </div>
        </div>
        <p-button
          label="Nuevo ingreso"
          icon="pi pi-plus"
          (onClick)="openNew()"
        />
      </div>

      @if (errorMessage) {
        <p-message severity="error" styleClass="w-full mb-3">{{
          errorMessage
        }}</p-message>
      }

      <div class="card movement-filter-card">
        <div class="movement-filters">
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
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} ingresos"
          [tableStyle]="{ 'min-width': '52rem' }"
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
              <th>Monto</th>
              <th>Descripción</th>
              <th>Acciones</th>
            </tr>
          </ng-template>
          <ng-template #body let-row>
            <tr>
              <td>{{ row.item.fecha | date: "dd/MM/yyyy" }}</td>
              <td>{{ accountName(row.item.idCuenta) }}</td>
              <td class="income-amount">S/ {{ row.item.monto | number: "1.2-2" }}</td>
              <td>{{ row.item.descripcion }}</td>
              <td>
                <p-button
                  icon="pi pi-pencil"
                  [text]="true"
                  ariaLabel="Editar ingreso"
                  (onClick)="edit(row.item)"
                />
              </td>
            </tr>
          </ng-template>
          <ng-template #emptymessage>
            <tr>
              <td colspan="5">
                <div class="movement-empty-state">
                  <i class="pi pi-inbox"></i>
                  <strong>No hay ingresos que coincidan con los filtros.</strong>
                  <span>Prueba cambiando o limpiando los criterios de búsqueda.</span>
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>

      <p-dialog
        [(visible)]="dialogVisible"
        [header]="editing ? 'Editar ingreso' : 'Nuevo ingreso'"
        [modal]="true"
        [style]="{ width: 'min(600px, 95vw)' }"
      >
        <form [formGroup]="form" (ngSubmit)="save()">
          <div class="form-grid">
            <div class="field">
              <label>Cuenta</label>
              <p-select
                formControlName="idCuenta"
                [options]="cuentas"
                optionLabel="nombreCuenta"
                optionValue="id"
                placeholder="Selecciona una cuenta"
                class="w-full"
                [appendTo]="'body'"
              />
            </div>
            <div class="field">
              <label>Fecha</label>
              <p-datepicker
                formControlName="fecha"
                dateFormat="yy-mm-dd"
                [showIcon]="true"
                class="w-full"
                [appendTo]="'body'"
              />
            </div>
            <div class="field">
              <label>Monto</label>
              <p-inputnumber
                formControlName="monto"
                (onFocus)="selectMoneyInput($event)"
                mode="decimal"
                [minFractionDigits]="2"
                class="w-full"
              />
            </div>
            <div class="field">
              <label>Descripción</label>
              <input
                pInputText
                formControlName="descripcion"
                placeholder="Ingrese una descripcion"
              />
            </div>
          </div>
          <div class="actions">
            <p-button
              label="Cancelar"
              [text]="true"
              type="button"
              (onClick)="dialogVisible = false"
            />
            <p-button
              label="Guardar"
              type="submit"
              [loading]="saving"
              [disabled]="form.invalid || saving"
            />
          </div>
        </form>
      </p-dialog>
    </section>
  `,
})
export class IngresosComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly cuentasService = inject(CuentaService);
  private readonly service = inject(IngresoService);
  private readonly messages = inject(MessageService);

  cuentas: CuentaResponse[] = [];
  rows: { item: IngresoResponse }[] = [];
  filteredRows: { item: IngresoResponse }[] = [];
  filterFechaDesde: Date | null = null;
  filterFechaHasta: Date | null = null;
  filterCuentaId: number | null = null;
  filterDescripcion = "";
  editing: IngresoResponse | null = null;
  dialogVisible = false;
  loading = false;
  saving = false;
  errorMessage = "";

  readonly form = this.fb.nonNullable.group({
    idCuenta: [0, Validators.required],
    monto: [0, [Validators.required, Validators.min(0.01)]],
    fecha: [new Date(), Validators.required],
    descripcion: ["", Validators.required],
  });

  ngOnInit(): void {
    this.loadAccounts();
  }

  loadAccounts(): void {
    this.auth.resolveUserId().subscribe((id) => {
      if (!id) return;
      this.cuentasService.listarPorUsuario(id).subscribe({
        next: (cuentas) => {
          this.cuentas = cuentas;
          this.loadRows();
        },
        error: (error) =>
          (this.errorMessage =
            error?.error?.mensaje ?? "No se pudieron cargar los datos."),
      });
    });
  }

  loadRows(): void {
    if (!this.cuentas.length) {
      this.rows = [];
      this.filteredRows = [];
      return;
    }
    this.loading = true;
    Promise.all(
      this.cuentas.map(
        (c) =>
          new Promise<IngresoResponse[]>((resolve, reject) =>
            this.service
              .listarPorCuenta(c.id)
              .subscribe({ next: resolve, error: reject }),
          ),
      ),
    )
      .then((result) => {
        this.rows = result
          .flat()
          .map((item) => ({ item }))
          .sort((a, b) => b.item.fecha.localeCompare(a.item.fecha));
        this.applyFilters();
      })
      .catch(() => {
        this.errorMessage = "No se pudieron cargar los ingresos.";
      })
      .finally(() => (this.loading = false));
  }



  applyFilters(): void {
    const desde = this.filterFechaDesde
      ? this.formatDate(this.filterFechaDesde)
      : null;
    const hasta = this.filterFechaHasta
      ? this.formatDate(this.filterFechaHasta)
      : null;
    const descripcion = this.normalize(this.filterDescripcion);

    this.filteredRows = this.rows.filter(({ item }) => {
      const matchesDesde = !desde || item.fecha >= desde;
      const matchesHasta = !hasta || item.fecha <= hasta;
      const matchesCuenta =
        !this.filterCuentaId || item.idCuenta === this.filterCuentaId;
      const matchesDescripcion =
        !descripcion ||
        this.normalize(item.descripcion).includes(descripcion);

      return (
        matchesDesde &&
        matchesHasta &&
        matchesCuenta &&
        matchesDescripcion
      );
    });
  }

  clearFilters(): void {
    this.filterFechaDesde = null;
    this.filterFechaHasta = null;
    this.filterCuentaId = null;
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

  accountName(id: number): string {
    return (
      this.cuentas.find((c) => c.id === id)?.nombreCuenta ?? `Cuenta #${id}`
    );
  }

  openNew(): void {
    this.editing = null;
    this.form.reset({
      idCuenta: this.cuentas[0]?.id ?? 0,
      monto: 0,
      fecha: new Date(),
      descripcion: "",
    });
    this.dialogVisible = true;
  }

  edit(item: IngresoResponse): void {
    this.editing = item;
    this.form.reset({
      idCuenta: item.idCuenta,
      monto: item.monto,
      fecha: new Date(`${item.fecha}T00:00:00`),
      descripcion: item.descripcion,
    });
    this.dialogVisible = true;
  }

  save(): void {
    if (this.form.invalid) return;
    const value = this.form.getRawValue();
    const fecha = this.formatDate(value.fecha);
    this.saving = true;
    this.errorMessage = "";

    const request$ = this.editing
      ? this.service.actualizar({
          id: this.editing.id,
          monto: value.monto,
          fecha,
          descripcion: value.descripcion,
          usuarioModificacion: this.auth.getUsername(),
        })
      : this.service.registrar({
          monto: value.monto,
          fecha,
          descripcion: value.descripcion,
          idCuenta: value.idCuenta,
          usuarioCreacion: this.auth.getUsername(),
        });

    request$.pipe().subscribe({
      next: () => {
        this.messages.add({
          severity: "success",
          summary: "Guardado",
          detail: this.editing
            ? "Ingreso actualizado."
            : "Ingreso registrado correctamente.",
          life: 3000,
        });

        this.saving = false;
        this.dialogVisible = false;
        this.loadRows();
      },
      error: (e) => {
        this.messages.add({
          severity: "error",
          summary: "Error",
          detail: "No se pudo guardar el ingreso.",
          life: 5000,
        });

        this.saving = false;
      },
    });
  }

  private formatDate(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  selectMoneyInput(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    setTimeout(() => input?.select());
  }
}
