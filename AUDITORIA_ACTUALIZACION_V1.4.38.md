# CVStudio v1.4.38 · Auditoría y corrección de actualización

- Versión: v1.4.38
- Build: 20260806-1415
- Fuente única: `centro-operaciones-prueba/version.json`
- Cargador: `centro-operaciones-prueba/bootstrap.js`
- `version-check.js` ya no recarga, no borra cachés y no usa sessionStorage.
- Los assets locales se cargan con `?build=20260806-1415` obtenido dinámicamente.
- El Worker de contacto permanece sin cambios porque no sirve el panel estático.
- Para completar el despliegue debe aplicarse la regla de Cloudflare indicada en `config/CLOUDFLARE_CACHE_VERSIONADO.md` y purgar una sola vez.
