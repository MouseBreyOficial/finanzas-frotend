import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { SwPush } from "@angular/service-worker";
import { Observable, from, map, switchMap, take, throwError } from "rxjs";

import { API_CONFIG } from "../config/api.config";
import {
  ApiResponse,
  PushEstadoResponse,
  PushSuscripcionRequest,
} from "../models/api.models";

@Injectable({
  providedIn: "root",
})
export class PushNotificationService {
  private readonly http = inject(HttpClient);
  private readonly swPush = inject(SwPush);
  private readonly url = `${API_CONFIG.baseUrl}/push`;

  get soportado(): boolean {
    return this.swPush.isEnabled;
  }

  /**
   * Suscripción Push del navegador/dispositivo actual.
   */
  get suscripcionActual(): Observable<PushSubscription | null> {
    return this.swPush.subscription;
  }

  /**
   * Indica si ESTE navegador/dispositivo tiene
   * una suscripción Push activa.
   */
  estadoDispositivoActual(): Observable<boolean> {
    if (!this.swPush.isEnabled) {
      return from(Promise.resolve(false));
    }

    return this.swPush.subscription.pipe(
      take(1),
      map((subscription) => subscription !== null),
    );
  }

  /**
   * Indica si el usuario tiene al menos una
   * suscripción registrada en el backend.
   *
   * Se mantiene para futuros usos, pero NO debe
   * utilizarse para mostrar el estado del
   * dispositivo actual.
   */
  estadoUsuario(idUsuario: number): Observable<boolean> {
    return this.http
      .get<ApiResponse<PushEstadoResponse>>(`${this.url}/estado/${idUsuario}`)
      .pipe(map((response) => response.data?.activo ?? false));
  }

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
         * Si este navegador ya tiene una suscripción,
         * la volvemos a registrar en el backend.
         *
         * Esto también permite recuperar el registro
         * si por algún motivo estaba inactivo en BD.
         */
        if (subscription) {
          return this.registrarEnBackend(idUsuario, subscription);
        }

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
        if (!subscription) {
          return from(Promise.resolve());
        }

        const endpoint = subscription.endpoint;

        return this.desactivarEnBackend(idUsuario, endpoint).pipe(
          switchMap(() => from(subscription.unsubscribe())),
          map(() => void 0),
        );
      }),
    );
  }

  enviarPrueba(idUsuario: number): Observable<void> {
    return this.http
      .post<ApiResponse<void>>(`${this.url}/prueba/${idUsuario}`, {})
      .pipe(map(() => void 0));
  }

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
