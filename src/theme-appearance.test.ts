// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { THEMES as THEME_KEYS, TokenResolver, type Rgb } from '../vitest/support/tokens';

/**
 * Вигляд НЕ наших пікселів — тих, що малює браузер: мета-тег `color-scheme`,
 * схема документа й нативні частини полів (UI-UX-v8 § 1.2, § 1.5.1).
 *
 * ## Що тут змінилося 2026-08-23 і чому попередня редакція вимагала протилежного
 *
 * Доти цей файл вимагав ДВОХ речей, які тепер заборонені:
 *
 *   1. щоб `color-scheme` оголошувався САМИМ КОНТРОЛАМ (`input`, `textarea`,
 *      `select`), а не документу;
 *   2. щоб на `:root`/`html` його не було ЗОВСІМ — «це справа мета-тега».
 *
 * Причина була справжня і заміряна: документ оголошував схему лише мета-тегом
 * `light dark`, тобто «браузер, вирішуй сам», і за темної системи браузер малював
 * ТЕМНІ контроли поверх нашої СВІТЛОЇ сторінки — світла іконка календаря на
 * світлому полі `type="date"`.
 *
 * Тепер палітра описана `light-dark()`, а схема оголошена документу й звужена під
 * кожну з чотирьох тем. Контроли беруть її звідти й збігаються зі сторінкою
 * завжди. А старий обхід у новому стані ЛАМАВСЯ б рівно там, де з'явився виграш:
 * у людини без збереженого вибору й темною системою сторінка тепер темна, а
 * `input { color-scheme: light }` малював би на ній світлі контроли.
 *
 * ## ЧОМУ ЗАБОРОНА `color-scheme` НА `:root` БУЛА НАДТО ШИРОКОЮ
 *
 * Її мета — не пустити Force Dark Mode на Android Chrome, який інвертує кольори
 * сторінки, коли та не заявила підтримки темної схеми. Але заявою про підтримку є
 * саме `light dark`, і тепер вона стоїть на `:root` ЯВНО — тобто сильніше, ніж
 * була в мета-тезі. Заборона ж накривала і цей випадок.
 *
 * Що справді лишається компромісом: `html.light-theme { color-scheme: light }`.
 * Людина, яка ЯВНО обрала світлу тему і має ввімкнений Force Dark, отримає
 * інверсію від браузера. Ціна альтернативи вища й безумовна: без звуження явний
 * вибір «світла» не переміг би системну перевагу, і в темній системі перемикач
 * теми просто не працював би. Перше — налаштування самого відвідувача, друге —
 * дефект сайту для всіх.
 *
 * Перевірити інверсію можна лише на пристрої, тож пункт про це є в
 * `/beta-test-checklists` (вкладка «Тема»).
 *
 * Ці пікселі не покриває більше ніщо: у `contrast.test.ts` кольору іконки немає в
 * джерелах, а axe не бачить тіньового DOM елементів керування.
 */

const APP_HTML = readFileSync('src/app.html', 'utf8');
const GLOBAL_CSS = readFileSync('src/lib/styles/global.css', 'utf8');

/**
 * Правила файлу як пари «селектор + тіло», без вкладених блоків.
 *
 * Коментарі зачищаються ПРОБІЛАМИ, і це не косметика — без цього перевірка
 * ламається двічі. По-перше, коментар перед правилом приклеюється до селектора,
 * і `:root` перестає бути початком рядка: перша редакція цієї перевірки
 * почервоніла саме так, на правильному коді. По-друге, коментарі в цьому файлі
 * ЦИТУЮТЬ `color-scheme: light` як приклад, і без зачистки сканер порахував би
 * цитату за оголошення (AI-AGENT-PITFALLS-v8 § 1).
 */
const CSS = GLOBAL_CSS.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
const rules = [...CSS.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, selector, body]) => ({
	selector: selector.trim(),
	body
}));
const withScheme = rules.filter(({ body }) => /(^|[;\s])color-scheme\s*:/.test(body));

/**
 * Усі теми проєкту й те, якою схемою кожна мусить бути.
 *
 * `name` — клас на `<html>`, а значення атрибута `data-theme` виходить із нього
 * відкиданням хвоста `-theme`: інлайн-скрипт у `app.html` ставить обидва разом.
 */
const THEMES: { name: string; scheme: 'light' | 'dark' }[] = [
	{ name: 'dark-theme', scheme: 'dark' },
	{ name: 'dark-cyan-theme', scheme: 'dark' },
	{ name: 'light-theme', scheme: 'light' },
	{ name: 'yellow-theme', scheme: 'light' },
	{ name: 'light-yellow-theme', scheme: 'light' },
	{ name: 'dark-blue-theme', scheme: 'dark' }
];

describe('вигляд, який малює браузер', () => {
	it('знаходить джерела — перевірка жива', () => {
		expect(APP_HTML).toContain('%sveltekit.head%');
		expect(GLOBAL_CSS.length).toBeGreaterThan(1000);
		// Без цього «порушень немає» означало б «нічого не розібралося».
		expect(withScheme.length, 'у global.css немає жодного правила з color-scheme').toBeGreaterThan(
			0
		);
	});

	/**
	 * КУЛІСИ ЗАСТАВКИ мусять бути темними в КОЖНІЙ темній темі.
	 *
	 * Заставка малюється до будь-якого CSS проєкту, тож її кольори живуть окремим
	 * набором змінних у `app.html`, а темний набір видавався за ПЕРЕЛІКОМ НАЗВ
	 * тем. Коли з'явилася шоста тема (`dark-blue`), у той перелік її не додали —
	 * і автор побачив жовті куліси на темно-синій сторінці. Це рівно та сама
	 * пастка, що з банером перевірки в жовтих темах: правило знає імена тем, а
	 * нова тема свого імені там не має.
	 *
	 * Тому перевіряється не текст селектора, а те, чи він СПРАВДІ накриває кожну
	 * темну тему. Форми селекторів розпізнаються ті, що тут вживаються:
	 * `[data-theme="x"]`, `[data-theme^="dark"]`, `.x-theme`, `[class*="dark-"]`.
	 *
	 * Зворотний експеримент (AI-AGENT-PITFALLS-v8 § 1.1): на попередній редакції
	 * `app.html`, де стояв перелік із чотирьох селекторів, перевірка червона саме
	 * на `dark-blue-theme` — з неї цю правку й почали.
	 */
	it('темні куліси заставки накривають кожну темну тему', () => {
		const АТРИБУТ = /\[data-theme\s*=\s*["']([^"']+)["']\]/;
		const ПРЕФІКС = /\[data-theme\s*\^=\s*["']([^"']+)["']\]/;
		const КЛАС = /\.([\w-]+)/;
		const ЧАСТИНА = /\[class\s*\*=\s*["']([^"']+)["']\]/;

		function накриває(selector: string, тема: { name: string; value: string }): boolean {
			return selector.split(',').some((частина) => {
				const sel = частина.trim();
				const атрибут = АТРИБУТ.exec(sel);
				if (атрибут) return атрибут[1] === тема.value;
				const префікс = ПРЕФІКС.exec(sel);
				if (префікс) return тема.value.startsWith(префікс[1]);
				const частинаКласу = ЧАСТИНА.exec(sel);
				if (частинаКласу) return тема.name.includes(частинаКласу[1]);
				const клас = КЛАС.exec(sel);
				if (клас) return клас[1] === тема.name;
				return false;
			});
		}

		/* Коментарі зачищаються: у цьому ж файлі вони ЦИТУЮТЬ селектори тем, і без
		   зачистки сканер порахував би цитату за правило. */
		const html = APP_HTML.replace(/<!--[\s\S]*?-->/g, ' ').replace(/\/\*[\s\S]*?\*\//g, ' ');
		const rules = [...html.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, selector, body]) => ({
			selector: selector.trim(),
			body
		}));
		const велюр = rules.filter(({ body }) => /--sp-v-base\s*:/.test(body));
		expect(велюр.length, 'у app.html не знайдено набору кольорів куліс').toBeGreaterThan(1);

		/* Базове правило на бареному `html` — світлий набір; шукаємо темні. */
		const темні = велюр.filter(({ selector }) => selector.replace(/\s+/g, '') !== 'html');
		const problems: string[] = [];
		for (const { name, scheme } of THEMES) {
			if (scheme !== 'dark') continue;
			const тема = { name, value: name.replace(/-theme$/, '') };
			if (!темні.some(({ selector }) => накриває(selector, тема))) {
				problems.push(`${name}: темний набір куліс її не накриває — заставка буде жовтою`);
			}
		}
		expect(problems, `куліси заставки: ${problems.join('; ')}`).toEqual([]);
	});

	it('мета color-scheme не дорівнює «light» — інакше Force Dark на Android', () => {
		const m = /name="color-scheme"[^>]*content="([^"]+)"/.exec(APP_HTML);
		expect(m?.[1], 'мета-тег color-scheme зник із app.html').toBeTruthy();
		expect(m?.[1], 'значення "light" на Android Chrome інвертує кольори сторінки').not.toBe(
			'light'
		);
	});

	it('інлайн-скрипт теми обгорнутий у try/catch', () => {
		// У приватному режимі частини браузерів доступ до localStorage кидає, а
		// неперехоплений виняток тут зупиняє скрипт до кінця — сторінка лишається
		// без теми взагалі, тобто миготіння замість анти-FOUC.
		const script = /<script>([\s\S]*?)<\/script>/.exec(APP_HTML)?.[1] ?? '';
		expect(script, 'інлайн-скрипт теми не знайдено').toContain('localStorage');
		expect(script.trimStart().startsWith('try {'), 'скрипт теми має починатися з try {').toBe(
			true
		);
		expect(script).toMatch(/catch\s*\(/);
	});

	/**
	 * База для `light-dark()`. Без неї функція мовчки віддає ПЕРШИЙ аргумент —
	 * тобто світлу палітру всім, і це не помилка, а тихо неправильний колір.
	 */
	it('документ оголошує `color-scheme: light dark` на бареному :root', () => {
		const base = withScheme.filter(
			({ selector, body }) =>
				/(^|,)\s*:root\s*(,|$)/.test(selector) && /color-scheme\s*:\s*light\s+dark/.test(body)
		);
		expect(
			base.length,
			'на :root немає `color-scheme: light dark` — light-dark() віддаватиме світлі значення всім'
		).toBeGreaterThan(0);
	});

	/**
	 * Кожна тема звужує схему до однієї, інакше `light-dark()` віддає їй значення
	 * за СИСТЕМНОЮ перевагою, а не за її власною природою. Найдорожчий випадок —
	 * жовті теми: вони світлі, але системна перевага може бути темна.
	 */
	it('кожна з шести тем звужує схему, і селектор строго специфічніший за :root', () => {
		const problems: string[] = [];

		for (const { name, scheme } of THEMES) {
			const own = withScheme.filter(({ selector }) => selector.includes(name));
			if (own.length === 0) {
				problems.push(`${name}: схема не звужена — light-dark() піде за системною перевагою`);
				continue;
			}
			if (!own.some(({ body }) => new RegExp(`color-scheme\\s*:\\s*${scheme}\\s*;`).test(body))) {
				problems.push(`${name}: очікувалося color-scheme: ${scheme}`);
			}
			// `html` обов'язковий: без нього специфічність (0,1,0) — нічия з `:root`,
			// і переможця обирає порядок правил, тобто бандлер
			// (SVELTE-UI-v8 `SUI-SCOPE-SPECIFICITY`). У сусідньому `as5` це заміряно:
			// звуження мовчки не діяло.
			for (const { selector } of own) {
				const parts = selector
					.split(',')
					.map((s) => s.trim())
					.filter((s) => s.includes(name));
				for (const part of parts) {
					if (!/^(html|:root)[.[]/.test(part)) {
						problems.push(`${name}: селектор «${part}» не специфічніший за :root — потрібен html`);
					}
				}
			}
		}

		expect(problems, `звуження схеми не діятиме:\n${problems.join('\n')}`).toEqual([]);
	});

	/**
	 * Обернений бік попередньої перевірки: якщо контролам знову задати схему
	 * власним правилом, вона розійдеться зі сторінкою — саме так, як розходилася
	 * доти, лише в інший бік.
	 */
	it('контроли НЕ задають собі схему власним правилом', () => {
		const onControls = withScheme.filter(({ selector }) =>
			/(^|[\s,>+~])(input|textarea|select)\b/.test(selector)
		);
		expect(
			onControls.map(({ selector }) => selector),
			'схема контролів мусить успадковуватися від документа, інакше вона розійдеться з темою сторінки'
		).toEqual([]);
	});
});

/**
 * Мініатюри тем у панелі налаштувань — і те, що вони НЕ розійдуться з темами.
 *
 * Кнопка теми показує кольори САМОЇ теми, а не активної: інакше обрати тему на
 * око не можна — доти всі шість кнопок були прозорі й однакові (заміряно в
 * браузері 2026-09-02). Прочитати токени чужої теми з CSS неможливо: імена
 * змінних не збираються з рядків, тож шість наборів у `global.css` оголошені
 * явно.
 *
 * Явна копія без інваріанта старіє мовчки — саме той клас помилки, який у цьому
 * проєкті вже коштував неправильних пропорцій у `HeroSection` і трьох різних
 * написань тієї самої вистави. Тому кожне значення звіряється з тим, що дає
 * розв'язувач токенів на самих файлах тем.
 *
 * Зворотний експеримент (AI-AGENT-PITFALLS-v8 § 1.1): змінити будь-який
 * `--sw-*` на сусідній відтінок — перевірка назве тему, змінну й обидва
 * значення.
 */
describe('мініатюри тем у панелі', () => {
	const resolver = new TokenResolver();
	const hex = (c: Rgb | null) =>
		c ? '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('') : null;

	/**
	 * `--sw-<роль>` кнопки → токен, який ця роль показує.
	 *
	 * Тло — `--bg-surface`, а не `--bg-page`: сторінки в цього проєкту попарно
	 * однакові (біла й біла, темна й темна), тож кнопки з них не розрізнялися б
	 * — саме це й показав автор знімком. Піднята поверхня натомість тримає
	 * характерний тон теми: жовтий у жовтій, синій у синій.
	 */
	const ROLES: Record<string, string> = {
		bg: '--bg-surface',
		fg: '--text-main',
		accent: '--accent-primary',
		on: '--text-on-accent'
	};

	/**
	 * Значення `--sw-*` із блоку `.theme-opt[data-theme-key='<тема>']`.
	 *
	 * Пошук рядком, а не регуляркою: селектор містить і точку, і квадратні
	 * дужки, і лапки — у зібраному з назви теми шаблоні кожне з них треба
	 * екранувати, і перша редакція цієї перевірки впала саме на цьому
	 * («Range out of order in character class», бо `[data-theme-key…]`
	 * прочиталося як клас символів).
	 */
	function swatches(theme: string): Map<string, string> {
		const marker = `.theme-opt[data-theme-key='${theme}'] {`;
		const at = GLOBAL_CSS.indexOf(marker);
		const out = new Map<string, string>();
		if (at === -1) return out;
		const body = GLOBAL_CSS.slice(at + marker.length).split('}')[0];
		for (const d of body.matchAll(/--sw-([\w-]+)\s*:\s*([^;]+);/g)) {
			out.set(d[1], d[2].trim().toLowerCase());
		}
		return out;
	}

	it('перевірка жива: набір є в кожної теми, і роли всі', () => {
		for (const theme of THEME_KEYS) {
			const own = swatches(theme);
			expect(own.size, `${theme}: блоку --sw-* немає в global.css`).toBe(
				Object.keys(ROLES).length
			);
		}
	});

	it('кожен колір мініатюри дорівнює токену своєї теми', () => {
		const bad: string[] = [];
		for (const theme of THEME_KEYS) {
			const own = swatches(theme);
			for (const [role, token] of Object.entries(ROLES)) {
				const written = own.get(role);
				const real = hex(resolver.resolve(token, theme));
				if (!written || !real) {
					bad.push(`${theme}.${role}: не розв'язується (${written ?? '—'} проти ${real ?? '—'})`);
					continue;
				}
				if (written !== real) bad.push(`${theme}.${role}: у панелі ${written}, у темі ${real} (${token})`);
			}
		}
		expect(bad, `мініатюра розійшлася з темою:\n${bad.join('\n')}`).toEqual([]);
	});
});
