import { Injectable, inject } from "@angular/core";
import { interval, Subscription, switchMap } from "rxjs";
import { MessageService } from "primeng/api";
import { AuthService } from "./auth.service";
import { AlertaService } from "./alerta.service";
import { AlertaResponse } from "../models/api.models";

@Injectable({ providedIn: "root" })
export class NotificationService {
  private readonly auth = inject(AuthService);
  private readonly alertas = inject(AlertaService);
  private readonly messages = inject(MessageService);
  private timer?: Subscription;

  async start(): Promise<void> {
    if (this.timer) return;

    // El permiso solo afecta a la notificacion nativa. El Toast de PrimeNG
    // sigue funcionando aunque el usuario no conceda este permiso.
    if ("Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission();
    }

    // Primera revision inmediatamente y luego cada 2 minutos.
    this.check();
    this.timer = interval(7_200_000).subscribe(() => this.check());
  }

  stop(): void {
    this.timer?.unsubscribe();
    this.timer = undefined;
  }

  private check(): void {
    this.auth
      .resolveUserId()
      .pipe(switchMap((id) => this.alertas.listarPorUsuario(id!)))
      .subscribe({
        next: (alerts) =>
          alerts
            .filter(
              (a) => (a.estado ?? "PENDIENTE") === "PENDIENTE" && this.isDue(a),
            )
            .forEach((a) => this.notify(a)),
        error: (error) =>
          console.error("Error consultando alertas para notificar:", error),
      });
  }

  private isDue(a: AlertaResponse): boolean {
    const due = new Date(`${a.fechaAlerta}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Empieza a insistir el dia del vencimiento y continua mientras siga pendiente.
    return due <= today;
  }

  private notify(a: AlertaResponse): void {
    const due = new Date(`${a.fechaAlerta}T00:00:00`);
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const diff = Math.round((due.getTime() - now.getTime()) / 86400000);
    const status =
      diff < 0
        ? `Vencido hace ${Math.abs(diff)} día(s)`
        : diff === 0
          ? "Vence hoy"
          : `Vence en ${diff} día(s)`;

    const mensaje = `${a.descripcion}${a.monto ? ` · S/ ${Number(a.monto).toFixed(2)}` : ""} · ${status}`;

    // Aviso dentro de Angular. Desaparece automaticamente a los 8 segundos.
    this.messages.add({
      severity: diff < 0 ? "error" : "warn",
      summary: "Pago pendiente",
      detail: mensaje,
      life: 5000,
    });

    // Aviso nativo del navegador/sistema si el usuario dio permiso.
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Finanzas Personales · Pago pendiente", {
        body: mensaje,
        icon: "/favicon.ico",
        tag: `alerta-${a.id}`,
      });
    }
  }
}
