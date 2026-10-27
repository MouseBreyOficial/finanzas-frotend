import { Component, inject, OnInit } from "@angular/core";
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  FormsModule,
} from "@angular/forms";
import { finalize } from "rxjs";
import { DecimalPipe } from "@angular/common";
import { TableModule } from "primeng/table";
import { ButtonModule } from "primeng/button";
import { DialogModule } from "primeng/dialog";
import { InputTextModule } from "primeng/inputtext";
import { InputNumberModule } from "primeng/inputnumber";
import { MessageModule } from "primeng/message";
import { AuthService } from "../../core/services/auth.service";
import { CuentaService } from "../../core/services/cuenta.service";
import { CuentaResponse } from "../../core/models/api.models";
import { MessageService } from "primeng/api";

@Component({
  selector: "app-cuentas",
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    DecimalPipe,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    InputNumberModule,
    MessageModule,
  ],
  template: `
    <section class="page management-page">
      <div class="page-header">
        <div class="management-heading">
          <div class="management-title-icon accounts"><i class="pi pi-wallet"></i></div>
          <div>
            <h1>Cuentas</h1>
            <p class="muted">Controla tus cuentas y consulta el saldo disponible en cada una.</p>
          </div>
        </div>
        <p-button label="Nueva cuenta" icon="pi pi-plus" (onClick)="openNew()" />
      </div>

      @if (errorMessage) {
        <p-message severity="error" styleClass="w-full mb-3">{{ errorMessage }}</p-message>
      }

      <div class="management-summary-grid accounts-summary-grid">
        <div class="summary-card compact-summary">
          <div class="summary-icon"><i class="pi pi-wallet"></i></div>
          <div><span>Cuentas registradas</span><strong>{{ cuentas.length }}</strong></div>
        </div>
        <div class="summary-card compact-summary neutral">
          <div class="summary-icon"><i class="pi pi-flag"></i></div>
          <div><span>Saldo inicial total</span><strong>S/ {{ totalInitialBalance | number: '1.2-2' }}</strong></div>
        </div>
        <div class="summary-card compact-summary success">
          <div class="summary-icon"><i class="pi pi-chart-line"></i></div>
          <div><span>Saldo disponible total</span><strong>S/ {{ totalCurrentBalance | number: '1.2-2' }}</strong></div>
        </div>
      </div>

      <div class="card table-card professional-table-card">
        <div class="table-toolbar professional-toolbar">
          <div class="toolbar-title"><i class="pi pi-list"></i><div><strong>Mis cuentas</strong><span>Detalle de saldos registrados</span></div></div>
        </div>
        <p-table
          [value]="cuentas"
          [loading]="loading"
          [paginator]="true"
          [rows]="10"
          [rowsPerPageOptions]="[5, 10, 20]"
          [showCurrentPageReport]="true"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} cuentas"
        >
          <ng-template #header>
            <tr><th>ID</th><th>Cuenta</th><th>Saldo inicial</th><th>Saldo actual</th><th>Acciones</th></tr>
          </ng-template>
          <ng-template #body let-c>
            <tr>
              <td><span class="id-pill">#{{ c.id }}</span></td>
              <td><div class="entity-cell"><div class="entity-avatar account-avatar"><i class="pi pi-wallet"></i></div><strong>{{ c.nombreCuenta }}</strong></div></td>
              <td><span class="secondary-value">S/ {{ c.saldoInicial | number: '1.2-2' }}</span></td>
              <td><strong class="balance-value">S/ {{ c.saldoActual | number: '1.2-2' }}</strong></td>
              <td><div class="table-actions"><p-button icon="pi pi-pencil" [text]="true" title="Editar cuenta" (onClick)="edit(c)" /></div></td>
            </tr>
          </ng-template>
          <ng-template #emptymessage>
            <tr><td colspan="5"><div class="management-empty"><i class="pi pi-wallet"></i><strong>No hay cuentas registradas</strong><span>Crea tu primera cuenta para comenzar a controlar tus saldos.</span></div></td></tr>
          </ng-template>
        </p-table>
      </div>

      <p-dialog
        [(visible)]="dialogVisible"
        [header]="editing ? 'Editar cuenta' : 'Nueva cuenta'"
        [modal]="true"
        [style]="{ width: 'min(500px,95vw)' }"
        styleClass="professional-dialog compact-form-dialog"
      >
        <form [formGroup]="form" (ngSubmit)="save()">
          <div class="form-intro">
            <i class="pi pi-wallet"></i>
            <span>{{ editing ? 'Actualiza el nombre o saldo disponible de la cuenta.' : 'Registra una cuenta y su saldo inicial.' }}</span>
          </div>
          <div class="form-grid compact-form-grid">
            <div class="field full">
              <label>Nombre de cuenta</label>
              <input pInputText formControlName="nombreCuenta" placeholder="Ej. BCP, Efectivo, Interbank" />
            </div>
            @if (!editing) {
              <div class="field full">
                <label>Saldo inicial</label>
                <p-inputnumber formControlName="saldoInicial" (onFocus)="selectMoneyInput($event)" mode="decimal" prefix="S/ " [minFractionDigits]="2" />
                <small class="muted">El saldo actual comenzará con este mismo importe.</small>
              </div>
            } @else {
              <div class="field">
                <label>Saldo inicial</label>
                <p-inputnumber [ngModel]="editing.saldoInicial" [ngModelOptions]="{ standalone: true }" mode="decimal" prefix="S/ " [disabled]="true" />
                <small class="muted">Valor de referencia.</small>
              </div>
              <div class="field">
                <label>Saldo actual</label>
                <p-inputnumber formControlName="saldoActual" (onFocus)="selectMoneyInput($event)" mode="decimal" prefix="S/ " [minFractionDigits]="2" />
              </div>
            }
          </div>
          <div class="actions dialog-actions">
            <p-button label="Cancelar" [text]="true" type="button" (onClick)="dialogVisible = false" />
            <p-button label="Guardar" icon="pi pi-check" type="submit" [loading]="saving" [disabled]="form.invalid || saving" />
          </div>
        </form>
      </p-dialog>
    </section>
  `,
})
export class CuentasComponent implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private service = inject(CuentaService);
  private readonly messages = inject(MessageService);

  cuentas: CuentaResponse[] = [];
  dialogVisible = false;
  editing: CuentaResponse | null = null;
  loading = false;
  saving = false;
  errorMessage = "";
  readonly form = this.fb.nonNullable.group({
    nombreCuenta: ["", Validators.required],
    saldoInicial: [0, Validators.required],
    saldoActual: [0, Validators.required],
  });

  get totalInitialBalance(): number {
    return this.cuentas.reduce((total, cuenta) => total + Number(cuenta.saldoInicial || 0), 0);
  }

  get totalCurrentBalance(): number {
    return this.cuentas.reduce((total, cuenta) => total + Number(cuenta.saldoActual || 0), 0);
  }

  ngOnInit() {
    this.load();
  }

  load() {
    const id = this.auth.getUserId();
    if (!id) {
      this.auth.resolveUserId().subscribe((x) => x && this.load());
      return;
    }

    this.loading = true;
    this.service
      .listarPorUsuario(id)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (d) => (this.cuentas = d),
        error: (e) =>
          (this.errorMessage =
            e?.error?.mensaje ?? "No se pudieron cargar las cuentas."),
      });
  }

  openNew() {
    this.editing = null;
    this.form.reset({
      nombreCuenta: "",
      saldoInicial: 0,
      saldoActual: 0,
    });
    this.dialogVisible = true;
  }

  edit(c: CuentaResponse) {
    this.editing = c;
    this.form.reset({
      nombreCuenta: c.nombreCuenta,
      saldoInicial: c.saldoInicial,
      saldoActual: c.saldoActual,
    });
    this.dialogVisible = true;
  }

  save() {
    const id = this.auth.getUserId();
    if (!id || this.form.invalid) return;

    this.saving = true;
    const v = this.form.getRawValue();
    const req = this.editing
      ? this.service.actualizar({
          id: this.editing.id,
          nombreCuenta: v.nombreCuenta,
          saldoActual: v.saldoActual,
          usuarioModificacion: this.auth.getUsername(),
        })
      : this.service.registrar({
          nombreCuenta: v.nombreCuenta,
          saldoInicial: v.saldoInicial,
          saldoActual: v.saldoInicial,
          idUsuario: id,
          usuarioCreacion: this.auth.getUsername(),
        });

    req.pipe().subscribe({
      next: () => {
        this.messages.add({
          severity: "success",
          summary: "Guardado",
          detail: this.editing
            ? "Cuenta actualizada."
            : "Cuenta registrada correctamente.",
          life: 3000,
        });

        this.saving = false;
        this.dialogVisible = false;
        this.load();
      },
      error: (e) => {
        this.messages.add({
          severity: "error",
          summary: "Error",
          detail: "No se pudo guardar la cuenta.",
          life: 5000,
        });

        this.saving = false;
      },
    });
  }

  selectMoneyInput(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    setTimeout(() => input?.select());
  }
}
