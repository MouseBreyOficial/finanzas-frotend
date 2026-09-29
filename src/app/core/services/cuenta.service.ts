import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { API_CONFIG } from '../config/api.config';
import { ApiResponse, CuentaRequest, CuentaResponse, CuentaUpdateRequest } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class CuentaService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_CONFIG.baseUrl}/cuentas`;

  listarPorUsuario(idUsuario: number): Observable<CuentaResponse[]> {
    return this.http.get<ApiResponse<CuentaResponse[]>>(`${this.url}/usuario/${idUsuario}`).pipe(map(r => r.data));
  }

  obtener(id: number): Observable<CuentaResponse> {
    return this.http.get<ApiResponse<CuentaResponse>>(`${this.url}/${id}`).pipe(map(r => r.data));
  }

  registrar(request: CuentaRequest): Observable<CuentaResponse> {
    return this.http.post<ApiResponse<CuentaResponse>>(this.url, request).pipe(map(r => r.data));
  }

  actualizar(request: CuentaUpdateRequest): Observable<CuentaResponse> {
    return this.http.put<ApiResponse<CuentaResponse>>(this.url, request).pipe(map(r => r.data));
  }
}
