---
title: "La hormiga de Langton"
description: "Dos reglas, dos colores y una hormiga que termina construyendo una autopista: cómo el comportamiento global emerge de decisiones locales."
date: "2026-10-24"
category: "autómatas"
minutes: 8
lang: "es"
field: "highway"
draft: false
---
<p>
	La hormiga de Langton es una de las demostraciones más limpias de una idea
	incómoda: no hace falta un plan para producir estructura. Hay una
	cuadrícula, una hormiga y dos reglas. Nada más. Después de unos diez mil
	pasos, el dibujo que aparece no se parece en nada a las reglas que lo
	produjeron.
</p>

<h2>Dos reglas</h2>
<p>
	El mundo es una cuadrícula infinita de celdas blancas o negras. La hormiga
	ocupa una celda y mira en una de las cuatro direcciones. En cada paso hace
	exactamente esto:
</p>

<table>
	<thead>
		<tr>
			<th>celda actual</th>
			<th>giro</th>
			<th>nuevo color</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td>blanca</td>
			<td>90° a la derecha</td>
			<td>negra</td>
		</tr>
		<tr>
			<td>negra</td>
			<td>90° a la izquierda</td>
			<td>blanca</td>
		</tr>
	</tbody>
</table>

<p>
	Después de girar y cambiar el color, la hormiga avanza una celda en la
	dirección en la que quedó mirando. No hay memoria, no hay búsqueda, no hay
	una representación interna del mundo. La cuadrícula es toda la memoria.
</p>
<p>
	La regla se inventó en 1986, en el contexto de los autómatas celulares y la
	vida artificial. Es un caso particular de <em>turmite</em>: una máquina de
	Turing que se mueve por una cinta bidimensional en lugar de leerla de
	izquierda a derecha.
</p>

<h2>La autopista</h2>
<p>
	Al principio el rastro es simétrico y caótico. Durante miles de pasos la
	hormiga parece vagar sin rumbo, construyendo y destruyendo bloques. Luego,
	alrededor del paso 10.000 en una cuadrícula vacía, algo cambia: el patrón se
	ordena y la hormiga empieza a repetir un ciclo de 104 pasos. Cada ciclo
	desplaza el dibujo dos celdas en diagonal. Esa estructura periódica se
	conoce como la <em>autopista</em> de Langton.
</p>

<figure>
	<img
		src="/images/langtons-ant.png"
		alt="Traza de la hormiga de Langton tras 15.000 pasos: una región caótica y una autopista diagonal"
		width="1200"
		height="800"
		loading="lazy"
	/>
	<figcaption>
		fig. 1 — 15.000 pasos desde una cuadrícula vacía. La diagonal es la
		autopista de período 104; el punto verde marca la posición final de la
		hormiga.
	</figcaption>
</figure>

<p>
	La autopista no está programada en ninguna parte. Es una consecuencia de la
	interacción entre la hormiga y los rastros que ella misma dejó atrás. Una
	celda que la hormiga pintó hace miles de pasos cambia el giro que tomará hoy.
	El sistema tiene memoria, pero la memoria está distribuida en el terreno.
</p>
<p>
	No se conoce una descripción cerrada de toda la trayectoria. Tampoco está
	demostrado que toda configuración inicial finita termine en una autopista;
	la evidencia computacional es abrumadora, pero el problema general sigue
	abierto. Lo que sí se sabe es que las generalizaciones con más colores y
	reglas pueden ser Turing-completas: la familia de hormigas es capaz de
	simular una máquina de Turing. La versión original de dos colores es un caso
	especial que todavía no se deja reducir a una fórmula simple.
</p>

<h2>Por qué importa</h2>
<p>
	La hormiga es un recordatorio de que la complejidad no requiere una regla
	compleja. También es un banco de pruebas para preguntas más generales:
	¿cuándo un sistema local produce estructura global?, ¿cómo se relaciona la
	previsibilidad con la computabilidad?, ¿qué significa que un sistema
	“calcule” sin tener un propósito?
</p>
<p>
	En ciencias de la computación aparece junto a los autómatas celulares, los
	sistemas dinámicos discretos y la computación no convencional. En todos
	esos casos la lección es parecida: el comportamiento interesante no está en
	los componentes, sino en las interacciones.
</p>

<h2>Una implementación mínima</h2>
<p>
	El código cabe en unas pocas líneas si se usan números complejos para la
	posición y la dirección. Multiplicar por <code>i</code> gira 90° en un
	sentido; multiplicar por <code>−i</code> gira en el otro. El conjunto
	<code>black</code> guarda las celdas negras.
</p>

<pre><code>black = set()
pos = 0j
direction = 1  # este

for _ in range(15_000):
    if pos in black:
        direction *= 1j      # izquierda
        black.remove(pos)
    else:
        direction *= -1j     # derecha
        black.add(pos)
    pos += direction</code></pre>

<p>
	Para dibujarlo basta con recorrer <code>black</code> y pintar cada par
	<code>(int(z.real), int(z.imag))</code> como una celda. La parte interesante
	no está en el render, sino en el hecho de que esas cuatro líneas producen
	la figura anterior.
</p>

<h2>Cierre</h2>
<p>
	La hormiga no sabe que está construyendo una autopista. Solo obedece dos
	reglas. Esa distancia entre la regla y el resultado es exactamente lo que
	hace que valga la pena estudiarla.
</p>
