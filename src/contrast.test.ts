// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { THEMES, TokenResolver, contrast, type Rgb, type Theme } from '../vitest/support/tokens';

/**
 * Контраст тексту й тла в кожній темі — і в спокої, і НА НАВЕДЕННІ.
 *
 * ## Чому цієї перевірки не було, хоч axe стоїть у CI
 *
 * axe міряє лише той стан, що намальований у момент прогону. `:hover` він не
 * розкриває принципово, тож дефекти на наведенні для нього невидимі всі до
 * одного. Саме такий і знайшовся оком: кнопка-CTA у світлій темі при наведенні
 * ставала темною з темним текстом — 1.25:1. Той самий рядок був скопійований
 * у підвал (`.footer__btn-order:hover`), і там його ніхто не бачив, бо підвал
 * з'являється на прокрутці.
 *
 * ## Чому по джерелах, а не в браузері
 *
 * Спроба зробити це через Playwright дала ДВА набори хибних дефектів, і обидва
 * виглядали переконливо:
 *
 * 1. напівпрозорі шари склеювалися в неправильному порядку, і перевірка
 *    «знаходила» тло `rgb(77,77,77)` — кольору, якого в темах немає взагалі;
 * 2. після виправлення склеювання виявилося, що підвал у момент заміру має
 *    `opacity: 0` (він з'являється на прокрутці), а перемикання теми з JS не
 *    доходить до `body`. Тобто міряли невидимий підвал у чужій темі.
 *
 * Обидва рази список був довгий і правдоподібний. Тут же немає ні прозорості,
 * ні порядку шарів, ні станів рантайму: беруться пари «тло+текст», де обидва
 * значення — токени тем, і граф `var()` розв'язується арифметично.
 *
 * ## Що ЦЯ перевірка не покриває
 *
 * Свідомо і з числом у звіті (`НЕПОКРИТО` нижче): напівпрозоре тло,
 * `color-mix`, градієнти, тло-зображення, а також текст, що успадковує колір
 * від батька або лежить на тлі, заданому в іншому компоненті. Для них
 * потрібен рантайм, і це записано боргом у `PROJECT-CONTEXT.md`, а не вдається
 * за покриття.
 */

const WCAG_AA_NORMAL = 4.5;
const WCAG_AA_LARGE = 3;

/**
 * Свідомі відхилення. Кожне — з виміряним числом і причиною, а не «щоб
 * зелений»: список без чисел за пів року перетворюється на виняток, який
 * ніхто не читає.
 */
const EXCEPTIONS: { selector: string; theme: Theme | '*'; ratio: number; why: string }[] = [
	{
		selector: '.btn-save-small',
		theme: '*',
		ratio: 2.08,
		why: "Стан DISABLED: у розмітці кнопка має `disabled={saving || !hasChanges}`, а клас `.is-active` додається лише коли є що зберігати. WCAG 1.4.3 прямо не застосовується до тексту НЕАКТИВНИХ елементів керування, і приглушений вигляд тут сам є сигналом недоступності"
	},
	{
		selector: '.header__nav-link',
		theme: 'light',
		ratio: 2.38,
		why: 'Фірмовий блакитний #00b5ec на білому. Це не помилка токена, а рішення про айдентику: змінити означає перефарбувати навігацію на кожній сторінці. Рішення за автором — записано боргом у PROJECT-CONTEXT.md'
	}
];

type Decl = { color?: string; background?: string; fontSize?: string; fontWeight?: string };

/**
 * Дві константи, а не одна: регулярка з прапорцем `g` зберігає `lastIndex`
 * між викликами `.test()`, тож одна й та сама на перевірку і на заміну давала
 * то true, то false на однакових селекторах — і базовий стан збирався з
 * правил `:hover`. Дефект був такий: `.header__cta:hover` показувало 1.00:1,
 * тобто текст того самого кольору, що тло, чого в коді немає.
 */
const IS_STATE = /:hover|:focus-visible|:focus|:active/;
const STRIP_STATE = /:hover|:focus-visible|:focus|:active/g;

function walk(dir: string, out: string[] = []): string[] {
	for (const e of readdirSync(dir, { withFileTypes: true })) {
		const p = join(dir, e.name);
		if (e.isDirectory()) walk(p, out);
		else if (e.name.endsWith('.svelte')) out.push(p);
	}
	return out;
}

/** Вирізає `<style>` компонента. Розмітка нас не цікавить. */
function styleBlock(source: string): string {
	return source.match(/<style[^>]*>([\s\S]*)<\/style>/)?.[1] ?? '';
}

const value = (raw: string) => raw.replace(/!important/g, '').trim();

/**
 * Плоскі правила `селектор { … }` з CSS-тексту.
 *
 * Медіазапити й `:global()` не розгортаються: усередині них ті самі пари
 * «тло+текст», а нам потрібні саме пари, не каскад.
 */
function rules(css: string): { selector: string; decl: Decl }[] {
	const out: { selector: string; decl: Decl }[] = [];
	// Коментарі геть ДО розбору: інакше вони приклеюються до селектора
	// («/* Order Button Style */ .footer__btn-order») і, гірше, `prop: value`
	// всередині коментаря читається як справжнє оголошення.
	const clean = css.replace(/\/\*[\s\S]*?\*\//g, '');
	for (const m of clean.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
		const selector = m[1].trim().replace(/\s+/g, ' ');
		if (!selector || selector.startsWith('@') || selector.startsWith('%')) continue;
		const body = m[2];
		const decl: Decl = {};
		for (const d of body.matchAll(/([a-z-]+)\s*:\s*([^;]+);?/g)) {
			const prop = d[1];
			if (prop === 'color') decl.color = value(d[2]);
			else if (prop === 'background' || prop === 'background-color') decl.background = value(d[2]);
			else if (prop === 'font-size') decl.fontSize = value(d[2]);
			else if (prop === 'font-weight') decl.fontWeight = value(d[2]);
		}
		if (decl.color || decl.background) out.push({ selector, decl });
	}
	return out;
}

/** Великий текст за WCAG: ≥24px, або ≥18.66px і жирний. */
function isLarge(decl: Decl): boolean {
	const size = decl.fontSize;
	if (!size) return false;
	const rem = /^([\d.]+)rem$/.exec(size);
	const px = /^([\d.]+)px$/.exec(size);
	const value = rem ? parseFloat(rem[1]) * 16 : px ? parseFloat(px[1]) : NaN;
	if (Number.isNaN(value)) return false;
	const bold = (parseInt(decl.fontWeight ?? '400', 10) || 400) >= 700;
	return value >= 24 || (value >= 18.66 && bold);
}

type Finding = {
	file: string;
	selector: string;
	state: string;
	theme: Theme;
	ratio: number;
	need: number;
	fg: Rgb;
	bg: Rgb;
};

describe('контраст тексту й тла', () => {
	const resolver = new TokenResolver();
	const files = [...walk('src'), 'src/lib/styles/global.css'];

	let pairsChecked = 0;
	let uncovered = 0;
	const findings: Finding[] = [];

	for (const file of files) {
		const source = readFileSync(file, 'utf8');
		const css = file.endsWith('.css') ? source : styleBlock(source);
		if (!css) continue;

		const parsed = rules(css);
		// Базовий стан селектора: те саме без :hover/:focus/:active.
		const base = new Map<string, Decl>();
		for (const { selector, decl } of parsed) {
			if (IS_STATE.test(selector)) continue;
			const prev = base.get(selector) ?? {};
			base.set(selector, { ...prev, ...decl });
		}

		for (const { selector, decl } of parsed) {
			const isState = IS_STATE.test(selector);
			const root = selector.replace(STRIP_STATE, '').trim();
			const inherited = base.get(root) ?? {};
			const effective: Decl = { ...inherited, ...decl };

			// Пара має сенс лише якщо ВІДОМІ обидва боки. Текст без тла — це
			// успадкування, і статично воно не розв'язується.
			if (!effective.color || !effective.background) {
				uncovered++;
				continue;
			}

			const need = isLarge(effective) ? WCAG_AA_LARGE : WCAG_AA_NORMAL;
			for (const theme of THEMES) {
				const fg = resolver.resolveValue(effective.color, theme);
				const bg = resolver.resolveValue(effective.background, theme);
				if (!fg || !bg) {
					uncovered++;
					continue;
				}
				pairsChecked++;
				const ratio = contrast(fg, bg);
				if (ratio >= need) continue;

				const allowed = EXCEPTIONS.some(
					(e) => selector.includes(e.selector) && (e.theme === '*' || e.theme === theme)
				);
				if (allowed) continue;

				findings.push({
					file,
					selector,
					state: isState ? 'наведення/фокус' : 'спокій',
					theme,
					ratio,
					need,
					fg,
					bg
				});
			}
		}
	}

	it('знаходить пари для перевірки — вона жива', () => {
		expect(files.length).toBeGreaterThan(50);
		// Число не з голови: стільки пар «тло+текст» розв'язується в токени.
		expect(pairsChecked).toBeGreaterThan(100);
	});

	it('граф токенів розв\'язується в усіх темах', () => {
		// Канарка на сам розв'язувач: якщо шляхи до тем зміняться, він почне
		// повертати null на всьому, і перевірка вище стане зеленою на нулі.
		for (const theme of THEMES) {
			expect(resolver.resolve('--bg-card', theme), theme).not.toBeNull();
			expect(resolver.resolve('--text-main', theme), theme).not.toBeNull();
			// --accent-primary, а не --color-border: остання в жовтих темах
			// напівпрозора, і `null` для неї — правильна відповідь, не збій.
			expect(resolver.resolve('--accent-primary', theme), theme).not.toBeNull();
		}
	});

	it('кожна пара «тло+текст» проходить WCAG AA', () => {
		const hex = (c: Rgb) => '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
		const report = findings
			.sort((a, b) => a.ratio - b.ratio)
			.map(
				(f) =>
					`${f.ratio.toFixed(2)}:1 (треба ${f.need})  ${f.theme}/${f.state}  ${f.file}\n      ${f.selector}  текст ${hex(f.fg)} на ${hex(f.bg)}`
			)
			.join('\n');

		expect(
			findings.map((f) => `${f.theme} ${f.selector}`),
			`\nПар перевірено: ${pairsChecked}. Непокрито (прозоре, color-mix, успадкування): ${uncovered}.\n\n${report}\n`
		).toEqual([]);
	});
});
