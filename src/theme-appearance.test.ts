// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

/**
 * Дві речі, які визначають вигляд НЕ наших пікселів, а тих, що малює браузер:
 * мета-тег `color-scheme` і `color-scheme` на елементах керування. Обидві
 * прописані в UI-UX-v8 § 4, і обох перевірок у проєкті не було.
 *
 * Вони пов'язані, і саме зв'язок робить помилку неочевидною. Мета-тег МУСИТЬ
 * бути `light dark` для світлої теми: значення `light` провокує Force Dark Mode
 * на Android Chrome, який самовільно інвертує кольори сторінки. Але `light dark`
 * означає «браузер, вирішуй сам» — і за темної системи він малює ТЕМНІ
 * контроли поверх нашої світлої сторінки.
 *
 * Симптом був саме такий: у полі `type="date"` світла іконка календаря на
 * світлому полі, і рівно у ЗВИЧАЙНІЙ світлій темі. У жовтих темах мета
 * дорівнює `light`, тому там правильно; у темній темна схема й доречна.
 *
 * Виміряно в браузері з емуляцією темної системи, на полі без авторських
 * кольорів (UA-стиль тла прямо показує використану схему):
 *
 *   тема          | без правила    | з правилом
 *   light         | rgb(59,59,59)  | rgb(255,255,255)
 *   dark          | rgb(59,59,59)  | rgb(59,59,59)
 *   yellow        | rgb(255,255,255) | rgb(255,255,255)
 *   light-yellow  | rgb(255,255,255) | rgb(255,255,255)
 *
 * За світлої системи правило не змінює нічого ні в одній темі.
 *
 * Ці пікселі не покриває більше ніщо: у `contrast.test.ts` кольору іконки
 * немає в джерелах, а axe не бачить тіньового DOM елементів керування.
 */

const APP_HTML = readFileSync('src/app.html', 'utf8');
const GLOBAL_CSS = readFileSync('src/lib/styles/global.css', 'utf8');

describe('вигляд, який малює браузер', () => {
	it('знаходить джерела — перевірка жива', () => {
		expect(APP_HTML).toContain('%sveltekit.head%');
		expect(GLOBAL_CSS.length).toBeGreaterThan(1000);
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
	 * Контролам схема задається ЯВНО, і саме контролам, а не документу: Force
	 * Dark дивиться на оголошення сторінки, тож його чіпати не можна.
	 */
	it('елементи керування отримують color-scheme для світлих тем і для темної', () => {
		const rules = [...GLOBAL_CSS.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
			.map(([, selector, body]) => ({ selector: selector.trim(), body }))
			.filter(({ body }) => /(^|[;\s])color-scheme\s*:/.test(body));

		expect(rules.length, 'color-scheme для контролів не оголошено ніде').toBeGreaterThan(0);

		const forControls = (r: { selector: string }) => /\b(input|textarea|select)\b/.test(r.selector);
		const light = rules.filter(
			(r) => forControls(r) && /color-scheme\s*:\s*light/.test(r.body) && !/dark-theme/.test(r.selector)
		);
		const dark = rules.filter(
			(r) => forControls(r) && /color-scheme\s*:\s*dark/.test(r.body) && /dark-theme/.test(r.selector)
		);

		expect(light.length, 'немає правила `color-scheme: light` для input/textarea/select').toBeGreaterThan(0);
		expect(dark.length, 'немає правила `color-scheme: dark` у межах .dark-theme').toBeGreaterThan(0);
	});

	it('color-scheme не оголошується для документа в CSS — це справа мета-тега', () => {
		// Оголошення на :root/html дублювало б мета-тег і могло б розійтися з ним,
		// а розходження тут коштує Force Dark Mode на Android.
		const onRoot = [...GLOBAL_CSS.matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter(
			([, selector, body]) =>
				/(^|,)\s*(:root|html)\s*(,|$)/.test(selector.trim()) &&
				/(^|[;\s])color-scheme\s*:/.test(body)
		);
		expect(
			onRoot.map(([, s]) => s.trim()),
			'color-scheme на :root/html конфліктує з мета-тегом у app.html'
		).toEqual([]);
	});
});
