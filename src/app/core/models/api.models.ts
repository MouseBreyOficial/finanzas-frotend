export interface ApiResponse<T> {
  codigo: number;
  mensaje: string;
  data: T;
}

export interface UsuarioResponse {
  id: number;
  nombreUsuario: string;
  nombreCompleto: string;
  correoElectronico: string;
  estadoRegistro: number;
}

export interface CuentaResponse {
  id: number;
  nombreCuenta: string;
  saldoActual: number;
  saldoInicial: number;
  idUsuario: number;
}

export interface IngresoResponse {
  id: number;
  monto: number;
  fecha: string;
  descripcion: string;
  idCuenta: number;
}

export interface GastoResponse {
  id: number;
  monto: number;
  fecha: string;
  categoria: string;
  descripcion: string;
  idCuenta: number;
}

export interface AlertaResponse {
  id: number;
  descripcion: string;
  fechaAlerta: string;
  tipo: string;
  idUsuario: number;
  esRecurrente?: boolean;
  frecuencia?: string;
  diaMes?: number;
  estado?: string;
  monto?: number;
  categoria?: string;
  idCuenta?: number;
}

export interface AuthResponse {
  token: string;
  tipo: string;
  username: string;
  nombreCompleto: string;
}

export interface AuthRequest {
  username: string;
  password: string;
}

export interface RegistroRequest {
  username: string;
  password: string;
  nombreCompleto: string;
  email: string;
  usuarioCreacion: string;
}

export interface CuentaRequest {
  nombreCuenta: string;
  saldoActual: number;
  saldoInicial: number;
  idUsuario: number;
  usuarioCreacion: string;
}

export interface CuentaUpdateRequest {
  id: number;
  nombreCuenta: string;
  saldoActual: number;
  usuarioModificacion: string;
}

export interface IngresoRequest {
  monto: number;
  fecha: string;
  descripcion: string;
  idCuenta: number;
  usuarioCreacion: string;
}

export interface IngresoUpdateRequest {
  id: number;
  monto: number;
  fecha: string;
  descripcion: string;
  usuarioModificacion: string;
}

export interface GastoRequest {
  monto: number;
  fecha: string;
  categoria: string;
  descripcion: string;
  idCuenta: number;
  usuarioCreacion: string;
}

export interface GastoUpdateRequest {
  id: number;
  monto: number;
  fecha: string;
  categoria: string;
  descripcion: string;
  usuarioModificacion: string;
}

export interface AlertaRequest {
  descripcion: string;
  fechaAlerta: string;
  tipo: string;
  idUsuario: number;
  usuarioCreacion: string;
  esRecurrente?: boolean;
  frecuencia?: string;
  diaMes?: number;
  estado?: string;
  monto?: number;
  categoria?: string;
  idCuenta?: number;
}

export interface AlertaUpdateRequest {
  id: number;
  descripcion: string;
  fechaAlerta: string;
  tipo: string;
  usuarioModificacion: string;
  esRecurrente?: boolean;
  frecuencia?: string;
  diaMes?: number;
  estado?: string;
  monto?: number;
  categoria?: string;
  idCuenta?: number;
}


export interface UsuarioRequest { nombreUsuario: string; hashContrasena: string; nombreCompleto: string; correoElectronico: string; usuarioCreacion: string; }
export interface UsuarioUpdateRequest { id: number; nombreCompleto: string; correoElectronico: string; hashContrasena?: string; usuarioModificacion: string; }
export interface UsuarioDeleteRequest { id: number; usuarioBaja: string; descripcionBaja: string; }
export interface GastoResumen { total: number; cantidad: number; porDia: Record<string, number>; porCategoria: Record<string, number>; detalles: GastoResponse[]; }
