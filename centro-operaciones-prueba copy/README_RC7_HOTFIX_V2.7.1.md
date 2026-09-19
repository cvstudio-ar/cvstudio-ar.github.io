# RC7 Hotfix v2.7.1

Corrige el bucle de recarga causado por la sincronización de datos reales.

- Se eliminan las recargas automáticas de `real-bridge.js` y `supabase-operational.js`.
- La interfaz se actualiza en la misma página mediante el evento `cvstudio:state-updated`.
- Mantiene la sesión, el módulo abierto y el scroll sin reinicios.
