---
title: "What distribution buys: evolving turmites with an island-model GA"
description: "What does a distributed genetic algorithm gain when the search landscape is small, rugged and deceptive? I evolved turmites with an asynchronous island-model GA over TCP in Rust, logged every generation and published the experiment and the paper."
date: "2026-11-10"
category: "algorithms"
minutes: 3
lang: "en"
field: "turmite"
draft: false
---
The question that opened this project fits in one line: **what does
distribution buy when the search landscape is small, rugged and
deceptive?**

To answer it, with the help of AI agents I wrote a Rust algorithm that
measures the capability of distributed evolutionary search over
generalized Langton ants — turmites. The genetic algorithm runs as
asynchronous islands communicating over TCP, records **every
generation** without exception, and the repository ships both the
experiment suite and the paper behind the numbers:

<https://github.com/sudo-giusppe/langton-ga>

## Why turmites

I already wrote about Langton's ant [here](/en/blog/langtons-ant): two
rules, two colors, and a highway that emerges on its own. The turmite is
the natural generalization: more states, more colors, and a transition
table that works as a genome. Evolving turmites means picking transition
tables that produce interesting behavior — and that search landscape
has a reputation for being exactly what you don't want: small-looking,
full of isolated peaks, and with optima that pretend to be more than
they are.

That makes it a good test bench for a question about method: when the
problem is this tricky, does splitting the population into islands that
evolve on their own and occasionally swap individuals buy something
real, or does it only buy pretty theory?

## What's in the box

- A **turmite simulator** in Rust, with the genome and the evaluation
  separated from everything else.
- An **island-model genetic algorithm, asynchronous**: each island
  evolves at its own pace and talks to the others over TCP.
- **Full generation logging**: every generation is recorded, not just
  the final result.
- The **experiment suite** and the **paper** backing the numbers, all in
  the same repository.

## What the numbers say — and what they don't

I'm going to be honest with myself here: the current research on the
topic is quite limited. What exists are exact paired permutation tests,
all five seeds, and effect directions.

| Piece | Status |
| :--- | :--- |
| Exact paired permutation test | yes |
| All five seeds | yes |
| Effect direction | yes |
| Magnitude with intervals | not yet |
| Pre-registered confirmation | not yet |

For a first snapshot, that level of rigor is appropriate. For a
confirmatory claim of effectiveness, it doesn't reach. And I'd rather
say it that way before someone else says it for me.

<div class="note">
  <p><strong>Note.</strong> This is a snapshot, not a verdict. The
  numbers in the paper are what five seeds can support — no more, no
  less.</p>
</div>

## Core separated from experiments

The most important design decision I made before writing the first
line: the evolutionary core is deliberately separated from the
experiments. Studying something new does not require touching the
simulator or the genome.

With the current interface, without rewriting anything in the core, you
can implement for example:

- **Adaptive migration**: decide when and how much to migrate based on
  the state of the islands, instead of a fixed timer.
- **Topology**: ring vs cellular vs gossip — who listens to whom, and
  how much it matters.
- **Statistical rigor**: more seeds, intervals, corrections for
  multiple comparisons.
- **Multi-host execution**: spread islands across several machines,
  which is the point of having TCP as the transport already.

Et cetera. The list is not closed; that's the idea.

## Closing

Every generation is logged. If a number in the paper bothers you, you
can pull the raw data from the repository and audit it yourself. To me,
that's the difference between an experiment and a demonstration.

The code, the experiments and the paper live here:

<https://github.com/sudo-giusppe/langton-ga>
