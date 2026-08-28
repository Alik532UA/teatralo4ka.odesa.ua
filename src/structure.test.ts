import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * PROJECT-STRUCTURE-v8 § 8.
 *
 * Три перевірки, і третя — про борг, який до 2026-08-16 ніхто не міряв.
 * PROJECT-CONTEXT називав три завеликі файли з числами 2078 / 1296 / 1113.
 * Заміряно: файлів **тридцять**, а ті три мають 2511 / 1419 / 1369 — тобто
 * записані числа не просто застаріли, вони занижені на чотири сотні рядків
 * кожне. Саме проти цього написаний AI-AGENT-PITFALLS-v8 § 5.5: число,
 * назване з пам'яті, живе в документації довго й читається як вимір.
 *
 * Стеля тут — не «мета», а храповик. Канон (§ 8) прямо каже: межу вмикають
 * після того, як чинні порушення розібрані, а доти перелік тримають у тесті
 * як явний allowlist, що тільки скорочується. Тому:
 *   • файл понад свою стелю — падіння (розростання зупинено);
 *   • файл, що впав нижче канонічної межі, мусить піти з переліку — інакше
 *     список перетворюється на пам'ятник;
 *   • новий файл понад канонічну межу — падіння без жодного запису.
 *
 * Стеля НЕ звужується на кожен знятий рядок навмисно: гейт, який червоніє від
 * будь-якої правки в бік покращення, вимикають першим.
 */

/** Канонічні межі § 7. Перший збіг виграє, тож порядок значущий. */
const LIMITS: Array<[RegExp, number]> = [
	[/\/routes\/.*\+page\.svelte$/, 400],
	[/\.svelte$/, 300],
	[/\.svelte\.ts$/, 300],
	[/\.ts$/, 250]
];

/**
 * Заміряно 2026-08-16. Кожен рядок — записаний борг § 7, а не дозвіл. Число
 * можна лише зменшувати; коли воно дійде до канонічної межі, рядок
 * прибирається, і перевірка нижче про це нагадає.
 *
 * Три числа підняті того самого дня, і причина записана, як вимагає § 7:
 * `ContentWidget` 813 → 840, `FooterSection` 562 → 575, `GalleryCarousel`
 * 382 → 404. Це коментарі до виправлення цілей дотику (WCAG 2.2 SC 2.5.8) —
 * пояснення, чому смужка малюється паддінгом, а не висотою. Логіки не додано
 * жодного рядка.
 *
 * Показово інше: підняти їх довелося тому, що храповик СПРАЦЮВАВ на першому ж
 * власному коміті автора цієї перевірки. Тобто вона не декоративна.
 *
 * 2026-08-19, чеклист бета-тестування: два записи додані, і причини різні.
 * `+layout.svelte` 504 → 518 — умова `{#if !data.hidden}` навколо canonical і
 * hreflang плюс коментар, чому службова сторінка їх не отримує.
 * `data/betaChecklist.ts` — 417 рядків при канонічній межі 250, і ділити його
 * нема на що: це ДАНІ, двадцять три пункти двома мовами. Розкладати їх по файлах
 * заради числа означало б розкидати один перелік, який читають цілим. Логіки в
 * файлі нуль — лише типи й константи.
 *
 * 2026-08-23 (друга правка того ж дня): `data/betaChecklist.ts` 368 → 387. Два
 * пункти про заставку й коментар до них. `admin_8` — святкові куліси: оформлення
 * саме собою з'являється тринадцять днів на рік, тож перевірити його інакше, ніж
 * параметром `?splash=flag`, неможливо, і сам цей параметр існує саме для
 * пункту. `admin_9` — заставка на внутрішній сторінці мусить дограти до кінця
 * (гейт `e2e/splash.spec.ts` це вже міряє, тож рівень `testable`).
 *
 * 2026-08-23: `data/betaChecklist.ts` 355 → 368. Два пункти й коментар до них,
 * і додані вони не «про всяк випадок»: разом із `light-dark()` у палітрі
 * з'явилися рівно два стани, яких машина не міряє. `admin_6` перевіряє ВИГРАШ
 * (сторінка з вимкненим JS мусить брати системну тему) — Playwright ганяє
 * сторінку з увімкненим JS, тож автотестом це не перевіряється чесно. `admin_7`
 * перевіряє ЦІНУ (Force Dark на Android при явно обраній світлій темі) — і це
 * можливо лише на пристрої. Файл і далі ДАНІ: логіки в ньому нуль.
 *
 * 2026-08-19: чотири стелі підняті на 3–7 рядків (`admin-articles` 267→272,
 * `articles` 267→275, `admin/settings` 2511→2514, `admin/users` 994→998).
 * Причина одна на всі — `limit()` у запитах до Firestore разом із коментарем,
 * чому саме така стеля (CLOUD-DATABASE-v8 § 7.1, `CDB-QUERY-LIMIT`). Це та
 * ситуація, для якої храповик і має вентиль: рядки додала перевірка іншого
 * правила, і платити за неї подрібненням файлів було б гірше за +3 рядки. Сам
 * храповик спрацював і тут — тобто працює.
 *
 * 2026-08-20: `ContentWidget` 840 → 846. Захист поля вводу в обробнику рівня
 * `window` переїхав із порівняння `tagName` на `isTypingTarget()`
 * (HOTKEYS-v8 HK-TEXT-ENTRY-GUARD, CRITICAL): рядок імпорту плюс коментар про
 * те, чому `closest` бачить `contenteditable`, а тег — ні. Логіки додано нуль,
 * і той самий вентиль, що й у попередньому записі: платити за виправлення
 * CRITICAL-правила подрібненням файлу було б гірше за +6 рядків.
 *
 * 2026-08-20, причини до `svelte-ignore`: шість стель піднято на 5–19 рядків
 * (`ContentWidget` 846→855, `FooterSection` 575→581, `GalleryCarousel` 404→423,
 * `Minimap` 662→668, `PageScrollbar` 399→404, `PianoModal` 682→688). Причина
 * одна на всі: SVELTE-UI-v8 § 4 вимагає записаної причини поруч із кожним
 * знятим попередженням компілятора, і тепер це тримає інваріант
 * `src/svelte-conventions.test.ts`. Логіки не додано жодного рядка — це рівно
 * той самий випадок, що запис про цілі дотику вище, і рівно те, для чого в
 * храповика є вентиль. Дві з восьми знятих заборон при цьому виявилися
 * СПРАВЖНІМИ порушеннями WCAG 2.1.1 і виправлені окремим комітом; інші три
 * записані як відомі межі, а не як розглянуті випадки.
 *
 * 2026-08-20, дубль кнопки «усі»: `ContentWidget` 855 → 868. Правило «або
 * перейти, або дописати решту тут» виїхало в `utils/contentWidgetControls` з
 * інваріантом на всі комбінації входу, а на місці лишилися докблок про причину
 * й коментар про підпис, який не можна позичати. Логіки в компоненті стало
 * МЕНШЕ: гілка `handleShowAll`, що дублювала `handleAllLink`, видалена.
 *
 * 2026-08-20, `GalleryCarousel` 423 → 424: один рядок `data-testid` на кнопку
 * пауза/грати. Контрол був єдиним видимим на публічній частині без локатора —
 * знайдено новим гейтом у `testid-conventions.test.ts`. Атрибут, а не логіка.
 *
 * 2026-08-20, скруглення смужок пагінації: `ContentWidget` 868 → 873,
 * `GalleryCarousel` 424 → 429. Змінено ОДНЕ число (`border-radius` 3px → 999px);
 * решта — коментар про те, чому саме таке: при `background-clip: content-box`
 * радіус зменшується на паддінг і обнуляється, тобто оголошене скруглення не
 * малювалося. Без коментаря наступний «прибирач магічних чисел» повернув би 3px.
 *
 * 2026-08-20, третя спроба зі смужками пагінації: `ContentWidget` 873 → 892,
 * `GalleryCarousel` 429 → 456, `ContentCard` 731 → 759. `border-radius: 999px`
 * дав ЕЛІПС — при `background-clip: content-box` радіус зменшується на паддінг
 * окремо по кожній осі, тож горизонтальний лишився величезним, а вертикальний
 * обрізався половиною висоти. Смужку тепер малює `::before` із власними межами,
 * і вся ця арифметика зникла; заодно з'явилася кнопка «лише іконка» для стану
 * «грає відео» з явним розміром 26px, бо іконка з паддінгом давала 23.6px і
 * ловилася гейтом цілей дотику. Рядки — це коментарі про причину й окремі
 * правила для `::before`; логіки додано нуль.
 * 2026-08-21: `HeaderSection.svelte` 1180 -> 1330. Відокремлено CTA кнопку в мобільному меню,
 * додано точну локалізовану перевірку активних вкладок nav / mobile / dropdown, синхронізацію стану мобільного меню з URL (?menu=open / ?menu=settings)
 * та фіксовану шапку модального вікна налаштувань мобільного меню з закріпленою кнопкою закриття й авторським оверлей-скролом на вмісті.
 * 2026-08-22: `src/routes/residents/adults/[slug]/+page.svelte` 400 -> 420. Додано підтримку кнопок олівця для викладачів з фотографією (25% прозорість, 100% при ховері) та месенджерів адміністратора у спливаючому вікні.
 *
 * 2026-08-26, розміри зображень: `DepartmentsSection` 352 → 353. Три рядки
 * `{@const size = imageSize(...)}` мінус два: помічник звуження типу лишився,
 * а `asset()` переїхав із даних у розмітку. Розгортання `{...imageSize()}`
 * було б коротшим на ті самі три рядки й коштувало б CSP: Svelte додає в
 * елемент зі спредом інлайнові `onload`/`onerror`, і браузер їх блокує.
 *
 * 2026-08-26, стрілки каруселей на фокусі: `GalleryCarousel` 365 → 366. Один
 * рядок — `onfocusout`, що звіряє `relatedTarget` із `contains`; без нього
 * перехід фокуса МІЖ дітьми каруселі читався б як вихід із неї, і автопрокрутка
 * стартувала б на кожен Tab усередині. `ContentWidget` у стелю вклався: там
 * рядків додано стільки ж, скільки прибрано умовою `isEngaged`.
 *
 * 2026-08-28: `+layout.svelte` 316 → 345, `data/betaChecklist.ts` 387 → 390. Додано маршрути /documents, /documents/statute та fallback SEO.
 */
const CEILINGS: Record<string, number> = {
	'src/routes/admin/settings/+page.svelte': 2185,
	'src/lib/components/admin/ArticleForm.svelte': 1195,
	'src/lib/components/HeaderSection.svelte': 1600,
	'src/lib/services/settings.ts': 980,
	'src/routes/admin/content/+page.svelte': 895,
	'src/routes/admin/users/+page.svelte': 890,
	'src/lib/components/ui/MenuEditor.svelte': 865,
	'src/lib/components/ui/RichTextEditor.svelte': 755,
	'src/routes/admin/articles/+page.svelte': 718,
	'src/lib/components/ContentWidget.svelte': 688,
	'src/lib/components/ContentCard.svelte': 598,
	'src/lib/components/ui/PianoModal.svelte': 595,
	'src/routes/residents/adults/[slug]/+page.svelte': 590,
	'src/lib/components/GraduateProfileView.svelte': 1540,
	'src/lib/components/FooterSection.svelte': 510,
	'src/lib/components/GraduateRosterFilters.svelte': 510,
	'src/lib/components/GraduateRoster.svelte': 750,
	'src/routes/projects/galaxy-graduates/[code]/+page.svelte': 535,
	'src/lib/components/ui/Toast.svelte': 488,
	'src/routes/+page.svelte': 432,
	'src/lib/components/GraduateCard.svelte': 475,
	'src/lib/components/ui/Select.svelte': 390,
	'src/lib/components/Minimap.svelte': 375,
	'src/lib/components/GalleryCarousel.svelte': 366,
	'src/lib/data/betaChecklist.ts': 390,
	'src/lib/components/DepartmentsSection.svelte': 353,
	'src/lib/components/HeroSection.svelte': 330,
	'src/lib/components/admin/ArticleCategoryPicker.svelte': 328,
	'src/lib/components/DetailPage.svelte': 322,
	'src/routes/+layout.svelte': 345,
	'src/lib/components/SearchOverlay.svelte': 312
};

const walk = (dir: string, out: string[] = []): string[] => {
	for (const entry of readdirSync(dir)) {
		const full = join(dir, entry).replace(/\\/g, '/');
		if (statSync(full).isDirectory()) walk(full, out);
		else out.push(full);
	}
	return out;
};

const all = walk('src');
const sources = all.filter((f) => /\.(ts|svelte)$/.test(f) && !/\.(test|spec)\.ts$/.test(f));
const countSloc = (f: string): number =>
	readFileSync(f, 'utf8')
		.replace(/<!--[\s\S]*?-->/g, '')
		.replace(/\/\*[\s\S]*?\*\//g, '')
		.replace(/^\s*\/\/.*$/gm, '')
		.split(/\r?\n/)
		.filter((l) => l.trim().length > 0).length;
const limitFor = (f: string) => LIMITS.find(([re]) => re.test(f))?.[1] ?? Infinity;

describe('структура', () => {
	it('знаходить джерела — перевірка жива', () => {
		expect(sources.length).toBeGreaterThan(0);
		expect(Object.keys(CEILINGS).length).toBeGreaterThan(0);
	});

	it('руни лише у .svelte та .svelte.ts (CRITICAL)', () => {
		// Компілятор не обробляє руни поза цими розширеннями: `$state` у
		// звичайному `.ts` не помилка синтаксису, а звичайне звертання до
		// неоголошеної змінної — тобто падіння в рантаймі, а не на збірці.
		const bad = all
			.filter((f) => f.endsWith('.ts') && !f.endsWith('.svelte.ts'))
			.filter((f) => !/\.(test|spec)\.ts$/.test(f))
			.filter((f) => /\$state[({<]|\$derived[({<]|\$effect[({.]/.test(readFileSync(f, 'utf8')));
		expect(bad, `руни у звичайному .ts — не скомпілюються:\n${bad.join('\n')}`).toEqual([]);
	});

	it('псевдонім імпорту збігається з іменем файлу (§ 5.2)', () => {
		// Розбіжність тиха: код працює, а пошук за назвою компонента більше не
		// знаходить місць його використання — і зв'язок «testid ↔ компонент ↔
		// файл» рветься саме там, де на нього спираються перевірки.
		const re = /import\s+([A-Z][A-Za-z0-9]*)\s+from\s+["'][^"']*\/([A-Z][A-Za-z0-9]*)\.svelte["']/g;
		const bad: string[] = [];
		for (const f of sources) {
			for (const m of readFileSync(f, 'utf8').matchAll(re)) {
				if (m[1] !== m[2]) bad.push(`${f}: ${m[1]} -> ${m[2]}.svelte`);
			}
		}
		expect(bad, `розбіжність псевдоніма й файлу:\n${bad.join('\n')}`).toEqual([]);
	});

	it('жоден файл не переріс своєї стелі (§ 7 SLOC)', () => {
		const grown = sources
			.map((f) => {
				const ceiling = CEILINGS[f] ?? limitFor(f);
				const n = countSloc(f);
				return n > ceiling ? `${f}: ${n} рядків SLOC (стеля ${ceiling})` : null;
			})
			.filter(Boolean);
		expect(
			grown,
			`файли виросли — розділити за відповідальністю або оновити стелю разом із причиною:\n${grown.join('\n')}`
		).toEqual([]);
	});

	it('перелік стель не містить зайвого (§ 8)', () => {
		const stale = Object.keys(CEILINGS).filter((f) => !sources.includes(f));
		expect(stale, `файлів більше немає — прибрати з переліку:\n${stale.join('\n')}`).toEqual([]);

		const fixed = Object.keys(CEILINGS)
			.filter((f) => sources.includes(f))
			.filter((f) => countSloc(f) <= limitFor(f))
			.map((f) => `${f}: ${countSloc(f)} — уже в межах ${limitFor(f)}`);
		expect(
			fixed,
			`борг закрито — прибрати рядок із CEILINGS, щоб перелік не став пам'ятником:\n${fixed.join('\n')}`
		).toEqual([]);
	});
});
