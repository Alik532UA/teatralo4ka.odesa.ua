// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Кнопка робить те, що на ній написано (UI-ELEMENTS-v8 § 1, WCAG 3.2.4).
 *
 * ## Що сталося
 *
 * Перемикачі в панелі налаштувань показані ПАРОЮ кнопок «Вимк / Увімк», тобто у
 * формі радіо. У `DebugSettingsDropdown` обидві кнопки пари викликали одну
 * функцію `ui.toggleBlurEffect()` — і поки прапорець збігався з підписом, це
 * виглядало правильно. Натискання на ВЖЕ активну кнопку гортало прапорець:
 * кнопка «Увімк» вимикала ефект.
 *
 * Заміряно в браузері 2026-08-26: три натискання поспіль по «Увімк» дали
 * `false`, `true`, `false`. Тобто половина натискань по цій кнопці робила
 * протилежне її підпису — і жоден гейт цього не бачив, бо в DOM усе на місці, а
 * axe читає атрибути, не наслідки.
 *
 * ## Чому саме така умова
 *
 * Не «жодних `toggle()` у розмітці» — гортання цілком доречне на ОДНІЙ кнопці,
 * що міняє свій підпис (пауза/грати в каруселі). Дефект народжується саме з
 * пари: два контроли, кожен зі своїм фіксованим підписом, і спільна дія
 * «навпаки». Тому перевірка дивиться лише на кнопки, названі `-on-btn` /
 * `-off-btn`, тобто на ті, що заявили себе половиною пари.
 *
 * Зворотний експеримент (AI-AGENT-PITFALLS-v8 § 1.1): повернути
 * `onclick={() => ui.toggleBlurEffect()}` на будь-яку з двох кнопок blur —
 * перевірка мусить назвати саме її.
 */

const SRC = 'src';

const walk = (dir: string, out: string[] = []): string[] => {
	for (const entry of readdirSync(dir)) {
		const full = join(dir, entry);
		if (statSync(full).isDirectory()) walk(full, out);
		else if (entry.endsWith('.svelte')) out.push(full.replace(/\\/g, '/'));
	}
	return out;
};

const withoutComments = (source: string): string =>
	source
		.replace(/<!--[\s\S]*?-->/g, (m) => '\n'.repeat((m.match(/\n/g) ?? []).length))
		.replace(/\/\*[\s\S]*?\*\//g, (m) => '\n'.repeat((m.match(/\n/g) ?? []).length));

/**
 * Відкриваючі теги. Кінець — перший `>` поза фігурними дужками, що не є
 * частиною `=>`: у розмітці Svelte стрілка в обробнику містить `>`, і наївний
 * `/<button[^>]*>/` обриває тег посеред `onclick`.
 */
function openingTags(source: string): Array<{ index: number; tag: string }> {
	const tags: Array<{ index: number; tag: string }> = [];
	for (let i = 0; i < source.length; i += 1) {
		if (source[i] !== '<') continue;
		let depth = 0;
		let j = i + 1;
		for (; j < source.length; j += 1) {
			const c = source[j];
			if (c === '{') depth += 1;
			else if (c === '}') depth -= 1;
			else if (c === '>' && depth === 0 && source[j - 1] !== '=') break;
		}
		tags.push({ index: i, tag: source.slice(i, j + 1) });
		i = j;
	}
	return tags;
}

/** Кнопка, що заявила себе половиною пари «увімк / вимк». */
const PAIR_HALF = /data-testid=[^\s>]*-(?:on|off)-btn/;

const files = walk(SRC);

const pairButtons = files.flatMap((file) => {
	const source = withoutComments(readFileSync(file, 'utf8'));
	return openingTags(source)
		.filter(({ tag }) => tag.startsWith('<button') && PAIR_HALF.test(tag))
		.map(({ index, tag }) => ({
			file,
			tag,
			line: (source.slice(0, index).match(/\n/g) ?? []).length + 1
		}));
});

describe('парні перемикачі «увімк / вимк»', () => {
	it('перевірка жива: пари знайдено', () => {
		expect(pairButtons.length, 'жодної кнопки -on-btn/-off-btn — сканер шукає не там').toBeGreaterThan(
			3
		);
	});

	it('перевірка жива: розбір тега не обривається на стрілці в обробнику', () => {
		const [only] = openingTags('<button onclick={() => go(1)} data-testid="x-on-btn">');
		expect(only.tag).toContain('data-testid="x-on-btn"');
	});

	it('половина пари не гортає стан, а задає своє значення', () => {
		const flipping = pairButtons
			// Дві незалежні умови по ВСЬОМУ тегу, а не `onclick=[^>]*toggle…`:
			// стрілка `=>` в обробнику містить `>`, тож клас `[^>]` обривається на
			// ній і до назви функції не доходить. Перша редакція саме через це
			// лишилася зеленою зі свідомо поверненим дефектом.
			.filter(({ tag }) => /\bon(?:click|change)=/.test(tag) && /\btoggle[A-Z]\w*\s*\(/.test(tag))
			.map(({ file, line, tag }) => {
				const id = tag.match(/data-testid="([^"]+)"/)?.[1] ?? '?';
				return `${file}:${line} — ${id}`;
			});

		expect(
			flipping,
			'обидві кнопки пари гортають той самий прапорець — натискання на вже ' +
				'активну робить протилежне її підпису. Кожна половина мусить задавати ' +
				`СВОЄ значення:\n${flipping.join('\n')}`
		).toEqual([]);
	});

	it('кожна половина пари повідомляє свій стан читалці', () => {
		// `class:active` бачить лише око. Без `aria-pressed` читалка чує дві
		// однакові кнопки й не знає, яка з них зараз обрана.
		const mute = pairButtons
			.filter(({ tag }) => !/\baria-pressed=/.test(tag) && !/\baria-checked=/.test(tag))
			.map(({ file, line, tag }) => {
				const id = tag.match(/data-testid="([^"]+)"/)?.[1] ?? '?';
				return `${file}:${line} — ${id}`;
			});

		expect(
			mute,
			`стан пари видно лише оком — додати aria-pressed:\n${mute.join('\n')}`
		).toEqual([]);
	});
});
