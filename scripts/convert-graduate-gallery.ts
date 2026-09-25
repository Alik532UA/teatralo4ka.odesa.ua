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
 *
 * ## Чорні поля зрізаються
 *
 * Половина знімків у теках — кадри з відео (`*.vob_snapshot_*`), і в них
 * майже завжди letterbox: широкий кадр усередині 4:3 або навпаки. Лишити поля
 * означає віддати чверть ваги файлу чорному прямокутнику й показати його в
 * лайтбоксі на весь екран.
 *
 * Ряд вважається полем, коли ПОНАД 99% його пікселів темніші за поріг. Не
 * 100%: у відео поле не буває ідеально чорним — компресія лишає крапки, і
 * строга умова не зрізала б нічого. Не 90%: тоді під ніж пішов би перший
 * темний ряд самого кадру.
 *
 * Зрізання обмежене третиною сторони з кожного боку. Кадр, у якого темні
 * майже всі краї (нічна сцена, темні куліси), інакше з'їдався б до плями
 * посередині — а це вже не обрізання полів, а псування знімка.
 */
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';

const OUT_ROOT = path.join('static', 'graduates', 'gallery');
const MAX_SIDE = 1280;
const QUALITY = 0.82;
const SOURCES = /\.(jpe?g|png|webp)$/i;

/** Поріг «пікселя поля»: сума каналів. 36 — це середнє 12 із 255. */
const DARK = 36;
/** Частка темних пікселів, за якої ряд вважається полем. */
const DARK_SHARE = 0.99;
/** Скільки щонайбільше можна зрізати з КОЖНОГО боку. */
const MAX_TRIM = 1 / 3;

function parseArgs() {
	let slug = '';
	let dir = '';
	let start = 0;
	let append = false;
	for (const arg of process.argv.slice(2)) {
		if (arg.startsWith('--slug=')) slug = arg.slice('--slug='.length);
		if (arg.startsWith('--dir=')) dir = arg.slice('--dir='.length);
		if (arg.startsWith('--start=')) start = parseInt(arg.slice('--start='.length), 10);
		if (arg === '--append') append = true;
	}
	if (!slug || !dir) {
		console.error(
			'Usage: npx tsx scripts/convert-graduate-gallery.ts --slug=<адреса> --dir=<тека> [--start=<число>] [--append]'
		);
		process.exit(1);
	}
	return { slug, dir, start, append };
}

async function main() {
	const { slug, dir, start, append } = parseArgs();
	const files = fs.readdirSync(dir).filter((f) => SOURCES.test(f)).sort();
	if (files.length === 0) {
		console.error(`У ${dir} немає знімків`);
		process.exit(1);
	}

	const outDir = path.join(OUT_ROOT, slug);
	fs.mkdirSync(outDir, { recursive: true });

	let startIndex = 1;
	if (start > 0) {
		startIndex = start;
	} else if (append) {
		const existing = fs
			.readdirSync(outDir)
			.filter((f) => /^\d+\.webp$/i.test(f))
			.map((f) => parseInt(f, 10));
		if (existing.length > 0) {
			startIndex = Math.max(...existing) + 1;
		}
	}

	const browser = await chromium.launch();
	const page = await browser.newPage();
	const рядки: string[] = [];

	for (const [i, file] of files.entries()) {
		const src = path.join(dir, file);
		const ext = path.extname(file).toLowerCase();
		const mime = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
		const dataUrl = `data:${mime};base64,${fs.readFileSync(src).toString('base64')}`;

		const result = await page.evaluate(
			async ({ dataUrl, maxSide, quality, dark, darkShare, maxTrim }) => {
				const res = await fetch(dataUrl);
				const blob = await res.blob();
				const img = await createImageBitmap(blob, { imageOrientation: 'from-image' });

				// Поля шукаються на ОРИГІНАЛІ: після зменшення межа поля
				// розмивається інтерполяцією, і рядок перестає бути темним.
				const probe = new OffscreenCanvas(img.width, img.height);
				const pctx = probe.getContext('2d')!;
				pctx.drawImage(img, 0, 0);
				const { data } = pctx.getImageData(0, 0, img.width, img.height);

				/*
				 * Один прохід по всіх пікселях замість виклику на кожен ряд:
				 * так само точно й на порядок швидше на 47 кадрах. Функцій тут
				 * навмисно немає — `tsx` дописує іменованим хелпер `__name`,
				 * якого в сторінці не існує, і `page.evaluate` падає.
				 */
				const темнихУРяду = new Uint32Array(img.height);
				const темнихУСтовпці = new Uint32Array(img.width);
				for (let y = 0; y < img.height; y++) {
					for (let x = 0; x < img.width; x++) {
						const i = (y * img.width + x) * 4;
						if (data[i] + data[i + 1] + data[i + 2] <= dark) {
							темнихУРяду[y]++;
							темнихУСтовпці[x]++;
						}
					}
				}

				const порігРяду = img.width * darkShare;
				const порігСтовпця = img.height * darkShare;
				const межаY = Math.floor(img.height * maxTrim);
				const межаX = Math.floor(img.width * maxTrim);

				let top = 0;
				while (top < межаY && темнихУРяду[top] >= порігРяду) top++;
				let bottom = img.height - 1;
				while (img.height - 1 - bottom < межаY && темнихУРяду[bottom] >= порігРяду) bottom--;
				let left = 0;
				while (left < межаX && темнихУСтовпці[left] >= порігСтовпця) left++;
				let right = img.width - 1;
				while (img.width - 1 - right < межаX && темнихУСтовпці[right] >= порігСтовпця) right--;

				const cropW = right - left + 1;
				const cropH = bottom - top + 1;
				const зрізано = cropW !== img.width || cropH !== img.height;

				const scale = Math.min(maxSide / Math.max(cropW, cropH), 1);
				const width = Math.round(cropW * scale);
				const height = Math.round(cropH * scale);
				const canvas = new OffscreenCanvas(width, height);
				canvas.getContext('2d')!.drawImage(img, left, top, cropW, cropH, 0, 0, width, height);
				const outBlob = await canvas.convertToBlob({ type: 'image/webp', quality });
				const buffer = await outBlob.arrayBuffer();
				let binary = '';
				for (const byte of new Uint8Array(buffer)) binary += String.fromCharCode(byte);
				return {
					base64: btoa(binary),
					width,
					height,
					from: `${img.width}×${img.height}`,
					зрізано: зрізано ? `${cropW}×${cropH}` : null
				};
			},
			{
				dataUrl,
				maxSide: MAX_SIDE,
				quality: QUALITY,
				dark: DARK,
				darkShare: DARK_SHARE,
				maxTrim: MAX_TRIM
			}
		);

		const outIndex = startIndex + i;
		const outName = `${String(outIndex).padStart(2, '0')}.webp`;
		fs.writeFileSync(path.join(outDir, outName), Buffer.from(result.base64, 'base64'));
		const поля = result.зрізано ? ` (поля зрізано до ${result.зрізано})` : '';
		console.log(`${outName} (${file}): ${result.from}${поля} → ${result.width}×${result.height}`);
		рядки.push(
			`\t'/graduates/gallery/${slug}/${outName}': { width: ${result.width}, height: ${result.height} },`
		);
	}

	await browser.close();

	// Без цього запису сторінка віддає 500, а не просто губить розмір:
	// `imageSize()` розкладає `LOCAL_IMAGE_SIZES[path]` і падає на `undefined`.
	console.log('\nДодати в `src/lib/config/localGalleryImages.ts`:');
	console.log(рядки.join('\n'));
}

main();
