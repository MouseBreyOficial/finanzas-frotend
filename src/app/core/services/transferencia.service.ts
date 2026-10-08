import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { API_CONFIG } from '../config/api.config';
import { ApiResponse, TransferenciaRequest, TransferenciaResponse } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class TransferenciaService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_CONFIG.baseUrl}/transferencias`;

  listarPorUsuario(idUsuario: number): Observable<TransferenciaResponse[]> {
    return this.http
      .get<ApiResponse<TransferenciaResponse[]>>(`${this.url}/usuario/${idUsuario}`)
      .pipe(map((r) => r.data));
  }

  obtener(id: number): Observable<TransferenciaResponse> {
    return this.http
      .get<ApiResponse<TransferenciaResponse>>(`${this.url}/${id}`)
      .pipe(map((r) => r.data));
  }

  registrar(request: TransferenciaRequest): Observable<TransferenciaResponse> {
    return this.http
      .post<ApiResponse<TransferenciaResponse>>(this.url, request)
      .pipe(map((r) => r.data));
  }
}
