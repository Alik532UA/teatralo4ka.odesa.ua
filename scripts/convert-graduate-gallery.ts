/**
 * Переводить теку знімків випускника у `static/graduates/gallery/<адреса>/NN.webp`.
 *
 * Використання:
 *   npx tsx scripts/convert-graduate-gallery.ts --slug=margotcine --dir="C:\path\to\folder"
 *
 * ## Чому окремий скрипт, а не `convert-group-photo`
 *
 * Той кладе ОДИН банер у `static/groups` чи `static/festivals` і зветься
 * іменем групи. Тут інша форма: тека з довільною кількістю знімків, вихід
 * нумерований від `01`, і межа більша — галерею відкривають на весь екран, а
 * банер стоїть угорі сторінки.
 *
 * Межа 1280 по ДОВШІЙ стороні, а не по ширині: у теці впереміш вертикальні й
 * горизонтальні кадри, і обмеження саме ширини роздуло б вертикальні до 1280
 * завширшки й 1700 заввишки — тобто вдвічі важчими за горизонтальні сусідні.
 * Заміряно на галереї `margotcine`: 1280×960 поруч із 960×1280.
 *
 * Кодек — Chromium через Playwright, як у сусідніх скриптів: він уже стоїть, а
 * `sharp` тягнув би нативний бінарник у кожен `npm ci` заради теки на рік.
 */
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';

const OUT_ROOT = path.join('static', 'graduates', 'gallery');
const MAX_SIDE = 1280;
const QUALITY = 0.82;
const SOURCES = /\.(jpe?g|png|webp)$/i;

function parseArgs() {
	let slug = '';
	let dir = '';
	for (const arg of process.argv.slice(2)) {
		if (arg.startsWith('--slug=')) slug = arg.slice('--slug='.length);
		if (arg.startsWith('--dir=')) dir = arg.slice('--dir='.length);
	}
	if (!slug || !dir) {
		console.error('Usage: npx tsx scripts/convert-graduate-gallery.ts --slug=<адреса> --dir=<тека>');
		process.exit(1);
	}
	return { slug, dir };
}

async function main() {
	const { slug, dir } = parseArgs();
	const files = fs.readdirSync(dir).filter((f) => SOURCES.test(f)).sort();
	if (files.length === 0) {
		console.error(`У ${dir} немає знімків`);
		process.exit(1);
	}

	const outDir = path.join(OUT_ROOT, slug);
	fs.mkdirSync(outDir, { recursive: true });

	const browser = await chromium.launch();
	const page = await browser.newPage();
	const рядки: string[] = [];

	for (const [i, file] of files.entries()) {
		const src = path.join(dir, file);
		const ext = path.extname(file).toLowerCase();
		const mime = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
		const dataUrl = `data:${mime};base64,${fs.readFileSync(src).toString('base64')}`;

		const result = await page.evaluate(
			async ({ dataUrl, maxSide, quality }) => {
				const img = await new Promise<HTMLImageElement>((resolve, reject) => {
					const el = new Image();
					el.onload = () => resolve(el);
					el.onerror = reject;
					el.src = dataUrl;
				});
				const scale = Math.min(maxSide / Math.max(img.width, img.height), 1);
				const width = Math.round(img.width * scale);
				const height = Math.round(img.height * scale);
				const canvas = new OffscreenCanvas(width, height);
				canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
				const blob = await canvas.convertToBlob({ type: 'image/webp', quality });
				const buffer = await blob.arrayBuffer();
				let binary = '';
				for (const byte of new Uint8Array(buffer)) binary += String.fromCharCode(byte);
				return { base64: btoa(binary), width, height, from: `${img.width}×${img.height}` };
			},
			{ dataUrl, maxSide: MAX_SIDE, quality: QUALITY }
		);

		const outName = `${String(i + 1).padStart(2, '0')}.webp`;
		fs.writeFileSync(path.join(outDir, outName), Buffer.from(result.base64, 'base64'));
		console.log(`${outName}: ${result.from} → ${result.width}×${result.height}`);
		рядки.push(
			`\t'/graduates/gallery/${slug}/${outName}': { width: ${result.width}, height: ${result.height} },`
		);
	}

	await browser.close();

	// Без цього запису сторінка віддає 500, а не просто губить розмір:
	// `imageSize()` розкладає `LOCAL_IMAGE_SIZES[path]` і падає на `undefined`.
	console.log('\nДодати в `src/lib/config/localImages.ts`:');
	console.log(рядки.join('\n'));
}

main();
