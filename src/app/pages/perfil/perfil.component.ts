import { Component, inject, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MessageModule } from "primeng/message";
import { SkeletonModule } from "primeng/skeleton";
import { SelectModule } from "primeng/select";
import { ButtonModule } from "primeng/button";
import { DialogModule } from "primeng/dialog";
import { InputTextModule } from "primeng/inputtext";
import { MessageService } from "primeng/api";
import { Router } from "@angular/router";

import { AuthService } from "../../core/services/auth.service";
import { UsuarioService } from "../../core/services/usuario.service";
import { PushNotificationService } from "../../core/services/push-notification.service";

import {
  ThemeService,
  AppThemeName,
  AppColorMode,
  AppPrimaryColor,
} from "../../core/services/theme.service";

import { UsuarioResponse } from "../../core/models/api.models";

@Component({
  selector: "app-perfil",
  standalone: true,
  imports: [
    FormsModule,
    MessageModule,
    SkeletonModule,
    SelectModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
  ],
  template: `
    <section class="page">
      <div class="page-header">
        <div>
          <div class="eyebrow">MI CUENTA</div>

          <h1>Mi perfil</h1>

          <p class="muted">
            Información asociada a tu usuario y preferencias de apariencia.
          </p>
        </div>
      </div>

      @if (errorMessage) {
        <p-message severity="error">
          {{ errorMessage }}
        </p-message>
      }

      <!-- =====================================================
           PERFIL + APARIENCIA
           ===================================================== -->

      <div class="profile-layout">
        <!-- DATOS DEL PERFIL -->

        <div class="profile-card card">
          @if (loading) {
            <p-skeleton shape="circle" size="5rem" />

            <p-skeleton width="12rem" height="1.6rem" />

            <p-skeleton width="20rem" />
          } @else if (usuario) {
            <div class="profile-avatar">
              {{ initials }}
            </div>

            <div class="profile-main">
              <h2>
                {{ usuario.nombreCompleto }}
              </h2>

              <span> @{{ usuario.nombreUsuario }} </span>
            </div>

            <div class="profile-info">
              <div>
                <i class="pi pi-envelope"></i>

                <span>
                  <small> Correo electrónico </small>

                  <strong>
                    {{ usuario.correoElectronico }}
                  </strong>
                </span>
              </div>

              <div>
                <i class="pi pi-id-card"></i>

                <span>
                  <small> ID de usuario </small>

                  <strong> #{{ usuario.id }} </strong>
                </span>
              </div>

              <div>
                <i class="pi pi-check-circle"></i>

                <span>
                  <small> Estado </small>

                  <strong>
                    {{ usuario.estadoRegistro === 1 ? "Activo" : "Inactivo" }}
                  </strong>
                </span>
              </div>
            </div>
          }
        </div>

        <!-- APARIENCIA -->

        <div class="appearance-card card">
          <div>
            <div class="eyebrow">APARIENCIA</div>

            <h2>Personalizar tema</h2>

            <p class="muted">
              El cambio se aplica inmediatamente y se conserva para tus próximos
              ingresos desde este navegador.
            </p>
          </div>

          <div class="appearance-grid">
            <div class="field">
              <label> Tema PrimeNG </label>

              <p-select
                [(ngModel)]="selectedTheme"
                [options]="themeService.themes"
                (onChange)="changeTheme($event.value)"
                appendTo="body"
              />
            </div>

            <div class="field">
              <label> Color principal </label>

              <p-select
                [(ngModel)]="selectedPrimary"
                [options]="themeService.primaryColors"
                optionLabel="label"
                optionValue="value"
                (onChange)="changePrimary($event.value)"
                appendTo="body"
              />
            </div>

            <div class="field full">
              <label> Modo </label>

              <p-select
                [(ngModel)]="selectedMode"
                [options]="themeService.modes"
                optionLabel="label"
                optionValue="value"
                (onChange)="changeMode($event.value)"
                appendTo="body"
              />
            </div>
          </div>

          <div class="theme-note">
            <i class="pi pi-palette"></i>

            <span>
              Combina Aura, Lara, Material o Nora con 8 colores y modo
              claro/oscuro.
            </span>
          </div>
        </div>
      </div>

      <!-- =====================================================
           NOTIFICACIONES
           ===================================================== -->

      @if (usuario) {
        <div class="notification-card card">
          <div class="notification-content">
            <div class="notification-icon">
              <i class="pi pi-bell"></i>
            </div>

            <div class="notification-info">
              <div class="eyebrow">NOTIFICACIONES</div>

              <h2>Recordatorios de pagos</h2>

              <p class="muted">
                Recibe alertas de tus pagos incluso cuando Finanzas no esté
                abierta.
              </p>

              @if (!pushService.soportado) {
                <div class="notification-status unavailable">
                  <i class="pi pi-exclamation-triangle"></i>

                  <span>
                    Web Push no está disponible en este navegador o la
                    aplicación no está ejecutándose como PWA.
                  </span>
                </div>
              } @else if (loadingPush) {
                <div class="notification-status">
                  <i class="pi pi-spin pi-spinner"></i>

                  <span> Consultando estado... </span>
                </div>
              } @else {
                <div class="notification-status" [class.active]="pushActivo">
                  <i
                    class="pi"
                    [class.pi-check-circle]="pushActivo"
                    [class.pi-times-circle]="!pushActivo"
                  ></i>

                  <span>
                    Estado:
                    <strong>
                      {{ pushActivo ? "Activadas" : "Desactivadas" }}
                    </strong>
                  </span>
                </div>
              }
            </div>
          </div>

          @if (pushService.soportado) {
            <div class="notification-actions">
              @if (!pushActivo) {
                <p-button
                  label="Activar notificaciones"
                  icon="pi pi-bell"
                  [loading]="processingPush"
                  [disabled]="loadingPush || processingPush"
                  (onClick)="activarNotificaciones()"
                />
              } @else {
                <!-- TEMPORAL:
                     Lo utilizaremos para probar Web Push.
                     Luego lo eliminaremos. -->

                <p-button
                  label="Enviar prueba"
                  icon="pi pi-send"
                  severity="secondary"
                  [outlined]="true"
                  [loading]="sendingTest"
                  [disabled]="processingPush || sendingTest"
                  (onClick)="enviarPrueba()"
                />

                <p-button
                  label="Desactivar"
                  icon="pi pi-bell-slash"
                  severity="danger"
                  [outlined]="true"
                  [loading]="processingPush"
                  [disabled]="processingPush || sendingTest"
                  (onClick)="desactivarNotificaciones()"
                />
              }
            </div>
          }
        </div>
      }

      <!-- =====================================================
           ZONA DE PELIGRO
           ===================================================== -->

      @if (usuario && !auth.isAdministrator()) {
        <div class="danger-card card">
          <div>
            <div class="eyebrow">ZONA DE PELIGRO</div>

            <h2>Eliminar mi cuenta</h2>

            <p class="muted">
              Tu cuenta será desactivada. No podrás volver a iniciar sesión
              hasta que un administrador la reactive.
            </p>
          </div>

          <p-button
            label="Eliminar mi cuenta"
            icon="pi pi-user-minus"
            severity="danger"
            [outlined]="true"
            (onClick)="deleteAccountVisible = true"
          />
        </div>
      }

      <!-- =====================================================
           DIALOG ELIMINAR CUENTA
           ===================================================== -->

      <p-dialog
        [(visible)]="deleteAccountVisible"
        header="Eliminar mi cuenta"
        [modal]="true"
        [style]="{ width: 'min(500px, 95vw)' }"
      >
        <p>
          ¿Seguro que deseas desactivar tu cuenta? Se cerrará tu sesión
          inmediatamente y no podrás iniciar sesión nuevamente hasta que un
          administrador la reactive.
        </p>

        <div class="field">
          <label> Motivo (opcional) </label>

          <input
            pInputText
            [(ngModel)]="deleteReason"
            placeholder="Motivo de la desactivación"
          />
        </div>

        <div class="actions">
          <p-button
            label="Cancelar"
            [text]="true"
            (onClick)="deleteAccountVisible = false"
          />

          <p-button
            label="Sí, eliminar mi cuenta"
            severity="danger"
            (onClick)="confirmDeleteAccount()"
          />
        </div>
      </p-dialog>
    </section>
  `,
})
export class PerfilComponent implements OnInit {
  readonly auth = inject(AuthService);
  readonly themeService = inject(ThemeService);
  readonly pushService = inject(PushNotificationService);

  private service = inject(UsuarioService);
  private router = inject(Router);
  private messages = inject(MessageService);

  usuario: UsuarioResponse | null = null;

  loading = true;
  errorMessage = "";

  deleteAccountVisible = false;
  deleteReason = "";

  loadingPush = false;
  processingPush = false;
  sendingTest = false;

  pushActivo = false;

  selectedTheme: AppThemeName = this.themeService.theme;

  selectedMode: AppColorMode = this.themeService.mode;

  selectedPrimary: AppPrimaryColor = this.themeService.primaryColor;

  get initials(): string {
    return (this.usuario?.nombreCompleto || "U")
      .split(" ")
      .slice(0, 2)
      .map((x) => x[0])
      .join("")
      .toUpperCase();
  }

  ngOnInit(): void {
    this.auth.resolveUserId().subscribe((id) => {
      if (!id) {
        this.loading = false;

        this.errorMessage = "No se pudo identificar al usuario.";

        return;
      }

      this.service.obtener(id).subscribe({
        next: (usuario) => {
          this.usuario = usuario;
          this.loading = false;

          this.cargarEstadoPush();
        },

        error: () => {
          this.loading = false;

          this.errorMessage = "No se pudo cargar tu perfil.";
        },
      });
    });
  }

  /**
   * Consulta el estado de las notificaciones
   * para el usuario actual.
   */
  cargarEstadoPush(): void {
    if (!this.usuario) {
      return;
    }

    if (!this.pushService.soportado) {
      this.pushActivo = false;
      return;
    }

    this.loadingPush = true;

    this.pushService.estado(this.usuario.id).subscribe({
      next: (activo) => {
        this.pushActivo = activo;
        this.loadingPush = false;
      },

      error: () => {
        this.pushActivo = false;
        this.loadingPush = false;
      },
    });
  }

  /**
   * Solicita permiso Push al navegador,
   * crea la PushSubscription y la registra
   * en Spring Boot.
   */
  activarNotificaciones(): void {
    if (!this.usuario) {
      return;
    }

    this.processingPush = true;

    this.pushService.activar(this.usuario.id).subscribe({
      next: () => {
        this.processingPush = false;
        this.pushActivo = true;

        this.messages.add({
          severity: "success",
          summary: "Notificaciones activadas",
          detail: "Este dispositivo ya puede recibir recordatorios.",
          life: 5000,
        });
      },

      error: (error) => {
        this.processingPush = false;

        this.messages.add({
          severity: "error",
          summary: "No se pudieron activar las notificaciones",
          detail:
            error?.error?.mensaje ??
            error?.message ??
            "No se pudo crear la suscripción Push.",
          life: 8000,
        });
      },
    });
  }

  /**
   * Desactiva la suscripción Push
   * de este dispositivo.
   */
  desactivarNotificaciones(): void {
    if (!this.usuario) {
      return;
    }

    this.processingPush = true;

    this.pushService.desactivar(this.usuario.id).subscribe({
      next: () => {
        this.processingPush = false;
        this.pushActivo = false;

        this.messages.add({
          severity: "success",
          summary: "Notificaciones desactivadas",
          detail: "Este dispositivo dejará de recibir recordatorios.",
          life: 5000,
        });
      },

      error: (error) => {
        this.processingPush = false;

        this.messages.add({
          severity: "error",
          summary: "No se pudieron desactivar las notificaciones",
          detail:
            error?.error?.mensaje ??
            error?.message ??
            "Ocurrió un error al desactivar las notificaciones.",
          life: 8000,
        });
      },
    });
  }

  /**
   * Endpoint temporal.
   * Permite comprobar el Web Push real.
   */
  enviarPrueba(): void {
    if (!this.usuario) {
      return;
    }

    this.sendingTest = true;

    this.pushService.enviarPrueba(this.usuario.id).subscribe({
      next: () => {
        this.sendingTest = false;

        this.messages.add({
          severity: "success",
          summary: "Notificación enviada",
          detail: "El backend envió la notificación de prueba.",
          life: 5000,
        });
      },

      error: (error) => {
        this.sendingTest = false;

        this.messages.add({
          severity: "error",
          summary: "No se pudo enviar la prueba",
          detail:
            error?.error?.mensaje ??
            error?.message ??
            "No se pudo enviar la notificación.",
          life: 8000,
        });
      },
    });
  }

  confirmDeleteAccount(): void {
    if (!this.usuario) {
      return;
    }

    this.service
      .eliminar({
        id: this.usuario.id,

        usuarioBaja: this.usuario.nombreUsuario,

        descripcionBaja:
          this.deleteReason.trim() ||
          "Cuenta desactivada por el usuario desde Mi perfil",
      })
      .subscribe({
        next: () => {
          this.deleteAccountVisible = false;

          this.auth.logout();

          void this.router.navigate(["/login"]);
        },

        error: (error) => {
          this.messages.add({
            severity: "error",
            summary: "No se pudo eliminar la cuenta",
            detail: error?.error?.mensaje ?? "No se pudo desactivar tu cuenta.",
            life: 8000,
          });
        },
      });
  }

  changeTheme(theme: AppThemeName): void {
    this.selectedTheme = theme;

    this.themeService.setTheme(theme);
  }

  changePrimary(color: AppPrimaryColor): void {
    this.selectedPrimary = color;

    this.themeService.setPrimaryColor(color);
  }

  changeMode(mode: AppColorMode): void {
    this.selectedMode = mode;

    this.themeService.setMode(mode);
  }
}
