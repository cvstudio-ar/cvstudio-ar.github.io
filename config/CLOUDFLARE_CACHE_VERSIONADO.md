# Cloudflare · reglas obligatorias para el Centro de Operaciones

El Worker `cloudflare-worker-contacto.js` no sirve archivos estáticos y no debe modificarse para este problema.

Crear una **Cache Rule** con prioridad superior para:

- URI Path equals `/centro-operaciones-prueba/`
- OR URI Path equals `/centro-operaciones-prueba/index.html`
- OR URI Path equals `/centro-operaciones-prueba/version.json`

Acción:

- Cache eligibility: **Bypass cache**
- Browser TTL: **Respect existing headers** o **0 segundos**

Luego ejecutar una única vez: **Caching → Configuration → Purge Everything**.

Los archivos CSS y JS sí pueden cachearse porque bootstrap.js los solicita con `?build=<build actual>`.
