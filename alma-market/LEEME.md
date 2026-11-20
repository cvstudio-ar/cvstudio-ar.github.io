# Alma Market — Demo CVStudio

Extensión pública de CVStudio Argentina: https://cvstudio.com.ar/alma-market/

Panel de prueba sin contraseña: https://cvstudio.com.ar/alma-market/admin/

## Funcionalidad disponible

- Portada con identidad visual propia, logo orientativo de Alma Market, paleta verde/coral/crema y recursos responsivos.
- Catálogo ilustrativo de 12 productos agrupados en yerbas e infusiones, snacks saludables, cuidado personal y regalos/bienestar.
- Filtros por categoría, buscador y consulta por WhatsApp.
- Instagram: @almamarket.ar.
- Ubicación: Alsina 132, San Isidro, Buenos Aires, según captura proporcionada por el cliente.
- Horarios: a confirmar por el cliente. No se inventaron horarios ni precios.
- Envíos: se informa la opción sin inventar alcance ni costo.
- Mapa, portada, presentación y sección de local.

## Panel de demostración

El panel está abierto sin contraseña solo para evaluación. Las modificaciones se guardan en localStorage del navegador del visitante: no sincronizan con otros visitantes ni alteran la versión pública predeterminada.

El usuario puede editar textos, productos, categorías, etiquetas, fotos, logo, ubicación, horarios, enlaces, colores, restaurar contenidos, exportar/importar JSON y abrir la vista previa en el mismo navegador.

Para el servicio definitivo hace falta panel protegido y almacenamiento compartido seguro (por ejemplo Cloudflare KV / Pages Functions, si el cliente contrata ese alcance). No activar escrituras públicas sin autenticar.

El catálogo es una representación: las fotografías compartidas por el cliente orientaron los nombres, colores y variedades; las ilustraciones SVG predeterminadas representan categorías y envases sin afirmar disponibilidad ni precios. Fotos reales y logo oficial se reemplazan desde el panel para la prueba.

## Infraestructura

Sitio estático dentro del repositorio principal cvstudio-ar/cvstudio-ar.github.io, ruta aislada alma-market/.
No crea GitHub, Supabase ni Cloudflare de terceros; usa el despliegue GitHub Pages existente.
Las pruebas están en tests/alma-market-demo.test.mjs y quedan excluidas de publicación por el workflow principal.
