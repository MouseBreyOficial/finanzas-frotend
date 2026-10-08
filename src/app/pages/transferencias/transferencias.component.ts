import { Component, inject, OnInit } from "@angular/core";
import { DatePipe, DecimalPipe, CurrencyPipe } from "@angular/common";
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
import { MessageService } from "primeng/api";
import { AuthService } from "../../core/services/auth.service";
import { CuentaService } from "../../core/services/cuenta.service";
import { TransferenciaService } from "../../core/services/transferencia.service";
import {
  CuentaResponse,
  TransferenciaResponse,
} from "../../core/models/api.models";

@Component({
  selector: "app-transferencias",
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
    CurrencyPipe,
  ],
  template: `
    <section class="page">
      <div class="page-header">
        <div>
          <h1>Transferencias</h1>
          <p class="muted">
            Transfiere dinero entre tus cuentas sin afectar tus ingresos ni
            gastos.
          </p>
        </div>
        <p-button
          label="Transferir"
          icon="pi pi-arrow-right-arrow-left"
          (onClick)="openTransfer()"
          [disabled]="cuentas.length < 2"
        />
      </div>

      @if (errorMessage) {
        <p-message severity="error" styleClass="w-full mb-3">
          {{ errorMessage }}
        </p-message>
      }

      @if (!loadingAccounts && cuentas.length < 2) {
        <p-message severity="info" styleClass="w-full mb-3">
          Necesitas al menos dos cuentas para realizar una transferencia.
        </p-message>
        <br />
      }

      <div class="card">
        <p-table
          [value]="transferencias"
          [loading]="loading"
          [paginator]="true"
          [rows]="10"
          [rowsPerPageOptions]="[5, 10, 20, 50]"
          sortField="fechaTransferencia"
          [sortOrder]="-1"
          [showCurrentPageReport]="true"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} transferencias"
          [tableStyle]="{ 'min-width': '60rem' }"
        >
          <ng-template #header>
            <tr>
              <th pSortableColumn="fechaTransferencia">
                <div class="table-header-sort">
                  Fecha
                  <p-sortIcon field="fechaTransferencia" />
                </div>
              </th>
              <th>Cuenta origen</th>
              <th>Cuenta destino</th>
              <th>Monto</th>
              <th>Descripción</th>
              <th>Detalle</th>
            </tr>
          </ng-template>
          <ng-template #body let-row>
            <tr>
              <td>{{ row.fechaTransferencia | date: "dd/MM/yyyy" }}</td>
              <td>{{ row.nombreCuentaOrigen }}</td>
              <td>{{ row.nombreCuentaDestino }}</td>
              <td>{{ row.monto | currency }}</td>
              <td>{{ row.descripcion || "-" }}</td>
              <td>
                <p-button
                  icon="pi pi-eye"
                  [text]="true"
                  ariaLabel="Ver detalle"
                  (onClick)="openDetail(row)"
                />
              </td>
            </tr>
          </ng-template>
          <ng-template #emptymessage>
            <tr>
              <td colspan="6">No hay transferencias registradas.</td>
            </tr>
          </ng-template>
        </p-table>
      </div>

      <p-dialog
        [(visible)]="transferDialogVisible"
        header="Nueva transferencia"
        [modal]="true"
        [style]="{ width: 'min(620px, 95vw)' }"
      >
        <form [formGroup]="form" (ngSubmit)="save()">
          <div class="form-grid">
            <div class="field">
              <label>Cuenta origen</label>
              <p-select
                formControlName="idCuentaOrigen"
                [options]="cuentas"
                optionLabel="nombreCuenta"
                optionValue="id"
                placeholder="Selecciona la cuenta origen"
                class="w-full"
                [appendTo]="'body'"
                (onChange)="validateAccounts()"
              />
              @if (cuentaOrigenSeleccionada) {
                <small class="muted">
                  Disponible: S/
                  {{ cuentaOrigenSeleccionada.saldoActual | number: "1.2-2" }}
                </small>
              }
            </div>

            <div class="field">
              <label>Cuenta destino</label>
              <p-select
                formControlName="idCuentaDestino"
                [options]="cuentasDestino"
                optionLabel="nombreCuenta"
                optionValue="id"
                placeholder="Selecciona la cuenta destino"
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
                prefix="S/ "
                [minFractionDigits]="2"
                [min]="0.01"
                class="w-full"
              />
            </div>

            <div class="field">
              <label>Fecha</label>
              <p-datepicker
                formControlName="fechaTransferencia"
                dateFormat="yy-mm-dd"
                [showIcon]="true"
                class="w-full"
                [appendTo]="'body'"
              />
            </div>

            <div class="field full">
              <label>Descripción</label>
              <input
                pInputText
                formControlName="descripcion"
                placeholder="Ej. Transferencia a cuenta de ahorros"
              />
            </div>
          </div>

          <div class="actions">
            <p-button
              label="Cancelar"
              [text]="true"
              type="button"
              (onClick)="transferDialogVisible = false"
            />
            <p-button
              label="Transferir"
              icon="pi pi-arrow-right-arrow-left"
              type="submit"
              [loading]="saving"
              [disabled]="form.invalid || saving"
            />
          </div>
        </form>
      </p-dialog>

      <p-dialog
        [(visible)]="detailDialogVisible"
        header="Detalle de transferencia"
        [modal]="true"
        [style]="{ width: 'min(560px, 95vw)' }"
        [draggable]="false"
        [resizable]="false"
      >
        @if (selectedTransferencia) {
          <div class="transfer-detail">
            <div class="transfer-route">
              <div class="account-side">
                <div class="account-icon">
                  <i class="pi pi-wallet"></i>
                </div>

                <span class="account-label"> Cuenta origen </span>

                <strong class="account-name">
                  {{ selectedTransferencia.nombreCuentaOrigen }}
                </strong>
              </div>

              <div class="transfer-arrow">
                <i class="pi pi-arrow-right"></i>
              </div>

              <div class="account-side">
                <div class="account-icon">
                  <i class="pi pi-wallet"></i>
                </div>

                <span class="account-label"> Cuenta destino </span>

                <strong class="account-name">
                  {{ selectedTransferencia.nombreCuentaDestino }}
                </strong>
              </div>
            </div>

            <div class="transfer-amount">
              <span>Monto transferido</span>

              <strong>
                S/ {{ selectedTransferencia.monto | number: "1.2-2" }}
              </strong>
            </div>

            <div class="detail-divider"></div>

            <div class="detail-info">
              <div class="detail-item">
                <span class="detail-label">
                  <i class="pi pi-calendar"></i>
                  Fecha
                </span>

                <strong>
                  {{
                    selectedTransferencia.fechaTransferencia
                      | date: "dd/MM/yyyy"
                  }}
                </strong>
              </div>

              <div class="detail-item">
                <span class="detail-label">
                  <i class="pi pi-file-edit"></i>
                  Descripción
                </span>

                <div class="detail-value">
                  {{ selectedTransferencia.descripcion || "Sin descripción" }}
                </div>
              </div>
            </div>
          </div>

          <div class="actions">
            <p-button
              label="Cerrar"
              icon="pi pi-times"
              [text]="true"
              (onClick)="detailDialogVisible = false"
            />
          </div>
        }
      </p-dialog>
    </section>
  `,
})
export class TransferenciasComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly cuentaService = inject(CuentaService);
  private readonly transferenciaService = inject(TransferenciaService);
  private readonly messages = inject(MessageService);

  cuentas: CuentaResponse[] = [];
  transferencias: TransferenciaResponse[] = [];
  selectedTransferencia: TransferenciaResponse | null = null;
  transferDialogVisible = false;
  detailDialogVisible = false;
  loading = false;
  loadingAccounts = false;
  saving = false;
  errorMessage = "";

  readonly form = this.fb.nonNullable.group({
    idCuentaOrigen: [0, [Validators.required, Validators.min(1)]],
    idCuentaDestino: [0, [Validators.required, Validators.min(1)]],
    monto: [0, [Validators.required, Validators.min(0.01)]],
    fechaTransferencia: [new Date(), Validators.required],
    descripcion: [""],
  });

  ngOnInit(): void {
    this.load();
  }

  get cuentaOrigenSeleccionada(): CuentaResponse | undefined {
    const id = this.form.controls.idCuentaOrigen.value;
    return this.cuentas.find((c) => c.id === id);
  }

  get cuentasDestino(): CuentaResponse[] {
    const idOrigen = this.form.controls.idCuentaOrigen.value;
    return this.cuentas.filter((c) => c.id !== idOrigen);
  }

  load(): void {
    this.auth.resolveUserId().subscribe((id) => {
      if (!id) return;
      this.loadAccounts(id);
      this.loadTransfers(id);
    });
  }

  private loadAccounts(idUsuario: number): void {
    this.loadingAccounts = true;
    this.cuentaService
      .listarPorUsuario(idUsuario)
      .pipe(finalize(() => (this.loadingAccounts = false)))
      .subscribe({
        next: (data) => (this.cuentas = data),
        error: (e) =>
          (this.errorMessage =
            e?.error?.mensaje ?? "No se pudieron cargar las cuentas."),
      });
  }

  private loadTransfers(idUsuario: number): void {
    this.loading = true;
    this.transferenciaService
      .listarPorUsuario(idUsuario)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (data) => (this.transferencias = data),
        error: (e) =>
          (this.errorMessage =
            e?.error?.mensaje ?? "No se pudieron cargar las transferencias."),
      });
  }

  openTransfer(): void {
    this.form.reset({
      idCuentaOrigen: 0,
      idCuentaDestino: 0,
      monto: 0,
      fechaTransferencia: new Date(),
      descripcion: "",
    });
    this.transferDialogVisible = true;
  }

  validateAccounts(): void {
    const origen = this.form.controls.idCuentaOrigen.value;
    if (this.form.controls.idCuentaDestino.value === origen) {
      this.form.controls.idCuentaDestino.setValue(0);
    }
  }

  save(): void {
    const idUsuario = this.auth.getUserId();
    if (!idUsuario || this.form.invalid) return;

    const value = this.form.getRawValue();
    if (value.idCuentaOrigen === value.idCuentaDestino) {
      this.messages.add({
        severity: "warn",
        summary: "Validación",
        detail: "La cuenta de origen y destino deben ser diferentes.",
        life: 4000,
      });
      return;
    }

    const origen = this.cuentas.find((c) => c.id === value.idCuentaOrigen);
    if (origen && value.monto > origen.saldoActual) {
      this.messages.add({
        severity: "warn",
        summary: "Saldo insuficiente",
        detail: `Disponible: S/ ${origen.saldoActual.toFixed(2)}`,
        life: 4000,
      });
      return;
    }

    this.saving = true;
    this.transferenciaService
      .registrar({
        idUsuario,
        idCuentaOrigen: value.idCuentaOrigen,
        idCuentaDestino: value.idCuentaDestino,
        monto: value.monto,
        fechaTransferencia: this.toDateString(value.fechaTransferencia),
        descripcion: value.descripcion?.trim() || undefined,
        usuarioCreacion: this.auth.getUsername(),
      })
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: () => {
          this.messages.add({
            severity: "success",
            summary: "Transferencia realizada",
            detail:
              "Los saldos de las cuentas fueron actualizados correctamente.",
            life: 3500,
          });
          this.transferDialogVisible = false;
          this.load();
        },
        error: (e) => {
          this.messages.add({
            severity: "error",
            summary: "No se pudo transferir",
            detail:
              e?.error?.mensaje ??
              "Ocurrió un error al realizar la transferencia.",
            life: 5000,
          });
        },
      });
  }

  openDetail(row: TransferenciaResponse): void {
    this.selectedTransferencia = row;
    this.detailDialogVisible = true;
  }

  selectMoneyInput(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    setTimeout(() => input?.select());
  }

  private toDateString(value: Date | string): string {
    if (typeof value === "string") return value;
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
}
