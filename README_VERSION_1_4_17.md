# CVStudio v1.4.17 — recepción de formularios por Gmail

## Configuración aplicada

- Destinatario predeterminado de formularios: **cvstudioargentina@gmail.com**.
- El envío de formularios no depende de que la ficha se guarde en el Centro de Operaciones.
- Se eliminaron del correo y de la pantalla final las afirmaciones de que la ficha quedó guardada en el panel.
- Las dos copias del Worker quedaron sincronizadas:
  - `WORKER_CVSTUDIO_CONTACTO_ESTABLE.js`
  - `config/cloudflare-worker-contacto.js`
- Puede definirse opcionalmente la variable de Cloudflare `FORM_NOTIFICATION_EMAIL`; si no existe, se usa `cvstudioargentina@gmail.com`.

## Publicación obligatoria

1. Subir/publicar los archivos de la web.
2. Copiar **todo** el contenido de `WORKER_CVSTUDIO_CONTACTO_ESTABLE.js` en el Worker `cvstudio-contacto`.
3. Conservar el secreto `RESEND_API_KEY`.
4. Opcional: crear la variable `FORM_NOTIFICATION_EMAIL` con valor `cvstudioargentina@gmail.com`.
5. Presionar **Deploy** en Cloudflare.

No hace falta modificar Supabase para que el correo llegue. La integración del formulario con el panel queda como una etapa independiente.
