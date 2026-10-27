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
import { TagModule } from "primeng/tag";
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
    TagModule,
    CheckboxModule,
    InputNumberModule,
    CurrencyPipe,
  ],
  template: `
    <section class="page management-page alerts-page">
      <div class="page-header">
        <div class="management-heading">
          <div class="management-title-icon alerts"><i class="pi pi-bell"></i></div>
          <div>
            <h1>Alertas</h1>
            <p class="muted">Organiza recordatorios, pagos pendientes y compromisos recurrentes.</p>
          </div>
        </div>
        <p-button label="Nueva alerta" icon="pi pi-plus" (onClick)="openNew()" />
      </div>

      @if (errorMessage) {
        <p-message severity="error" styleClass="w-full mb-3">{{ errorMessage }}</p-message>
      }

      <div class="management-summary-grid alerts-summary-grid">
        <div class="summary-card compact-summary warning">
          <div class="summary-icon"><i class="pi pi-clock"></i></div>
          <div><span>Pendientes</span><strong>{{ pendingAlertsCount }}</strong></div>
        </div>
        <div class="summary-card compact-summary danger">
          <div class="summary-icon"><i class="pi pi-exclamation-circle"></i></div>
          <div><span>Vencidas</span><strong>{{ overdueAlertsCount }}</strong></div>
        </div>
        <div class="summary-card compact-summary success">
          <div class="summary-icon"><i class="pi pi-check-circle"></i></div>
          <div><span>Pagadas</span><strong>{{ paidAlertsCount }}</strong></div>
        </div>
      </div>

      <div class="card table-card professional-table-card">
        <div class="table-toolbar professional-toolbar">
          <div class="toolbar-title"><i class="pi pi-bell"></i><div><strong>Mis alertas</strong><span>Seguimiento de tus próximos pagos y recordatorios</span></div></div>
        </div>
        <p-table
          [value]="alertas"
          [loading]="loading"
          [paginator]="true"
          [rows]="10"
          [rowsPerPageOptions]="[5, 10, 20, 50]"
          [showCurrentPageReport]="true"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} alertas"
        >
          <ng-template #header>
            <tr><th>Descripción</th><th>Monto</th><th>Tipo</th><th>Fecha</th><th>Estado</th><th>Recurrente</th><th>Acciones</th></tr>
          </ng-template>
          <ng-template #body let-alerta>
            <tr [class.alerta-muy-vencida]="isOverdue(alerta)">
              <td><div class="alert-description"><i class="pi pi-bell"></i><strong>{{ alerta.descripcion }}</strong></div></td>
              <td><strong>{{ alerta.monto | currency: 'PEN' : 'symbol' : '1.2-2' }}</strong></td>
              <td><span class="type-pill">{{ formatAlertType(alerta.tipo) }}</span></td>
              <td><span class="date-cell"><i class="pi pi-calendar"></i>{{ alerta.fechaAlerta | date: 'dd/MM/yyyy' }}</span></td>
              <td><p-tag [value]="(alerta.estado || 'PENDIENTE') === 'PAGADO' ? 'Pagado' : (isOverdue(alerta) ? 'Vencido' : 'Pendiente')" [severity]="(alerta.estado || 'PENDIENTE') === 'PAGADO' ? 'success' : (isOverdue(alerta) ? 'danger' : 'warn')" /></td>
              <td><p-tag [value]="alerta.esRecurrente ? 'Mensual' : 'No'" [severity]="alerta.esRecurrente ? 'info' : 'secondary'" /></td>
              <td>
                <div class="table-actions">
                  @if ((alerta.estado || 'PENDIENTE') !== 'PAGADO' && canPay(alerta)) {
                    <p-button icon="pi pi-check" severity="success" [text]="true" title="Registrar pago" (onClick)="pagar(alerta)" />
                  }
                  @if ((alerta.estado || 'PENDIENTE') !== 'PAGADO') {
                    <p-button icon="pi pi-pencil" [text]="true" title="Editar alerta" (onClick)="edit(alerta)" />
                  }
                </div>
              </td>
            </tr>
          </ng-template>
          <ng-template #emptymessage>
            <tr><td colspan="7"><div class="management-empty"><i class="pi pi-bell-slash"></i><strong>No hay alertas registradas</strong><span>Crea una alerta para no olvidar tus próximos pagos.</span></div></td></tr>
          </ng-template>
        </p-table>
      </div>

      <p-dialog
        [(visible)]="dialogVisible"
        [header]="editing ? 'Editar alerta' : 'Nueva alerta'"
        [modal]="true"
        [style]="{ width: 'min(600px, 95vw)' }"
        styleClass="professional-dialog compact-form-dialog"
      >
        <form [formGroup]="form" (ngSubmit)="save()">
          <div class="form-intro">
            <i class="pi pi-bell"></i>
            <span>Define el pago, la fecha y si debe repetirse automáticamente cada mes.</span>
          </div>
          <div class="form-grid compact-form-grid">
            <div class="field full"><label>Descripción</label><input pInputText formControlName="descripcion" placeholder="Ej. Pago de internet" /></div>
            <div class="field"><label>Tipo</label><p-select formControlName="tipo" [options]="tipos" placeholder="Selecciona un tipo" [appendTo]="'body'" /></div>
            <div class="field"><label>Fecha de alerta</label><p-datepicker formControlName="fechaAlerta" dateFormat="yy-mm-dd" [showIcon]="true" [appendTo]="'body'" /></div>
            <div class="field"><label>Monto estimado</label><p-inputnumber formControlName="monto" (onFocus)="selectMoneyInput($event)" mode="currency" currency="PEN" locale="es-PE" /></div>
            <div class="field"><label>Categoría</label><input pInputText formControlName="categoria" placeholder="Ej. Luz, Internet, Alimentos" /></div>
            <div class="field"><label>Cuenta para el pago</label><p-select formControlName="idCuenta" [options]="cuentas" optionLabel="nombreCuenta" optionValue="id" placeholder="Opcional" [appendTo]="'body'" /></div>
            <div class="field"><label>Estado</label><p-select formControlName="estado" [options]="estados" [appendTo]="'body'" /></div>
            <div class="field"><label>Repetición</label><div class="checkbox-row compact-checkbox"><p-checkbox formControlName="esRecurrente" [binary]="true" inputId="recurrente" /><label for="recurrente">Pago recurrente mensual</label></div></div>
            @if (form.controls.esRecurrente.value) { <div class="field"><label>Día de cada mes</label><p-inputnumber formControlName="diaMes" [min]="1" [max]="31" /></div> }
          </div>
          <div class="actions dialog-actions">
            <p-button label="Cancelar" [text]="true" type="button" (onClick)="dialogVisible = false" />
            <p-button label="Guardar" icon="pi pi-check" type="submit" [loading]="saving" [disabled]="form.invalid || saving" />
          </div>
        </form>
      </p-dialog>

      <p-dialog [(visible)]="payConfirmVisible" header="Confirmar pago" [modal]="true" [style]="{ width: 'min(460px, 95vw)' }" styleClass="professional-dialog compact-form-dialog">
        <div class="confirm-box success-confirm"><i class="pi pi-check-circle"></i><div><strong>Registrar pago</strong><span>Si la alerta tiene monto y cuenta asociados, también se creará el gasto.</span></div></div>
        <div class="actions dialog-actions"><p-button label="Cancelar" [text]="true" (onClick)="cancelPay()" /><p-button label="Registrar pago" icon="pi pi-check" severity="success" (onClick)="confirmPay()" /></div>
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

  get pendingAlertsCount(): number {
    return this.alertas.filter((a) => (a.estado ?? "PENDIENTE") !== "PAGADO").length;
  }

  get paidAlertsCount(): number {
    return this.alertas.filter((a) => (a.estado ?? "PENDIENTE") === "PAGADO").length;
  }

  get overdueAlertsCount(): number {
    return this.alertas.filter((a) => this.isOverdue(a)).length;
  }

  formatAlertType(tipo: string): string {
    return (tipo || "").replaceAll("_", " ");
  }

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
