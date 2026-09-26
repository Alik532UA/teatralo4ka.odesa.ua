/**
 * Конвертує знімок у фон плаката навчального календаря.
 *
 * Використання:
 *   npx tsx scripts/convert-calendar-bgs.ts --src="C:\шлях\до\фото.jpg" --name=blue-hall
 *   ... --max-width=2560   — якщо фон мусить лишатися різким на великому екрані
 *
 * Результат — `static/calendar/calendar-bg-<name>.webp`. Далі два кроки руками:
 * тема в `src/lib/config/calendarThemes.ts` і розміри файлу в
 * `src/lib/config/localImages.ts` — скрипт друкує готовий рядок, а
 * `localImages.test.ts` звіряє його з диском.
 *
 * Перша редакція мала зашитий шлях до теки «Завантаження» одного комп'ютера й
 * перелік із чотирьох файлів, тобто повторити її не міг ніхто, навіть автор на
 * іншій машині.
 *
 * ## Межа 1920 і якість 0.82
 *
 * Фон лежить під розмиттям на плакаті завширшки до 1600 px, тож більша ширина
 * нічого не додає, крім ваги. Якість — та сама, що в решти знімків проєкту
 * (AGENTS.md, розділ про формат знімків). Кодувальник — Chromium із Playwright,
 * як у `convert-group-photo.ts`: окремої залежності заради кількох фонів не
 * треба. І з ВИХІДНИКА: перекодування вже стисненого файлу не економить.
 */
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';

const MAX_WIDTH = 1920;
const QUALITY = 0.82;
const OUT_DIR = path.join('static', 'calendar');

function parseArgs() {
	let src = '';
	let name = '';
	let maxWidth = MAX_WIDTH;
	for (const arg of process.argv.slice(2)) {
		if (arg.startsWith('--src=')) src = arg.slice('--src='.length);
		if (arg.startsWith('--name=')) name = arg.slice('--name='.length);
		if (arg.startsWith('--max-width=')) maxWidth = parseInt(arg.slice('--max-width='.length), 10);
	}
	if (!src || !name) {
		console.error('Потрібні --src="шлях до файлу" і --name=назва-фону');
		process.exit(1);
	}
	if (!/^[a-z0-9-]+$/.test(name)) {
		console.error(`--name=${name}: лише латинські літери, цифри й дефіс — назва йде в адресу`);
		process.exit(1);
	}
	if (!Number.isFinite(maxWidth) || maxWidth < 320) {
		console.error('--max-width: число від 320');
		process.exit(1);
	}
	return { src, name, maxWidth };
}

async function convert() {
	const { src, name, maxWidth } = parseArgs();
	if (!fs.existsSync(src)) {
		console.error(`Файл не знайдено: ${src}`);
		process.exit(1);
	}

	const mime = src.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
	const dataUrl = `data:${mime};base64,${fs.readFileSync(src).toString('base64')}`;

	const browser = await chromium.launch({ headless: true });
	try {
		const page = await browser.newPage();
		const { webp, width, height } = await page.evaluate(
			async ({ dataUrl, maxWidth, quality }) => {
				const img = new Image();
				img.src = dataUrl;
				await img.decode();
				const scale = Math.min(1, maxWidth / img.naturalWidth);
				const canvas = document.createElement('canvas');
				canvas.width = Math.round(img.naturalWidth * scale);
				canvas.height = Math.round(img.naturalHeight * scale);
				const ctx = canvas.getContext('2d');
				if (!ctx) throw new Error('canvas 2d недоступний');
				ctx.imageSmoothingQuality = 'high';
				ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
				return {
					webp: canvas.toDataURL('image/webp', quality),
					width: canvas.width,
					height: canvas.height
				};
			},
			{ dataUrl, maxWidth, quality: QUALITY }
		);

		const file = `calendar-bg-${name}.webp`;
		const out = path.join(OUT_DIR, file);
		fs.writeFileSync(out, Buffer.from(webp.replace(/^data:image\/webp;base64,/, ''), 'base64'));
		const kb = (fs.statSync(out).size / 1024).toFixed(1);
		console.log(`${out}: ${width}×${height}, ${kb} КБ`);
		console.log(`Рядок для localImages.ts:`);
		console.log(`\t'/calendar/${file}': { width: ${width}, height: ${height} },`);
	} finally {
		await browser.close();
	}
}

convert().catch((error) => {
	console.error('Конвертація не вдалася:', error);
	process.exit(1);
});
