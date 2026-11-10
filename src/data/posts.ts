import { getCollection, type CollectionEntry } from "astro:content";
import type { FieldVariant } from "./fields";

export interface Post {
	title: string;
	description: string;
	/** ISO date, displayed as-is. */
	date: string;
	category: string;
	minutes: number;
	href: string;
	lang: "es" | "en";
	/** Background variant for the article page. */
	field: FieldVariant;
}

export interface Category {
	value: string;
	label: string;
}

export function toPost(entry: CollectionEntry<"posts">): Post {
	return {
		title: entry.data.title,
		description: entry.data.description,
		date: entry.data.date,
		category: entry.data.category,
		minutes: entry.data.minutes,
		href: `/blog/${entry.slug}`,
		lang: entry.data.lang,
		field: entry.data.field,
	};
}

/** Published posts, newest first. Drafts are left out unless requested. */
export async function getPosts(includeDrafts = false): Promise<Post[]> {
	const entries = await getCollection(
		"posts",
		({ data }) => includeDrafts || !data.draft,
	);
	return entries
		.map(toPost)
		.sort(
			(a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title),
		);
}

/** Tabs for the archive, in order of first appearance. */
export function categoriesFor(posts: Post[]): Category[] {
	const seen = new Set<string>();
	const values: Category[] = [{ value: "all", label: "todo" }];
	for (const post of posts) {
		if (seen.has(post.category)) continue;
		seen.add(post.category);
		values.push({ value: post.category, label: post.category });
	}
	return values;
}

export function countFor(posts: Post[], value: string): number {
	if (value === "all") return posts.length;
	return posts.filter((post) => post.category === value).length;
}

/** The post before and after in publication order. */
export function adjacent(
	posts: Post[],
	href: string,
): {
	previous?: Post;
	next?: Post;
} {
	const index = posts.findIndex((post) => post.href === href);
	return {
		next: index > 0 ? posts[index - 1] : undefined,
		previous: index >= 0 ? posts[index + 1] : undefined,
	};
}
