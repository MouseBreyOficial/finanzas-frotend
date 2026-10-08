import { Component, inject, OnInit } from "@angular/core";
import { DatePipe, CurrencyPipe } from "@angular/common";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { finalize } from "rxjs";
import { TableModule } from "primeng/table";
import { ButtonModule } from "primeng/button";
import { DialogModule } from "primeng/dialog";
import { InputTextModule } from "primeng/inputtext";
import { DatePickerModule } from "primeng/datepicker";
import { SelectModule } from "primeng/select";
import { MessageModule } from "primeng/message";
import { CheckboxModule } from "primeng/checkbox";
import { InputNumberModule } from "primeng/inputnumber";
import { CuentaService } from "../../core/services/cuenta.service";
import { CuentaResponse } from "../../core/models/api.models";
import { AuthService } from "../../core/services/auth.service";
import { AlertaService } from "../../core/services/alerta.service";
import { AlertaResponse } from "../../core/models/api.models";
import { MessageService } from "primeng/api";

@Component({
  selector: "app-alertas",
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DatePipe,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    DatePickerModule,
    SelectModule,
    MessageModule,
    CheckboxModule,
    InputNumberModule,
    CurrencyPipe,
  ],
  template: `
    <section class="page">
      <div class="page-header">
        <div>
          <h1>Alertas</h1>
          <p class="muted">Gestiona recordatorios y pagos fijos.</p>
        </div>
        <p-button
          label="Nueva alerta"
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
        <p-table [value]="alertas" [loading]="loading">
          <ng-template #header>
            <tr>
              <th>Descripción</th>
              <th>Monto</th>
              <th>Tipo</th>
              <th>Fecha</th>
              <th>Estado</th>
              <th>Es recurrente</th>
              <th>Acciones</th>
            </tr>
          </ng-template>
          <ng-template #body let-alerta>
            <tr [class.alerta-muy-vencida]="isOverdue(alerta)">
              <td>{{ alerta.descripcion }}</td>
              <td class="test-bold">
                {{ alerta.monto | currency: "PEN" : "symbol" : "1.2-2" }}
              </td>
              <td>{{ alerta.tipo }}</td>
              <td>{{ alerta.fechaAlerta | date: "dd/MM/yyyy" }}</td>
              <td>{{ alerta.estado || "PENDIENTE" }}</td>
              <td>{{ alerta.esRecurrente ? "Sí" : "No" }}</td>
              <td>
                @if (
                  (alerta.estado || "PENDIENTE") !== "PAGADO" && canPay(alerta)
                ) {
                  <p-button
                    icon="pi pi-check"
                    severity="success"
                    [text]="true"
                    title="Registrar pago"
                    (onClick)="pagar(alerta)"
                  />
                }
                @if ((alerta.estado || "PENDIENTE") !== "PAGADO") {
                  <p-button
                    icon="pi pi-pencil"
                    [text]="true"
                    (onClick)="edit(alerta)"
                  />
                }
              </td>
            </tr>
          </ng-template>
          <ng-template #emptymessage
            ><tr>
              <td colspan="6">No hay alertas.</td>
            </tr></ng-template
          >
        </p-table>
      </div>

      <p-dialog
        [(visible)]="dialogVisible"
        [header]="editing ? 'Editar alerta' : 'Nueva alerta'"
        [modal]="true"
        [style]="{ width: 'min(600px, 95vw)' }"
      >
        <form [formGroup]="form" (ngSubmit)="save()">
          <div class="form-grid">
            <div class="field full">
              <label>Descripción</label>
              <input pInputText formControlName="descripcion" />
            </div>
            <div class="field">
              <label>Tipo</label>
              <p-select
                formControlName="tipo"
                [options]="tipos"
                placeholder="Selecciona un tipo"
                [appendTo]="'body'"
              />
            </div>
            <div class="field">
              <label>Fecha de alerta</label
              ><p-datepicker
                formControlName="fechaAlerta"
                dateFormat="yy-mm-dd"
                [showIcon]="true"
                [appendTo]="'body'"
              />
            </div>
            <div class="field">
              <label>Monto estimado</label
              ><p-inputnumber
                formControlName="monto"
                (onFocus)="selectMoneyInput($event)"
                mode="currency"
                currency="PEN"
                locale="es-PE"
              />
            </div>
            <div class="field">
              <label>Categoría</label
              ><input
                pInputText
                formControlName="categoria"
                placeholder="LUZ, INTERNET, ALIMENTOS..."
              />
            </div>
            <div class="field">
              <label>Cuenta para el pago</label
              ><p-select
                formControlName="idCuenta"
                [options]="cuentas"
                optionLabel="nombreCuenta"
                optionValue="id"
                placeholder="Opcional"
                [appendTo]="'body'"
              />
            </div>
            <div class="field">
              <label>Estado</label
              ><p-select
                formControlName="estado"
                [options]="estados"
                [appendTo]="'body'"
              />
            </div>
            <div class="field">
              <label>Repetición</label>
              <div class="checkbox-row">
                <p-checkbox
                  formControlName="esRecurrente"
                  [binary]="true"
                  inputId="recurrente"
                /><label for="recurrente">Pago recurrente mensual</label>
              </div>
            </div>
            @if (form.controls.esRecurrente.value) {
              <div class="field">
                <label>Día de cada mes</label
                ><p-inputnumber formControlName="diaMes" [min]="1" [max]="31" />
              </div>
            }
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
      <p-dialog
        [(visible)]="payConfirmVisible"
        header="Confirmar pago"
        [modal]="true"
        [style]="{ width: 'min(500px, 95vw)' }"
      >
        <p>
          ¿Registrar este pago? Si tiene monto y cuenta asociados, también se
          creará el gasto.
        </p>
        <div class="actions">
          <p-button
            label="Cancelar"
            [text]="true"
            (onClick)="cancelPay()"
          /><p-button
            label="Aceptar"
            severity="success"
            (onClick)="confirmPay()"
          />
        </div>
      </p-dialog>
    </section>
  `,
  styles: [
    `
      :host ::ng-deep .p-datatable-tbody > tr.alerta-muy-vencida > td {
        background: rgba(220, 38, 38, 0.2) !important;
      }
      :host ::ng-deep .p-datatable-tbody > tr.alerta-muy-vencida:hover > td {
        background: rgba(220, 38, 38, 0.28) !important;
      }
    `,
  ],
})
export class AlertasComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly service = inject(AlertaService);
  private readonly cuentaService = inject(CuentaService);

  private readonly messages = inject(MessageService);

  alertas: AlertaResponse[] = [];
  tipos = ["PAGO_FIJO", "RECORDATORIO", "OTRO"];
  estados = ["PENDIENTE", "PAGADO"];
  cuentas: CuentaResponse[] = [];
  editing: AlertaResponse | null = null;
  dialogVisible = false;
  loading = false;
  saving = false;
  errorMessage = "";
  payConfirmVisible = false;
  pendingPay: AlertaResponse | null = null;

  readonly form = this.fb.nonNullable.group({
    descripcion: ["", Validators.required],
    fechaAlerta: [new Date(), Validators.required],
    tipo: ["", Validators.required],
    monto: [0],
    categoria: [""],
    idCuenta: [null as number | null],
    estado: ["PENDIENTE"],
    esRecurrente: [false],
    diaMes: [new Date().getDate()],
  });

  ngOnInit(): void {
    this.load();
    this.auth.resolveUserId().subscribe((id) => {
      if (id)
        this.cuentaService
          .listarPorUsuario(id)
          .subscribe((c) => (this.cuentas = c));
    });
  }

  load(): void {
    this.auth.resolveUserId().subscribe((id) => {
      if (!id) return;
      this.loading = true;
      this.service
        .listarPorUsuario(id)
        .pipe(finalize(() => (this.loading = false)))
        .subscribe({
          next: (data) => (this.alertas = data),
          error: (error) =>
            (this.errorMessage =
              error?.error?.mensaje ?? "No se pudieron cargar las alertas."),
        });
    });
  }

  openNew(): void {
    this.editing = null;
    this.form.reset({
      descripcion: "",
      fechaAlerta: new Date(),
      tipo: "PAGO_FIJO",
      monto: 0,
      categoria: "",
      idCuenta: null,
      estado: "PENDIENTE",
      esRecurrente: false,
      diaMes: new Date().getDate(),
    });
    this.dialogVisible = true;
  }

  edit(alerta: AlertaResponse): void {
    this.editing = alerta;
    this.form.reset({
      descripcion: alerta.descripcion,
      fechaAlerta: new Date(`${alerta.fechaAlerta}T00:00:00`),
      tipo: alerta.tipo,
      monto: alerta.monto ?? 0,
      categoria: alerta.categoria ?? "",
      idCuenta: alerta.idCuenta ?? null,
      estado: alerta.estado ?? "PENDIENTE",
      esRecurrente: alerta.esRecurrente ?? false,
      diaMes: alerta.diaMes ?? new Date(`${alerta.fechaAlerta}T00:00:00`).getDate(),
    });
    this.dialogVisible = true;
  }

  save(): void {
    const idUsuario = this.auth.getUserId();
    if (!idUsuario || this.form.invalid) return;

    const value = this.form.getRawValue();
    const fechaAlerta = this.formatDate(value.fechaAlerta);
    this.saving = true;
    this.errorMessage = "";

    const request$ = this.editing
      ? this.service.actualizar({
          id: this.editing.id,
          descripcion: value.descripcion,
          fechaAlerta,
          tipo: value.tipo,
          usuarioModificacion: this.auth.getUsername(),
          esRecurrente: value.esRecurrente,
          frecuencia: value.esRecurrente ? "MENSUAL" : undefined,
          diaMes: value.esRecurrente ? value.diaMes : undefined,
          estado: value.estado,
          monto: value.monto || undefined,
          categoria: value.categoria || undefined,
          idCuenta: value.idCuenta || undefined,
        })
      : this.service.registrar({
          descripcion: value.descripcion,
          fechaAlerta,
          tipo: value.tipo,
          idUsuario,
          usuarioCreacion: this.auth.getUsername(),
          esRecurrente: value.esRecurrente,
          frecuencia: value.esRecurrente ? "MENSUAL" : undefined,
          diaMes: value.esRecurrente ? value.diaMes : undefined,
          estado: value.estado,
          monto: value.monto || undefined,
          categoria: value.categoria || undefined,
          idCuenta: value.idCuenta || undefined,
        });

    request$.pipe().subscribe({
      next: () => {
        this.messages.add({
          severity: "success",
          summary: "Guardado",
          detail: this.editing
            ? "Alerta actualizada."
            : "Alerta registrada correctamente.",
          life: 3000,
        });

        this.dialogVisible = false;
        this.load();
        this.saving = false;
      },
      error: (e) => {
        this.messages.add({
          severity: "error",
          summary: "Error",
          detail: "No se pudo guardar la alerta.",
          life: 5000,
        });

        this.saving = false;
      },
    });
  }

  canPay(alerta: AlertaResponse): boolean {
    const due = new Date(`${alerta.fechaAlerta}T00:00:00`);
    const today = new Date();

    const dueMonth = due.getFullYear() * 12 + due.getMonth();
    const currentMonth = today.getFullYear() * 12 + today.getMonth();
    const monthDifference = currentMonth - dueMonth;

    // Solo permite pagar alertas del mes actual o del mes inmediatamente anterior.
    return monthDifference === 0 || monthDifference === 1;
  }

  isOverdue(alerta: AlertaResponse): boolean {
    if ((alerta.estado ?? "PENDIENTE") === "PAGADO") return false;

    const due = new Date(`${alerta.fechaAlerta}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return due < today;
  }

  pagar(alerta: AlertaResponse): void {
    this.pendingPay = alerta;
    this.payConfirmVisible = true;
  }

  cancelPay(): void {
    this.payConfirmVisible = false;
    this.pendingPay = null;
  }

  confirmPay(): void {
    if (!this.pendingPay) return;
    this.service
      .marcarPagada(this.pendingPay.id, this.auth.getUsername())
      .subscribe({
        next: () => {
          this.cancelPay();
          this.load();
        },
        error: (e) =>
          (this.errorMessage =
            e?.error?.mensaje ?? "No se pudo registrar el pago."),
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
