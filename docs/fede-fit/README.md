# Fede FIT — producción de fotografías de ejercicios

Herramienta aislada del sitio público (el despliegue excluye `docs/`). No altera rutinas ni otras categorías. Lee el catálogo existente en cada ejecución y no vuelve a generar ejercicios habilitados. No se guardan credenciales en Git.

## Uso

En un clon actualizado del repositorio, con Python 3.10+ y Git configurado con el acceso de la cuenta propietaria:

```sh
python -m pip install Pillow
python docs/fede-fit/pipeline.py plan
```

El modo `prepare` usa fotografías sin texto ya disponibles, nombradas `<id>.png` dentro de `sources/` de la carpeta de trabajo. No consume créditos. El modo `generate` solicita una fotografía individual por ejercicio; requiere `pip install runwayml` y una clave de la API de Runway configurada como variable de entorno `RUNWAYML_API_SECRET`. Los créditos API son independientes de los créditos de la aplicación Runway. No hay reintentos automáticos de generación. Usar un máximo de 12 por ejecución, empezando por los pendientes reales. Los 18 pendientes/revisiones de ESPALDA FEMENINO tienen instrucciones técnicas específicas; otras posturas requieren ampliar el diccionario POSES antes de usar generación automática. La generación no certifica técnica deportiva.

```sh
python docs/fede-fit/pipeline.py generate --limit 12
# O, para imágenes generadas por otra vía:
python docs/fede-fit/pipeline.py prepare --limit 12
```

La carpeta predeterminada es `~/fede-fit-candidates/femenino/espalda/`. Se conservan los originales en `sources/`, las tarjetas WebP 340×320 en `cards/`, un `manifest.json` de integridad y una cuadrícula `preview.png`. Se pueden seleccionar otras carpetas externas al repositorio con `--work`. Cada modelo/categoría usa su propia carpeta.

Revisar visualmente la cuadrícula y seleccionar los identificadores válidos (no solo el nombre). El comando de publicación verifica que la imagen no cambió, que el ejercicio no esté habilitado previamente y que el catálogo siga coincidiendo con la referencia inicial. Genera un único commit para toda la tanda. `--push` actualiza `main` con las credenciales Git de la cuenta propietaria y activa el despliegue existente de GitHub Pages. Sin `--push` crea únicamente un commit local. No se habilitan candidatos no revisados. Comprobar que el despliegue finaliza y que la web muestra la versión nueva.

```sh
python docs/fede-fit/pipeline.py publish --approve renegade-row,band-row --push
```

No guardar una clave API en la línea de comandos, archivos versionados ni en el sitio. El modo de generación requiere activación y saldo de API; no se ha activado ningún trabajo de pago ni programado ejecuciones recurrentes.
