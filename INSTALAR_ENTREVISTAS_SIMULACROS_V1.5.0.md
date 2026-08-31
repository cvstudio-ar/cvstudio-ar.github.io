# CVStudio v1.5.0 · Entrevistas y simulacros

## Activación

1. Ingresar a Supabase y abrir **SQL Editor**.
2. Copiar y ejecutar el contenido de `docs/migraciones/SUPABASE_ENTREVISTAS_SIMULACROS.sql`.
3. Publicar el proyecto actualizado en la rama `main`. GitHub Pages desplegará el sitio automáticamente.
4. Ingresar al **Centro de Operaciones** con la cuenta de Dirección y abrir **Entrevistas y simulacros**.

## Crear el simulacro de Federico

1. Presionar **+ Federico · lógico**.
2. Confirmar el puesto objetivo y el vencimiento del enlace.
3. Presionar **Crear y obtener enlace**.
4. Copiar el mensaje sugerido y enviarlo por WhatsApp.

El cronómetro empieza cuando Federico presiona **Comenzar simulacro**. Al finalizar, el Centro de Operaciones mostrará respuestas, puntaje, tiempo utilizado, dificultad y ansiedad percibidas. Las respuestas correctas no se muestran al participante.

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
