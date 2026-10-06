import { Component, inject } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { Router, ActivatedRoute, RouterLink } from "@angular/router";
import { finalize } from "rxjs";

import { InputTextModule } from "primeng/inputtext";
import { PasswordModule } from "primeng/password";
import { ButtonModule } from "primeng/button";
import { MessageModule } from "primeng/message";

import { AuthService } from "../../core/services/auth.service";
import { PwaUpdateService } from "../../core/services/pwa-update.service";

@Component({
  selector: "app-login",
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    MessageModule,
  ],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <h1 class="auth-title text-center">Finanzas Personales</h1>

        <p class="auth-subtitle">
          Inicia sesión para administrar tus finanzas.
        </p>

        @if (errorMessage) {
          <p-message severity="error" styleClass="w-full mb-3">
            {{ errorMessage }}
          </p-message>
        }

        <form [formGroup]="form" (ngSubmit)="submit()">
          <div class="field">
            <label for="username"> Usuario </label>

            <input
              id="username"
              pInputText
              formControlName="username"
              autocomplete="username"
              placeholder="Ingrese su nombre de usuario"
            />

            @if (
              form.controls.username.touched && form.controls.username.invalid
            ) {
              <small class="error-text"> Ingresa tu usuario. </small>
            }
          </div>

          <div class="field" style="margin-top: 1rem">
            <label for="password"> Contraseña </label>

            <p-password
              inputId="password"
              formControlName="password"
              [feedback]="false"
              [toggleMask]="true"
              styleClass="w-full"
              inputStyleClass="w-full"
              placeholder="Ingrese su contraseña"
            />

            @if (
              form.controls.password.touched && form.controls.password.invalid
            ) {
              <small class="error-text"> Ingresa tu contraseña. </small>
            }
          </div>

          <div class="field full pt-2">
            <p-button
              type="submit"
              label="Ingresar"
              icon="pi pi-sign-in"
              [loading]="loading"
              [disabled]="form.invalid || loading"
              [fluid]="true"
            />

            <p-button
              type="button"
              label="Crear cuenta"
              [outlined]="true"
              [fluid]="true"
              routerLink="/registro"
            />
          </div>
        </form>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private readonly pwaUpdateService = inject(PwaUpdateService);

  loading = false;
  errorMessage = "";

  readonly form = this.fb.nonNullable.group({
    username: ["", Validators.required],
    password: ["", Validators.required],
  });

  constructor() {
    if (this.route.snapshot.queryParamMap.get("expired")) {
      this.errorMessage = "Tu sesión expiró. Ingresa nuevamente.";
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = "";

    this.auth
      .login(this.form.getRawValue())
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => {
          void this.procesarLoginExitoso();
        },

        error: (error) => {
          this.errorMessage =
            error?.error?.mensaje ?? "Usuario o contraseña incorrectos.";
        },
      });
  }

  private async procesarLoginExitoso(): Promise<void> {
    const actualizacionDisponible = await this.pwaUpdateService.hayActualizacion();

    if (actualizacionDisponible) {
      /*
       * Primero navegamos al dashboard.
       * De esta manera, cuando la nueva versión
       * recargue la aplicación, la URL actual
       * ya será /dashboard.
       */
      await this.router.navigate(["/dashboard"]);

      /*
       * Activamos la nueva versión y recargamos.
       */
      await this.pwaUpdateService.actualizarAplicacion();

      return;
    }

    /*
     * Si no existe actualización,
     * continuamos normalmente.
     */
    await this.router.navigate(["/dashboard"]);
  }
}
