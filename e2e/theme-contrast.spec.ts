import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { gotoReady, waitForAnimations } from './ready';

/**
 * Контраст У КОЖНІЙ ТЕМІ, а не лише в тій, що стоїть за замовчуванням.
 *
 * ## Навіщо окремий прогін, коли є `a11y.spec.ts`
 *
 * `a11y.spec.ts` ходить по всіх публічних сторінках, але в ОДНІЙ темі — тій,
 * яку віддає браузер прогону. Тем у проєкті шість: `light`, `dark`, `yellow`,
 * `light-yellow`, `dark-cyan`, `dark-blue`. Тобто п'ять із них не перевіряв
 * ніхто, і саме там і сиділи дефекти.
 *
 * Знайдено це не міркуванням, а скаргою автора: у ЖОВТІЙ темі банер перевірки
 * показував світлий текст на світлому тлі. Причина — правило зі світлими
 * кольорами стояло під селектором однієї теми (`light`), а жовті теми теж
 * світлі, але тим селектором не накриваються. Замір контрасту тексту банера до
 * складеного фону:
 *
 *   light 8,28 · dark 10,16 · dark-cyan 11,17 · dark-blue 11,66
 *   yellow 1,01 · light-yellow 1,03   ← того самого кольору, що й тло
 *
 * Той самий прогін axe одразу знайшов і другий дефект того ж класу, якого ніхто
 * не бачив: рік вистави на сторінці групи мав контраст 1,61–1,65 у ТРЬОХ
 * світлих темах (20 порушень на сторінці).
 *
 * ## Чому банер міряється власною математикою, а не axe
 *
 * У банера `backdrop-filter`. Крізь нього axe фон не обчислює й відносить
 * елемент до «не змогла визначити» — тобто саме той елемент, з якого почалася
 * скарга, у порушення НЕ попадає. Тому нижче дві різні перевірки: axe на
 * сторінку в цілому і власний замір банера (склад шарів + формула WCAG).
 *
 * ## Зворотний експеримент (AI-AGENT-PITFALLS-v8 § 1.1)
 *
 * Зроблено, і не на джерелах, а на тому CSS, який справді віддає сервер: колір
 * тексту банера повернено до одного значення (світлого). Перевірка почервоніла
 * в УСІХ ТРЬОХ світлих темах — light 1,02, light-yellow 1,02, yellow 1,01 — і
 * назвала кожну поіменно. Після повернення пари — знову зелена.
 *
 * Заразом виявилося, ЩО саме віддає сервер: `npm run preview` роздає
 * `.svelte-kit/output/client`, а не `build/`. Перша спроба експерименту правила
 * файл у `build/` і «не спіймала» дефекту — тобто показала б хибно зелений
 * результат тому, що правила не той файл.
 *
 * ## Чому сторінка групи
 *
 * Вона несе банер перевірки й одночасно всі компоненти, які довелося правити
 * (картки людей, смуга вистав, родовід, фотобанер). Адреса не вписана рядком, а
 * береться з даних: група з поміткою «можливі помилки». Якщо автор колись
 * перевірить їх усі, перевірка впаде на порожньому списку — і це правильно, бо
 * без банера вона нічого не стереже.
 */
const ТЕМИ = ['light', 'dark', 'yellow', 'light-yellow', 'dark-cyan', 'dark-blue'] as const;

/** Мінімум WCAG AA для звичайного тексту. */
const МІНІМУМ = 4.5;

/*
 * Дані читаються ФАЙЛОМ, а не імпортом `$lib/data/groups`.
 *
 * Той модуль тягне за собою JSON, а завантажувач Node у прогоні Playwright
 * вимагає для цього `import ... with { type: 'json' }` і без нього не збирає
 * файл узагалі — перша редакція падала на «No tests found», тобто перевірка
 * просто не існувала.
 */
const ГРУПИ = JSON.parse(
	readFileSync(new URL('../src/lib/data/groups.data.json', import.meta.url), 'utf8')
) as { slug: string; verificationStatus?: string }[];

const ГРУПА = ГРУПИ.find((g) => g.verificationStatus === 'possible_errors');

/** Учень — для сторінки, яка живе в темі сайту, а не в палітрі галактики. */
const ЛЮДИ = JSON.parse(
	readFileSync(new URL('../src/lib/data/graduates.index.json', import.meta.url), 'utf8')
) as { slug: string; kind?: string }[];
const УЧЕНЬ = ЛЮДИ.find((г) => г.kind === 'student');

/** Тема ставиться так, як її ставить сам сайт: значення в сховищі до першого кадру. */
async function зТемою(page: import('@playwright/test').Page, тема: string) {
	await page.addInitScript((t) => {
		try {
			localStorage.setItem('teatralo4ka_theme', t);
		} catch {
			/* приватне вікно — тема лишиться типовою, перевірка це побачить */
		}
	}, тема);
}

test.describe('контраст у кожній темі', () => {
	test('у даних є група з поміткою «можливі помилки» — перевірка жива', () => {
		expect(ГРУПА, 'без такої групи банер перевірки нікуди не виводиться').toBeTruthy();
	});

	for (const тема of ТЕМИ) {
		test(`${тема}: axe не бачить порушень контрасту`, async ({ page }, testInfo) => {
			test.skip(testInfo.project.name === 'mobile', 'правила контрасту від ширини не залежать');
			await зТемою(page, тема);
			await gotoReady(page, `/projects/galaxy-graduates/groups/${ГРУПА!.slug}/`);
			await waitForAnimations(page);

			expect(
				await page.evaluate(() => document.documentElement.dataset.theme),
				'тема не застосувалася — замір був би не про те'
			).toBe(тема);

			const { violations } = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze();
			const вузли = violations.flatMap((v) =>
				v.nodes.map((n) => `${n.target.join(' ')} — ${n.any?.[0]?.message ?? ''}`)
			);
			expect(вузли, `у темі ${тема} axe бачить недостатній контраст`).toEqual([]);
		});

		test(`${тема}: «Планета творчості» без порушень контрасту`, async ({ page }, testInfo) => {
			test.skip(testInfo.project.name === 'mobile', 'правила контрасту від ширини не залежать');
			await зТемою(page, тема);
			await gotoReady(page, '/projects/creativity-planet/');
			await waitForAnimations(page);

			/*
			 * Сторінка навмисно НЕ має власної палітри: планета зібрана з акцентів
			 * теми через `color-mix`, тобто в шести темах вона шість різних
			 * кольорів. Саме тому її контраст і треба міряти в кожній: підпис під
			 * обличчям лежить не на тлі сторінки, а на самій планеті.
			 */
			const { violations } = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze();
			const вузли = violations.flatMap((v) =>
				v.nodes.map((n) => `${n.target.join(' ')} — ${n.any?.[0]?.message ?? ''}`)
			);
			expect(вузли, `у темі ${тема} планета має нечитні написи`).toEqual([]);
		});

		test(`${тема}: сторінка учня без порушень контрасту`, async ({ page }, testInfo) => {
			test.skip(testInfo.project.name === 'mobile', 'правила контрасту від ширини не залежать');
			await зТемою(page, тема);
			await gotoReady(page, `/projects/galaxy-graduates/${УЧЕНЬ!.slug}/`);
			await waitForAnimations(page);

			/*
			 * Сторінка учня — єдине місце, де КАРТКА випускника фарбується темою
			 * сайту: змінні `--galaxy-*` на ній перенаправлені на токени теми.
			 * Півдороги тут коштувало два нечитні написи (контраст 3,06): тло
			 * бралося з теми, а плашки всередині лишалися космічними.
			 */
			const { violations } = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze();
			const вузли = violations.flatMap((v) =>
				v.nodes.map((n) => `${n.target.join(' ')} — ${n.any?.[0]?.message ?? ''}`)
			);
			expect(вузли, `у темі ${тема} сторінка учня має нечитні написи`).toEqual([]);
		});

		test(`${тема}: текст банера перевірки видно`, async ({ page }, testInfo) => {
			test.skip(testInfo.project.name === 'mobile', 'кольори від ширини не залежать');
			await зТемою(page, тема);
			await gotoReady(page, `/projects/galaxy-graduates/groups/${ГРУПА!.slug}/`);
			await waitForAnimations(page);

			const банер = page.getByTestId('verification-notice-banner');
			await expect(банер).toBeVisible();

			/*
			 * Склад шарів робиться В СТОРІНЦІ: тло банера напівпрозоре, тож
			 * «колір фону» — це його власний шар, накладений на перший непрозорий
			 * вище. Без складання вийшло б порівняння з `rgba(…, 0.1)`, тобто ні
			 * з чим.
			 */
			const контраст = await page.evaluate(() => {
				const розбір = (s: string) => {
					const m = s.match(/rgba?\(([^)]+)\)/);
					if (!m) return null;
					const p = m[1]
						.split(/[,\s/]+/)
						.filter(Boolean)
						.map(Number);
					return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
				};
				type Колір = { r: number; g: number; b: number; a: number };
				const поверх = (верх: Колір, низ: Колір): Колір => ({
					r: верх.r * верх.a + низ.r * (1 - верх.a),
					g: верх.g * верх.a + низ.g * (1 - верх.a),
					b: верх.b * верх.a + низ.b * (1 - верх.a),
					a: 1
				});
				const яскравість = ({ r, g, b }: Колір) => {
					const f = (v: number) => {
						const c = v / 255;
						return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
					};
					return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
				};

				const банер = document.querySelector('[data-testid="verification-notice-banner"]')!;
				const текст = банер.querySelector('.verification-banner__text') ?? банер;

				const шари: Колір[] = [];
				for (let el: Element | null = текст; el; el = el.parentElement) {
					const bg = розбір(getComputedStyle(el).backgroundColor);
					if (bg && bg.a > 0) шари.push(bg);
					if (bg && bg.a === 1) break;
				}
				let фон = шари.pop() ?? { r: 255, g: 255, b: 255, a: 1 };
				while (шари.length) фон = поверх(шари.pop()!, фон);

				const колір = поверх(розбір(getComputedStyle(текст).color)!, фон);
				const l1 = яскравість(колір);
				const l2 = яскравість(фон);
				return Number(
					((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)).toFixed(2)
				);
			});

			expect(
				контраст,
				`у темі ${тема} контраст тексту банера ${контраст} — нижче за ${МІНІМУМ}, тобто напису не видно`
			).toBeGreaterThanOrEqual(МІНІМУМ);
		});
	}
});
