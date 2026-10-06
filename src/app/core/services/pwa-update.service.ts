import { Injectable, inject } from "@angular/core";
import { SwUpdate } from "@angular/service-worker";

@Injectable({
  providedIn: "root",
})
export class PwaUpdateService {
  private readonly swUpdate = inject(SwUpdate);

  /**
   * Comprueba si existe una nueva versión de la aplicación.
   *
   * Retorna:
   * true  -> existe una nueva versión.
   * false -> no existe actualización o Service Worker
   *          no está habilitado.
   */
  async hayActualizacion(): Promise<boolean> {
    if (!this.swUpdate.isEnabled) {
      return false;
    }

    try {
      return await this.swUpdate.checkForUpdate();
    } catch (error) {
      console.error("Error comprobando actualización de la PWA:", error);

      return false;
    }
  }

  /**
   * Activa la nueva versión descargada y recarga
   * completamente la aplicación.
   */
  async actualizarAplicacion(): Promise<void> {
    if (!this.swUpdate.isEnabled) {
      return;
    }

    try {
      await this.swUpdate.activateUpdate();

      document.location.reload();
    } catch (error) {
      console.error("Error activando actualización de la PWA:", error);
    }
  }

  /**
   * Comprueba si existe una nueva versión y,
   * si existe, la activa automáticamente.
   *
   * Devuelve true cuando se encontró una actualización.
   *
   * IMPORTANTE:
   * si devuelve true, actualizarAplicacion()
   * recargará la página.
   */
  async comprobarYActualizar(): Promise<boolean> {
    const actualizacionDisponible = await this.hayActualizacion();

    if (!actualizacionDisponible) {
      return false;
    }

    await this.actualizarAplicacion();

    return true;
  }
}
