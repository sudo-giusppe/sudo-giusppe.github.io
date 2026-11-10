import { defineCollection, z } from "astro:content";
import { fieldConfigs, type FieldVariant } from "../data/fields";

const fieldValues = Object.keys(fieldConfigs) as [
	FieldVariant,
	...FieldVariant[],
];

const postSchema = z.object({
	title: z.string().min(1),
	description: z.string().min(1),
	/** ISO date (YYYY-MM-DD), displayed as-is. */
	date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
	category: z.string().min(1),
	minutes: z.number().int().positive(),
	lang: z.enum(["es", "en"]),
	field: z.enum(fieldValues),
	draft: z.boolean().default(false),
});

const posts = defineCollection({ schema: postSchema });
const postsEn = defineCollection({ schema: postSchema });

export const collections = { posts, "posts-en": postsEn };
