import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, map, throwError, mergeMap, of } from "rxjs";
import { API_CONFIG } from "../config/api.config";
import {
  ApiResponse,
  UsuarioResponse,
  UsuarioRequest,
  UsuarioUpdateRequest,
  UsuarioDeleteRequest,
} from "../models/api.models";

@Injectable({ providedIn: "root" })
export class UsuarioService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_CONFIG.baseUrl}/usuarios`;

  listar(): Observable<UsuarioResponse[]> {
    return this.http
      .get<ApiResponse<UsuarioResponse[]>>(`${this.url}/listar`)
      .pipe(map((r) => r.data));
  }

  obtener(id: number): Observable<UsuarioResponse> {
    return this.http
      .get<ApiResponse<UsuarioResponse>>(`${this.url}/${id}`)
      .pipe(map((r) => r.data));
  }
  registrar(request: UsuarioRequest): Observable<UsuarioResponse> {
    return this.http
      .post<ApiResponse<UsuarioResponse>>(`${this.url}/registrar`, request)
      .pipe(
        mergeMap((r) =>
          r.codigo === 0 && r.data
            ? of(r.data)
            : throwError(() => ({
                error: {
                  codigo: r.codigo,
                  mensaje: r.mensaje || "No se pudo registrar el usuario.",
                },
              })),
        ),
      );
  }
  actualizar(request: UsuarioUpdateRequest): Observable<UsuarioResponse> {
    return this.http
      .post<ApiResponse<UsuarioResponse>>(`${this.url}/actualizar`, request)
      .pipe(map((r) => r.data));
  }
  eliminar(request: UsuarioDeleteRequest): Observable<void> {
    return this.http
      .post<ApiResponse<void>>(`${this.url}/eliminar`, request)
      .pipe(
        mergeMap((r) =>
          r.codigo === 0
            ? of(undefined)
            : throwError(() => ({
                error: {
                  codigo: r.codigo,
                  mensaje: r.mensaje || "No se pudo desactivar el usuario.",
                },
              })),
        ),
      );
  }
  activar(id: number, usuario: string): Observable<void> {
    return this.http
      .post<
        ApiResponse<void>
      >(`${this.url}/${id}/activar?usuario=${encodeURIComponent(usuario)}`, {})
      .pipe(
        mergeMap((r) =>
          r.codigo === 0
            ? of(undefined)
            : throwError(() => ({
                error: {
                  codigo: r.codigo,
                  mensaje: r.mensaje || "No se pudo activar el usuario.",
                },
              })),
        ),
      );
  }
}
