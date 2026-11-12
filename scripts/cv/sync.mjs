#!/usr/bin/env node
// Sincroniza src/data/cv.json con el gist que hace de "base de datos" del CV.
//   npm run cv:pull   gist -> archivo local (la build siempre lee el local)
//   npm run cv:push   archivo local -> gist
// Requiere el CLI de GitHub autenticado (`gh auth login`).

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const configPath = join(root, "cv.config.json");
const localPath = join(root, "src", "data", "cv.json");

const command = process.argv[2];
if (command !== "pull" && command !== "push") {
	console.error("Uso: node scripts/cv/sync.mjs <pull|push>");
	process.exit(1);
}

const config = JSON.parse(readFileSync(configPath, "utf8"));
const { gistId, file } = config;
if (!gistId || !file) {
	console.error(`Falta "gistId" o "file" en ${configPath}`);
	process.exit(1);
}

const gh = (args) =>
	execFileSync("gh", args, { encoding: "utf8", cwd: root }).trim();

/** Valida lo mínimo para no romper la build con un gist a medio editar. */
function validate(data, origin) {
	const required = [
		"name",
		"summary",
		"location",
		"links",
		"experience",
		"projects",
		"education",
		"certifications",
		"skills",
	];
	const missing = required.filter((key) => !(key in data));
	if (missing.length > 0) {
		throw new Error(`${origin}: faltan campos ${missing.join(", ")}`);
	}
	if (!Array.isArray(data.links) || !Array.isArray(data.skills)) {
		throw new Error(`${origin}: "links" y "skills" deben ser listas`);
	}
	return data;
}

async function pull() {
	let rawUrl;
	try {
		rawUrl = gh([
			"api",
			`gists/${gistId}`,
			"--jq",
			`.files["${file}"].raw_url`,
		]);
	} catch (error) {
		console.error("No se pudo leer el gist. ¿Está autenticado `gh`?");
		console.error(error.message);
		process.exit(1);
	}

	if (!rawUrl) {
		console.error(`El gist ${gistId} no tiene un archivo "${file}".`);
		process.exit(1);
	}

	const response = await fetch(rawUrl);
	if (!response.ok) {
		console.error(`Descarga fallida: HTTP ${response.status}`);
		process.exit(1);
	}

	const data = validate(await response.json(), `gist ${gistId}`);
	writeFileSync(localPath, `${JSON.stringify(data, null, "\t")}\n`);
	console.log(`cv.json actualizado desde https://gist.github.com/${gistId}`);
}

function push() {
	const data = validate(JSON.parse(readFileSync(localPath, "utf8")), "cv.json");
	writeFileSync(localPath, `${JSON.stringify(data, null, "\t")}\n`);
	try {
		gh(["gist", "edit", gistId, "--filename", file, localPath]);
	} catch (error) {
		console.error("No se pudo actualizar el gist.");
		console.error(error.message);
		process.exit(1);
	}
	console.log(`Gist actualizado: https://gist.github.com/${gistId}`);
}

if (command === "pull") {
	await pull();
} else {
	push();
}
