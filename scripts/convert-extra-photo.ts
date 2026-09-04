/**
 * Конвертує додаткове фото випускника у 3 розміри webp.
 *
 * Використання:
 *   npx tsx scripts/convert-extra-photo.ts --slug=... --index=1 --src="C:\path\photo.jpg"
 *   ... --top=0.02   — зсунути квадрат вище (0 = від самого верху, 0.5 = центр)
 *   ... --left=0.35  — те саме по горизонталі для широких знімків
 *
 * Використовує Playwright/Chromium як кодек webp (як fetch-graduate-photos.ts).
 *
 * ## ЧОМУ КВАДРАТ БЕРЕТЬСЯ НЕ З ЦЕНТРУ
 *
 * Доти обрізка була строго центральною, і на портретних знімках вона різала
 * МАКУШКУ. Заміряно на теці з 27 фотографіями (2026-09-05): голова зрізана або
 * впритул до краю у восьми — Павло Кошка, Анна Степанова, Євгеній Тищенко,
 * Аліса Тункевич, Анастасія Чепелюк, Максим Наконечний, Дар'я Дрикина, Дана
 * Брошкова. Автор побачив це першим і назвав поіменно.
 *
 * Причина проста: у вертикальному портреті обличчя майже завжди у ВЕРХНІЙ
 * третині, а зайва висота — це ноги й тло внизу. Центр ділить надлишок навпіл,
 * тобто половину зрізає згори.
 *
 * Тому у вертикальних знімків квадрат тепер береться біля верху (`TOP_BIAS`);
 * горизонтальні лишаються центрованими — там надлишок по ширині, і людина
 * зазвичай посередині. Обидва значення перекриваються прапорцями: жодне число
 * не вгадає кадру, де людина стоїть скраю.
 */

/**
 * Частка ЗАЙВОЇ висоти, що лишається НАД квадратом у вертикальних знімках.
 *
 * 0.08, а не 0: невеликий запас згори лишає повітря над головою — інакше
 * портрет, знятий упритул, починався б рівно з волосся.
 */
const TOP_BIAS = 0.08;
/** Горизонталь лишається центром: у широкому кадрі людина зазвичай посередині. */
const LEFT_BIAS = 0.5;
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
	let top = TOP_BIAS;
	let left = LEFT_BIAS;

	for (const arg of args) {
		if (arg.startsWith('--slug=')) slug = arg.slice('--slug='.length);
		if (arg.startsWith('--index=')) index = parseInt(arg.slice('--index='.length), 10);
		if (arg.startsWith('--src=')) src = arg.slice('--src='.length);
		if (arg.startsWith('--top=')) top = Number(arg.slice('--top='.length));
		if (arg.startsWith('--left=')) left = Number(arg.slice('--left='.length));
	}

	if (!slug || !index || index < 1 || !src) {
		console.error('Usage: npx tsx scripts/convert-extra-photo.ts --slug=<slug> --index=<N> --src=<path>');
		process.exit(1);
	}

	if (!fs.existsSync(src)) {
		console.error(`Source file not found: ${src}`);
		process.exit(1);
	}

	/* Поза межами 0..1 квадрат вийшов би за краї зображення. */
	top = Math.min(1, Math.max(0, Number.isFinite(top) ? top : TOP_BIAS));
	left = Math.min(1, Math.max(0, Number.isFinite(left) ? left : LEFT_BIAS));

	return { slug, index, src, top, left };
}

async function main() {
	const { slug, index, src, top, left } = parseArgs();

	console.log(`Converting ${src} for ${slug} (index ${index}, top ${top}, left ${left})...`);

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
			async ({ dataUrl, size, quality, top, left }) => {
				return new Promise<string>((resolve, reject) => {
					const img = new Image();
					img.onload = async () => {
						// Квадрат: по горизонталі центр, по вертикалі — ближче до верху.
						// Розбір, чому не центр, — у докблоці файлу.
						const side = Math.min(img.width, img.height);
						const sx = Math.round((img.width - side) * left);
						const sy = Math.round((img.height - side) * top);

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
			{ dataUrl, size, quality: QUALITY, top, left }
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
