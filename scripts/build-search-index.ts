import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';

/**
 * Покажчик пошуку по АНКЕТАХ — те, чого немає в бандлі.
 *
 * ## Навіщо він узагалі
 *
 * Пошук по сайту бачив лише ШАПКИ реєстрів: імена людей, назви вистав, курсів,
 * закладів. Усе, що всередині анкети, лежить окремими файлами
 * (`static/graduates/profiles/*.json`, `static/masters/profiles/*.json`), які
 * сторінка тягне по одному, коли відкривають картку. Заміряно 2026-09-05: шість
 * із шести правдоподібних запитів давали нуль —
 *
 *   «Риськіна» (майстер), «Той, що отримує ляпаса» (роль у виставі),
 *   «Ляпаса», «Пісня пісень» і «Пекельна Хоругва» (фільми в біографіях),
 *   «Богомазова» (курс, названий в анкетах).
 *
 * Шукати по 361 файлу з браузера не можна, а класти їх у бандл — тим паче: це
 * 45 КБ тексту анкет випускників плюс 76 КБ анкет майстрів, які платила б кожна
 * сторінка сайту. Тому текст збирається ТУТ, на збірці, в один файл, а браузер
 * тягне його один раз — коли пошук справді відкрили.
 *
 * ## Що саме кладеться у файл
 *
 * Не запис пошуку, а ДОДАТКОВИЙ ТЕКСТ до запису, який пошук уже має:
 * `{ "person:<slug>": "…", "master:<slug>": "…" }`. Ключі — ті самі, що будує
 * `services/searchGalaxy`, тож накладка просто дописує текст до наявних
 * записів. Через це людина лишається ОДНИМ рядком у результатах (а не двома —
 * «людина» і «текст про людину»), і збіг у ІМЕНІ й далі важить утричі більше за
 * збіг у тексті — саме так, як задумано в `utils/siteSearch`.
 *
 * ## Кого сюди НЕ беремо
 *
 * Тих, кого приховали навмисно (`visibility` не `listed`; учні — виняток, вони
 * `linked`, але в пошуку є). І це не лише про пошук: файл лежить у `static/`,
 * тобто його можна відкрити прямо. Скласти в нього текст прихованої людини
 * означало б віддати її одним запитом — рівно те, від чого рівень `direct`
 * і захищає.
 *
 * ## Свіжість
 *
 * Файл генерується в `prebuild`, тобто перед КОЖНОЮ збіркою, і звіряється
 * гейтом `src/search-index.test.ts`: він перебудовує покажчик у пам'яті й
 * порівнює з тим, що в репозиторії. Застарілий файл — червоний прогін, а не
 * тихо неповний пошук.
 */

const ІНДЕКС_ЛЮДЕЙ = 'src/lib/data/graduates.index.json';
const ІНДЕКС_МАЙСТРІВ = 'src/lib/data/masters.index.json';
const АНКЕТИ_ЛЮДЕЙ = 'static/graduates/profiles';
const АНКЕТИ_МАЙСТРІВ = 'static/masters/profiles';
export const ФАЙЛ_ПОКАЖЧИКА = 'static/search/profiles.json';

interface ЗаписЛюдини {
	id: string;
	slug: string;
	code?: string;
	name: string;
	visibility?: string;
	kind?: string;
}

interface ЗаписМайстра {
	id: string;
	slug: string;
	visibility?: string;
}

const читати = <T>(шлях: string): T => JSON.parse(readFileSync(шлях, 'utf8')) as T;

/** Порожнє, повтори й зайві пробіли геть — у пошуку вони лише вага. */
function зібрати(частини: (string | undefined | null)[]): string {
	const бачені = new Set<string>();
	for (const частина of частини) {
		const рядок = (частина ?? '').replace(/\s+/gu, ' ').trim();
		if (рядок) бачені.add(рядок);
	}
	return [...бачені].join(' · ');
}

/**
 * Текст анкети випускника.
 *
 * `plays[].text` уже містить і назву вистави, і роль одним рядком (««Уривки з
 * класики: Той, що отримує ляпаса», Той») — саме його автор і шукав. Решта
 * полів дописується поруч, бо шукають і за ними: фільм із біографії, фестиваль,
 * рядок «після випуску».
 */
function текстЛюдини(анкета: Record<string, unknown>): string {
	const частини: (string | undefined)[] = [];
	const bio = анкета.bio;
	if (Array.isArray(bio)) частини.push(...(bio as string[]));
	else if (typeof bio === 'string') частини.push(bio);

	for (const поле of ['duringStudies', 'afterGraduation', 'archiveNote'] as const) {
		const значення = анкета[поле];
		if (typeof значення === 'string') частини.push(значення);
	}

	const plays = анкета.plays;
	if (Array.isArray(plays)) {
		for (const виступ of plays as Record<string, unknown>[]) {
			частини.push(typeof виступ.text === 'string' ? виступ.text : undefined);
			частини.push(typeof виступ.role === 'string' ? виступ.role : undefined);
		}
	}

	const festivals = анкета.festivals;
	if (Array.isArray(festivals)) {
		for (const фестиваль of festivals) {
			частини.push(typeof фестиваль === 'string' ? фестиваль : JSON.stringify(фестиваль));
		}
	}

	return зібрати(частини);
}

/** Текст анкети майстра: посада, предмети, біографія, повне ім'я. */
function текстМайстра(анкета: Record<string, unknown>): string {
	const частини: (string | undefined)[] = [];
	for (const поле of ['fullName', 'fullNameEn', 'roleTitle', 'bio'] as const) {
		const значення = анкета[поле];
		if (typeof значення === 'string') частини.push(значення);
	}
	const subjects = анкета.subjects;
	if (Array.isArray(subjects)) частини.push(...(subjects as string[]));
	return зібрати(частини);
}

/** Чи потрапляє людина в пошук — те саме правило, що в `services/searchGalaxy`. */
function уПошуку(запис: { visibility?: string; kind?: string }): boolean {
	const рівень = запис.visibility ?? 'listed';
	if (рівень === 'listed') return true;
	return рівень === 'linked' && запис.kind === 'student';
}

export function зібратиПокажчик(): Record<string, string> {
	const покажчик: Record<string, string> = {};

	for (const запис of читати<ЗаписЛюдини[]>(ІНДЕКС_ЛЮДЕЙ)) {
		if (!уПошуку(запис)) continue;
		const файл = join(АНКЕТИ_ЛЮДЕЙ, `${запис.code ?? запис.slug}.json`);
		if (!existsSync(файл)) continue;
		const текст = текстЛюдини(читати<Record<string, unknown>>(файл));
		if (текст) покажчик[`person:${запис.slug}`] = текст;
	}

	for (const запис of читати<ЗаписМайстра[]>(ІНДЕКС_МАЙСТРІВ)) {
		if ((запис.visibility ?? 'listed') !== 'listed') continue;
		const файл = join(АНКЕТИ_МАЙСТРІВ, `${запис.slug}.json`);
		if (!existsSync(файл)) continue;
		const текст = текстМайстра(читати<Record<string, unknown>>(файл));
		if (текст) покажчик[`master:${запис.slug}`] = текст;
	}

	return покажчик;
}

function записати(): void {
	const покажчик = зібратиПокажчик();
	const тека = dirname(ФАЙЛ_ПОКАЖЧИКА);
	if (!existsSync(тека)) mkdirSync(тека, { recursive: true });

	/* Ключі впорядковані: інакше порядок залежав би від файлової системи, і
	   кожна збірка давала б інший diff при тому самому вмісті. */
	const впорядкований: Record<string, string> = {};
	for (const ключ of Object.keys(покажчик).sort()) впорядкований[ключ] = покажчик[ключ];

	const текст = `${JSON.stringify(впорядкований, null, '\t')}\n`;
	writeFileSync(ФАЙЛ_ПОКАЖЧИКА, текст, 'utf8');

	const людей = Object.keys(впорядкований).filter((k) => k.startsWith('person:')).length;
	const майстрів = Object.keys(впорядкований).length - людей;
	console.log(
		`🔎 покажчик анкет: ${людей} випускників + ${майстрів} майстрів, ` +
			`${(Buffer.byteLength(текст) / 1024).toFixed(0)} КБ у ${ФАЙЛ_ПОКАЖЧИКА}`
	);
}

/*
 * Запис — лише при ПРЯМОМУ запуску.
 *
 * Гейт `src/search-index.test.ts` імпортує звідси `зібратиПокажчик`, щоб
 * перебудувати покажчик у пам'яті й порівняти з файлом. Якби модуль писав файл
 * на імпорті, перевірка сама б його й оновлювала — тобто ніколи не червоніла.
 */
if (process.argv[1]?.includes('build-search-index')) записати();
