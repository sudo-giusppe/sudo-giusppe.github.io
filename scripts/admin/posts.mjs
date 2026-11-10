import fs from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import { AdminError } from "./errors.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(HERE, "../..");
export const POSTS_DIR = path.join(ROOT, "src/content/posts");
export const PUBLIC_DIR = path.join(ROOT, "public");
export const IMAGES_DIR = path.join(PUBLIC_DIR, "images");
export const TRASH_DIR = path.join(ROOT, ".admin/trash");

const FIELD_CONFIG = JSON.parse(
	await fs.readFile(path.join(ROOT, "src/data/fields.json"), "utf8"),
);
export const FIELD_VALUES = Object.keys(FIELD_CONFIG);
export const fieldOptions = Object.entries(FIELD_CONFIG).map(
	([value, config]) => ({ value, label: config.label }),
);

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_MARKDOWN = 2 * 1024 * 1024;

export function slugify(value) {
	return String(value ?? "")
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 96)
		.replace(/-+$/g, "");
}

function assertSlug(slug) {
	if (
		typeof slug !== "string" ||
		slug.length > 96 ||
		!SLUG_PATTERN.test(slug)
	) {
		throw new AdminError(400, "El identificador del post no es válido.");
	}
	return slug;
}

function postFile(slug) {
	assertSlug(slug);
	return path.join(POSTS_DIR, `${slug}.md`);
}

function normalizeMeta(data) {
	return {
		title: typeof data.title === "string" ? data.title : "",
		description:
			typeof data.description === "string" ? data.description : "",
		date: typeof data.date === "string" ? data.date : "",
		category: typeof data.category === "string" ? data.category : "",
		minutes: Number.isFinite(Number(data.minutes)) ? Number(data.minutes) : 0,
		lang: data.lang === "en" ? "en" : "es",
		field: FIELD_VALUES.includes(data.field) ? data.field : "classic",
		draft: data.draft === true,
	};
}

function isDate(value) {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
	const parsed = new Date(`${value}T00:00:00Z`);
	return (
		!Number.isNaN(parsed.getTime()) &&
		parsed.toISOString().slice(0, 10) === value
	);
}

export function validatePost(input) {
	const raw = input && typeof input === "object" ? input : {};
	const errors = {};

	const title = String(raw.title ?? "").trim();
	if (!title) errors.title = "El título es obligatorio.";
	else if (title.length > 180) errors.title = "Máximo 180 caracteres.";

	const slugSource = String(raw.slug ?? "").trim();
	const slug = slugSource || slugify(title);
	if (!SLUG_PATTERN.test(slug) || slug.length > 96) {
		errors.slug = "Usa minúsculas, números y guiones (ej. mi-nota).";
	}

	const description = String(raw.description ?? "").trim();
	if (!description) errors.description = "El resumen es obligatorio.";
	else if (description.length > 600) {
		errors.description = "Máximo 600 caracteres.";
	}

	const date = String(raw.date ?? "").trim();
	if (!isDate(date)) errors.date = "Usa una fecha válida (AAAA-MM-DD).";

	const category = String(raw.category ?? "")
		.trim()
		.replace(/\s+/g, " ");
	if (!category) errors.category = "La categoría es obligatoria.";
	else if (category.length > 40) errors.category = "Máximo 40 caracteres.";

	const minutes = Number(raw.minutes);
	if (!Number.isInteger(minutes) || minutes < 1 || minutes > 600) {
		errors.minutes = "Minutos de lectura: entero entre 1 y 600.";
	}

	const lang = raw.lang === "en" ? "en" : raw.lang === "es" ? "es" : "";
	if (!lang) errors.lang = "Elige un idioma.";

	const field = FIELD_VALUES.includes(raw.field) ? raw.field : "";
	if (!field) errors.field = "Elige una variante de fondo.";

	const draft = raw.draft === true || raw.draft === "true";
	const markdown = String(raw.markdown ?? "")
		.replace(/\r\n?/g, "\n")
		.trimEnd();
	if (markdown.length > MAX_MARKDOWN) {
		errors.markdown = "El contenido supera el límite de 2 MB.";
	} else if (!markdown && !draft) {
		errors.markdown = "Una nota publicada necesita contenido.";
	}

	const post = {
		slug,
		title,
		description,
		date,
		category,
		minutes,
		lang,
		field,
		draft,
		markdown,
	};

	return { ok: Object.keys(errors).length === 0, errors, post };
}

function serialize(post) {
	const frontmatter = [
		"---",
		`title: ${JSON.stringify(post.title)}`,
		`description: ${JSON.stringify(post.description)}`,
		`date: ${JSON.stringify(post.date)}`,
		`category: ${JSON.stringify(post.category)}`,
		`minutes: ${post.minutes}`,
		`lang: ${JSON.stringify(post.lang)}`,
		`field: ${JSON.stringify(post.field)}`,
		`draft: ${post.draft}`,
		"---",
		"",
	].join("\n");
	return `${frontmatter}\n${post.markdown}\n`;
}

async function writeAtomic(file, contents) {
	await fs.mkdir(path.dirname(file), { recursive: true });
	const temporary = `${file}.${process.pid}.${randomBytes(5).toString("hex")}.tmp`;
	const handle = await fs.open(temporary, "w", 0o644);
	try {
		await handle.writeFile(contents, "utf8");
		await handle.sync();
	} finally {
		await handle.close();
	}
	try {
		await fs.rename(temporary, file);
	} catch (error) {
		await fs.rm(temporary, { force: true });
		throw error;
	}
}

async function exists(file) {
	try {
		await fs.access(file);
		return true;
	} catch {
		return false;
	}
}

export async function listPosts() {
	await fs.mkdir(POSTS_DIR, { recursive: true });
	const entries = await fs.readdir(POSTS_DIR, { withFileTypes: true });
	const posts = [];

	for (const entry of entries) {
		if (!entry.isFile() || !entry.name.endsWith(".md")) continue;
		const slug = entry.name.slice(0, -3);
		if (!SLUG_PATTERN.test(slug)) continue;
		const file = path.join(POSTS_DIR, entry.name);
		try {
			const [raw, stat] = await Promise.all([
				fs.readFile(file, "utf8"),
				fs.stat(file),
			]);
			const parsed = matter(raw);
			posts.push({
				slug,
				...normalizeMeta(parsed.data),
				updatedAt: stat.mtime.toISOString(),
			});
		} catch (error) {
			console.error(`[admin] no se pudo leer ${entry.name}:`, error.message);
		}
	}

	return posts.sort(
		(a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title),
	);
}

export async function readPost(slug) {
	const file = postFile(slug);
	let raw;
	try {
		raw = await fs.readFile(file, "utf8");
	} catch (error) {
		if (error.code === "ENOENT") {
			throw new AdminError(404, "Esa nota no existe.");
		}
		throw error;
	}
	const parsed = matter(raw);
	return {
		slug,
		...normalizeMeta(parsed.data),
		markdown: parsed.content.replace(/^\n/, ""),
	};
}

export async function createPost(input) {
	const { ok, errors, post } = validatePost(input);
	if (!ok) {
		throw new AdminError(422, "Revisa los campos marcados.", { fields: errors });
	}
	const file = postFile(post.slug);
	if (await exists(file)) {
		throw new AdminError(409, "Ya existe una nota con ese identificador.", {
			fields: { slug: "Este identificador ya está en uso." },
		});
	}
	await writeAtomic(file, serialize(post));
	return readPost(post.slug);
}

export async function updatePost(originalSlug, input) {
	const source = postFile(originalSlug);
	if (!(await exists(source))) {
		throw new AdminError(404, "Esa nota no existe.");
	}

	const { ok, errors, post } = validatePost(input);
	if (!ok) {
		throw new AdminError(422, "Revisa los campos marcados.", { fields: errors });
	}

	const target = postFile(post.slug);
	if (target !== source && (await exists(target))) {
		throw new AdminError(409, "Ya existe una nota con ese identificador.", {
			fields: { slug: "Este identificador ya está en uso." },
		});
	}

	await writeAtomic(target, serialize(post));
	if (target !== source) await fs.rm(source, { force: true });
	return readPost(post.slug);
}

export async function deletePost(slug) {
	const file = postFile(slug);
	if (!(await exists(file))) {
		throw new AdminError(404, "Esa nota no existe.");
	}
	await fs.mkdir(TRASH_DIR, { recursive: true });
	const stamp = new Date().toISOString().replace(/[:.]/g, "-");
	const destination = path.join(TRASH_DIR, `${slug}--${stamp}.md`);
	try {
		await fs.rename(file, destination);
	} catch (error) {
		if (error.code !== "EXDEV") throw error;
		await fs.copyFile(file, destination);
		await fs.rm(file, { force: true });
	}
	return { slug, trashed: path.relative(ROOT, destination) };
}

export async function listCategories() {
	const posts = await listPosts();
	return [...new Set(posts.map((post) => post.category))];
}
