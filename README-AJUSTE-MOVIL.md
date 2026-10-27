# Ajuste móvil - Octubre 2026

Cambios aplicados sobre la última versión del frontend:

- Evita el zoom automático de Safari/iPhone al enfocar inputs, selects, fechas, importes y textareas mediante `font-size: 16px` únicamente en resoluciones móviles.
- No se bloquea el zoom del navegador mediante `maximum-scale` o `user-scalable=no`, preservando accesibilidad.
- Barra inferior responsive ligeramente más alta para conservar espacio seguro.
- Iconos del menú inferior reducidos de tamaño.
- Botones del menú con mayor padding inferior, quedando visualmente un poco más arriba y alejados del gesto inferior del sistema.
- Se conserva un área táctil amplia para cada opción.

Archivo modificado: `src/styles.css`.
