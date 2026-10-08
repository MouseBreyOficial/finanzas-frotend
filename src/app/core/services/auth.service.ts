import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, map, catchError, of } from 'rxjs';
import { API_CONFIG } from '../config/api.config';
import { ApiResponse, AuthRequest, AuthResponse, RegistroRequest, UsuarioResponse } from '../models/api.models';

const TOKEN_KEY = 'finanzas_token';
const AUTH_KEY = 'finanzas_auth';
const USER_ID_KEY = 'finanzas_user_id';

@Injectable({ providedIn: "root" })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = API_CONFIG.baseUrl;

  login(request: AuthRequest): Observable<ApiResponse<AuthResponse>> {
    return this.http
      .post<ApiResponse<AuthResponse>>(`${this.baseUrl}/auth/login`, request)
      .pipe(
        tap((auth) => {
          if (auth.codigo == 0) {
            this.saveSession(auth.data);
          }
        }),
      );
  }

  register(request: RegistroRequest): Observable<AuthResponse> {
    return this.http
      .post<ApiResponse<AuthResponse>>(`${this.baseUrl}/auth/register`, request)
      .pipe(
        map((response) => response.data),
        tap((auth) => this.saveSession(auth)),
      );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(USER_ID_KEY);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const payload = this.decodeToken(token);
      if (payload?.["exp"] && Number(payload["exp"]) * 1000 <= Date.now()) {
        this.logout();
        return false;
      }
    } catch {
      // Si no se puede decodificar, el backend será la fuente de verdad.
    }
    return true;
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  getAuth(): AuthResponse | null {
    const value = localStorage.getItem(AUTH_KEY);
    return value ? (JSON.parse(value) as AuthResponse) : null;
  }

  getUsername(): string {
    return this.getAuth()?.username ?? "";
  }

  isAdministrator(): boolean {
    return this.getUsername().trim().toLowerCase() === "administrador";
  }

  getNombreCompleto(): string {
    return this.getAuth()?.nombreCompleto ?? this.getUsername();
  }

  getUserId(): number | null {
    const stored = localStorage.getItem(USER_ID_KEY);
    if (stored) return Number(stored);

    const token = this.getToken();
    if (!token) return null;

    try {
      const payload = this.decodeToken(token);
      const candidate =
        payload?.["idUsuario"] ??
        payload?.["userId"] ??
        payload?.["id"] ??
        payload?.["user_id"];
      if (candidate !== undefined && candidate !== null) {
        const id = Number(candidate);
        if (Number.isFinite(id)) {
          this.setUserId(id);
          return id;
        }
      }
    } catch {}
    return null;
  }

  resolveUserId(): Observable<number | null> {
    const existing = this.getUserId();
    if (existing) return of(existing);

    return this.http
      .get<ApiResponse<UsuarioResponse[]>>(`${this.baseUrl}/usuarios/listar`)
      .pipe(
        map(
          (response) =>
            response.data.find((u) => u.nombreUsuario === this.getUsername())
              ?.id ?? null,
        ),
        tap((id) => {
          if (id) this.setUserId(id);
        }),
        catchError(() => of(null)),
      );
  }

  private saveSession(auth: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY, auth.token);
    localStorage.setItem(AUTH_KEY, JSON.stringify(auth));

    try {
      const payload = this.decodeToken(auth.token);
      const candidate =
        payload?.["idUsuario"] ??
        payload?.["userId"] ??
        payload?.["id"] ??
        payload?.["user_id"];
      if (candidate !== undefined && Number.isFinite(Number(candidate))) {
        this.setUserId(Number(candidate));
      }
    } catch {}
  }

  private setUserId(id: number): void {
    localStorage.setItem(USER_ID_KEY, String(id));
  }

  private decodeToken(token: string): Record<string, unknown> {
    const payload = token.split(".")[1];
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(normalized));
  }
}
