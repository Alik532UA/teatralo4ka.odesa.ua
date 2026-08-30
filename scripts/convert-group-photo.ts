/**
 * Конвертує фотографію групи у webp для банера на сторінці групи.
 *
 * Використання:
 *   npx tsx scripts/convert-group-photo.ts --slug=tv-prodakshn --src="C:\path\to\photo.jpg"
 *   npx tsx scripts/convert-group-photo.ts --slug=tv-prodakshn --index=2 --src=...
 *
 * ## Чому Chromium, а не бібліотека
 *
 * Кодека webp у залежностях немає й не було: `fetch-graduate-photos.ts` і
 * `convert-extra-photo.ts` беруть його з Playwright, який у проєкті вже стоїть
 * заради E2E. Тягнути `sharp` заради п'яти знімків означало б додати нативну
 * залежність там, де вистачає наявної.
 *
 * ## Чому не квадрат
 *
 * На відміну від портрета випускника, знімок групи — це БАНЕР: на ньому весь
 * склад в один-два ряди, і центральний квадрат відрізав би половину людей.
 * Тому кадр не ріжеться, а вписується в межу — заміряно на наявних банерах
 * ЗТК: 1280×720, 768×576, 787×576, тобто пропорції в них різні й збережені.
 */
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';

const MAX_WIDTH = 1280;
const MAX_HEIGHT = 720;
const QUALITY = 0.82;
/** Куди кладеться результат: групи й фестивалі мають однакові банери. */
const KINDS = { groups: 'groups', festivals: 'festivals' } as const;
type Kind = keyof typeof KINDS;

function parseArgs() {
	const args = process.argv.slice(2);
	let slug = '';
	let index = 0;
	let src = '';
	let kind: Kind = 'groups';

	for (const arg of args) {
		if (arg.startsWith('--slug=')) slug = arg.slice('--slug='.length);
		if (arg.startsWith('--index=')) index = parseInt(arg.slice('--index='.length), 10);
		if (arg.startsWith('--src=')) src = arg.slice('--src='.length);
		if (arg.startsWith('--kind=')) {
			const value = arg.slice('--kind='.length);
			if (!(value in KINDS)) {
				console.error(`Невідомий --kind: ${value}. Можна: ${Object.keys(KINDS).join(', ')}`);
				process.exit(1);
			}
			kind = value as Kind;
		}
	}

	if (!slug || !src) {
		console.error(
			'Usage: npx tsx scripts/convert-group-photo.ts --slug=<slug> [--index=N] [--kind=groups|festivals] --src=<path>'
		);
		process.exit(1);
	}

	if (!fs.existsSync(src)) {
		console.error(`Джерела немає: ${src}`);
		process.exit(1);
	}

	return { slug, index, src, kind };
}

async function main() {
	const { slug, index, src, kind } = parseArgs();
	const outDir = path.join('static', KINDS[kind]);

	const ext = path.extname(src).toLowerCase();
	const mime = ext === '.png' ? 'image/png' : 'image/jpeg';
	const dataUrl = `data:${mime};base64,${fs.readFileSync(src).toString('base64')}`;

	const browser = await chromium.launch({ headless: true });
	const page = await browser.newPage();
	await page.setContent('<html><body></body></html>');

	const result = await page.evaluate(
		async ({ dataUrl, maxWidth, maxHeight, quality }) => {
			return new Promise<{ base64: string; width: number; height: number; from: string }>(
				(resolve, reject) => {
					const img = new Image();
					img.onload = async () => {
						// Вписуємо в межу, не збільшуючи: дрібний знімок краще лишити
						// дрібним, ніж розтягнути й показати кожен піксель.
						const scale = Math.min(maxWidth / img.width, maxHeight / img.height, 1);
						const width = Math.round(img.width * scale);
						const height = Math.round(img.height * scale);

						const canvas = new OffscreenCanvas(width, height);
						const ctx = canvas.getContext('2d')!;
						ctx.drawImage(img, 0, 0, width, height);

						const blob = await canvas.convertToBlob({ type: 'image/webp', quality });
						const reader = new FileReader();
						reader.onload = () =>
							resolve({
								base64: (reader.result as string).split(',')[1],
								width,
								height,
								from: `${img.width}×${img.height}`
							});
						reader.onerror = reject;
						reader.readAsDataURL(blob);
					};
					img.onerror = () => reject(new Error('не вдалося прочитати зображення'));
					img.src = dataUrl;
				}
			);
		},
		{ dataUrl, maxWidth: MAX_WIDTH, maxHeight: MAX_HEIGHT, quality: QUALITY }
	);

	await browser.close();

	fs.mkdirSync(outDir, { recursive: true });
	const outName = index > 1 ? `${slug}-${index}.webp` : `${slug}.webp`;
	const outPath = path.join(outDir, outName);
	fs.writeFileSync(outPath, Buffer.from(result.base64, 'base64'));

	const wasKb = Math.round(fs.statSync(src).size / 1024);
	const nowKb = Math.round(fs.statSync(outPath).size / 1024);
	console.log(
		`${outName}: ${result.from} → ${result.width}×${result.height}, ${wasKb} КБ → ${nowKb} КБ`
	);

	// Без цього запису сторінка групи віддає 500, а не просто губить розмір:
	// `imageSize()` розкладає `LOCAL_IMAGE_SIZES[path]` і падає на `undefined`.
	// Перевірено на власній шкурі — саме так і сталося на першому ж банері.
	console.log('\nДодати в `src/lib/config/localImages.ts`:');
	console.log(`\t'/${KINDS[kind]}/${outName}': { width: ${result.width}, height: ${result.height} },`);
}

main();
