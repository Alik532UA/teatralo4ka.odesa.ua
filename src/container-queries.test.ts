// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Медіазапит там, де мав бути контейнерний (FLUID-SIZING-v8 § 7A, `FS-CONTAINER`,
 * HIGH).
 *
 * Медіазапит міряє ВІКНО. Картка стоїть у сітці, у сайдбарі або в модалці — і на
 * широкому екрані може мати 240px. Через це компонент, який зверстали під
 * «десктоп», ламається першого ж разу, коли його кладуть у вужче місце: правильний
 * вигляд він дає рівно в одному розкладі.
 *
 * ## Що саме тут перевіряється
 *
 * Не «замінити `@media` на `@container`»: канон прямо каже, що `@media` лишається
 * доречним для того, що справді залежить від пристрою чи вікна. Перевіряється
 * інше — щоб ВИБІР був зроблений і записаний. До 2026-08-28 у PROJECT-CONTEXT.md
 * стояло «скільки з 24 таких — не рахували», тобто борг без числа, який не
 * скорочується, бо ніхто не знає, з чого він складається.
 *
 * Тепер кожен компонент із РОЗМІРНИМ медіазапитом має вердикт, а нового
 * компонента без вердикту гейт не пропускає. Компоненти, у яких `@media` лише
 * `prefers-*`, `print`, `hover` чи `orientation`, до переліку не входять: там
 * альтернативи немає в принципі.
 *
 * ## Результат перебору (2026-08-28, замість слова «не рахували»)
 *
 * 28 компонентів із `@media`, з них 22 із розмірними запитами. Двадцять один —
 * `window`: це або накладки й фіксовані шари (лайтбокс, пошук, тости, картка
 * випускника, аркуш переліку), або смуги на всю ширину сторінки (шапка, підвал,
 * герой, секції новин і проєктів), або кількість колонок самої сторінки — усе це
 * справді питання про вікно.
 *
 * `container` — ОДИН: `ContentCard`. Він рендериться у трьох різних за шириною
 * місцях (карусель із власною `--focus-card-width`, сітка `auto-fill` від однієї
 * до трьох колонок, список), а внутрішню розкладку міняє за шириною ВІКНА. На
 * екрані 1400px картка в триколонковій сітці має близько 430px і отримує вигляд,
 * розрахований на вдвічі ширшу.
 *
 * ## Чому він не переписаний цим же комітом
 *
 * Заміна не механічна. `@media (max-width: 1024px)` спрацьовує на вікні 1024,
 * `@container (max-width: N)` — на контейнері N, і N звідти не виводиться: його
 * треба взяти з реальних ширин картки в кожному з трьох місць і звірити оком у
 * браузері. Помилка в N міняє вигляд головної на десктопі, тобто ціна
 * неперевіреного припущення тут вища за сам борг. Той самий компонент несе й
 * сусідній борг («картка в режимі списку рендериться ДВІЧІ»), і розв'язувати їх
 * варто разом: обидва існують саме тому, що компонент не знає власної ширини.
 *
 * Число боргу звіряється на РІВНІСТЬ (CODE-QUALITY-v8 `CQ-ESLINT-DEBT-LEDGER`):
 * борг не може ані вирости мовчки, ані «зникнути» без правки цього числа.
 *
 * Зворотний експеримент (AI-AGENT-PITFALLS-v8 § 1.1): дописати `@media
 * (max-width: 700px)` у будь-який компонент без вердикту — гейт мусить назвати
 * саме його. Зроблено на `GraduateStar.svelte`, падає.
 */

const COMPONENTS = 'src/lib/components';

/** Запити, у яких `@container` не альтернатива: питання не про місце. */
const NOT_ABOUT_SPACE = /prefers-|^\s*print|hover\s*:|pointer\s*:|orientation\s*:|forced-colors/i;

/** Розмірний запит — той, що питає ширину або висоту. */
const ABOUT_SIZE = /(min|max)-(width|height)\s*:/i;

type Axis = 'window' | 'container';

/**
 * Вердикт для кожного компонента з розмірним медіазапитом.
 *
 * `window` — вигляд справді залежить від вікна: накладка, фіксований шар, смуга
 * на всю ширину сторінки або кількість колонок самої сторінки.
 * `container` — вигляд залежить від НАЯВНОГО МІСЦЯ, тобто це борг на `@container`.
 */
const VERDICT: Record<string, { axis: Axis; why: string }> = {
	'ContentCard.svelte': {
		axis: 'container',
		why:
			'та сама картка рендериться в каруселі (ширину задає `--focus-card-width` ' +
			'віджета), у сітці `auto-fill` від однієї до трьох колонок і в списку — ' +
			'а внутрішню розкладку міняє за шириною ВІКНА'
	},
	'ContentWidget.svelte': {
		axis: 'window',
		why:
			'віджет займає всю ширину сторінки; розмірні запити міняють кількість ' +
			'колонок сітки, висоту каруселі й шапку — це питання про сторінку, а не ' +
			'про місце, що дісталося (§ 7A: контейнерним запитом кількість колонок ' +
			'порахувати не можна — їх ще не існує на момент виміру)'
	},
	'DepartmentsSection.svelte': { axis: 'window', why: 'секція на всю ширину сторінки' },
	'DetailPage.svelte': { axis: 'window', why: 'розкладка самої сторінки статті' },
	'FooterSection.svelte': { axis: 'window', why: 'підвал сайту — завжди на всю ширину вікна' },
	'GalleryCarousel.svelte': {
		axis: 'window',
		why:
			'смуга на всю ширину; запит на 480px збільшує ціль дотику крапок — ' +
			'це про палець, а не про місце'
	},
	'GraduateCard.svelte': { axis: 'window', why: '`position: fixed` — накладка поверх сторінки' },
	'GraduateProfileView.svelte': { axis: 'window', why: 'розкладка всієї сторінки профілю' },
	'GraduateRoster.svelte': { axis: 'window', why: 'аркуш на весь екран' },
	'GraduateRosterFilters.svelte': { axis: 'window', why: 'панель того самого аркуша' },
	'GraduateRosterYears.svelte': { axis: 'window', why: 'шкала того самого аркуша' },
	'HeaderSection.svelte': { axis: 'window', why: 'шапка сайту — завжди на всю ширину вікна' },
	'HeroSection.svelte': { axis: 'window', why: 'герой на всю ширину першого екрана' },
	'MasterGraduateFlow.svelte': {
		axis: 'window',
		why: 'потік зірок на всю ширину сторінки; 860px — межа, за якою смуг дві, а не одна'
	},
	'NewsSection.svelte': { axis: 'window', why: 'відступи секції сторінки' },
	'PhotoLightbox.svelte': { axis: 'window', why: 'накладка на весь екран' },
	'VideoModal.svelte': { axis: 'window', why: '`position: fixed` — плеєр поверх сторінки' },
	'GroupPlaysTimeline.svelte': {
		axis: 'window',
		why:
			'смуга на всю ширину секції сторінки групи — єдине місце, де вона стоїть. ' +
			'Потрапить у вузьку колонку картки випускника — вердикт треба перерішити на @container'
	},
	'ProjectsSection.svelte': { axis: 'window', why: 'відступи секції сторінки' },
	'SearchOverlay.svelte': { axis: 'window', why: 'фіксована панель поверх сторінки' },
	'StaticPage.svelte': { axis: 'window', why: 'розкладка самої сторінки й таблиць у тексті' },
	'admin/ArticleForm.svelte': { axis: 'window', why: 'форма займає сторінку адмінки цілком' },
	'ui/PianoModal.svelte': { axis: 'window', why: 'модалка на весь екран' },
	'ui/Toast.svelte': { axis: 'window', why: 'фіксований контейнер сповіщень' }
};

/**
 * Скільки компонентів чекають на `@container`.
 *
 * Звіряється на РІВНІСТЬ: число має лише спадати, і кожна зміна — свідома.
 */
const CONTAINER_DEBT = 1;

function walk(dir: string, out: string[] = []): string[] {
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const full = join(dir, entry.name);
		if (entry.isDirectory()) walk(full, out);
		else if (entry.name.endsWith('.svelte')) out.push(full);
	}
	return out;
}

/** Умови всіх `@media` у тексті, без коментарів. */
function mediaConditions(source: string): string[] {
	const text = source.replace(/\/\*[\s\S]*?\*\//g, ' ');
	return [...text.matchAll(/@media([^{]*)\{/g)].map((m) => m[1].trim());
}

describe('вибір між @media і @container зроблений і записаний (FLUID-SIZING-v8 § 7A)', () => {
	const files = walk(COMPONENTS).map((f) => ({
		key: f.replace(/\\/g, '/').slice(COMPONENTS.length + 1),
		source: readFileSync(f, 'utf8')
	}));

	const withMedia = files.filter((f) => mediaConditions(f.source).length > 0);
	const sized = withMedia.filter((f) =>
		mediaConditions(f.source).some((c) => ABOUT_SIZE.test(c) && !NOT_ABOUT_SPACE.test(c))
	);

	it('перевірка жива: компоненти з медіазапитами знайдено', () => {
		expect(files.length, 'компонентів не знайдено — сканер шукає не там').toBeGreaterThan(40);
		expect(
			withMedia.length,
			'жодного @media у компонентах — або розбір зламався, або гейт більше не потрібен'
		).toBeGreaterThan(10);
		expect(sized.length, 'жодного РОЗМІРНОГО запиту — розбір умов зламався').toBeGreaterThan(10);
	});

	it('розбір живий: розмірний запит відрізняється від решти', () => {
		expect(mediaConditions('@media (max-width: 700px) { a { color: red } }')).toEqual([
			'(max-width: 700px)'
		]);
		expect(mediaConditions('/* @media (max-width: 700px) */'), 'коментар — не код').toEqual([]);

		expect(ABOUT_SIZE.test('(max-width: 700px)')).toBe(true);
		expect(ABOUT_SIZE.test('(prefers-reduced-motion: reduce)')).toBe(false);
		expect(NOT_ABOUT_SPACE.test('(orientation: portrait)'), 'орієнтація — не про місце').toBe(true);
		expect(NOT_ABOUT_SPACE.test('(hover: none)'), 'наведення — не про місце').toBe(true);
		expect(NOT_ABOUT_SPACE.test('print'), 'друк — не про місце').toBe(true);
	});

	it('кожен компонент із розмірним запитом має вердикт', () => {
		const missing = sized.map((f) => f.key).filter((key) => !(key in VERDICT));
		expect(
			missing,
			'новий компонент міряє вікно, і ніхто не вирішив, чи це правильно. ' +
				'Питання одне: його вигляд залежить від ВІКНА чи від МІСЦЯ, яке йому ' +
				`дісталося? Відповідь — рядок у VERDICT:\n  ${missing.join('\n  ')}`
		).toEqual([]);
	});

	it('жоден вердикт не пережив свій компонент', () => {
		const keys = new Set(sized.map((f) => f.key));
		const stale = Object.keys(VERDICT).filter((key) => !keys.has(key));
		expect(
			stale,
			'вердикт є, а розмірного медіазапиту в компоненті вже немає — рядок ' +
				`застарів:\n  ${stale.join('\n  ')}`
		).toEqual([]);
	});

	it('борг на @container не виріс і не зник мовчки', () => {
		const debt = sized
			.filter((f) => VERDICT[f.key]?.axis === 'container')
			.filter((f) => !/@container/.test(f.source))
			.map((f) => f.key)
			.sort();

		expect(
			debt.length,
			`компонентів, що чекають на @container: ${debt.join(', ') || '—'}. ` +
				'Число звіряється на рівність: якщо борг закрито — понизити CONTAINER_DEBT ' +
				'тим самим комітом; якщо виріс — це нове рішення, а не випадковість'
		).toBe(CONTAINER_DEBT);
	});
});
