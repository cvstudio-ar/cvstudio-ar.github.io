# CVStudio · Evaluaciones sectoriales v1.8

## Alcance

La biblioteca contiene 18 orientaciones: Administración, Atención al cliente, Comercial, Construcción, Finanzas, Gastronomía, Hotelería, Industria, Liderazgo, Logística, Maestranza, Mantenimiento, Recursos Humanos, Retail, Salud, Seguridad, Tecnología y Transporte.

Cada plantilla dispone de un banco propio de 22 consignas. Ninguna utiliza los módulos genéricos anteriores. La terminología, los registros, las prioridades, los riesgos, los equipos y las decisiones se contextualizan en el sector correspondiente.

## Composición de cada banco

- 6 consignas de análisis aplicado al sector.
- 6 consignas de atención, precisión y procedimientos sectoriales.
- 6 casos de juicio situacional propios del puesto.
- 4 respuestas abiertas de entrevista y resolución de casos.

Cada enlace asigna 18 preguntas con una composición fija de 5 + 5 + 5 + 3. El token individual modifica la selección y el orden sin alterar el equilibrio. En los intentos posteriores se priorizan las consignas que el cliente todavía no respondió.

## Instalación

Ejecutar después de las migraciones V3 y V4 existentes:

`docs/migraciones/SUPABASE_BANCOS_SECTORIALES_V4.sql`

El archivo es transaccional y aborta si alguna de las 18 plantillas no contiene exactamente 22 identificadores únicos, si la composición no es 6/6/6/4 o si detecta preguntas de un módulo genérico o de otro sector.

## Conservación de intentos

Los intentos iniciados o completados mantienen su copia inmutable de preguntas. Los enlaces pendientes que todavía no comenzaron utilizarán la versión sectorial cuando el cliente presione “Comenzar”.

## Uso profesional

Las evaluaciones son prácticas orientativas para entrevistas y pruebas laborales. No son instrumentos psicométricos validados, diagnósticos psicológicos ni decisiones de aptitud. Las consignas abiertas requieren revisión profesional antes de generar la devolución.
