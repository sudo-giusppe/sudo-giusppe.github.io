import path from "node:path";
import { fileURLToPath } from "node:url";
import { generatePassword, hashPassword, isValidHash } from "./auth.mjs";
import { loadEnvFile, readEnvFile, saveEnvValue } from "./env.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../..");
const ENV_FILE = process.env.ADMIN_ENV_FILE
	? path.resolve(process.env.ADMIN_ENV_FILE)
	: path.join(ROOT, ".env");

loadEnvFile(ENV_FILE);
const reset = process.argv.includes("--reset");
const existing = readEnvFile(ENV_FILE).ADMIN_PASSWORD_HASH;

if (existing && !reset) {
	if (!isValidHash(existing)) {
		console.warn("");
		console.warn("  El hash existente no parece válido.");
		console.warn("  Genera una clave nueva con:");
		console.warn("      npm run admin:password -- --reset");
		console.warn("");
		process.exit(1);
	}
	console.log("");
	console.log("  Ya hay una clave configurada en:");
	console.log(`  ${ENV_FILE}`);
	console.log("");
	console.log("  Para generar una nueva:");
	console.log("      npm run admin:password -- --reset");
	console.log("");
	process.exit(0);
}

const password = generatePassword();
const hash = await hashPassword(password);
saveEnvValue(ENV_FILE, "ADMIN_PASSWORD_HASH", hash);

console.log("");
console.log("  ┌──────────────────────────────────────────────┐");
console.log("  │ CLAVE GENERADA — se muestra una sola vez     │");
console.log("  └──────────────────────────────────────────────┘");
console.log("");
console.log(`      ${password}`);
console.log("");
console.log("  Guardada como hash scrypt N=131072 en:");
console.log(`      ${ENV_FILE}`);
console.log("");
console.log("  Reinicia el admin si estaba corriendo:");
console.log("      npm run admin");
console.log("");
