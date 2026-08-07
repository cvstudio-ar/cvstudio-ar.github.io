# CVStudio Argentina

Sitio web y panel SIAC de CVStudio Argentina.

## Componentes principales

- `index.html`: sitio público.
- `admin.html`: Centro de Conversaciones SIAC.
- `css/`: estilos del sitio y del panel.
- `js/`: lógica del sitio, Supabase y SIAC.
- `config/`: Cloudflare Worker y configuración de servicios.
- Archivos `.sql`: estructura y actualizaciones de Supabase.

## Publicación

```bash
git add .
git commit -m "Actualizar CVStudio"
git push origin main
```

Las claves privadas deben permanecer en Cloudflare/Supabase y nunca subirse al repositorio.

## Portal de clientes

La versión actual incorpora el MVP del portal privado de portfolios:

- administración de cuentas desde SIAC;
- Worker independiente para alta y gestión de usuarios;
- acceso privado en `/clientes.html`;
- panel del cliente en `/cliente-panel.html`;
- carga de perfil, proyectos e imágenes;
- portfolio público mediante URL personalizada;
- instrucciones en `PORTAL_CLIENTES_INSTALACION.md`.
