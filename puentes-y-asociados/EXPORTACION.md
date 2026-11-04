# Puentes & Asociados — muestra portable v1.1

## Qué contiene
Proyecto estático independiente: index.html, panel de demostración admin.html, JavaScript, estilos y recursos propios en assets/. No requiere instalación ni compilación. Todas las referencias funcionales al proyecto son relativas. No necesita la otra muestra para funcionar.

## Alcance de esta etapa
Esta es una muestra comercial para evaluar diseño y funciones antes de contratar. El panel permite editar portada, WhatsApp, correo, horarios y enlace de YouTube en el navegador, importar/exportar configuración y gestionar ejemplos ficticios de consultas. No ofrece autenticación real, publicación global de cambios, base de clientes ni reservas sincronizadas. La agenda prepara un mensaje de WhatsApp que el visitante envía voluntariamente. No reserva ni envía mensajes por sí sola.

## Publicación en cuentas del cliente después de aprobar
1. Copiar el contenido completo de esta carpeta a la raíz de un repositorio propio del cliente.
2. Crear el hosting estático en su cuenta (por ejemplo Cloudflare Pages: sin framework, sin comando de build, salida raíz).
3. Ajustar los valores de defaults en demo-data.js con los contactos y la configuración definitiva aprobados. Si se exportó configuración desde la demo, aplicar los campos de configuration al objeto defaults; el JSON no se aplica automáticamente al hosting.
4. Cambiar las URLs de og:image al nuevo dominio. Conectar dominio y comprobar HTTPS.
5. Decidir si se mantienen las fuentes de Google Fonts o se alojan localmente según la entrega final.
6. Antes de convertir el panel demo en administrativo real, implementar y verificar autenticación, permisos y almacenamiento propios del cliente. El código de la demo no es un panel privado ni incluye claves.
7. Crear la base/almacenamiento en la cuenta del cliente cuando se concrete esa etapa: ajustes publicados, solicitudes de entrevista y enlaces de contenido. Definir su acceso administrativo y políticas para impedir acceso público a las consultas. Confirmar agenda desde servidor si se acuerda reserva automática.
8. Sustituir los ejemplos ficticios y el aviso de demostración solo al terminar las conexiones reales. Revisar textos, coberturas, imágenes ilustrativas y vínculos aprobados por el cliente. Retirar noindex cuando corresponda lanzar el sitio definitivo.
9. Comprobar contactos separados por marca y sus avisos de privacidad. Las imágenes de estilo de vida son ilustrativas generadas para la propuesta.

## Respaldos
El panel descarga un JSON de configuración demo. El respaldo completo del proyecto es esta carpeta, incluyendo assets/. Para empaquetar desde su carpeta superior: `python -m zipfile -c puentes-y-asociados.zip puentes-y-asociados`.

## Independencia de CVStudio
Los archivos públicos, estilos y recursos se pueden trasladar sin enlaces funcionales a otras carpetas de CVStudio. Solo og:image contiene la URL de muestra, y el crédito del pie enlaza a CVStudio. La configuración del navegador es local y no reemplaza una base del cliente.

## Acceso de demostración
El panel incluye una pantalla de ingreso para prueba con verificación PBKDF2 en el navegador y sesión local de hasta cuatro horas. No es autenticación de servidor y no protege datos privados. No reutilizar la clave demo para producción ni conectar este acceso de muestra con datos reales. Reemplazar por autenticación y permisos reales en la cuenta del cliente durante el desarrollo definitivo.

Actualización v1.1: márgenes de escritorio ampliados, presentación como proyecto en desarrollo y textos de acceso administrativo actualizados. El guardado sigue siendo local en esta etapa.

Acabados v1.2: íconos SVG independientes de fuentes de texto, botones, bordes y estados de interacción refinados.

## Avance Neuquén · 4 de noviembre de 2026
Imágenes elegidas: 12, 14, 06 y 08, desarrolladas individualmente. Origen: Neuquén capital y alcance nacional, con trayectoria informada por el estudio (+25 años). Se conserva celular y Gmail. Panel visual ampliado: imágenes por ubicación, carga de archivos optimizados y textos por sección, respaldo JSON. Los ajustes se guardan solo en el navegador; publicación compartida y autenticación definitiva pendientes de las cuentas del cliente. El formulario prepara WhatsApp; no confirma turnos automáticamente.
Mapa: silueta Natural Earth 1:110m, dominio público, referencia cartográfica general; no delimita coberturas de productos. Fuente: https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_110m_admin_0_countries.geojson

## Redacción de Iván · 4 de noviembre de 2026
Texto emocional y llamadas a reunión por sección, red de productores con mensaje WhatsApp específico, bloque explicativo del seguro de retiro, foto real de Iván junto al formulario y solicitud de propuesta con nombre/edad. Sin testimonios ni videos inventados: pendientes de envío autorizado. Se retiraron los enlaces públicos al panel y la etiqueta de desarrollo. Página pública indexable a pedido; panel mantiene noindex y acceso de prueba. Beneficios fiscales y acceso desde año 6 se presentan sujetos a producto/póliza y requisitos vigentes; no se garantiza el mejor contrato ni cobertura universal. Fuentes de contraste: https://www.argentina.gob.ar/superintendencia-de-seguros/conciencia-aseguradora/que-es-un-seguro/seguros-de-personas y https://www.sancristobalretiro.com.ar/preguntas-frecuentes/ . Los cambios del panel siguen siendo locales hasta la conexión definitiva de cuentas.
