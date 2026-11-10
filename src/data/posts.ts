import { getCollection, type CollectionEntry } from "astro:content";
import type { FieldVariant } from "./fields";
import { t, type Locale } from "../i18n/ui";

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

export type PostEntry =
	| CollectionEntry<"posts">
	| CollectionEntry<"posts-en">;

export function toPost(entry: PostEntry): Post {
	return {
		title: entry.data.title,
		description: entry.data.description,
		date: entry.data.date,
		category: entry.data.category,
		minutes: entry.data.minutes,
		href:
			entry.data.lang === "en"
				? `/en/blog/${entry.slug}`
				: `/blog/${entry.slug}`,
		lang: entry.data.lang,
		field: entry.data.field,
	};
}

/** Published posts of one locale, newest first. Drafts stay out unless asked. */
export async function getPosts(
	locale: Locale = "es",
	includeDrafts = false,
): Promise<Post[]> {
	const entries =
		locale === "en"
			? await getCollection("posts-en", ({ data }) => includeDrafts || !data.draft)
			: await getCollection("posts", ({ data }) => includeDrafts || !data.draft);
	return entries
		.map(toPost)
		.sort(
			(a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title),
		);
}

/** Slugs that exist for a locale, to detect available translations. */
export async function slugsFor(locale: Locale = "es"): Promise<Set<string>> {
	const entries =
		locale === "en" ? await getCollection("posts-en") : await getCollection("posts");
	return new Set(entries.map((entry) => entry.slug));
}

/** Tabs for the archive, in order of first appearance. */
export function categoriesFor(
	posts: Post[],
	locale: Locale = "es",
): Category[] {
	const seen = new Set<string>();
	const values: Category[] = [
		{ value: "all", label: t(locale, "categories.all") },
	];
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
