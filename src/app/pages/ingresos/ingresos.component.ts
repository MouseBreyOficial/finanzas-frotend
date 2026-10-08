import { Component, inject, OnInit } from "@angular/core";
import { DatePipe, DecimalPipe } from "@angular/common";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
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
        <div>
          <h1>Ingresos</h1>
          <p class="muted">Registra y consulta ingresos por cuenta.</p>
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

      <div class="card">
        <p-table [value]="rows" [loading]="loading">
          <ng-template #header>
            <tr>
              <th>Fecha</th>
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
              <td>{{ row.item.monto | number: "1.2-2" }}</td>
              <td>{{ row.item.descripcion }}</td>
              <td>
                <p-button
                  icon="pi pi-pencil"
                  [text]="true"
                  (onClick)="edit(row.item)"
                />
              </td>
            </tr>
          </ng-template>
          <ng-template #emptymessage
            ><tr>
              <td colspan="5">No hay ingresos.</td>
            </tr></ng-template
          >
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
      })
      .catch(() => {
        this.errorMessage = "No se pudieron cargar los ingresos.";
      })
      .finally(() => (this.loading = false));
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
