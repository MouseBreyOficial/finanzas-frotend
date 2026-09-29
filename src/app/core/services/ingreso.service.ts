import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { API_CONFIG } from '../config/api.config';
import { ApiResponse, IngresoRequest, IngresoResponse, IngresoUpdateRequest } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class IngresoService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_CONFIG.baseUrl}/ingresos`;

  listarPorCuenta(idCuenta: number): Observable<IngresoResponse[]> {
    return this.http.get<ApiResponse<IngresoResponse[]>>(`${this.url}/cuenta/${idCuenta}`).pipe(map(r => r.data));
  }

  obtener(id: number): Observable<IngresoResponse> {
    return this.http.get<ApiResponse<IngresoResponse>>(`${this.url}/${id}`).pipe(map(r => r.data));
  }

  registrar(request: IngresoRequest): Observable<IngresoResponse> {
    return this.http.post<ApiResponse<IngresoResponse>>(this.url, request).pipe(map(r => r.data));
  }

  actualizar(request: IngresoUpdateRequest): Observable<IngresoResponse> {
    return this.http.put<ApiResponse<IngresoResponse>>(this.url, request).pipe(map(r => r.data));
  }
}
