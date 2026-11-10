---
title: "Genetic algorithms"
description: "Selection, crossover and mutation: how a population of solutions improves without gradients, and why it is not a magic wand."
date: "2026-10-18"
category: "algorithms"
minutes: 11
lang: "en"
field: "duet"
draft: false
---
<p>
	A genetic algorithm knows nothing about the problem it solves. It does not
	compute derivatives, it does not know the shape of the landscape and it
	has no plan. It just keeps a population of candidates, evaluates them, and
	lets the best ones have more offspring. The hope is that selection
	accumulates the correct pieces before the population becomes uniform.
</p>

<h2>The idea</h2>
<p>
	The inspiration is biological evolution, but the algorithm is a stochastic
	search technique, not a biology simulation. Each individual represents a
	possible solution. A <em>fitness</em> function assigns it a number. Each
	generation selects parents, recombines their genomes and introduces
	mutations. The children replace the population and the process repeats.
</p>
<p>
	The central piece is the representation. A genome can be a bit string, a
	vector of real numbers, a permutation or a tree. The choice is not
	neutral: it determines which solutions are reachable and which operators
	make sense.
</p>

<h2>The pieces</h2>
<table>
	<thead>
		<tr>
			<th>piece</th>
			<th>role</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td>representation</td>
			<td>encodes a solution as a genome</td>
		</tr>
		<tr>
			<td>fitness</td>
			<td>measures how good a solution is</td>
		</tr>
		<tr>
			<td>selection</td>
			<td>favors individuals with better fitness</td>
		</tr>
		<tr>
			<td>crossover</td>
			<td>combines genetic material from two parents</td>
		</tr>
		<tr>
			<td>mutation</td>
			<td>introduces small random changes</td>
		</tr>
		<tr>
			<td>elitism</td>
			<td>preserves the best individuals unchanged</td>
		</tr>
	</tbody>
</table>

<p>
	Tournament selection is one of the simplest: pick <code>k</code>
	individuals at random and the one with the highest fitness wins. With
	<code>k = 3</code> the selective pressure is moderate. Single-point
	crossover cuts two genomes at the same position and swaps them. Mutation
	flips bits with low probability. Elitism avoids losing the best solution
	found so far.
</p>

<h2>A concrete example</h2>
<p>
	We want to maximize a multimodal function on the interval <code>[0, 32]</code>:
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
	The genome is a 16-bit string. It is read as an integer between 0 and
	65,535, which is scaled linearly to <code>[0, 32]</code>. The population
	has 30 individuals; tournaments of size 3, single-point crossover with
	probability 0.9, per-bit mutation of 0.01 and two-individual elitism are
	used. Over 100 generations the best fitness and the mean are recorded.
</p>

<figure>
	<svg
		class="figure-svg"
		viewBox="0 0 720 300"
		role="img"
		aria-labelledby="ga-plot-title ga-plot-desc"
	>
		<title id="ga-plot-title">Convergence of a genetic algorithm</title>
		<desc id="ga-plot-desc">
			Best fitness and mean fitness per generation over one hundred generations.
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
		<text class="ga-label" x="378" y="298" text-anchor="middle">generation</text>
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
			<text x="24" y="4">best</text>
			<line class="ga-mean" x1="0" y1="24" x2="18" y2="24"></line>
			<text x="24" y="28">mean</text>
		</g>
	</svg>
	<figcaption>
		fig. 1 — best fitness (solid line) and mean fitness (dashed line) per
		generation. The best individual stabilizes early; the mean keeps
		fluctuating because mutation and crossover preserve diversity.
	</figcaption>
</figure>

<p>
	In this run the best individual landed at <code>x ≈ 26.741</code>, with
	<code>f(x) ≈ 36.722</code>. The maximum of the function is at
	<code>x ≈ 26.741</code>, so the algorithm found the correct region. What
	matters is not the exact number but the shape of the curves: best fitness
	climbs fast and plateaus, while the mean takes longer to approach it.
</p>
<p>
	The gap between the two curves is useful information. If the mean sticks to
	the best too early, the population lost diversity and the search can get
	trapped in a local optimum. If the mean never rises, selective pressure is
	too weak or the representation cannot build better solutions.
</p>

<h2>Why it works, and when it doesn't</h2>
<p>
	The classic explanation is the <em>schemata theorem</em>: selection
	increases the representation of blocks that are above average, and
	crossover can recombine good blocks from different parents. It is a useful
	justification, not a guarantee. The theorem describes the expected effect
	of selection on patterns, but it does not promise that the algorithm finds
	the global optimum.
</p>
<p>
	The landscape matters. If fitness is noisy, if the variables interact
	hostilely, or if the global optimum is surrounded by deep valleys, the
	population can converge to a mediocre solution. The phenomenon is called
	premature convergence, and it is fought with more diversity, adaptive
	mutation, restarts or structured populations. There is no universal recipe.
</p>
<p>
	Nor is there a genetic algorithm that is “better” for every problem. The
	<em>no free lunch</em> theorem says that, averaged over all possible
	landscapes, no search algorithm beats another. A genetic algorithm bakes
	in assumptions: that the space can be represented, that good solutions
	share blocks, and that selection can exploit them. If those assumptions
	don't hold, the method loses its edge.
</p>
<p>
	That's why a GA is rarely the first choice when gradients are available,
	constraints are smooth, or the problem is convex. It makes more sense when
	fitness is a black box, when the space is discrete or combinatorial, when
	there are multiple optima, or when evaluating a solution is expensive but
	parallelizable.
</p>

<h2>A minimal implementation</h2>
<p>
	The following code reproduces the experiment. It is not a framework: it is
	the skeleton to understand where each decision lives.
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
	There are three details that usually get overlooked. First, parents are
	copied before mutating; otherwise mutation modifies the previous
	population. Second, elitism is applied before crossover and mutation, so
	the best individual is not lost. Third, the tournament is held with
	replacement: the same individual can be selected several times, which
	increases selective pressure.
</p>

<h2>Closing</h2>
<p>
	A genetic algorithm is not an intelligence and it does not “discover” the
	problem. It is a way of biasing a search: keep several answers, punish
	the bad ones and let variation explore. Its virtue is the same as
	Langton's ant: simple local rules, global behavior that is not visible at
	first sight.
</p>
