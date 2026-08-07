# CVStudio v1.4.19

Corrección definitiva del destinatario de formularios.

- Receptor fijo: **cvstudioargentina@gmail.com**.
- El Worker ya no lee `FORM_NOTIFICATION_EMAIL`; una variable vieja de Cloudflare no puede redirigir el mensaje a otra cuenta.
- Se actualizaron ambas copias del Worker a v2.8.3.
- Después de reemplazar el código en Cloudflare, presionar **Deploy**.
- No es necesario modificar Supabase para esta recepción por Gmail.
