import fs from "node:fs";
import path from "node:path";

/** A tiny .env reader. We only need plain KEY=VALUE lines. */
export function parseEnv(text) {
	const values = {};
	for (const raw of text.split(/\r?\n/)) {
		const line = raw.trim();
		if (!line || line.startsWith("#")) continue;
		const eq = line.indexOf("=");
		if (eq <= 0) continue;
		const key = line.slice(0, eq).trim();
		let value = line.slice(eq + 1).trim();
		const quote = value[0];
		if (
			(quote === '"' || quote === "'") &&
			value.length > 1 &&
			value.endsWith(quote)
		) {
			value = value.slice(1, -1);
		}
		if (/^[A-Z_][A-Z0-9_]*$/i.test(key)) values[key] = value;
	}
	return values;
}

export function readEnvFile(file) {
	try {
		return parseEnv(fs.readFileSync(file, "utf8"));
	} catch (error) {
		if (error.code === "ENOENT") return {};
		throw error;
	}
}

/** Load .env into process.env without overwriting real environment values. */
export function loadEnvFile(file) {
	const values = readEnvFile(file);
	for (const [key, value] of Object.entries(values)) {
		if (process.env[key] === undefined) process.env[key] = value;
	}
	return values;
}

/** Insert or replace one key while preserving the rest of the file. */
export function saveEnvValue(file, key, value) {
	let lines = [];
	try {
		lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
	} catch (error) {
		if (error.code !== "ENOENT") throw error;
	}

	const entry = `${key}=${value}`;
	const index = lines.findIndex((line) => {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith("#")) return false;
		const eq = trimmed.indexOf("=");
		return eq > 0 && trimmed.slice(0, eq).trim() === key;
	});

	if (index >= 0) lines[index] = entry;
	else {
		while (lines.length > 0 && lines[lines.length - 1] === "") lines.pop();
		if (lines.length > 0) lines.push("");
		lines.push(entry, "");
	}

	fs.mkdirSync(path.dirname(file), { recursive: true });
	fs.writeFileSync(file, lines.join("\n"), { mode: 0o600 });
	try {
		fs.chmodSync(file, 0o600);
	} catch {
		/* file systems without POSIX permissions */
	}
}
