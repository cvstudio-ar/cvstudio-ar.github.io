# Auditoría integral de actualización — CVStudio v1.4.37

## Conflicto encontrado
El panel tenía dos verificadores de versión simultáneos: uno incrustado en `index.html` y otro en `version-check.js`. Ambos registraban intentos en `sessionStorage` y dejaban de recargar después de dos intentos.

Durante la propagación no atómica de GitHub Pages/Cloudflare, `version.json`, `index.html`, CSS y JavaScript pueden estar disponibles en momentos distintos. Si el navegador detectaba el build nuevo antes de que el HTML nuevo estuviera disponible, consumía los intentos y quedaba bloqueado permanentemente en el build anterior durante esa sesión. Por eso podían verse estilos nuevos con la versión vieja.

## Correcciones aplicadas
- Eliminado el verificador duplicado incrustado en `index.html`.
- Reescrito `version-check.js` con intentos asociados al build y vencimiento de 45 segundos.
- Eliminado el bloqueo permanente de `sessionStorage`.
- Eliminados `panel-20260806-1208.html` y `BUILD_20260806_1208_OK.txt`.
- Unificada la versión activa en `1.4.37`, build `20260806-1315`.
- La versión visible se sincroniza también desde `version.json`.
- Eliminada la carpeta `.git` del paquete para evitar mezclar el repositorio interno del ZIP con el repositorio local de despliegue.

## Verificación esperada
Debajo del logo y en Configuración debe aparecer `v1.4.37`, build `20260806-1315`.
