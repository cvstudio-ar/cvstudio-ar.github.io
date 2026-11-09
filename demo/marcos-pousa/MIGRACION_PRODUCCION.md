# Estudio Jurídico Marcos A. Pousa — Preparación de migración
**Fecha de preparación:** 09/11/2026
**Origen DEMO:** https://cvstudio.com.ar/demo/marcos-pousa/
**Estado:** pendiente de dominios y backend de producción. NO confundir demo con sitio listo para clientes.

## 1. Propiedad y cuentas del cliente
- [ ] Gmail de Marcos disponible y recuperable. Activar 2FA y métodos de recuperación; NO publicar contraseñas en el repositorio o chats.
- [ ] Cuenta GitHub bajo titularidad de Marcos. Crear repositorio **privado** propio; invitar a CVStudio como colaborador (permisos mínimos).
- [ ] Cuenta Cloudflare del cliente; habilitar 2FA, invitar CVStudio con rol limitado.
- [ ] Cuenta Supabase del cliente; confirmar plan y costos ANTES de crear proyecto. Invitar CVStudio mediante los controles de la organización/proyecto.
- [ ] Documentar quién administra dominio, vencimientos y facturación.

## 2. Trabajo y recursos que ya existen
- Web demostrativa HTML/CSS/JS: `index.html` dentro de `demo/marcos-pousa/`.
- Recursos gráficos de la demo: `assets/logo-mp.svg` y `assets/marcos-pousa-hq-20261109.webp`.
- Datos públicos del estudio y especialidades cargados para revisión por el titular.
- Panel actual de **demostración** con datos en `localStorage`: NO es una administración segura, sincronizada ni apta para información real de clientes.
- El acceso de demo está incrustado en el frontend y NO se debe reciclar en producción.
- La foto, datos profesionales, horarios y textos requieren aprobación final de Marcos.

## 3. Trabajo técnico pendiente ANTES de publicar el dominio
- [ ] Extraer web del repositorio compartido CVStudio a repositorio independiente controlado por el cliente.
- [ ] Reemplazar el acceso de demo por **Supabase Auth** y autorización por titular (políticas RLS); deshabilitar login de demo en producción.
- [ ] Crear tablas privadas/protegidas para configuración y servicios; edición autenticada; contenido público solo de lectura.
- [ ] Subir imágenes a almacenamiento persistente (Supabase Storage o alternativa) con reglas seguras y URLs estables.
- [ ] Migrar contenido aprobado desde la demo a base de datos; no confiar en localStorage de otro navegador.
- [ ] Configurar copias de seguridad, recuperación y rol de administrador.
- [ ] Respetar privacidad: los formularios/WhatsApp NO deben registrar contenido jurídico confidencial sin consentimiento, bases legales y medidas adecuadas.
- [ ] Validar que el panel modifica el sitio en otro dispositivo y persiste después de cerrar sesión.
- [ ] Crear un modo de reversión si falla publicación.

## 4. Publicación con Cloudflare Pages
1. En la cuenta Cloudflare del cliente: Workers & Pages > Create > Pages > Connect to Git.
2. Autorizar únicamente el repositorio del proyecto de Marcos (no todo CVStudio).
3. Vincular la rama `main` del repositorio privado; salida `/` si el HTML queda en raíz, sin framework ni build.
4. Desplegar y probar primero el subdominio `*.pages.dev`.
5. En Workers & Pages > [proyecto] > Custom domains > Set up a domain, agregar el dominio comprado.
6. Si es dominio raíz, agregar la zona a Cloudflare y cambiar nameservers en el registrador **solo después de revisar registros DNS existentes**, en especial MX, SPF, DKIM, DMARC y otros servicios.
7. Configurar dominio preferido, redirección www/no-www, HTTPS y verificación de certificados.
8. **Nunca** colocar contraseñas de administrador, tokens de servicio o claves privadas dentro de HTML/JS público.

Documentación oficial:
- https://developers.cloudflare.com/pages/configuration/git-integration/
- https://developers.cloudflare.com/pages/configuration/custom-domains/

## 5. Pruebas de aceptación
- [ ] PC: 1920, 1440, 1280, 1024 px.
- [ ] Móvil: 390, 375, 320 px; navegación sin desbordes y botones clicables.
- [ ] Foto de Marcos nítida y sin separación visible del borde inferior de la portada.
- [ ] Logo/íconos completos, imágenes cargadas, enlaces y WhatsApp correctos.
- [ ] Ubicación y mapa exactos; número, correo, Instagram, horario confirmados.
- [ ] Panel: entrar, salir, cambiar textos/colores/foto, guardar, revisar desde navegador incógnito y segundo dispositivo.
- [ ] Controles de seguridad y acceso no autorizado; base de datos con RLS habilitada.
- [ ] Móviles reales, HTTPS, página 404 y rendimiento básico.
- [ ] Respaldo final antes de habilitar dominio.

## 6. Datos necesarios para finalizar
- Dominio exacto adquirido y registrador donde se compró.
- Confirmación de que GitHub, Cloudflare y Supabase se abrirán con el Gmail de Marcos.
- Aprobación final de servicios, teléfono, dirección, correos, horarios, fotografía y logo.
- Confirmación de si se recibirá correo en el nuevo dominio (para preservar registros MX al cambiar DNS).
- No enviar contraseñas, códigos 2FA, claves de API privadas ni tokens al chat.

## 7. Regla de entrega
No anunciar el sitio como "listo para producción" ni migrar la administración de demo a dominio real hasta aprobar seguridad, persistencia, pruebas visuales y acceso del titular.
