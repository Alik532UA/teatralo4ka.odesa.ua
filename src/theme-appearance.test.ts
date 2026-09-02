// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

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

/** Усі теми проєкту й те, якою схемою кожна мусить бути. */
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
