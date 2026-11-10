/** Detect an allowed raster image from its magic bytes. SVG is intentionally
 * rejected: it can carry scripts and it is not needed for post figures. */
export function detectImage(buffer) {
	if (buffer.length < 24) return null;

	if (
		buffer[0] === 0x89 &&
		buffer[1] === 0x50 &&
		buffer[2] === 0x4e &&
		buffer[3] === 0x47 &&
		buffer[4] === 0x0d &&
		buffer[5] === 0x0a &&
		buffer[6] === 0x1a &&
		buffer[7] === 0x0a
	) {
		return { ext: "png", mime: "image/png", ...pngSize(buffer) };
	}

	if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
		return { ext: "jpg", mime: "image/jpeg", ...jpegSize(buffer) };
	}

	const gifHeader = buffer.subarray(0, 6).toString("latin1");
	if (gifHeader === "GIF87a" || gifHeader === "GIF89a") {
		return {
			ext: "gif",
			mime: "image/gif",
			width: buffer.readUInt16LE(6),
			height: buffer.readUInt16LE(8),
		};
	}

	if (
		buffer.subarray(0, 4).toString("latin1") === "RIFF" &&
		buffer.subarray(8, 12).toString("latin1") === "WEBP"
	) {
		return { ext: "webp", mime: "image/webp", ...webpSize(buffer) };
	}

	if (buffer.subarray(4, 8).toString("latin1") === "ftyp") {
		const brand = buffer.subarray(8, 12).toString("latin1");
		if (brand === "avif" || brand === "avis") {
			return { ext: "avif", mime: "image/avif", width: null, height: null };
		}
	}

	return null;
}

function pngSize(buffer) {
	if (buffer.length < 24) return {};
	return {
		width: buffer.readUInt32BE(16),
		height: buffer.readUInt32BE(20),
	};
}

function gifSize(buffer) {
	if (buffer.length < 10) return {};
	return {
		width: buffer.readUInt16LE(6),
		height: buffer.readUInt16LE(8),
	};
}

function webpSize(buffer) {
	const chunk = buffer.subarray(12, 16).toString("latin1");
	if (chunk === "VP8X" && buffer.length >= 30) {
		return {
			width: buffer.readUIntLE(24, 3) + 1,
			height: buffer.readUIntLE(27, 3) + 1,
		};
	}
	if (chunk === "VP8L" && buffer.length >= 25 && buffer[20] === 0x2f) {
		const b1 = buffer[21];
		const b2 = buffer[22];
		const b3 = buffer[23];
		const b4 = buffer[24];
		return {
			width: 1 + (((b2 & 0x3f) << 8) | b1),
			height: 1 + (((b4 & 0x0f) << 10) | (b3 << 2) | ((b2 & 0xc0) >> 6)),
		};
	}
	return {};
}

function jpegSize(buffer) {
	let offset = 2;
	while (offset + 9 < buffer.length) {
		if (buffer[offset] !== 0xff) {
			offset += 1;
			continue;
		}
		let marker = buffer[offset + 1];
		while (marker === 0xff) {
			offset += 1;
			marker = buffer[offset + 1];
		}
		if (marker === 0xd8 || marker === 0xd9) {
			offset += 2;
			continue;
		}
		if (marker === 0xda) break;
		const length = buffer.readUInt16BE(offset + 2);
		if (length < 2) break;
		const isFrame =
			(marker >= 0xc0 && marker <= 0xc3) ||
			(marker >= 0xc5 && marker <= 0xc7) ||
			(marker >= 0xc9 && marker <= 0xcb) ||
			(marker >= 0xcd && marker <= 0xcf);
		if (isFrame) {
			return {
				height: buffer.readUInt16BE(offset + 5),
				width: buffer.readUInt16BE(offset + 7),
			};
		}
		offset += 2 + length;
	}
	return {};
}
