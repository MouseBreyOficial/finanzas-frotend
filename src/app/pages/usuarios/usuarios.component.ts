import { Component, inject, OnInit } from "@angular/core";
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  Validators,
} from "@angular/forms";
import { TableModule } from "primeng/table";
import { TagModule } from "primeng/tag";
import { ButtonModule } from "primeng/button";
import { DialogModule } from "primeng/dialog";
import { InputTextModule } from "primeng/inputtext";
import { MessageModule } from "primeng/message";
import { TooltipModule } from "primeng/tooltip";
import { MessageService } from "primeng/api";
import { UsuarioService } from "../../core/services/usuario.service";
import { AuthService } from "../../core/services/auth.service";
import { UsuarioResponse } from "../../core/models/api.models";

@Component({
  selector: "app-usuarios",
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    TagModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    MessageModule,
    TooltipModule,
  ],
  template: `
    <section class="page management-page">
      <div class="page-header">
        <div class="management-heading">
          <div class="management-title-icon users"><i class="pi pi-users"></i></div>
          <div>
            <div class="eyebrow">ADMINISTRACIÓN</div>
            <h1>Usuarios</h1>
            <p class="muted">Administra accesos, estados y datos de los usuarios registrados.</p>
          </div>
        </div>
        <p-button label="Nuevo usuario" icon="pi pi-plus" (onClick)="openNew()" />
      </div>

      @if (errorMessage) {
        <p-message severity="error" styleClass="w-full mb-3">{{ errorMessage }}</p-message>
      }

      <div class="management-summary-grid">
        <div class="summary-card compact-summary">
          <div class="summary-icon"><i class="pi pi-users"></i></div>
          <div><span>Total de usuarios</span><strong>{{ usuarios.length }}</strong></div>
        </div>
        <div class="summary-card compact-summary success">
          <div class="summary-icon"><i class="pi pi-user-plus"></i></div>
          <div><span>Usuarios activos</span><strong>{{ activeUsersCount }}</strong></div>
        </div>
        <div class="summary-card compact-summary muted-card">
          <div class="summary-icon"><i class="pi pi-user-minus"></i></div>
          <div><span>Usuarios inactivos</span><strong>{{ inactiveUsersCount }}</strong></div>
        </div>
      </div>

      <div class="card table-card professional-table-card">
        <div class="table-toolbar professional-toolbar">
          <div class="search-box">
            <i class="pi pi-search"></i>
            <input pInputText [(ngModel)]="search" placeholder="Buscar por usuario, nombre o correo..." />
          </div>
          <div class="toolbar-result"><i class="pi pi-list"></i><span>{{ filteredUsuarios.length }} registro(s)</span></div>
        </div>

        <p-table
          [value]="filteredUsuarios"
          [loading]="loading"
          [paginator]="true"
          [rows]="10"
          [rowsPerPageOptions]="[5, 10, 20, 50]"
          [showCurrentPageReport]="true"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} usuarios"
        >
          <ng-template #header>
            <tr>
              <th>ID</th>
              <th>Usuario</th>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </ng-template>
          <ng-template #body let-u>
            <tr>
              <td><span class="id-pill">#{{ u.id }}</span></td>
              <td>
                <div class="entity-cell">
                  <div class="entity-avatar">{{ (u.nombreUsuario || 'U').charAt(0).toUpperCase() }}</div>
                  <strong>{{ u.nombreUsuario }}</strong>
                </div>
              </td>
              <td>{{ u.nombreCompleto }}</td>
              <td><span class="secondary-value">{{ u.correoElectronico }}</span></td>
              <td>
                <p-tag
                  [value]="u.estadoRegistro === 1 ? 'Activo' : 'Inactivo'"
                  [severity]="u.estadoRegistro === 1 ? 'success' : 'secondary'"
                />
              </td>
              <td>
                <div class="table-actions">
                  <p-button icon="pi pi-eye" [text]="true" pTooltip="Ver detalle" (onClick)="view(u)" />
                  <p-button icon="pi pi-pencil" [text]="true" pTooltip="Editar" (onClick)="edit(u)" />
                  @if (!isAdministratorUser(u)) {
                    @if (u.estadoRegistro === 1) {
                      <p-button icon="pi pi-user-minus" severity="danger" [text]="true" pTooltip="Desactivar" (onClick)="remove(u)" />
                    } @else {
                      <p-button icon="pi pi-user-plus" severity="success" [text]="true" pTooltip="Activar" (onClick)="activate(u)" />
                    }
                  }
                </div>
              </td>
            </tr>
          </ng-template>
          <ng-template #emptymessage>
            <tr><td colspan="6"><div class="management-empty"><i class="pi pi-users"></i><strong>No hay usuarios para mostrar</strong><span>Prueba con otro criterio de búsqueda.</span></div></td></tr>
          </ng-template>
        </p-table>
      </div>

      <p-dialog
        [(visible)]="detailVisible"
        header="Detalle del usuario"
        [modal]="true"
        [style]="{ width: 'min(520px, 95vw)' }"
        styleClass="professional-dialog"
      >
        @if (selected) {
          <div class="detail-profile-head">
            <div class="detail-avatar">{{ (selected.nombreUsuario || 'U').charAt(0).toUpperCase() }}</div>
            <div><strong>{{ selected.nombreCompleto }}</strong><span>@{{ selected.nombreUsuario }}</span></div>
          </div>
          <div class="detail-grid">
            <div><span>ID</span><strong>#{{ selected.id }}</strong></div>
            <div><span>Estado</span><strong>{{ selected.estadoRegistro === 1 ? 'Activo' : 'Inactivo' }}</strong></div>
            <div class="full"><span>Correo electrónico</span><strong>{{ selected.correoElectronico }}</strong></div>
          </div>
        }
      </p-dialog>

      <p-dialog
        [(visible)]="formVisible"
        [header]="editing ? 'Editar usuario' : 'Nuevo usuario'"
        [modal]="true"
        [style]="{ width: 'min(560px, 95vw)' }"
        styleClass="professional-dialog compact-form-dialog"
      >
        <form [formGroup]="form" (ngSubmit)="save()">
          <div class="form-intro">
            <i class="pi pi-user-edit"></i>
            <span>{{ editing ? 'Actualiza los datos permitidos del usuario.' : 'Completa los datos para crear un nuevo acceso.' }}</span>
          </div>
          <div class="form-grid compact-form-grid">
            <div class="field">
              <label>Usuario</label>
              <input pInputText formControlName="nombreUsuario" [readonly]="!!editing" placeholder="Ej. breyes" />
              @if (editing) { <small class="muted">El usuario no se puede modificar.</small> }
            </div>
            <div class="field">
              <label>Contraseña</label>
              <input pInputText type="password" formControlName="hashContrasena" [placeholder]="editing ? 'Mantener contraseña actual' : 'Ingresa una contraseña'" />
              @if (editing) { <small class="muted">Déjala vacía para conservar la actual.</small> }
            </div>
            <div class="field full">
              <label>Nombre completo</label>
              <input pInputText formControlName="nombreCompleto" placeholder="Nombres y apellidos" />
            </div>
            <div class="field full">
              <label>Correo electrónico</label>
              <input pInputText type="email" formControlName="correoElectronico" placeholder="correo@ejemplo.com" />
            </div>
          </div>
          <div class="actions dialog-actions">
            <p-button label="Cancelar" [text]="true" type="button" (onClick)="formVisible = false" />
            <p-button label="Guardar" icon="pi pi-check" type="submit" [disabled]="form.invalid" />
          </div>
        </form>
      </p-dialog>

      <p-dialog
        [(visible)]="deleteVisible"
        header="Confirmar baja de usuario"
        [modal]="true"
        [style]="{ width: 'min(480px, 95vw)' }"
        styleClass="professional-dialog compact-form-dialog"
      >
        <div class="confirm-box danger-confirm">
          <i class="pi pi-exclamation-triangle"></i>
          <div><strong>Desactivar usuario</strong><span>El usuario <b>{{ pendingDelete?.nombreUsuario }}</b> ya no podrá acceder.</span></div>
        </div>
        <div class="field">
          <label>Motivo de baja</label>
          <input pInputText [(ngModel)]="deleteReason" placeholder="Describe brevemente el motivo" />
        </div>
        <div class="actions dialog-actions">
          <p-button label="Cancelar" [text]="true" (onClick)="cancelDelete()" />
          <p-button label="Desactivar" severity="danger" icon="pi pi-user-minus" (onClick)="confirmDelete()" />
        </div>
      </p-dialog>
    </section>
  `,
})
export class UsuariosComponent implements OnInit {
  private service = inject(UsuarioService);
  private auth = inject(AuthService);
  private fb = inject(FormBuilder);
  private messages = inject(MessageService);
  usuarios: UsuarioResponse[] = [];
  loading = false;
  errorMessage = "";
  search = "";
  detailVisible = false;
  formVisible = false;
  selected: UsuarioResponse | null = null;
  editing: UsuarioResponse | null = null;
  deleteVisible = false;
  pendingDelete: UsuarioResponse | null = null;
  deleteReason = "";

  form = this.fb.nonNullable.group({
    nombreUsuario: ["", Validators.required],
    hashContrasena: [""],
    nombreCompleto: ["", Validators.required],
    correoElectronico: ["", [Validators.required, Validators.email]],
  });

  get filteredUsuarios() {
    const q = this.search.toLowerCase().trim();
    return q
      ? this.usuarios.filter((u) =>
          `${u.nombreUsuario} ${u.nombreCompleto} ${u.correoElectronico}`
            .toLowerCase()
            .includes(q),
        )
      : this.usuarios;
  }

  get activeUsersCount(): number {
    return this.usuarios.filter((u) => u.estadoRegistro === 1).length;
  }

  get inactiveUsersCount(): number {
    return this.usuarios.filter((u) => u.estadoRegistro !== 1).length;
  }

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading = true;
    this.service.listar().subscribe({
      next: (d) => {
        this.usuarios = d;
        this.loading = false;
      },
      error: () => {
        this.errorMessage = "No se pudieron cargar los usuarios.";
        this.loading = false;
      },
    });
  }

  isAdministratorUser(u: UsuarioResponse) {
    return u.nombreUsuario.trim().toLowerCase() === "administrador";
  }

  activate(u: UsuarioResponse) {
    this.service.activar(u.id, this.auth.getUsername()).subscribe({
      next: () => {
        this.messages.add({
          severity: "success",
          summary: "Usuario activado",
          detail: `${u.nombreUsuario} fue activado correctamente.`,
          life: 5000,
        });
        this.load();
      },
      error: (e) =>
        this.messages.add({
          severity: "error",
          summary: "No se pudo activar",
          detail: e?.error?.mensaje ?? "No se pudo activar el usuario.",
          life: 7000,
        }),
    });
  }

  view(u: UsuarioResponse) {
    this.service.obtener(u.id).subscribe({
      next: (d) => {
        this.selected = d;
        this.detailVisible = true;
      },
      error: () => (this.errorMessage = "No se pudo cargar el detalle."),
    });
  }

  openNew() {
    this.editing = null;
    this.form.reset({
      nombreUsuario: "",
      hashContrasena: "",
      nombreCompleto: "",
      correoElectronico: "",
    });
    this.form.controls.nombreUsuario.enable();
    this.form.controls.hashContrasena.setValidators(Validators.required);
    this.form.controls.hashContrasena.updateValueAndValidity();
    this.formVisible = true;
  }

  edit(u: UsuarioResponse) {
    this.editing = u;
    this.form.reset({
      nombreUsuario: u.nombreUsuario,
      hashContrasena: "",
      nombreCompleto: u.nombreCompleto,
      correoElectronico: u.correoElectronico,
    });
    this.form.controls.nombreUsuario.disable();
    this.form.controls.hashContrasena.clearValidators();
    this.form.controls.hashContrasena.updateValueAndValidity();
    this.formVisible = true;
  }

  save() {
    if (this.form.invalid) return;

    const v = this.form.getRawValue();
    const req = this.editing
      ? this.service.actualizar({
          id: this.editing.id,
          nombreCompleto: v.nombreCompleto,
          correoElectronico: v.correoElectronico,
          hashContrasena: v.hashContrasena?.trim() || undefined,
          usuarioModificacion: this.auth.getUsername(),
        })
      : this.service.registrar({
          nombreUsuario: v.nombreUsuario,
          hashContrasena: v.hashContrasena,
          nombreCompleto: v.nombreCompleto,
          correoElectronico: v.correoElectronico,
          usuarioCreacion: this.auth.getUsername(),
        });

    req.subscribe({
      next: () => {
        this.formVisible = false;
        this.messages.add({
          severity: "success",
          summary: "Usuario",
          detail: this.editing
            ? "Usuario actualizado correctamente."
            : "Usuario registrado correctamente.",
          life: 5000,
        });
        this.load();
      },
      error: (e) => {
        const mensaje =
          e?.error?.mensaje ??
          e?.error?.message ??
          "No se pudo guardar el usuario.";
        this.messages.add({
          severity: "error",
          summary: "No se pudo registrar",
          detail: mensaje,
          life: 8000,
        });
      },
    });
  }

  remove(u: UsuarioResponse) {
    this.pendingDelete = u;
    this.deleteReason = "";
    this.deleteVisible = true;
  }

  cancelDelete() {
    this.deleteVisible = false;
    this.pendingDelete = null;
    this.deleteReason = "";
  }

  confirmDelete() {
    if (!this.pendingDelete) return;
    if (this.isAdministratorUser(this.pendingDelete)) {
      this.cancelDelete();
      this.messages.add({
        severity: "error",
        summary: "Acción no permitida",
        detail: "El usuario Administrador no puede ser desactivado.",
        life: 7000,
      });
      return;
    }
    this.service
      .eliminar({
        id: this.pendingDelete.id,
        usuarioBaja: this.auth.getUsername(),
        descripcionBaja: this.deleteReason.trim() || "Baja desde frontend",
      })
      .subscribe({
        next: () => {
          this.cancelDelete();
          this.messages.add({
            severity: "success",
            summary: "Usuario desactivado",
            detail: "El usuario fue desactivado correctamente.",
            life: 5000,
          });
          this.load();
        },
        error: (e) =>
          this.messages.add({
            severity: "error",
            summary: "No se pudo desactivar",
            detail: e?.error?.mensaje ?? "No se pudo desactivar el usuario.",
            life: 7000,
          }),
      });
  }
}
