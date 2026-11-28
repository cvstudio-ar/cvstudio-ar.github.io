# Producción de imágenes de FEDE AGUIRRE FIT

El catálogo contiene 415 ejercicios para cada personaje. El estado en
`fit-catalog-progress.json` permite retomar el trabajo. Cada plan incluye
hasta 12 entradas pendientes o en revisión. Las entradas habilitadas quedan
excluidas.

La generación usa ImageGen integrado en Codex, una fotografía por ejercicio.
Las referencias se conservan en `private/fede-fit/references/`, excluido de
Git y de GitHub Pages. Las fotos llevan únicamente las iniciales FA de la
indumentaria. El pipeline aplica la tipografía y la categoría muscular al
convertirlas a WebP de 340 × 320 px.

1. Ejecutar `pipeline.py status` y `pipeline.py plan --work private/fede-fit/001`.
   Se puede indicar el orden con `--select femenino/id,masculino/id`. El plan
   incluye el nombre en inglés y el equipamiento del catálogo.
2. Guardar las fotos en `sources/<personaje>/<id>.png` dentro de la tanda.
   Conservar los prompts y usar `pipeline.py prepare --work private/fede-fit/001`.
   `crops.json` admite un recorte individual en píxeles `[izquierda, arriba,
   derecha, abajo]` por `personaje/id`.
   El pipeline registra huellas y señala fotos similares de tandas anteriores.
3. Revisar visualmente postura, equipamiento, personaje, encuadre y tarjeta.
   Guardar la decisión en `review.json`, identificada por `personaje/id`,
   con `approved`, `sha256` de la tarjeta y una nota. Conservar los rechazos
   para regenerarlos con una corrección específica.
4. Ejecutar `pipeline.py publish --work private/fede-fit/001`. El comando valida
   los hashes y el catálogo actual y escribe `publication.json` con las rutas
   exactas para el commit y la versión pública. Si se interrumpe la escritura,
   repetir `publish` para retomar la tanda con el registro existente.
   `pipeline.py deploy --work private/fede-fit/001` crea el commit y lo envía a
   `main`.
5. Ejecutar `pipeline.py verify --work private/fede-fit/001` después del push.
   Comprueba la versión del editor y los bytes de los catálogos y cada foto.

Se requiere Python 3.10+, Pillow, Git y curl. Reutilizar la carpeta de una tanda
durante sus reintentos y crear el plan siguiente a partir del catálogo actualizado.
