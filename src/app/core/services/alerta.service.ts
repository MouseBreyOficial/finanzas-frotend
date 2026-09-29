import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { API_CONFIG } from '../config/api.config';
import { AlertaRequest, AlertaResponse, AlertaUpdateRequest, ApiResponse } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class AlertaService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_CONFIG.baseUrl}/alertas`;

  listarPorUsuario(idUsuario: number): Observable<AlertaResponse[]> {
    return this.http.get<ApiResponse<AlertaResponse[]>>(`${this.url}/usuario/${idUsuario}`).pipe(map(r => r.data));
  }

  obtener(id: number): Observable<AlertaResponse> {
    return this.http.get<ApiResponse<AlertaResponse>>(`${this.url}/${id}`).pipe(map(r => r.data));
  }

  registrar(request: AlertaRequest): Observable<AlertaResponse> {
    return this.http.post<ApiResponse<AlertaResponse>>(this.url, request).pipe(map(r => r.data));
  }

  actualizar(request: AlertaUpdateRequest): Observable<AlertaResponse> {
    return this.http.put<ApiResponse<AlertaResponse>>(this.url, request).pipe(map(r => r.data));
  }
  marcarPagada(id: number, usuario: string): Observable<AlertaResponse> { return this.http.post<ApiResponse<AlertaResponse>>(`${this.url}/${id}/pagar?usuario=${encodeURIComponent(usuario)}`, {}).pipe(map(r => r.data)); }
}
