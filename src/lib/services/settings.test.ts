// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { DEFAULT_HEADER_SETTINGS, resolveHeaderSettings } from './settings';

/**
 * Наскрізна перевірка: зіпсований документ Firestore не має ламати шапку.
 *
 * Схеми перевіряються окремо (`schemas/settings.test.ts`), але сама по собі
 * правильна схема нічого не гарантує — важливо, що вона стоїть НА ШЛЯХУ даних
 * і що після неї працює злиття з типовими значеннями. Саме цей стик і
 * перевіряється тут, на вигаданих, але цілком можливих даних: налаштування
 * пише адміністратор через форму, а Firestore не перевіряє нічого.
 *
 * Шапка обрана не випадково — вона на кожній сторінці сайту.
 */

/** Заглушка console.warn: попередження тут очікувані й не мають засмічувати вивід. */
function silenceWarn() {
	return vi.spyOn(console, 'warn').mockImplementation(() => {});
}

describe('resolveHeaderSettings із порожнім документом', () => {
	it('віддає рівно типові налаштування', () => {
		const out = resolveHeaderSettings({});
		expect(out.cta).toEqual(DEFAULT_HEADER_SETTINGS.cta);
		expect(out.ticker).toEqual(DEFAULT_HEADER_SETTINGS.ticker);
		expect(out.debugPanel).toEqual(DEFAULT_HEADER_SETTINGS.debugPanel);
		expect(out.headerBar.items.map((i) => i.id)).toEqual(
			DEFAULT_HEADER_SETTINGS.headerBar.items.map((i) => i.id)
		);
	});
});

describe('resolveHeaderSettings із зіпсованими даними', () => {
	it('поле неправильного типу замінюється типовим, а не потрапляє в UI', () => {
		const warn = silenceWarn();
		const out = resolveHeaderSettings({
			// @ts-expect-error — навмисно неправильний тип: саме це й приходить із бази
			ticker: { grayscaleStrength: 'багато', visible: true, startTime: 'опівдні' }
		});

		expect(out.ticker.grayscaleStrength).toBe(DEFAULT_HEADER_SETTINGS.ticker.grayscaleStrength);
		expect(out.ticker.startTime).toBe(DEFAULT_HEADER_SETTINGS.ticker.startTime);
		// Придатне поле з того самого обʼєкта зберігається — деградує значення,
		// а не весь блок налаштувань.
		expect(out.ticker.visible).toBe(true);
		warn.mockRestore();
	});

	it('рядок замість меню не ламає шапку — лишається типове меню', () => {
		const warn = silenceWarn();
		// @ts-expect-error — навмисно не той тип
		const out = resolveHeaderSettings({ headerBar: 'зіпсовано' });

		expect(out.headerBar.items.map((i) => i.id)).toEqual(
			DEFAULT_HEADER_SETTINGS.headerBar.items.map((i) => i.id)
		);
		expect(warn).toHaveBeenCalled();
		warn.mockRestore();
	});

	it('накладка без id відкидається, решта меню застосовується', () => {
		const warn = silenceWarn();
		const firstId = DEFAULT_HEADER_SETTINGS.headerBar.items[0].id;
		const out = resolveHeaderSettings({
			headerBar: {
				items: [
					{ id: firstId, labelUk: 'Змінено' },
					// @ts-expect-error — накладка без id ні до чого не застосовна
					{ labelUk: 'Загублений пункт' }
				]
			}
		});

		const changed = out.headerBar.items.find((i) => i.id === firstId);
		expect(changed?.labelUk).toBe('Змінено');
		expect(out.headerBar.items.some((i) => i.labelUk === 'Загублений пункт')).toBe(false);
		warn.mockRestore();
	});

	it('null у накладці означає «узяти типове», а не порожній рядок', () => {
		const first = DEFAULT_HEADER_SETTINGS.headerBar.items[0];
		const out = resolveHeaderSettings({
			headerBar: { items: [{ id: first.id, labelUk: null }] }
		});
		expect(out.headerBar.items.find((i) => i.id === first.id)?.labelUk).toBe(first.labelUk);
	});

	it('усі три меню лишаються придатними, навіть якщо всі три зіпсовані', () => {
		const warn = silenceWarn();
		const out = resolveHeaderSettings({
			// @ts-expect-error — навмисно не той тип
			headerBar: 42,
			// @ts-expect-error — навмисно не той тип
			navDropdown: [],
			// @ts-expect-error — навмисно не той тип
			mobileOverlay: { items: 'не масив' }
		});

		for (const menu of [out.headerBar, out.navDropdown, out.mobileOverlay]) {
			expect(Array.isArray(menu.items)).toBe(true);
			expect(Array.isArray(menu.sections)).toBe(true);
		}
		warn.mockRestore();
	});
});

describe('міграція cta.linkValue → cta.href', () => {
	it('стара форма й далі працює після додавання валідації', () => {
		// Схема мусила зберегти linkValue: інакше zod викинув би незнайомий ключ,
		// і посилання кнопки «Для вступу» тихо стало б типовим.
		const out = resolveHeaderSettings({ cta: { linkValue: '/старий-шлях' } });
		expect(out.cta.href).toBe('/старий-шлях');
	});

	it('href має пріоритет над linkValue', () => {
		const out = resolveHeaderSettings({ cta: { href: '/новий', linkValue: '/старий' } });
		expect(out.cta.href).toBe('/новий');
	});
});

describe('налаштування debug-панелі досяжні з адмінки', () => {
	/**
	 * Кожне поле `DebugPanelConfig` мусить мати керування в Debug-табі адмінки.
	 *
	 * Саме тут і був пропуск: `DebugSettingsDropdown` уже приймав проп
	 * `showScrollbar`, але його ніхто не передавав і ніде не можна було вимкнути.
	 * Поле, яке нема як змінити, — це не налаштування, а константа з виглядом
	 * налаштування, і відрізнити їх у коді неможливо: типи сходяться, збірка
	 * проходить, у сховищі ключ просто відсутній.
	 *
	 * Перевірка дивиться на розмітку, бо прогалина живе саме там. Ні схема, ні
	 * типи про неї сказати не можуть у принципі.
	 */
	const page = readFileSync('src/routes/admin/settings/+page.svelte', 'utf8');

	it('сторінку налаштувань знайдено — перевірка жива', () => {
		expect(page).toContain('debugPanel');
	});

	for (const key of Object.keys(DEFAULT_HEADER_SETTINGS.debugPanel)) {
		it(`${key} має керування`, () => {
			expect(page, `у Debug-табі немає керування для debugPanel.${key}`).toContain(
				`debugPanel.${key}`
			);
		});
	}

	/**
	 * Тип `TabId` і масив `TABS` — два переліки того самого, і вони можуть
	 * розійтися молча.
	 *
	 * Додати вкладку в тип і в розмітку (`{:else if activeTab === '…'}`), але
	 * забути в `TABS`, — і кнопки для неї не буде: вміст існує й недосяжний. Типи
	 * цього не ловлять, бо `TabId` лишається валідним. Відколи вкладка живе ще й
	 * в адресі, ціна помилки виросла: `?tab=` з такою назвою теж відкине її як
	 * невідому, бо перелік дійсних значень будується саме з `TABS`.
	 */
	it('кожна вкладка з типу TabId є в переліку TABS', () => {
		const union = page.match(/type TabId =([^;]+);/)?.[1] ?? '';
		const fromType = [...union.matchAll(/'([^']+)'/g)].map((m) => m[1]);
		const tabsBlock = page.match(/const TABS[^=]*=\s*\[([\s\S]*?)\];/)?.[1] ?? '';
		const fromArray = [...tabsBlock.matchAll(/id:\s*'([^']+)'/g)].map((m) => m[1]);

		expect(fromType.length, 'не вдалося прочитати тип TabId — перевірка мертва').toBeGreaterThan(0);
		expect(fromArray.length, 'не вдалося прочитати TABS — перевірка мертва').toBeGreaterThan(0);

		const missing = fromType.filter((id) => !fromArray.includes(id));
		expect(missing, `вкладки без кнопки: ${missing.join(', ')}`).toEqual([]);
	});
});
