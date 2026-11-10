import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { randomBytes, timingSafeEqual } from "node:crypto";
import { fileURLToPath } from "node:url";

import { loadEnvFile } from "./env.mjs";
import {
	ensureCredentials,
	LoginLimiter,
	SessionStore,
	verifyPassword,
} from "./auth.mjs";
import { AdminError } from "./errors.mjs";
import {
	createPost,
	deletePost,
	fieldOptions,
	IMAGES_DIR,
	listCategories,
	listPosts,
	PUBLIC_DIR,
	readPost,
	ROOT,
	updatePost,
} from "./posts.mjs";
import {
	assertPreviewSize,
	previewDocument,
	renderMarkdown,
} from "./markdown.mjs";
import { detectImage } from "./images.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ENV_FILE = process.env.ADMIN_ENV_FILE
	? path.resolve(process.env.ADMIN_ENV_FILE)
	: path.join(ROOT, ".env");
loadEnvFile(ENV_FILE);

const HOST = process.env.ADMIN_HOST || "127.0.0.1";
const PORT = Number(process.env.ADMIN_PORT || 4321);
const SITE_URL = process.env.ADMIN_SITE_URL || "http://localhost:3000";
const LOOPBACK = new Set(["127.0.0.1", "localhost", "::1", "::ffff:127.0.0.1"]);
const ALLOW_REMOTE = process.env.ADMIN_ALLOW_REMOTE === "1";
const TRUST_PROXY = process.env.ADMIN_TRUST_PROXY === "1";
const COOKIE_NAME = "admin_session";
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
	console.error("ADMIN_PORT debe ser un puerto válido (1-65535).");
	process.exit(1);
}
if (!LOOPBACK.has(HOST) && !ALLOW_REMOTE) {
	console.error(
		`[admin] ADMIN_HOST=${HOST} expone el editor fuera de esta máquina.\n` +
			"Por seguridad solo se permite loopback. Si de verdad lo necesitas,\n" +
			"pon ADMIN_ALLOW_REMOTE=1 y sirve el admin detrás de HTTPS.",
	);
	process.exit(1);
}

const publicUrl = process.env.ADMIN_PUBLIC_URL
	? new URL(process.env.ADMIN_PUBLIC_URL)
	: null;
const cookieSecure = publicUrl?.protocol === "https:";

const allowedHosts = new Set([
	`127.0.0.1:${PORT}`,
	`localhost:${PORT}`,
	`[::1]:${PORT}`,
]);
const allowedOrigins = new Set([
	`http://127.0.0.1:${PORT}`,
	`http://localhost:${PORT}`,
	`http://[::1]:${PORT}`,
]);
for (const extra of (process.env.ADMIN_ALLOWED_HOSTS || "").split(",")) {
	const host = extra.trim().toLowerCase();
	if (!host) continue;
	allowedHosts.add(host);
	allowedOrigins.add(`http://${host}`);
	allowedOrigins.add(`https://${host}`);
}
if (publicUrl) {
	allowedHosts.add(publicUrl.host.toLowerCase());
	allowedOrigins.add(publicUrl.origin);
}

if (!cookieSecure && publicUrl) {
	console.warn(
		"[admin] ADMIN_PUBLIC_URL no usa https; la cookie de sesión no llevará Secure.",
	);
}

const sessions = new SessionStore({ ttlMs: SESSION_TTL_MS });
const limiter = new LoginLimiter();
let credentials;
try {
	credentials = await ensureCredentials(ENV_FILE);
} catch (error) {
	console.error(`[admin] ${error.message}`);
	process.exit(1);
}

const HTML_CSP = [
	"default-src 'none'",
	"script-src 'self'",
	"style-src 'self' 'unsafe-inline'",
	"img-src 'self' data: blob:",
	"font-src 'self'",
	"connect-src 'self'",
	"frame-src 'self' data: blob:",
	"base-uri 'none'",
	"form-action 'self'",
	"frame-ancestors 'none'",
].join("; ");

const MIME = {
	".html": "text/html; charset=utf-8",
	".css": "text/css; charset=utf-8",
	".js": "text/javascript; charset=utf-8",
	".mjs": "text/javascript; charset=utf-8",
	".json": "application/json; charset=utf-8",
	".svg": "image/svg+xml",
	".png": "image/png",
	".jpg": "image/jpeg",
	".jpeg": "image/jpeg",
	".gif": "image/gif",
	".webp": "image/webp",
	".avif": "image/avif",
	".woff2": "font/woff2",
	".woff": "font/woff",
	".ico": "image/x-icon",
};

function securityHeaders(res, { html = false } = {}) {
	res.setHeader("X-Content-Type-Options", "nosniff");
	res.setHeader("Referrer-Policy", "no-referrer");
	res.setHeader("X-Frame-Options", "DENY");
	res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
	res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
	if (html) {
		res.setHeader("Content-Security-Policy", HTML_CSP);
		res.setHeader("X-Robots-Tag", "noindex, nofollow");
		res.setHeader("Cache-Control", "no-store");
	}
}

function send(res, status, body, headers = {}) {
	if (res.writableEnded) return;
	const buffer = Buffer.isBuffer(body) ? body : Buffer.from(String(body));
	res.writeHead(status, {
		"Content-Length": buffer.length,
		...headers,
	});
	res.end(buffer);
}

function sendJson(res, status, data, headers = {}) {
	send(res, status, JSON.stringify(data), {
		"Content-Type": "application/json; charset=utf-8",
		"Cache-Control": "no-store",
		...headers,
	});
}

function sendText(res, status, text, headers = {}) {
	send(res, status, text, {
		"Content-Type": "text/plain; charset=utf-8",
		"Cache-Control": "no-store",
		...headers,
	});
}

function parseCookies(header = "") {
	const cookies = {};
	for (const part of header.split(";")) {
		const index = part.indexOf("=");
		if (index < 0) continue;
		const key = part.slice(0, index).trim();
		const value = part.slice(index + 1).trim();
		if (key) cookies[key] = decodeURIComponent(value);
	}
	return cookies;
}

function sessionToken(req) {
	return parseCookies(req.headers.cookie || "")[COOKIE_NAME] || null;
}

function sessionCookie(token, maxAgeSeconds) {
	const parts = [
		`${COOKIE_NAME}=${encodeURIComponent(token)}`,
		"Path=/admin",
		"HttpOnly",
		"SameSite=Strict",
		`Max-Age=${maxAgeSeconds}`,
	];
	if (cookieSecure) parts.push("Secure");
	return parts.join("; ");
}

function getSession(req) {
	return sessions.get(sessionToken(req));
}

function requireSession(req) {
	const session = getSession(req);
	if (!session) throw new AdminError(401, "Sesión expirada. Vuelve a entrar.");
	return session;
}

function requireCsrf(req, session) {
	const token = req.headers["x-admin-csrf"];
	if (typeof token !== "string" || token.length !== session.csrf.length) {
		throw new AdminError(403, "Petición no autorizada.");
	}
	const given = Buffer.from(token);
	const expected = Buffer.from(session.csrf);
	if (
		given.length !== expected.length ||
		!timingSafeEqual(given, expected)
	) {
		throw new AdminError(403, "Petición no autorizada.");
	}
}

function requestAllowed(req) {
	const origin = req.headers.origin;
	if (origin && !allowedOrigins.has(origin)) return false;
	const fetchSite = req.headers["sec-fetch-site"];
	if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "none") {
		return false;
	}
	return true;
}

function hostAllowed(req) {
	const host = String(req.headers.host || "").toLowerCase();
	if (!host) return false;
	if (allowedHosts.has(host)) return true;
	if ((PORT === 80 || PORT === 443) && allowedHosts.has(host.replace(/:\d+$/, ""))) {
		return true;
	}
	return false;
}

function clientKey(req) {
	if (TRUST_PROXY) {
		const forwarded = String(req.headers["x-forwarded-for"] || "")
			.split(",")[0]
			.trim();
		if (forwarded) return forwarded;
	}
	return req.socket.remoteAddress || "local";
}

async function readBody(req, limit) {
	const chunks = [];
	let size = 0;
	for await (const chunk of req) {
		size += chunk.length;
		if (size > limit) {
			throw new AdminError(413, "La petición es demasiado grande.");
		}
		chunks.push(chunk);
	}
	return Buffer.concat(chunks);
}

async function readJson(req, limit = 8 * 1024 * 1024) {
	const buffer = await readBody(req, limit);
	if (buffer.length === 0) return {};
	try {
		return JSON.parse(buffer.toString("utf8"));
	} catch {
		throw new AdminError(400, "El cuerpo de la petición no es JSON válido.");
	}
}

function safeStaticFile(base, relative) {
	let decoded;
	try {
		decoded = decodeURIComponent(relative);
	} catch {
		return null;
	}
	if (!decoded || decoded.includes("\0")) return null;
	if (decoded.split(/[\\/]/).some((segment) => segment.startsWith("."))) {
		return null;
	}
	const target = path.resolve(base, decoded);
	if (target !== base && !target.startsWith(base + path.sep)) return null;
	return target;
}

async function serveStatic(res, pathname, method) {
	let file = null;
	let cache = "no-store";
	let html = false;

	if (pathname === "/admin" || pathname === "/admin/") {
		file = path.join(HERE, "public/index.html");
		html = true;
	} else if (pathname === "/admin/assets/global.css") {
		file = path.join(ROOT, "src/styles/global.css");
	} else if (pathname.startsWith("/admin/assets/")) {
		file = safeStaticFile(
			path.join(HERE, "public"),
			pathname.slice("/admin/assets/".length),
		);
	} else if (pathname === "/favicon.svg") {
		file = path.join(PUBLIC_DIR, "favicon.svg");
		cache = "public, max-age=3600";
	} else if (pathname.startsWith("/fonts/")) {
		file = safeStaticFile(path.join(PUBLIC_DIR, "fonts"), pathname.slice(7));
		cache = "public, max-age=86400";
	} else if (pathname.startsWith("/images/")) {
		file = safeStaticFile(path.join(PUBLIC_DIR, "images"), pathname.slice(8));
		cache = "public, max-age=3600";
	}

	if (!file) {
		sendText(res, 404, "No encontrado.");
		return;
	}

	let data;
	try {
		data = await fs.readFile(file);
	} catch (error) {
		if (error.code === "ENOENT" || error.code === "EISDIR") {
			sendText(res, 404, "No encontrado.");
			return;
		}
		throw error;
	}

	const type = MIME[path.extname(file).toLowerCase()] || "application/octet-stream";
	securityHeaders(res, { html });
	if (method === "HEAD") {
		send(res, 200, "", {
			"Content-Type": type,
			"Cache-Control": cache,
			"Content-Length": data.length,
		});
		return;
	}
	send(res, 200, data, {
		"Content-Type": type,
		"Cache-Control": cache,
	});
}

async function handleApi(req, res, pathname) {
	if (pathname === "/admin/api/session" && req.method === "GET") {
		const session = getSession(req);
		sendJson(res, 200, {
			authenticated: Boolean(session),
			csrf: session?.csrf ?? null,
			expiresAt: session?.expiresAt ?? null,
			siteUrl: SITE_URL,
		});
		return;
	}

	if (pathname === "/admin/api/login" && req.method === "POST") {
		if (!requestAllowed(req)) throw new AdminError(403, "Origen no permitido.");
		const key = clientKey(req);
		const limit = limiter.check(key);
		if (limit.locked) {
			sendJson(
				res,
				429,
				{ error: "Demasiados intentos. Espera antes de reintentar." },
				{ "Retry-After": String(limit.retryAfter) },
			);
			return;
		}

		const body = await readJson(req, 8 * 1024);
		const password = typeof body.password === "string" ? body.password : "";
		if (!password || password.length > 1024) {
			limiter.fail(key);
			throw new AdminError(401, "Clave incorrecta.");
		}

		const valid = await verifyPassword(password, credentials.hash);
		if (!valid) {
			limiter.fail(key);
			await new Promise((resolve) => setTimeout(resolve, 350));
			throw new AdminError(401, "Clave incorrecta.");
		}

		limiter.succeed(key);
		const session = sessions.create();
		sendJson(
			res,
			200,
			{
				csrf: session.csrf,
				expiresAt: session.expiresAt,
				siteUrl: SITE_URL,
			},
			{ "Set-Cookie": sessionCookie(session.token, SESSION_TTL_MS / 1000) },
		);
		return;
	}

	if (pathname === "/admin/api/logout" && req.method === "POST") {
		if (!requestAllowed(req)) throw new AdminError(403, "Origen no permitido.");
		const session = requireSession(req);
		requireCsrf(req, session);
		sessions.destroy(sessionToken(req));
		sendJson(
			res,
			200,
			{ ok: true },
			{ "Set-Cookie": sessionCookie("", 0) },
		);
		return;
	}

	const isApi = pathname.startsWith("/admin/api/");
	if (!isApi) {
		sendJson(res, 404, { error: "Ruta no encontrada." });
		return;
	}

	const session = requireSession(req);
	const mutating = req.method !== "GET" && req.method !== "HEAD";
	if (mutating) {
		if (!requestAllowed(req)) throw new AdminError(403, "Origen no permitido.");
		requireCsrf(req, session);
	}

	if (pathname === "/admin/api/posts" && req.method === "GET") {
		sendJson(res, 200, {
			posts: await listPosts(),
			categories: await listCategories(),
			fields: fieldOptions,
			siteUrl: SITE_URL,
		});
		return;
	}

	if (pathname === "/admin/api/posts" && req.method === "POST") {
		const post = await createPost(await readJson(req));
		sendJson(res, 201, { post });
		return;
	}

	const match = pathname.match(/^\/admin\/api\/posts\/([^/]+)$/);
	if (match) {
		let slug;
		try {
			slug = decodeURIComponent(match[1]);
		} catch {
			throw new AdminError(400, "Identificador no válido.");
		}

		if (req.method === "GET") {
			sendJson(res, 200, { post: await readPost(slug) });
			return;
		}
		if (req.method === "PUT") {
			const post = await updatePost(slug, await readJson(req));
			sendJson(res, 200, { post });
			return;
		}
		if (req.method === "DELETE") {
			sendJson(res, 200, { deleted: await deletePost(slug) });
			return;
		}
	}

	if (pathname === "/admin/api/preview" && req.method === "POST") {
		const body = await readJson(req);
		const markdown = String(body.markdown ?? "");
		assertPreviewSize(markdown);
		const html = await renderMarkdown(markdown);
		sendJson(res, 200, {
			document: previewDocument(html, body.theme),
		});
		return;
	}

	if (pathname === "/admin/api/upload" && req.method === "POST") {
		const body = await readJson(req, 13 * 1024 * 1024);
		const raw = String(body.data ?? "").replace(/^data:[^;]+;base64,/, "");
		if (!raw || raw.length > 12 * 1024 * 1024) {
			throw new AdminError(413, "La imagen es demasiado grande (máximo 8 MB).");
		}
		const buffer = Buffer.from(raw, "base64");
		if (buffer.length === 0 || buffer.length > 8 * 1024 * 1024) {
			throw new AdminError(413, "La imagen es demasiado grande (máximo 8 MB).");
		}
		const detected = detectImage(buffer);
		if (!detected) {
			throw new AdminError(
				415,
				"Formato no admitido. Usa PNG, JPEG, GIF, WebP o AVIF.",
			);
		}
		const baseName =
			String(body.name ?? "")
				.replace(/\.[^.]+$/, "")
				.normalize("NFD")
				.replace(/[\u0300-\u036f]/g, "")
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, "-")
				.replace(/^-+|-+$/g, "")
				.slice(0, 64) || "imagen";
		const filename = `${baseName}-${randomBytes(4).toString("hex")}.${detected.ext}`;
		await fs.mkdir(IMAGES_DIR, { recursive: true });
		await fs.writeFile(path.join(IMAGES_DIR, filename), buffer, {
			flag: "wx",
			mode: 0o644,
		});
		sendJson(res, 201, {
			path: `/images/${filename}`,
			name: filename,
			width: detected.width ?? null,
			height: detected.height ?? null,
		});
		return;
	}

	sendJson(res, 404, { error: "Ruta no encontrada." });
}

const server = http.createServer(async (req, res) => {
	try {
		if (!hostAllowed(req)) {
			sendText(res, 421, "Host no permitido.");
			return;
		}

		const url = new URL(req.url || "/", `http://${req.headers.host}`);
		const pathname = url.pathname;

		if (pathname.startsWith("/admin/api/")) {
			await handleApi(req, res, pathname);
			return;
		}

		if (req.method === "GET" || req.method === "HEAD") {
			await serveStatic(res, pathname, req.method);
			return;
		}

		sendText(res, 405, "Método no permitido.");
	} catch (error) {
		if (res.headersSent) {
			res.end();
			return;
		}
		if (error instanceof AdminError) {
			sendJson(res, error.status, {
				error: error.message,
				...(error.details || {}),
			});
			return;
		}
		console.error("[admin] error inesperado:", error);
		sendJson(res, 500, { error: "Error interno del servidor." });
	}
});

server.listen(PORT, HOST, () => {
	const label = HOST === "0.0.0.0" ? "127.0.0.1" : HOST;
	console.log("");
	console.log(`  admin     http://${label}:${PORT}/admin`);
	console.log(`  sitio     ${SITE_URL}`);
	console.log(`  env       ${ENV_FILE}`);
	console.log(`  scrypt    N=131072 r=8 p=1`);
	if (credentials.created && credentials.password) {
		console.log("");
		console.log("  ┌──────────────────────────────────────────────────────┐");
		console.log("  │ CLAVE GENERADA — se muestra una sola vez             │");
		console.log("  └──────────────────────────────────────────────────────┘");
		console.log("");
		console.log(`      ${credentials.password}`);
		console.log("");
		console.log("  Guárdala en tu gestor de contraseñas. En .env solo");
		console.log("  queda el hash. Si la pierdes:");
		console.log("      npm run admin:password -- --reset");
		console.log("");
	}
	if (!LOOPBACK.has(HOST)) {
		console.log("");
		console.log("  AVISO: el admin está escuchando fuera de loopback.");
		console.log("  Úsalo solo detrás de HTTPS y con ADMIN_ALLOWED_HOSTS.");
	}
});

server.on("error", (error) => {
	console.error("[admin] no se pudo iniciar el servidor:", error.message);
	process.exit(1);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
	process.on(signal, () => {
		server.close(() => process.exit(0));
		setTimeout(() => process.exit(0), 1000).unref();
	});
}
