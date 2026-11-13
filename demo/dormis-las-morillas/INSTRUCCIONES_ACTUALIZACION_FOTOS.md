# Actualización fotográfica Dormis Las Morillas
Rama de preparación (no fusionar antes de subir y probar las imágenes).

## Archivos preparados en la rama
- demo/dormis-las-morillas/index.html: portada real, asignación inicial de fotografías, galería.
- demo/dormis-las-morillas/assets/morillas-fotos.css: estilos responsive.
- demo/dormis-las-morillas/assets/morillas-galeria.js: filtros y visor de imágenes.

## Archivos necesarios antes de fusionar
Copiar los 43 archivos WebP del paquete `Dormis_Las_Morillas_Fotos_Optimizadas_Integracion.zip`, desde `assets/fotos/`, a:
`demo/dormis-las-morillas/assets/fotos/`.

No subir la foto a otra ruta ni renombrarla: los 43 nombres son utilizados por la selección editorial y pueden reutilizarse desde el panel. No usar el script `aplicar_imagenes.py` sobre esta rama porque los cambios de HTML ya se aplicaron.

## Controles antes de publicar
1. Foto de portada drone-08.webp visible tanto en computadora como celular; evitar imágenes rotas.
2. Las 5 tarjetas iniciales usan fotos reales de dormis y cabaña, sujetas a confirmación del cliente.
3. Galería filtrable con zoom y carga diferida (24 fotos).
4. Panel de administración funcional, edición de imágenes conservada, sin modificar localStorage.
5. Consultas, WhatsApp y filtros de disponibilidad intactos.
6. Apartados Meta Pixel y estadísticas siguen siendo de demostración: no activar campañas ni Pixel real sin configurar consentimiento y datos del cliente.
7. Revisar Preview antes de unir a main o publicar.

Los ZIP originales entregados por el cliente deben conservarse fuera del repositorio. Los dos DNG no deben publicarse.