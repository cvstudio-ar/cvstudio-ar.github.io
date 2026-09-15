# CVStudio v1.6.0 · Entrevistas y simulacros

## Activación

1. Ingresar a Supabase y abrir **SQL Editor**.
2. Copiar y ejecutar el contenido de `docs/migraciones/SUPABASE_ENTREVISTAS_SIMULACROS.sql`.
3. Ejecutar `docs/migraciones/SUPABASE_ENTREVISTAS_PLANTILLAS_V2.sql` para habilitar Dirección y cargar el catálogo genérico.
4. Publicar el proyecto actualizado en la rama `main`. GitHub Pages desplegará el sitio automáticamente.
5. Ingresar al **Centro de Operaciones** con la cuenta de Dirección y abrir **Entrevistas y simulacros**.

## Generar un simulacro para cualquier cliente

1. Elegir una de las plantillas disponibles.
2. Completar el nombre del cliente, puesto objetivo y vencimiento.
3. Presionar **Crear y obtener enlace**.
4. Copiar el mensaje sugerido y enviarlo por WhatsApp.

El cronómetro empieza cuando el cliente presiona **Comenzar simulacro**. Al finalizar, el Centro de Operaciones mostrará respuestas, puntaje, tiempo utilizado, dificultad y ansiedad percibidas. Las respuestas correctas no se muestran al participante.

## Seguridad y alcance

- Las tablas no admiten lectura anónima directa.
- Cada participante accede mediante un token UUID individual.
- Las funciones públicas devuelven únicamente la información necesaria para rendir.
- Las migraciones SQL se excluyen del artefacto público de GitHub Pages.
- El módulo es visible solo para el nivel **Director**.
- El servicio se presenta como preparación laboral orientativa, no como diagnóstico psicológico o evaluación psicotécnica oficial.

## Rutas nuevas

- Servicio público: `https://cvstudio.com.ar/preparacion-entrevistas/`
- Simulacro individual: `https://cvstudio.com.ar/simulacro/?token=TOKEN`
- Administración: `https://cvstudio.com.ar/centro-operaciones-prueba/#evaluaciones`
