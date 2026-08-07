# CVStudio v1.4.34 — actualización estable

Esta versión corrige el problema por el cual una publicación nueva podía mostrar archivos anteriores.

## Correcciones
- Se eliminaron marcadores de versión contradictorios en el HTML.
- `index.html`, `settings.js` y `version.json` usan el mismo build `20260806-1154`.
- El verificador recupera el HTML nuevo con `cache: no-store` cuando detecta un build distinto.
- Se eliminan Service Workers y Cache Storage residuales antes de aplicar una actualización.
- Se evita el ciclo infinito de recargas.
- El ZIP de entrega no incluye `.git`, por lo que no puede mezclar el repositorio local con el remoto.

## Verificación
Abrir `/centro-operaciones-prueba/version.json` y confirmar:
- version: `1.4.34`
- build: `20260806-1154`

Después, el panel debe mostrar `v1.4.34` debajo del logo y en Configuración.
