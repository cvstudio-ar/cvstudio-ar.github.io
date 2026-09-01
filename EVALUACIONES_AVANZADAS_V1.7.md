# CVStudio · Evaluaciones avanzadas v1.7

## Alcance implementado

La biblioteca activa incluye 18 perfiles: Administración, Atención al cliente, Comercial, Construcción, Finanzas, Gastronomía, Hotelería, Industria, Liderazgo, Logística, Maestranza, Mantenimiento, Recursos Humanos, Retail, Salud, Seguridad privada, Tecnología y Transporte.

Cada perfil combina cuatro módulos:

1. Razonamiento y análisis de datos.
2. Atención, precisión y seguimiento de instrucciones.
3. Criterio laboral e entrevista estructurada.
4. Situaciones específicas del sector.

Cada plantilla contiene un banco de 22 consignas y asigna 18 por intento. La selección se determina con el token individual, por lo que el intento queda estable al recargar pero cambia entre clientes.

## Tipos de consignas

- Objetivas: cálculo, inferencia, interpretación y reglas condicionales.
- Juicio situacional: alternativas plausibles con crédito gradual de 0 a 3.
- Casos de puesto: decisiones con contexto, límites y consecuencias.
- Abiertas: respuestas conductuales y técnicas para revisión profesional.

El informe interno muestra resultado global, tiempo, dificultad percibida y puntaje por dimensión. Las consignas abiertas no se corrigen automáticamente.

## Criterios de diseño

- Las opciones incorrectas evitan formulaciones absurdas o evidentemente negligentes siempre que el caso lo permite.
- La opción de mayor puntaje integra procedimiento, comunicación, trazabilidad y gestión del riesgo.
- Las respuestas correctas, puntajes, explicaciones y rúbricas nunca se envían al navegador público.
- Cada intento guarda una copia inmutable de las preguntas asignadas.
- Las plantillas son prácticas orientativas de preparación; no se presentan como instrumentos psicométricos validados ni como diagnósticos.

## Fuentes marco

- O*NET Content Model y base ocupacional.
- ESCO: clasificación europea de ocupaciones y capacidades.
- SIOP: selección multimétodo, entrevistas estructuradas y criterios de validez.
- EEOC: relación con el puesto, equidad y riesgos de impacto adverso.
- SRT Argentina: prevención, riesgos y elementos de protección.
- ANMAT: manipulación segura de alimentos.
- Ministerio de Salud de Argentina: seguridad del paciente y calidad de atención.

## Próxima evolución recomendada

La arquitectura permite agregar módulos especializados sin rehacer el motor. Las siguientes expansiones deberían priorizarse según demanda real: farmacia, enfermería por nivel, laboratorio, petróleo y gas, minería, educación, cuidado infantil, cobranzas, banca, seguros, comercio exterior, compras, marketing, diseño, programación, soporte por tecnología, oficios técnicos y mandos medios por industria.

Antes de comercializar una nueva especialidad conviene revisar sus consignas con una persona experta en el puesto y registrar versión, fuente y fecha de revisión.
