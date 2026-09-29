# finanzas-frontend

Frontend completo en Angular 20 + PrimeNG para el backend Spring Boot de finanzas personales.

## Requisitos

- Node.js 20.19+ o 22.12+
- npm
- Backend Spring Boot ejecutándose en `http://localhost:8080`

## Ejecutar

```bash
npm install
npm start
```

Luego abrir:

```text
http://localhost:4200
```

## Backend

La URL base está en:

`src/app/core/config/api.config.ts`

Por defecto:

```ts
http://localhost:8080/api
```

## Seguridad

- JWT almacenado en `localStorage`.
- `auth.interceptor.ts` agrega `Authorization: Bearer <token>`.
- Ante HTTP 401/403 se limpia la sesión y se redirige a `/login`.
- `auth.guard.ts` protege las rutas internas.
- El frontend intenta obtener el `idUsuario` desde claims comunes del JWT (`idUsuario`, `userId`, `id`, `user_id`) y, si no está disponible, resuelve el usuario mediante `/usuarios/listar`.

## Endpoints usados

Todos corresponden al Swagger proporcionado:

- POST `/auth/login`
- POST `/auth/register`
- POST/PUT/GET `/cuentas`
- POST/PUT/GET `/ingresos`
- POST/PUT/GET `/gastos`
- GET `/gastos/promedios/{idUsuario}`
- POST/PUT/GET `/alertas`
- GET `/usuarios/listar`

## Nota sobre el dashboard

El Swagger no expone un endpoint específico de resumen. El dashboard calcula ingresos y gastos sumando los movimientos de las cuentas del usuario. El gráfico de gastos por categoría utiliza `/gastos/promedios/{idUsuario}`.

## CORS

Si el backend bloquea `http://localhost:4200`, habilita CORS en Spring Boot para ese origen.

## Pantallas adicionales
- **Usuarios** (`/usuarios`): listado, búsqueda, paginación y detalle usando `GET /api/usuarios/listar`.
- **Mi perfil** (`/perfil`): información del usuario autenticado usando `GET /api/usuarios/{id}`.

> Los endpoints POST de registrar/actualizar/eliminar usuarios no se conectaron a formularios administrativos porque el contrato de request de esos endpoints no estaba especificado en el Swagger facilitado. Esto evita enviar DTOs inventados al backend.

## Mejoras de esta versión
- Análisis de gastos por rango, día y categoría.
- CRUD de usuarios conectado a registrar/actualizar/eliminar.
- Detalle de usuario consulta GET /usuarios/{id} y usa response.data.
- Alertas con overlays corregidos (`appendTo=body`), recurrencia, estado, monto, categoría, cuenta y registrar pago.
- Compatible con los endpoints nuevos incluidos en el backend actualizado.
