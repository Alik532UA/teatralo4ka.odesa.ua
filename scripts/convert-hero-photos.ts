import fs from 'node:fs';
import path from 'node:path';
import { chromium, type Page } from '@playwright/test';

/**
 * Знімки героя головної — у webp кількох ширин, БЕЗ КАДРУВАННЯ.
 *
 * ## Навіщо
 *
 * Заміряно 2026-09-10: герой тягнув 1107 КБ двома JPEG без жодного `srcset` —
 * `DSC_1405.jpg` (259 КБ, 1280×804) і `DJI_0759 v02.jpg` (848 КБ, 4068×3070).
 * Слот у розкладці має щонайбільше 544 CSS px (заміряно в браузері на 1440 і
 * 1920 — однаково 544; 500 на планшеті, 311 на телефоні), тобто другий знімок
 * приходив увосьмеро більшим, ніж є куди його покласти.
 *
 * Друга половина ціни — вигляд. 848 КБ baseline JPEG браузер малює ЗГОРИ ВНИЗ
 * у міру приходу байтів, і на екрані це смужка фото над суцільним блоком.
 * Плавна поява (`installImageReveal`) часткове малювання ховає, але чекання
 * лишається довгим саме через вагу.
 *
 * ## Чому БЕЗ кадрування
 *
 * Рішення автора, і воно зберігає нинішній вигляд точно. Слот має
 * `aspect-ratio: 4 / 3` і `object-fit: cover`, тобто ОБРІЗАННЯ ВЖЕ РОБИТЬ
 * БРАУЗЕР, і робить його з повного кадру. Обріж джерело — і те, що видно в
 * слоті, зміниться; масштабуй повний кадр — і не зміниться нічого, крім ваги.
 *
 * Пропорції двох знімків різні (1.59 і 1.325), і вони так і лишаються різними:
 * кожен зменшується по своїй ширині, висота виводиться з його ж пропорції.
 *
 * ## Чому Chromium, а не бібліотека
 *
 * Той самий кодек, що в `fetch-graduate-photos.ts`: `OffscreenCanvas` уміє
 * `image/webp`, а нових залежностей проєкт не бере (DEPENDENCIES-v9 § 1).
 * Усередині `page.evaluate` жодної НАЗВАНОЇ функції — `tsx` (esbuild) обгортає
 * їх хелпером `__name`, якого в контексті сторінки немає. Пастка вже записана
 * в `crawl-ats-ua.ts` і в конвертері портретів.
 *
 * ## Використання
 *
 *   npx tsx scripts/convert-hero-photos.ts
 *
 * Кличеться руками й один раз: джерела лежать у `design-source/hero/`, вихід —
 * у `static/photo/`. Це не крок збірки, тому в `package.json` його немає —
 * інакше кожен `npm run build` підіймав би Chromium заради файлів, які не
 * змінюються (той самий вибір, що для `fetch-graduate-photos.ts`).
 */

/**
 * Ширини мініатюри — із заміру слота, а не «про запас».
 *
 * 544 — максимум CSS-ширини слота; 1088 — те саме на екрані з DPR 2; 768 —
 * телефон із DPR 2 (311 × 2 = 622) і десктоп із DPR 1.5; 320 — телефон із
 * DPR 1. Ширшого тут немає навмисно: слот не росте.
 */
const ШИРИНИ = [320, 544, 768, 1088] as const;

/**
 * ОКРЕМИЙ ВЕЛИКИЙ ВАРІАНТ — для перегляду на весь екран, і без нього правка
 * була б регресом.
 *
 * Клік по герою відкриває `PhotoLightbox`, і той бере ТОЙ САМИЙ `src`, що й
 * мініатюра. Саме тому знімок на 848 КБ тут і жив: він працював за двох, і
 * зменшити його «до слота» означало б зламати перегляд на весь екран.
 *
 * 2560, і щедро — навмисно. Цей варіант вантажиться ЛИШЕ НА КЛІК, тобто його
 * вага не входить у завантаження сторінки взагалі; єдиний, хто за неї платить,
 * — людина, яка саме зараз хоче розглянути знімок. Тому питання не «скільки не
 * шкода», а «скільки треба, щоб не було гірше, ніж було».
 *
 * Геометрія лайтбокса: `max-width: 90vw`, `max-height: 78dvh`,
 * `object-fit: contain`. На 2560×1440 висота впирається першою (78dvh ≈ 1123),
 * тобто для 4:3 це ≈ 1497 CSS px — а на такому екрані з DPR 2 треба вже ~2994.
 * Півтори тисячі дали б помітно м'якшу картинку, ніж нинішні 4068 px джерела:
 * це був би обмін «сторінка легша, розглянути гірше», і його ніхто не просив.
 *
 * 2560 покриває 1497 CSS px аж до DPR 1.7 і лишається вдвічі легшим за
 * оригінал. Сам оригінал при цьому НІКУДИ НЕ ЗНИКАЄ — він лежить у
 * `design-source/hero/`, і якщо колись знадобиться справжній повний розмір,
 * його є звідки взяти.
 */
const ПОВНА_ШИРИНА = 2560;

/**
 * 82 замість типового 80.
 *
 * У портретах випускників стоїть нижча якість, бо там обличчя 96–480 px і
 * артефакти видно на шкірі. Тут кадр загальний — дахи, натовп, — і 82 дає
 * помітно чистіші дрібні деталі за ті ж кілобайти. Число перевірене оком на
 * найгіршому з двох знімків (аерофото з черепицею).
 */
const ЯКІСТЬ = 0.82;

const ДЖЕРЕЛА = 'design-source/hero';
const ВИХІД = 'static/photo';

/** Основа імені: `DJI_0759 v02.jpg` → `dji-0759-v02`. */
function основа(джерело: string): string {
	return path
		.basename(джерело, path.extname(джерело))
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/(^-|-$)/g, '');
}

async function перекодувати(
	page: Page,
	dataUrl: string,
	ширина: number,
	якість: number
): Promise<{ base64: string; height: number } | null> {
	return page.evaluate(
		async ([source, target, q]: [string, number, number]) => {
			const response = await fetch(source);
			const bitmap = await createImageBitmap(await response.blob());

			// БЕЗ КАДРУВАННЯ: увесь кадр, висота — з пропорції джерела.
			const height = Math.round((target * bitmap.height) / bitmap.width);

			const canvas = new OffscreenCanvas(target, height);
			const ctx = canvas.getContext('2d');
			if (!ctx) return null;
			ctx.imageSmoothingEnabled = true;
			ctx.imageSmoothingQuality = 'high';
			ctx.drawImage(bitmap, 0, 0, bitmap.width, bitmap.height, 0, 0, target, height);
			bitmap.close();

			const blob = await canvas.convertToBlob({ type: 'image/webp', quality: q });
			if (blob.type !== 'image/webp') return null;

			const buffer = new Uint8Array(await blob.arrayBuffer());
			let binary = '';
			for (const byte of buffer) binary += String.fromCharCode(byte);
			return { base64: btoa(binary), height };
		},
		[dataUrl, ширина, якість] as [string, number, number]
	);
}

async function main() {
	if (!fs.existsSync(ДЖЕРЕЛА)) {
		console.error(`❌ немає ${ДЖЕРЕЛА}/ — покладіть туди повні знімки героя`);
		process.exit(1);
	}
	const джерела = fs
		.readdirSync(ДЖЕРЕЛА)
		.filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
		.sort();
	if (джерела.length === 0) {
		console.error(`❌ у ${ДЖЕРЕЛА}/ немає зображень`);
		process.exit(1);
	}

	fs.mkdirSync(ВИХІД, { recursive: true });
	const browser = await chromium.launch();
	const page = await browser.newPage();
	const звіт: string[] = [];

	try {
		for (const файл of джерела) {
			const повний = path.join(ДЖЕРЕЛА, файл);
			const байти = fs.readFileSync(повний);
			const тип = /\.png$/i.test(файл) ? 'image/png' : /\.webp$/i.test(файл) ? 'image/webp' : 'image/jpeg';
			const dataUrl = `data:${тип};base64,${байти.toString('base64')}`;

			const власна = await page.evaluate(async (source: string) => {
				const bitmap = await createImageBitmap(await (await fetch(source)).blob());
				const w = bitmap.width;
				bitmap.close();
				return w;
			}, dataUrl);

			// Апскейлу немає: варіант ширший за джерело не додає жодного пікселя,
			// а дескриптор у `srcset` став би неправдивим. `DSC_1405` має 1280 px,
			// тож його «повний» варіант і буде 1280, а не 1600.
			const завдання = [
				...ШИРИНИ.filter((ш) => ш <= власна).map((ш) => ({ ширина: ш, повний: false })),
				{ ширина: Math.min(ПОВНА_ШИРИНА, власна), повний: true }
			];

			звіт.push(`   ← ${файл} (${(байти.length / 1024).toFixed(0)} КБ, ${власна} px)`);
			for (const { ширина, повний } of завдання) {
				const результат = await перекодувати(page, dataUrl, ширина, ЯКІСТЬ);
				if (!результат) {
					console.error(`❌ Chromium не віддав webp: ${файл} @ ${ширина}px`);
					process.exit(1);
				}
				const назва = повний
					? `hero-${основа(файл)}-full.webp`
					: `hero-${основа(файл)}-${ширина}.webp`;
				const куди = path.join(ВИХІД, назва);
				fs.writeFileSync(куди, Buffer.from(результат.base64, 'base64'));
				const кб = fs.statSync(куди).size / 1024;
				звіт.push(`      ${назва}  ${ширина}×${результат.height}  ${кб.toFixed(1)} КБ`);
			}
		}
	} finally {
		await browser.close();
	}

	console.log(`🖼️  герой: ${джерела.length} знімків × ${ШИРИНИ.length} ширин`);
	for (const рядок of звіт) console.log(рядок);
}

void main();
