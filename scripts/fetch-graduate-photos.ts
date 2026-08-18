/**
 * Третій крок міграції: стягує портрети випускників у `static/graduates/`.
 *
 * Вхід: `.temp/ats-ua/parsed/*.json` (див. `scripts/parse-graduates.ts`).
 * Вихід: `static/graduates/<slug>-<розмір>.webp`; звіт — у `.temp/`.
 *
 * ## Чому Chromium, а не sharp
 *
 * Конвертація у webp потрібна рівно 80 разів і рівно один раз у житті проєкту.
 * `sharp` — нативна залежність на десятки мегабайтів із власним бінарником під
 * кожну платформу; брати її заради одноразової операції означає платити за неї
 * в кожному `npm ci` назавжди (DEPENDENCIES-v8 § 1.2: не брати бібліотеку, коли
 * задача вирішується наявним). Chromium уже стоїть заради Playwright і вміє
 * кодувати webp сам — через `OffscreenCanvas.convertToBlob`.
 *
 * ## Чому байти тягне Node, а не сторінка
 *
 * `fetch` із порожньої сторінки до `lh3.googleusercontent.com` впирається в
 * CORS, і canvas після `drawImage` стає «зіпсованим» — `convertToBlob` кидає.
 * Тому Node качає байти (у Node немає CORS), передає їх у сторінку як data-URL,
 * а звідти забирає готовий webp. Сторінка тут — лише кодек.
 *
 * ## Розміри
 *
 * Джерела заміряно: 473×480 (54 шт.) і 480×480 (26 шт.), тобто майже квадрат.
 * Отже стеля 480:
 *
 *   96   зірка в галактиці
 *   192  зірка при наведенні, і вона ж 2x для 96
 *   480  картка випускника
 *
 * Сторона файлу РІВНО така, як в його імені, — і це виправлення другої спроби.
 * Перша не збільшувала зображення, тож `-480.webp` для 54 портретів мав 473 px.
 * Виглядало охайніше й тягнуло за собою гіршу річ: дескриптор `srcset` мусить
 * бути правдивим, отже сторінці знадобився б манифест реальних розмірів на
 * кожен портрет. 473 → 480 це 1.5% — непомітно оком і дешевше за ту складність.
 * Справжній апскейл усе одно відсікається: розмір, більший за джерело понад
 * 5%, просто не створюється.
 *
 * Обрізання по центру до квадрата: портрет показується круглим, і без обрізання
 * круг з'їв би краї несиметрично.
 */
import fs from 'node:fs';
import path from 'node:path';
import { chromium, type Browser, type Page } from '@playwright/test';

const PARSED_DIR = path.join('.temp', 'ats-ua', 'parsed');
const OUT_DIR = path.join('static', 'graduates');
/**
 * Звіт, а не дані застосунку: розміри тепер однакові в усіх портретів, тож
 * сторінці нема чого звідси читати. У `static/` він лише служив би публічно без
 * причини, тому лежить у `.temp/`.
 */
const REPORT = path.join('.temp', 'ats-ua', 'photos-report.json');

/** Стеля 480 — розмір джерел. Понад джерело +5% не створюється. */
const SIZES = [96, 192, 480] as const;

/**
 * 0.82 — не «на око». На 0.9 файли важать майже як без стискання, на 0.7 на
 * обличчях з'являється характерна webp-каша в півтонах шкіри. Перевірено
 * заміром на трьох портретах різної яскравості.
 */
const QUALITY = 0.82;

const FORCE = process.argv.includes('--force');
const DELAY_MS = 250;

interface Graduate {
	slug: string;
	name: string;
	photo: { src: string; width: number; height: number } | null;
}

interface PhotoEntry {
	slug: string;
	sizes: number[];
	source: { width: number; height: number };
	bytes: Record<string, number>;
}

/**
 * Перекодувати в webp зі обрізанням по центру до квадрата.
 *
 * Усередині `page.evaluate` жодної названої функції: `tsx` (esbuild) обгортає їх
 * хелпером `__name`, якого в контексті сторінки немає. Та сама пастка вже
 * записана в `crawl-ats-ua.ts`.
 */
async function encode(
	page: Page,
	dataUrl: string,
	size: number,
	quality: number
): Promise<string | null> {
	return page.evaluate(
		async ([source, target, q]: [string, number, number]) => {
			const response = await fetch(source);
			const bitmap = await createImageBitmap(await response.blob());

			// Обрізання «cover»: беремо найбільший квадрат по центру джерела.
			const side = Math.min(bitmap.width, bitmap.height);
			const sx = (bitmap.width - side) / 2;
			const sy = (bitmap.height - side) / 2;

			// Сторона РІВНО така, як в імені файлу.
			//
			// Спершу тут стояло `Math.min(target, side)`, щоб не збільшувати
			// зображення. Виглядало правильно й давало гіршу річ: у 54 джерел
			// 473×480, тож файл `-480.webp` насправді мав 473 px. Для `srcset`
			// дескриптор мусить бути правдивим, отже застосунку знадобився б
			// манифест реальних розмірів на кожен портрет — складність, що
			// тягнеться далі в код сторінки.
			//
			// 473 → 480 це 1.5% збільшення: непомітно оком і дешевше за
			// манифест. Справжній апскейл усе одно відсікається нижче.
			const edge = target;

			const canvas = new OffscreenCanvas(edge, edge);
			const ctx = canvas.getContext('2d');
			if (!ctx) return null;
			ctx.imageSmoothingEnabled = true;
			ctx.imageSmoothingQuality = 'high';
			ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, edge, edge);
			bitmap.close();

			const blob = await canvas.convertToBlob({ type: 'image/webp', quality: q });
			if (blob.type !== 'image/webp') return null;

			const buffer = new Uint8Array(await blob.arrayBuffer());
			let binary = '';
			for (const byte of buffer) binary += String.fromCharCode(byte);
			return btoa(binary);
		},
		[dataUrl, size, quality] as [string, number, number]
	);
}

async function main() {
	if (!fs.existsSync(PARSED_DIR)) {
		console.error(`! немає ${PARSED_DIR} — спершу npm run parse:graduates`);
		process.exit(1);
	}

	const graduates: Graduate[] = fs
		.readdirSync(PARSED_DIR)
		.filter((f) => f.endsWith('.json'))
		.map((f) => JSON.parse(fs.readFileSync(path.join(PARSED_DIR, f), 'utf8')) as Graduate);

	const withPhoto = graduates.filter((g) => g.photo !== null);
	if (withPhoto.length === 0) {
		console.error('! жодного портрета в розібраних записах — перевірка мертва');
		process.exit(1);
	}

	fs.mkdirSync(OUT_DIR, { recursive: true });

	const entries: PhotoEntry[] = [];
	const failed: string[] = [];
	let downloaded = 0;
	let skipped = 0;

	let browser: Browser | null = null;
	try {
		browser = await chromium.launch();
		const page = await browser.newPage();

		for (const graduate of withPhoto) {
			const photo = graduate.photo!;
			// Квадрат беремо по меншій стороні, і саме з нею порівнюємо стелю.
			// Запас 5% дозволяє 473 → 480 і водночас відсікає справжній апскейл:
			// якби колись трапився портрет 200 px, файлу `-480` для нього просто
			// не було б, замість розмитої підробки під правдивим іменем.
			const side = Math.min(photo.width, photo.height);
			const targets = SIZES.filter((s) => s <= side * 1.05);
			const paths = targets.map((s) => path.join(OUT_DIR, `${graduate.slug}-${s}.webp`));

			if (!FORCE && paths.every((p) => fs.existsSync(p))) {
				skipped++;
				entries.push({
					slug: graduate.slug,
					sizes: [...targets],
					source: { width: photo.width, height: photo.height },
					bytes: Object.fromEntries(
						targets.map((s, i) => [String(s), fs.statSync(paths[i]).size])
					)
				});
				continue;
			}

			// Байти тягне Node: у сторінці цей запит упреться в CORS.
			let dataUrl: string;
			try {
				const response = await fetch(photo.src);
				if (!response.ok) throw new Error(`HTTP ${response.status}`);
				const buffer = Buffer.from(await response.arrayBuffer());
				const type = response.headers.get('content-type') ?? 'image/jpeg';
				dataUrl = `data:${type};base64,${buffer.toString('base64')}`;
			} catch (error) {
				failed.push(`${graduate.slug}: не завантажилося — ${String(error)}`);
				continue;
			}

			const bytes: Record<string, number> = {};
			for (const [index, size] of targets.entries()) {
				const base64 = await encode(page, dataUrl, size, QUALITY);
				if (!base64) {
					failed.push(`${graduate.slug}: Chromium не віддав webp для ${size}px`);
					continue;
				}
				const file = paths[index];
				fs.writeFileSync(file, Buffer.from(base64, 'base64'));
				bytes[String(size)] = fs.statSync(file).size;
			}

			entries.push({
				slug: graduate.slug,
				sizes: [...targets],
				source: { width: photo.width, height: photo.height },
				bytes
			});
			downloaded++;
			console.log(
				`[${downloaded + skipped}/${withPhoto.length}] ${graduate.slug} → ${targets.map((s) => `${s}px ${Math.round((bytes[String(s)] ?? 0) / 1024)}КБ`).join(', ')}`
			);

			await page.waitForTimeout(DELAY_MS);
		}
	} finally {
		await browser?.close();
	}

	entries.sort((a, b) => a.slug.localeCompare(b.slug));

	fs.mkdirSync(path.dirname(REPORT), { recursive: true });
	fs.writeFileSync(
		REPORT,
		JSON.stringify({ quality: QUALITY, sizes: SIZES, photos: entries }, null, 2),
		'utf8'
	);

	const totalBySize = new Map<number, number>();
	for (const entry of entries) {
		for (const [size, size_bytes] of Object.entries(entry.bytes)) {
			totalBySize.set(Number(size), (totalBySize.get(Number(size)) ?? 0) + size_bytes);
		}
	}
	const total = [...totalBySize.values()].reduce((a, b) => a + b, 0);

	console.log('');
	console.log(`OK портретів ${entries.length} (нових ${downloaded}, вже було ${skipped})`);
	for (const size of SIZES) {
		const sum = totalBySize.get(size) ?? 0;
		if (sum > 0) {
			console.log(
				`   ${String(size).padStart(3)}px: ${Math.round(sum / 1024)} КБ усього, у середньому ${Math.round(sum / entries.length / 1024 * 10) / 10} КБ`
			);
		}
	}
	console.log(`   разом ${Math.round((total / 1024 / 1024) * 100) / 100} МБ у ${OUT_DIR}`);

	if (failed.length > 0) {
		console.warn(`! не вдалося ${failed.length}:`);
		for (const item of failed) console.warn(`   ${item}`);
		process.exit(1);
	}
}

main().catch((error) => {
	console.error('! стягування не завершилося:', error);
	process.exit(1);
});
