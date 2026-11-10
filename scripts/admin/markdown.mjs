import { marked } from "marked";
import { AdminError } from "./errors.mjs";

marked.use({ gfm: true, breaks: false });

export async function renderMarkdown(markdown) {
	const source = String(markdown ?? "");
	if (!source.trim()) return "";
	return await marked.parse(source, { gfm: true, breaks: false });
}

/** The preview runs inside a sandboxed iframe, so it can use the real blog CSS. */
export function previewDocument(html, theme) {
	const mode = theme === "dark" ? "dark" : "light";
	const body = html.trim()
		? `<article class="prose">${html}</article>`
		: `<p class="preview-empty">La vista previa aparecerá aquí.</p>`;

	return `<!doctype html>
<html lang="es" data-theme="${mode}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="stylesheet" href="/admin/assets/global.css">
<link rel="stylesheet" href="/admin/assets/preview.css">
</head>
<body class="preview-body">
<main class="preview-wrap">${body}</main>
</body>
</html>`;
}

export function assertPreviewSize(markdown) {
	if (String(markdown ?? "").length > 2 * 1024 * 1024) {
		throw new AdminError(413, "El contenido es demasiado grande para previsualizar.");
	}
}
