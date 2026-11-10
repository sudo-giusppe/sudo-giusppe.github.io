---
title: "Qué compra la distribución: evolucionar turmites con un GA de islas"
description: "¿Qué gana un algoritmo genético distribuido cuando el paisaje de búsqueda es pequeño, rugoso y engañoso? Evolucioné turmites con un GA de islas asíncrono sobre TCP en Rust, registré cada generación y publiqué el experimento y el paper."
date: "2026-11-10"
category: "algoritmos"
minutes: 3
lang: "es"
field: "turmite"
draft: false
---

La pregunta que abrió este proyecto cabe en una línea: **¿qué compra la
distribución cuando el paisaje de búsqueda es pequeño, rugoso y
engañoso?**

Para responderla, con la ayuda de agentes de IA escribí un algoritmo en
Rust que mide la capacidad de la búsqueda evolutiva distribuida sobre
hormigas de Langton generalizadas — turmites. El algoritmo genético corre
como islas asíncronas comunicadas por TCP, registra **cada generación**
sin excepción, y el repositorio trae tanto la suite de experimentos como
el paper detrás de los números:

<https://github.com/sudo-giusppe/langton-ga>

## Por qué turmites

Ya escribí sobre la hormiga de Langton [aquí](/blog/langtons-ant): dos
reglas, dos colores, y una autopista que emerge sola. El turmite es la
generalización natural: más estados, más colores, y una tabla de
transiciones que funciona como genoma. Evolucionar turmites significa
elegir tablas de transición que produzcan comportamiento interesante —
y ese paisaje de búsqueda tiene fama de ser exactamente lo que no
querrías: pequeño en apariencia, lleno de picos aislados y con óptimos
que aparentan más de lo que son.

Eso lo convierte en un buen banco de pruebas para una pregunta de
método: cuando el problema es así de tramposo, ¿repartir la población en
islas que evolucionan por su cuenta y de vez en cuando intercambian
individuos compra algo real, o solo compra teoría bonita?

## Qué hay en la caja

- Un **simulador de turmites** en Rust, con el genoma y la evaluación
  separados de todo lo demás.
- Un **algoritmo genético de islas, asíncrono**: cada isla evoluciona a
  su ritmo y se comunica con las demás por TCP.
- **Registro completo de generaciones**: cada generación queda grabada,
  no solo el resultado final.
- La **suite de experimentos** y el **paper** que sostiene los números,
  todo en el mismo repositorio.

## Lo que los números dicen — y lo que no

Voy a ser honesto conmigo mismo aquí: la investigación actual del tema
es bastante limitada. Lo que hay son pruebas de permutación por pares
exactas, todas las cinco semillas, y las direcciones de efecto.

| Pieza | Estado |
| :--- | :--- |
| Prueba de permutación por pares exacta | sí |
| Las cinco semillas | sí |
| Dirección del efecto | sí |
| Magnitud con intervalos | no todavía |
| Confirmación preregistrada | no todavía |

Para una primera foto, ese nivel de rigor es lo apropiado. Para una
afirmación confirmatoria de su eficacia, no alcanza. Y prefiero decirlo
así antes de que alguien más lo diga por mí.

<div class="note">
  <p><strong>Nota.</strong> Esto es una instantánea, no un veredicto.
  Los números del paper son lo que cinco semillas pueden sostener — ni
  más ni menos.</p>
</div>

## Núcleo separado de experimentos

La decisión de diseño más importante la tomé antes de escribir la
primera línea: el núcleo evolutivo está deliberadamente separado de los
experimentos. Estudiar algo nuevo no requiere tocar el simulador ni el
genoma.

Con la interfaz actual, sin reescribir nada del núcleo, se pueden
implementar por ejemplo:

- **Migración adaptativa**: decidir cuándo y cuánto migrar según el
  estado de las islas, en lugar de un cronómetro fijo.
- **Topología**: anillo contra celular contra gossip — quién escucha a
  quién, y cuánto importa.
- **Rigor estadístico**: más semillas, intervalos, correcciones por
  comparaciones múltiples.
- **Ejecución multi-host**: repartir islas entre varias máquinas, que
  para eso el transporte ya es TCP.

Etcétera. La lista no está cerrada; esa es la idea.

## Cierre

Cada generación está registrada. Si un número del paper te chirría,
puedes bajar los datos crudos del repositorio y auditarlo tú mismo. Para
mí, esa es la diferencia entre un experimento y una demostración.

El código, los experimentos y el paper viven aquí:

<https://github.com/sudo-giusppe/langton-ga>
