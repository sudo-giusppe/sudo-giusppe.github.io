---
title: "Langton's ant"
description: "Two rules, two colors and an ant that ends up building a highway: how global behavior emerges from local decisions."
date: "2026-10-24"
category: "automata"
minutes: 8
lang: "en"
field: "highway"
draft: false
---
<p>
	Langton's ant is one of the cleanest demonstrations of an uncomfortable
	idea: you don't need a plan to produce structure. There is a grid, an ant
	and two rules. Nothing else. After about ten thousand steps, the drawing
	that appears looks nothing like the rules that produced it.
</p>

<h2>Two rules</h2>
<p>
	The world is an infinite grid of white or black cells. The ant occupies one
	cell and faces one of the four directions. At each step it does exactly
	this:
</p>

<table>
	<thead>
		<tr>
			<th>current cell</th>
			<th>turn</th>
			<th>new color</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td>white</td>
			<td>90° right</td>
			<td>black</td>
		</tr>
		<tr>
			<td>black</td>
			<td>90° left</td>
			<td>white</td>
		</tr>
	</tbody>
</table>

<p>
	After turning and flipping the color, the ant moves one cell forward in
	whatever direction it is facing. There is no memory, no search, no internal
	representation of the world. The grid is all the memory there is.
</p>
<p>
	The rule was invented in 1986, in the context of cellular automata and
	artificial life. It is a particular case of a <em>turmite</em>: a Turing
	machine that moves over a two-dimensional tape instead of reading it left
	to right.
</p>

<h2>The highway</h2>
<p>
	At first the trail is symmetric and chaotic. For thousands of steps the ant
	seems to wander aimlessly, building and destroying blocks. Then, around
	step 10,000 on an empty grid, something changes: the pattern orders itself
	and the ant starts repeating a 104-step cycle. Each cycle shifts the
	drawing two cells diagonally. That periodic structure is known as
	Langton's <em>highway</em>.
</p>

<figure>
	<img
		src="/images/langtons-ant.png"
		alt="Trace of Langton's ant after 15,000 steps: a chaotic region and a diagonal highway"
		width="1200"
		height="800"
		loading="lazy"
	/>
	<figcaption>
		fig. 1 — 15,000 steps from an empty grid. The diagonal is the period-104
		highway; the green dot marks the ant's final position.
	</figcaption>
</figure>

<p>
	The highway is not programmed anywhere. It is a consequence of the
	interaction between the ant and the trails it left behind itself. A cell
	that the ant painted thousands of steps ago changes the turn it will take
	today. The system has memory, but the memory is distributed across the
	terrain.
</p>
<p>
	There is no known closed description of the whole trajectory. Nor is it
	proven that every finite initial configuration ends in a highway; the
	computational evidence is overwhelming, but the general problem remains
	open. What is known is that generalizations with more colors and rules can
	be Turing-complete: the family of ants can simulate a Turing machine. The
	original two-color version is a special case that still refuses to reduce
	to a simple formula.
</p>

<h2>Why it matters</h2>
<p>
	The ant is a reminder that complexity does not require a complex rule. It
	is also a test bench for more general questions: when does a local system
	produce global structure? How does predictability relate to
	computability? What does it mean for a system to “compute” without having
	a purpose?
</p>
<p>
	In computer science it appears next to cellular automata, discrete
	dynamical systems and unconventional computing. In all those cases the
	lesson is similar: the interesting behavior is not in the components, but
	in the interactions.
</p>

<h2>A minimal implementation</h2>
<p>
	The code fits in a few lines if you use complex numbers for the position
	and the direction. Multiplying by <code>i</code> turns 90° one way;
	multiplying by <code>−i</code> turns it the other. The <code>black</code>
	set holds the black cells.
</p>

<pre><code>black = set()
pos = 0j
direction = 1  # east

for _ in range(15_000):
    if pos in black:
        direction *= 1j      # left
        black.remove(pos)
    else:
        direction *= -1j     # right
        black.add(pos)
    pos += direction</code></pre>

<p>
	To draw it, walk <code>black</code> and paint each pair
	<code>(int(z.real), int(z.imag))</code> as a cell. The interesting part is
	not the render, but the fact that those four lines produce the figure
	above.
</p>

<h2>Closing</h2>
<p>
	The ant doesn't know it is building a highway. It just obeys two rules.
	That distance between the rule and the result is exactly what makes it
	worth studying.
</p>
