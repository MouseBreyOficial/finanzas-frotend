import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { SwPush } from "@angular/service-worker";
import { Observable, from, map, switchMap, take, throwError } from "rxjs";
import { API_CONFIG } from "../config/api.config";
import { ApiResponse, PushEstadoResponse, PushSuscripcionRequest} from "../models/api.models";

@Injectable({ providedIn: "root" })
export class PushNotificationService {
  private readonly http = inject(HttpClient);
  private readonly swPush = inject(SwPush);
  private readonly url = `${API_CONFIG.baseUrl}/push`;

  /**
   * Indica si Service Worker / Web Push está disponible.
   */
  get soportado(): boolean {
    return this.swPush.isEnabled;
  }

  /**
   * Devuelve la suscripción actual como Observable.
   */
  get suscripcionActual(): Observable<PushSubscription | null> {
    return this.swPush.subscription;
  }

  /**
   * Consulta si el usuario tiene alguna suscripción
   * activa registrada en el backend.
   */
  estado(idUsuario: number): Observable<boolean> {
    return this.http
      .get<ApiResponse<PushEstadoResponse>>(`${this.url}/estado/${idUsuario}`)
      .pipe(map((response) => response.data?.activo ?? false));
  }

  /**
   * Activa Web Push para este navegador/dispositivo.
   */
  activar(idUsuario: number): Observable<void> {
    if (!this.swPush.isEnabled) {
      return throwError(
        () =>
          new Error(
            "Las notificaciones Push no están disponibles en este dispositivo.",
          ),
      );
    }

    return this.swPush.subscription.pipe(
      take(1),

      switchMap((subscription) => {
        /*
         * Si ya existe una suscripción en este navegador,
         * simplemente volvemos a registrarla en el backend.
         */
        if (subscription) {
          return this.registrarEnBackend(idUsuario, subscription);
        }

        /*
         * Si todavía no existe, solicitamos una nueva
         * utilizando nuestra clave pública VAPID.
         */
        return from(
          this.swPush.requestSubscription({
            serverPublicKey: API_CONFIG.vapidPublicKey,
          }),
        ).pipe(
          switchMap((newSubscription) =>
            this.registrarEnBackend(idUsuario, newSubscription),
          ),
        );
      }),
    );
  }

  /**
   * Desactiva Web Push únicamente para
   * este navegador/dispositivo.
   */
  desactivar(idUsuario: number): Observable<void> {
    if (!this.swPush.isEnabled) {
      return throwError(
        () =>
          new Error(
            "Las notificaciones Push no están disponibles en este dispositivo.",
          ),
      );
    }

    return this.swPush.subscription.pipe(
      take(1),

      switchMap((subscription) => {
        /*
         * Este navegador ya no tiene una
         * PushSubscription.
         */
        if (!subscription) {
          return from(Promise.resolve());
        }

        const endpoint = subscription.endpoint;

        /*
         * Primero desactivamos la suscripción
         * en nuestro backend.
         */
        return this.desactivarEnBackend(idUsuario, endpoint).pipe(
          /*
           * Después eliminamos la suscripción
           * del navegador.
           */
          switchMap(() => from(subscription.unsubscribe())),

          map(() => void 0),
        );
      }),
    );
  }

  /**
   * Envía una notificación Web Push de prueba.
   */
  enviarPrueba(idUsuario: number): Observable<void> {
    return this.http
      .post<ApiResponse<void>>(`${this.url}/prueba/${idUsuario}`, {})
      .pipe(map(() => void 0));
  }

  /**
   * Registra en Spring Boot la PushSubscription
   * obtenida del navegador.
   */
  private registrarEnBackend(
    idUsuario: number,
    subscription: PushSubscription,
  ): Observable<void> {
    const json = subscription.toJSON();

    const p256dh = json.keys?.["p256dh"];
    const auth = json.keys?.["auth"];

    if (!p256dh || !auth) {
      return throwError(
        () =>
          new Error(
            "No se pudieron obtener las claves de la suscripción Push.",
          ),
      );
    }

    const request: PushSuscripcionRequest = {
      endpoint: subscription.endpoint,
      p256dh,
      auth,
    };

    return this.http
      .post<ApiResponse<void>>(`${this.url}/suscribir/${idUsuario}`, request)
      .pipe(map(() => void 0));
  }

  /**
   * Desactiva en Spring Boot la suscripción
   * correspondiente al endpoint del navegador.
   */
  private desactivarEnBackend(
    idUsuario: number,
    endpoint: string,
  ): Observable<void> {
    return this.http
      .post<ApiResponse<void>>(`${this.url}/desuscribir/${idUsuario}`, {
        endpoint,
      })
      .pipe(map(() => void 0));
  }
}
