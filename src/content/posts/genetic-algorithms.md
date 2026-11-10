---
title: "Algoritmos genéticos"
description: "Selección, cruce y mutación: cómo una población de soluciones mejora sin gradientes, y por qué no es una varita mágica."
date: "2026-10-18"
category: "algoritmos"
minutes: 11
lang: "es"
field: "duet"
draft: false
---
<p>
	Un algoritmo genético no sabe nada del problema que resuelve. No calcula
	derivadas, no conoce la forma del paisaje y no tiene un plan. Solo mantiene
	una población de candidatos, los evalúa, y deja que los mejores tengan más
	descendencia. La esperanza es que la selección acumule las piezas correctas
	antes de que la población se vuelva uniforme.
</p>

<h2>La idea</h2>
<p>
	La inspiración es la evolución biológica, pero el algoritmo es una técnica
	de búsqueda estocástica, no una simulación de biología. Cada individuo
	representa una solución posible. Una función de <em>fitness</em> le asigna
	un número. En cada generación se seleccionan padres, se recombinan sus
	genomas y se introducen mutaciones. Los hijos reemplazan a la población y el
	proceso se repite.
</p>
<p>
	La pieza central es la representación. Un genoma puede ser una cadena de
	bits, un vector de números reales, una permutación o un árbol. La elección
	no es neutral: determina qué soluciones son alcanzables y qué operadores
	tienen sentido.
</p>

<h2>Las piezas</h2>
<table>
	<thead>
		<tr>
			<th>pieza</th>
			<th>función</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td>representación</td>
			<td>codifica una solución como un genoma</td>
		</tr>
		<tr>
			<td>fitness</td>
			<td>mide qué tan buena es una solución</td>
		</tr>
		<tr>
			<td>selección</td>
			<td>favorece a los individuos con mejor fitness</td>
		</tr>
		<tr>
			<td>cruce</td>
			<td>combina material genético de dos padres</td>
		</tr>
		<tr>
			<td>mutación</td>
			<td>introduce cambios pequeños y aleatorios</td>
		</tr>
		<tr>
			<td>elitismo</td>
			<td>preserva los mejores individuos sin cambios</td>
		</tr>
	</tbody>
</table>

<p>
	La selección por torneo es una de las más simples: se eligen
	<code>k</code> individuos al azar y gana el de mayor fitness. Con
	<code>k = 3</code> la presión selectiva es moderada. El cruce de un punto
	corta dos genomas en la misma posición y los intercambia. La mutación voltea
	bits con probabilidad baja. El elitismo evita perder la mejor solución
	encontrada.
</p>

<h2>Un ejemplo concreto</h2>
<p>
	Queremos maximizar una función multimodal en el intervalo <code>[0, 32]</code>:
</p>

<div class="equation">
	<math display="block">
		<mi>f</mi>
		<mo>(</mo>
		<mi>x</mi>
		<mo>)</mo>
		<mo>=</mo>
		<mi>x</mi>
		<mi mathvariant="normal">sin</mi>
		<mi>x</mi>
		<mo>+</mo>
		<mn>10</mn>
		<mo>,</mo>
		<mspace width="1em"></mspace>
		<mn>0</mn>
		<mo>≤</mo>
		<mi>x</mi>
		<mo>≤</mo>
		<mn>32</mn>
	</math>
</div>

<p>
	El genoma es una cadena de 16 bits. Se interpreta como un entero entre 0 y
	65.535, que se escala linealmente a <code>[0, 32]</code>. La población tiene
	30 individuos; se usan torneos de tamaño 3, cruce de un punto con
	probabilidad 0,9, mutación por bit de 0,01 y elitismo de dos individuos.
	Durante 100 generaciones se registran el mejor fitness y la media.
</p>

<figure>
	<svg
		class="figure-svg"
		viewBox="0 0 720 300"
		role="img"
		aria-labelledby="ga-plot-title ga-plot-desc"
	>
		<title id="ga-plot-title">Convergencia de un algoritmo genético</title>
		<desc id="ga-plot-desc">
			Mejor fitness y fitness medio por generación durante cien generaciones.
		</desc>
		<line class="ga-grid" x1="54" y1="262.0" x2="702" y2="262.0"></line>
		<text class="ga-tick" x="44" y="265.5" text-anchor="end">0</text>
		<line class="ga-grid" x1="54" y1="201.5" x2="702" y2="201.5"></line>
		<text class="ga-tick" x="44" y="205.0" text-anchor="end">10</text>
		<line class="ga-grid" x1="54" y1="141.0" x2="702" y2="141.0"></line>
		<text class="ga-tick" x="44" y="144.5" text-anchor="end">20</text>
		<line class="ga-grid" x1="54" y1="80.5" x2="702" y2="80.5"></line>
		<text class="ga-tick" x="44" y="84.0" text-anchor="end">30</text>
		<line class="ga-grid" x1="54" y1="20.0" x2="702" y2="20.0"></line>
		<text class="ga-tick" x="44" y="23.5" text-anchor="end">40</text>
		<text class="ga-tick" x="54.0" y="284" text-anchor="middle">0</text>
		<text class="ga-tick" x="183.6" y="284" text-anchor="middle">20</text>
		<text class="ga-tick" x="313.2" y="284" text-anchor="middle">40</text>
		<text class="ga-tick" x="442.8" y="284" text-anchor="middle">60</text>
		<text class="ga-tick" x="572.4" y="284" text-anchor="middle">80</text>
		<text class="ga-tick" x="702.0" y="284" text-anchor="middle">100</text>
		<text class="ga-label" x="378" y="298" text-anchor="middle">generación</text>
		<text
			class="ga-label"
			x="14"
			y="141"
			text-anchor="middle"
			transform="rotate(-90 14 141)">fitness</text
		>
		<path
			class="ga-best"
			d="M54.0,80.4 L60.5,43.7 L67.0,43.7 L73.4,41.5 L79.9,40.5 L86.4,40.5 L92.9,40.0 L99.4,39.8 L105.8,39.8 L112.3,39.8 L118.8,39.8 L125.3,39.8 L131.8,39.8 L138.2,39.8 L144.7,39.8 L151.2,39.8 L157.7,39.8 L164.2,39.8 L170.6,39.8 L177.1,39.8 L183.6,39.8 L190.1,39.8 L196.6,39.8 L203.0,39.8 L209.5,39.8 L216.0,39.8 L222.5,39.8 L229.0,39.8 L235.4,39.8 L241.9,39.8 L248.4,39.8 L254.9,39.8 L261.4,39.8 L267.8,39.8 L274.3,39.8 L280.8,39.8 L287.3,39.8 L293.8,39.8 L300.2,39.8 L306.7,39.8 L313.2,39.8 L319.7,39.8 L326.2,39.8 L332.6,39.8 L339.1,39.8 L345.6,39.8 L352.1,39.8 L358.6,39.8 L365.0,39.8 L371.5,39.8 L378.0,39.8 L384.5,39.8 L391.0,39.8 L397.4,39.8 L403.9,39.8 L410.4,39.8 L416.9,39.8 L423.4,39.8 L429.8,39.8 L436.3,39.8 L442.8,39.8 L449.3,39.8 L455.8,39.8 L462.2,39.8 L468.7,39.8 L475.2,39.8 L481.7,39.8 L488.2,39.8 L494.6,39.8 L501.1,39.8 L507.6,39.8 L514.1,39.8 L520.6,39.8 L527.0,39.8 L533.5,39.8 L540.0,39.8 L546.5,39.8 L553.0,39.8 L559.4,39.8 L565.9,39.8 L572.4,39.8 L578.9,39.8 L585.4,39.8 L591.8,39.8 L598.3,39.8 L604.8,39.8 L611.3,39.8 L617.8,39.8 L624.2,39.8 L630.7,39.8 L637.2,39.8 L643.7,39.8 L650.2,39.8 L656.6,39.8 L663.1,39.8 L669.6,39.8 L676.1,39.8 L682.6,39.8 L689.0,39.8 L695.5,39.8"
		></path>
		<path
			class="ga-mean"
			d="M54.0,224.2 L60.5,153.7 L67.0,117.2 L73.4,87.0 L79.9,55.1 L86.4,56.6 L92.9,49.0 L99.4,54.2 L105.8,63.2 L112.3,47.5 L118.8,60.8 L125.3,54.5 L131.8,47.3 L138.2,54.4 L144.7,39.9 L151.2,49.1 L157.7,39.9 L164.2,40.3 L170.6,48.2 L177.1,55.1 L183.6,53.1 L190.1,48.0 L196.6,54.6 L203.0,40.5 L209.5,56.6 L216.0,49.7 L222.5,42.4 L229.0,49.1 L235.4,46.3 L241.9,51.2 L248.4,47.1 L254.9,47.3 L261.4,48.0 L267.8,39.9 L274.3,40.5 L280.8,39.8 L287.3,55.3 L293.8,55.1 L300.2,57.4 L306.7,47.3 L313.2,40.0 L319.7,47.1 L326.2,55.5 L332.6,48.3 L339.1,69.7 L345.6,47.7 L352.1,49.1 L358.6,54.6 L365.0,45.6 L371.5,49.1 L378.0,54.9 L384.5,49.1 L391.0,55.4 L397.4,43.1 L403.9,62.2 L410.4,39.8 L416.9,47.4 L423.4,42.5 L429.8,64.2 L436.3,55.7 L442.8,58.9 L449.3,55.6 L455.8,49.3 L462.2,54.4 L468.7,53.0 L475.2,55.8 L481.7,55.1 L488.2,43.7 L494.6,44.9 L501.1,59.1 L507.6,43.0 L514.1,49.9 L520.6,48.8 L527.0,39.8 L533.5,40.5 L540.0,39.9 L546.5,42.4 L553.0,53.0 L559.4,54.3 L565.9,64.5 L572.4,45.6 L578.9,40.5 L585.4,45.6 L591.8,56.7 L598.3,49.2 L604.8,49.1 L611.3,51.7 L617.8,47.1 L624.2,45.6 L630.7,40.0 L637.2,60.5 L643.7,47.8 L650.2,43.0 L656.6,39.9 L663.1,47.8 L669.6,49.1 L676.1,39.8 L682.6,40.5 L689.0,47.8 L695.5,39.8"
		></path>
		<g class="ga-legend" transform="translate(552,222)">
			<line class="ga-best" x1="0" y1="0" x2="18" y2="0"></line>
			<text x="24" y="4">mejor</text>
			<line class="ga-mean" x1="0" y1="24" x2="18" y2="24"></line>
			<text x="24" y="28">media</text>
		</g>
	</svg>
	<figcaption>
		fig. 1 — mejor fitness (línea continua) y fitness medio (línea
		discontinua) por generación. El mejor individuo se estabiliza pronto; la
		media sigue fluctuando porque la mutación y el cruce conservan
		diversidad.
	</figcaption>
</figure>

<p>
	En esta ejecución el mejor individuo quedó en <code>x ≈ 26.741</code>, con
	<code>f(x) ≈ 36.722</code>. El máximo de la función está en
	<code>x ≈ 26.741</code>, así que el algoritmo encontró la región correcta.
	Lo importante no es el número exacto, sino la forma de la curva: el mejor
	fitness sube rápido y se estanca, mientras la media tarda más en acercarse.
</p>
<p>
	La diferencia entre ambas curvas es información útil. Si la media se pega al
	mejor demasiado pronto, la población perdió diversidad y la búsqueda puede
	quedar atrapada en un óptimo local. Si la media nunca sube, la presión
	selectiva es demasiado débil o la representación no permite construir
	mejores soluciones.
</p>

<h2>Por qué funciona, y cuándo no</h2>
<p>
	La explicación clásica es el <em>teorema de los esquemas</em>: la selección
	aumenta la representación de los bloques que están por encima de la media, y
	el cruce puede recombinar bloques buenos de padres distintos. Es una
	justificación útil, no una garantía. El teorema describe el efecto esperado
	de la selección sobre patrones, pero no promete que el algoritmo encuentre
	el óptimo global.
</p>
<p>
	El paisaje importa. Si el fitness es ruidoso, si las variables interactúan
	de forma hostil o si el óptimo global está rodeado de valles profundos, la
	población puede converger a una solución mediocre. El fenómeno se llama
	convergencia prematura, y se combate con más diversidad, mutación adaptativa,
	reinicios o poblaciones estructuradas. No hay una receta universal.
</p>
<p>
	Tampoco existe un algoritmo genético “mejor” para todos los problemas. El
	teorema de <em>no free lunch</em> dice que, promediado sobre todos los
	paisajes posibles, ningún algoritmo de búsqueda supera a otro. Un algoritmo
	genético incorpora supuestos: que el espacio se puede representar, que las
	buenas soluciones comparten bloques y que la selección puede explotarlos. Si
	esos supuestos no se cumplen, el método pierde su ventaja.
</p>
<p>
	Por eso un GA no suele ser la primera opción cuando hay gradientes,
	restricciones suaves o un problema convexo. Es más razonable cuando el
	fitness es una caja negra, cuando el espacio es discreto o combinatorio,
	cuando hay múltiples óptimos o cuando evaluar una solución es caro pero se
	puede paralelizar.
</p>

<h2>Una implementación mínima</h2>
<p>
	El siguiente código reproduce el experimento. No es un framework: es el
	esqueleto para entender dónde está cada decisión.
</p>

<pre><code>import math
import random

BITS, POP, GENS = 16, 30, 100
TOUR, PC, PM = 3, 0.9, 0.01
random.seed(20261024)


def fitness(bits):
    x = int("".join(map(str, bits)), 2) / (2**BITS - 1) * 32
    return x * math.sin(x) + 10


def tournament(population, fits):
    contenders = random.sample(range(len(population)), TOUR)
    return population[max(contenders, key=lambda i: fits[i])]


population = [[random.randint(0, 1) for _ in range(BITS)]
              for _ in range(POP)]

for gen in range(GENS):
    fits = [fitness(g) for g in population]
    elite = sorted(range(POP), key=lambda i: fits[i], reverse=True)[:2]
    next_pop = [population[i][:] for i in elite]

    while len(next_pop) &lt; POP:
        a = tournament(population, fits)[:]
        b = tournament(population, fits)[:]

        if random.random() &lt; PC:
            cut = random.randint(1, BITS - 1)
            a, b = a[:cut] + b[cut:], b[:cut] + a[cut:]

        for g in (a, b):
            for i in range(BITS):
                if random.random() &lt; PM:
                    g[i] ^= 1

        next_pop.extend([a, b])

    population = next_pop[:POP]

best = max(population, key=fitness)
print("".join(map(str, best)), fitness(best))</code></pre>

<p>
	Hay tres detalles que suelen pasarse por alto. Primero, los padres se copian
	antes de mutar; si no, la mutación modifica la población anterior. Segundo,
	el elitismo se aplica antes del cruce y la mutación, para que el mejor
	individuo no se pierda. Tercero, el torneo se hace con reemplazo: un mismo
	individuo puede ser seleccionado varias veces, lo que aumenta la presión
	selectiva.
</p>

<h2>Cierre</h2>
<p>
	Un algoritmo genético no es una inteligencia y no “descubre” el problema. Es
	una forma de sesgar una búsqueda: mantener varias respuestas, castigar a las
	malas y dejar que la variación explore. Su virtud es la misma que la de la
	hormiga de Langton: reglas locales simples, comportamiento global que no se
	ve a simple vista.
</p>
