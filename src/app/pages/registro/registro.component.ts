import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, InputTextModule, PasswordModule, ButtonModule, MessageModule],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <h1 class="auth-title">Crear cuenta</h1>
        <p class="auth-subtitle">Registra tu usuario para comenzar.</p>

        @if (errorMessage) {
          <p-message severity="error" styleClass="w-full mb-3">{{ errorMessage }}</p-message>
        }

        <form [formGroup]="form" (ngSubmit)="submit()">
          <div class="form-grid">
            <div class="field full">
              <label>Usuario</label>
              <input pInputText formControlName="username" />
            </div>
            <div class="field full">
              <label>Contraseña</label>
              <p-password formControlName="password" [toggleMask]="true" styleClass="w-full" inputStyleClass="w-full" />
            </div>
            <div class="field full">
              <label>Nombre completo</label>
              <input pInputText formControlName="nombreCompleto" />
            </div>
            <div class="field full">
              <label>Correo electrónico</label>
              <input pInputText type="email" formControlName="email" />
            </div>
            <div class="field full">
              <label>Usuario de creación</label>
              <input pInputText formControlName="usuarioCreacion" />
            </div>
          </div>

          <div class="auth-actions">
            <p-button type="submit" label="Registrarme" icon="pi pi-user-plus"
              [loading]="loading" [disabled]="form.invalid || loading" />
            <p-button type="button" label="Volver al login" [outlined]="true" routerLink="/login" />
          </div>
        </form>
      </div>
    </div>
  `
})
export class RegistroComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  loading = false;
  errorMessage = '';

  readonly form = this.fb.nonNullable.group({
    username: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(6)]],
    nombreCompleto: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    usuarioCreacion: ['', Validators.required]
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.auth.register(this.form.getRawValue()).pipe(
      finalize(() => this.loading = false)
    ).subscribe({
      next: () => void this.router.navigate(['/dashboard']),
      error: (error) => {
        this.errorMessage = error?.error?.mensaje ?? 'No se pudo registrar el usuario.';
      }
    });
  }
}
