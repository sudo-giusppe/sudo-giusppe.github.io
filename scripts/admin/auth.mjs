import {
	randomBytes,
	scrypt as scryptCallback,
	timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import { readEnvFile, saveEnvValue } from "./env.mjs";

const scrypt = promisify(scryptCallback);

/*
 * scrypt with N=2^17, r=8, p=1. Each guess costs ~128 MiB and a few hundred
 * milliseconds, which is the point: the stored hash is useless to an attacker
 * without a very large budget. The generated key has 160 bits of entropy, so
 * guessing is not a realistic path anyway.
 */
const PARAMS = { N: 131072, r: 8, p: 1, keylen: 64, maxmem: 256 * 1024 * 1024 };
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I ambiguity
const PREFIX = "scrypt";

export function generatePassword() {
	const chars = [];
	for (let i = 0; i < 32; i += 1) {
		// 256 is a multiple of 32, so there is no modulo bias here.
		chars.push(ALPHABET[randomBytes(1)[0] % ALPHABET.length]);
	}
	return chars.join("").replace(/(.{4})(?=.)/g, "$1-");
}

export async function hashPassword(password) {
	const salt = randomBytes(16);
	const hash = await scrypt(
		password.normalize("NFKC"),
		salt,
		PARAMS.keylen,
		PARAMS,
	);
	return [
		PREFIX,
		PARAMS.N,
		PARAMS.r,
		PARAMS.p,
		salt.toString("base64url"),
		hash.toString("base64url"),
	].join("$");
}

export function isValidHash(stored) {
	if (typeof stored !== "string") return false;
	const parts = stored.split("$");
	if (parts.length !== 6 || parts[0] !== PREFIX) return false;
	const [, N, r, p, salt, hash] = parts;
	return (
		Number(N) > 0 &&
		Number(r) > 0 &&
		Number(p) > 0 &&
		/^[A-Za-z0-9_-]+$/.test(salt) &&
		/^[A-Za-z0-9_-]+$/.test(hash)
	);
}

export async function verifyPassword(password, stored) {
	if (!isValidHash(stored)) return false;
	const [, N, r, p, salt, expected] = stored.split("$");
	const expectedBuffer = Buffer.from(expected, "base64url");
	const saltBuffer = Buffer.from(salt, "base64url");
	if (expectedBuffer.length < 16) return false;

	let actual;
	try {
		actual = await scrypt(
			String(password).normalize("NFKC"),
			saltBuffer,
			expectedBuffer.length,
			{
				N: Number(N),
				r: Number(r),
				p: Number(p),
				maxmem: PARAMS.maxmem,
			},
		);
	} catch {
		return false;
	}

	return (
		actual.length === expectedBuffer.length &&
		timingSafeEqual(actual, expectedBuffer)
	);
}

/**
 * Read the scrypt hash from the environment, or create one on first run.
 * Returns the generated key only when it was just created.
 */
export async function ensureCredentials(envFile, { reset = false } = {}) {
	const fromFile = readEnvFile(envFile);
	const existing = process.env.ADMIN_PASSWORD_HASH || fromFile.ADMIN_PASSWORD_HASH;

	if (existing && !reset) {
		if (!isValidHash(existing)) {
			throw new Error(
				"ADMIN_PASSWORD_HASH no tiene el formato esperado. " +
					"Genera uno nuevo con: npm run admin:password -- --reset",
			);
		}
		return { hash: existing, created: false, password: null };
	}

	const password = generatePassword();
	const hash = await hashPassword(password);
	saveEnvValue(envFile, "ADMIN_PASSWORD_HASH", hash);
	return { hash, created: true, password };
}

export class SessionStore {
	#sessions = new Map();
	#ttlMs;
	#max;

	constructor({ ttlMs = 8 * 60 * 60 * 1000, max = 20 } = {}) {
		this.#ttlMs = ttlMs;
		this.#max = max;
	}

	create() {
		this.#prune();
		while (this.#sessions.size >= this.#max) {
			const oldest = this.#sessions.keys().next().value;
			this.#sessions.delete(oldest);
		}
		const token = randomBytes(32).toString("base64url");
		const session = {
			csrf: randomBytes(32).toString("base64url"),
			expiresAt: Date.now() + this.#ttlMs,
		};
		this.#sessions.set(token, session);
		return { token, ...session };
	}

	get(token) {
		if (!token) return null;
		const session = this.#sessions.get(token);
		if (!session) return null;
		if (session.expiresAt <= Date.now()) {
			this.#sessions.delete(token);
			return null;
		}
		return session;
	}

	destroy(token) {
		if (token) this.#sessions.delete(token);
	}

	#prune() {
		const now = Date.now();
		for (const [token, session] of this.#sessions) {
			if (session.expiresAt <= now) this.#sessions.delete(token);
		}
	}
}

export class LoginLimiter {
	#entries = new Map();
	#maxFailures;
	#baseDelayMs;
	#maxDelayMs;

	constructor({
		maxFailures = 5,
		baseDelayMs = 30_000,
		maxDelayMs = 30 * 60 * 1000,
	} = {}) {
		this.#maxFailures = maxFailures;
		this.#baseDelayMs = baseDelayMs;
		this.#maxDelayMs = maxDelayMs;
	}

	check(key) {
		const entry = this.#entries.get(key);
		if (!entry || entry.lockedUntil <= Date.now()) return { locked: false };
		return {
			locked: true,
			retryAfter: Math.max(1, Math.ceil((entry.lockedUntil - Date.now()) / 1000)),
		};
	}

	fail(key) {
		if (this.#entries.size > 500) this.#prune();
		const now = Date.now();
		const entry = this.#entries.get(key) || {
			failures: 0,
			strikes: 0,
			lockedUntil: 0,
		};
		entry.failures += 1;
		if (entry.failures >= this.#maxFailures) {
			entry.failures = 0;
			entry.strikes += 1;
			const delay = Math.min(
				this.#baseDelayMs * 2 ** (entry.strikes - 1),
				this.#maxDelayMs,
			);
			entry.lockedUntil = now + delay;
		}
		this.#entries.set(key, entry);
	}

	succeed(key) {
		this.#entries.delete(key);
	}

	#prune() {
		const now = Date.now();
		for (const [key, entry] of this.#entries) {
			if (entry.lockedUntil <= now && entry.failures === 0) {
				this.#entries.delete(key);
			}
		}
	}
}
