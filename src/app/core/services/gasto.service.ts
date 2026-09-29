import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { API_CONFIG } from '../config/api.config';
import { ApiResponse, GastoRequest, GastoResponse, GastoUpdateRequest, GastoResumen } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class GastoService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_CONFIG.baseUrl}/gastos`;

  listarPorCuenta(idCuenta: number): Observable<GastoResponse[]> {
    return this.http.get<ApiResponse<GastoResponse[]>>(`${this.url}/cuenta/${idCuenta}`).pipe(map(r => r.data));
  }

  obtener(id: number): Observable<GastoResponse> {
    return this.http.get<ApiResponse<GastoResponse>>(`${this.url}/${id}`).pipe(map(r => r.data));
  }

  registrar(request: GastoRequest): Observable<GastoResponse> {
    return this.http.post<ApiResponse<GastoResponse>>(this.url, request).pipe(map(r => r.data));
  }

  actualizar(request: GastoUpdateRequest): Observable<GastoResponse> {
    return this.http.put<ApiResponse<GastoResponse>>(this.url, request).pipe(map(r => r.data));
  }

  promedios(idUsuario: number): Observable<Record<string, number>> {
    return this.http.get<ApiResponse<Record<string, number>>>(`${this.url}/promedios/${idUsuario}`).pipe(map(r => r.data));
  }
  categorias(idUsuario: number): Observable<string[]> { return this.http.get<ApiResponse<string[]>>(`${this.url}/categorias/${idUsuario}`).pipe(map(r => r.data)); }
  resumen(idUsuario: number, desde: string, hasta: string): Observable<GastoResumen> { return this.http.get<ApiResponse<GastoResumen>>(`${this.url}/resumen/${idUsuario}?desde=${desde}&hasta=${hasta}`).pipe(map(r => r.data)); }
}
