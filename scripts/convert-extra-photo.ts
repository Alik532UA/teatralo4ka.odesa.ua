/**
 * Конвертує додаткове фото випускника у 3 розміри webp.
 *
 * Використання:
 *   npx tsx scripts/convert-extra-photo.ts --slug=alik-zapolnov --index=2 --src="C:\path\to\photo.jpg"
 *
 * Використовує Playwright/Chromium як кодек webp (як fetch-graduate-photos.ts).
 */
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';

const SIZES = [96, 192, 480] as const;
const QUALITY = 0.82;
const OUT_DIR = path.join('static', 'graduates');

function parseArgs() {
	const args = process.argv.slice(2);
	let slug = '';
	let index = 0;
	let src = '';

	for (const arg of args) {
		if (arg.startsWith('--slug=')) slug = arg.slice('--slug='.length);
		if (arg.startsWith('--index=')) index = parseInt(arg.slice('--index='.length), 10);
		if (arg.startsWith('--src=')) src = arg.slice('--src='.length);
	}

	if (!slug || !index || index < 1 || !src) {
		console.error('Usage: npx tsx scripts/convert-extra-photo.ts --slug=<slug> --index=<N> --src=<path>');
		process.exit(1);
	}

	if (!fs.existsSync(src)) {
		console.error(`Source file not found: ${src}`);
		process.exit(1);
	}

	return { slug, index, src };
}

async function main() {
	const { slug, index, src } = parseArgs();

	console.log(`Converting ${src} for ${slug} (index ${index})...`);

	// Read source as data URL
	const ext = path.extname(src).toLowerCase();
	const mime = ext === '.png' ? 'image/png' : (ext === '.webp' ? 'image/webp' : 'image/jpeg');
	const buf = fs.readFileSync(src);
	const dataUrl = `data:${mime};base64,${buf.toString('base64')}`;

	const browser = await chromium.launch({ headless: true });
	const page = await browser.newPage();
	await page.setContent('<html><body></body></html>');

	for (const size of SIZES) {
		const webpBase64: string = await page.evaluate(
			async ({ dataUrl, size, quality }) => {
				return new Promise<string>((resolve, reject) => {
					const img = new Image();
					img.onload = async () => {
						// Center crop to square
						const side = Math.min(img.width, img.height);
						const sx = Math.round((img.width - side) / 2);
						const sy = Math.round((img.height - side) / 2);

						const canvas = new OffscreenCanvas(size, size);
						const ctx = canvas.getContext('2d')!;
						ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);

						const blob = await canvas.convertToBlob({ type: 'image/webp', quality });
						const reader = new FileReader();
						reader.onload = () => {
							const result = reader.result as string;
							resolve(result.split(',')[1]); // base64 part only
						};
						reader.onerror = reject;
						reader.readAsDataURL(blob);
					};
					img.onerror = () => reject(new Error('Failed to load image'));
					img.src = dataUrl;
				});
			},
			{ dataUrl, size, quality: QUALITY }
		);

		// `--index=1` — головне фото, і в його імені номера немає.
		const outName = index === 1 ? `${slug}-${size}.webp` : `${slug}-${index}-${size}.webp`;
		const outPath = path.join(OUT_DIR, outName);
		fs.writeFileSync(outPath, Buffer.from(webpBase64, 'base64'));
		const bytes = fs.statSync(outPath).size;
		console.log(`  ✅ ${outName} (${bytes} bytes)`);
	}

	await browser.close();
	console.log('Done!');
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
