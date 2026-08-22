import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';

interface CropOverride {
	size?: number;
	sx?: number;
	sy?: number;
}

const CROP_OVERRIDES: Record<string, CropOverride> = {
	'mykola-baldin': {
		size: 1800,
		sx: 400,
		sy: 550
	}
};

async function main() {
	const rawDir = path.join('assets', 'masters-raw');
	const outDir = path.join('static', 'masters');

	if (!fs.existsSync(rawDir)) {
		console.error(`❌ Raw directory not found: ${rawDir}`);
		process.exit(1);
	}
	if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

	const files = fs.readdirSync(rawDir).filter((f) => f.endsWith('.webp'));
	console.log(`🔨 Building web-optimized master photos from ${files.length} raw sources...`);

	const browser = await chromium.launch({ headless: true });
	const page = await browser.newPage();
	await page.setContent('<html><body></body></html>');

	let totalOutBytes = 0;

	for (const file of files) {
		const id = path.basename(file, '.webp');
		const rawPath = path.join(rawDir, file);
		const outPath = path.join(outDir, `${id}.webp`);

		const buf = fs.readFileSync(rawPath);
		const dataUrl = `data:image/webp;base64,${buf.toString('base64')}`;
		const override = CROP_OVERRIDES[id] || {};

		const webpBase64 = await page.evaluate(
			async ({ dataUrl, override, targetSize, quality }) => {
				return new Promise<string>((resolve, reject) => {
					const img = new Image();
					img.onload = () => {
						const canvas = document.createElement('canvas');
						canvas.width = targetSize;
						canvas.height = targetSize;
						const ctx = canvas.getContext('2d');
						if (!ctx) return reject(new Error('no ctx'));

						const minDim = Math.min(img.naturalWidth, img.naturalHeight);
						const cropSize = override.size ?? minDim;
						const extraY = img.naturalHeight - cropSize;

						let sx = override.sx;
						if (sx === undefined) {
							sx = (img.naturalWidth - cropSize) / 2;
						}

						let sy = override.sy;
						if (sy === undefined) {
							sy = extraY > 0 ? extraY * 0.12 : 0;
						}

						ctx.imageSmoothingEnabled = true;
						ctx.imageSmoothingQuality = 'high';
						ctx.drawImage(img, sx, sy, cropSize, cropSize, 0, 0, targetSize, targetSize);

						const outUrl = canvas.toDataURL('image/webp', quality);
						resolve(outUrl.split(',')[1]);
					};
					img.onerror = reject;
					img.src = dataUrl;
				});
			},
			{ dataUrl, override, targetSize: 480, quality: 0.85 }
		);

		const outBuf = Buffer.from(webpBase64, 'base64');
		fs.writeFileSync(outPath, outBuf);
		totalOutBytes += outBuf.length;
		console.log(`✅ [480x480] static/masters/${id}.webp (${(outBuf.length / 1024).toFixed(1)} KB)`);
	}

	console.log(`\n🎉 Built ${files.length} production master photos. Total size: ${(totalOutBytes / 1024 / 1024).toFixed(2)} MB.`);
	await browser.close();
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
