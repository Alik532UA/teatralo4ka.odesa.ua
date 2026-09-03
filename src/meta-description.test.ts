// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Опис сторінки має бути РІВНО ОДИН, і малює його лише layout.
 *
 * ## Що саме зламалося
 *
 * `+layout.svelte` малює `<meta name="description">` завжди — з
 * `page.data.seoDescription` або з SEO-карти. Вісім сторінок писали ще й свій,
 * у власному `<svelte:head>`, і жодна перевірка цього не бачила.
 *
 * Наслідок був не «дубль у розмітці», а гірший. Заміряно у ЗБІРЦІ на трьох
 * переліках розділу (`festivals`, `groups`, `plays`): у HTML стояли ДВІ мітки
 * `description` — першою загальна з layout, другою власна, — і краулер брав
 * першу. Тобто добре написаний опис сторінки не доходив нікуди, а прев'ю в
 * месенджері показувало опис ГОЛОВНОЇ сторінки. Так само було на сторінках
 * групи, вистави, фестивалю й працівника.
 *
 * `og:description` при цьому власного опису не бачив ЗОВСІМ: його малює layout
 * із того самого джерела, а `<svelte:head>` сторінки до нього не дотягується.
 *
 * ## Чому перевіряються джерела, а не `build/`
 *
 * Порахувати мітки в готовому HTML було б прямішим виміром, але тоді гейт
 * вимагав би збірки — тобто не потрапив би у швидкі перевірки перед комітом,
 * а саме там він і потрібен: дубль з'являється в момент, коли хтось пише
 * `<meta name="description">` у сторінці, і з коду це виглядає доречним.
 *
 * Правило точне й тому перевіряється однозначно: описом володіє layout, а
 * сторінка каже своє через `seoDescription` із `load`.
 *
 * ## Зворотний експеримент (AI-AGENT-PITFALLS-v8 § 1.1)
 *
 * Повернути мітку в `plays/[id]/+page.svelte` — перевірка падає й називає саме
 * цей файл.
 */

/** Єдиний файл, якому мітка належить. */
const ВЛАСНИК = join('src', 'routes', '+layout.svelte');

function walk(dir: string, out: string[] = []): string[] {
	for (const name of readdirSync(dir)) {
		const full = join(dir, name);
		if (statSync(full).isDirectory()) walk(full, out);
		else if (full.endsWith('.svelte')) out.push(full);
	}
	return out;
}

/**
 * Тег `<meta … name="description" …>` у будь-якому написанні, зокрема з переносами.
 *
 * Прапорця `g` тут НЕМА навмисно: `RegExp` із `g` тримає `lastIndex` між
 * викликами, тож `.test()` на одному файлі зсуває пошук для наступного — і
 * перевірка бачить то є, то немає, залежно від порядку. Перша редакція саме на
 * цьому й показала, що в layout мітки «немає». Для підрахунку зразок клонується
 * з `g` окремо.
 */
const МІТКА = /<meta\b[^>]*\bname=["']description["']/s;
const УСІ_МІТКИ = () => new RegExp(МІТКА.source, 'gs');

/**
 * Коментарі знімаються ПЕРЕД пошуком, і це не педантизм.
 *
 * Перша редакція впала на `DetailPage.svelte`, у якому мітки немає: там у
 * коментарі написано «це вміст `<meta name="description">`», бо компонент
 * віддає опис інакше. Гейт, що читає згадку як порушення, змусив би переписати
 * правильний коментар — рівно навпаки до того, чого він хоче.
 */
function безКоментарів(text: string): string {
	return text
		.replace(/<!--[\s\S]*?-->/g, '')
		.replace(/\/\*[\s\S]*?\*\//g, '')
		.replace(/^\s*\/\/.*$/gm, '');
}

describe('опис сторінки (SEO-v8)', () => {
	const усі = walk('src');

	it('перевірка жива — сторінки знайдено, і в layout мітка є', () => {
		expect(усі.length, 'жодного .svelte не знайдено').toBeGreaterThan(50);
		expect(
			МІТКА.test(безКоментарів(readFileSync(ВЛАСНИК, 'utf8'))),
			`${ВЛАСНИК}: мітки опису немає — тоді її не малює НІХТО`
		).toBe(true);
	});

	it('жодна сторінка не малює власну мітку опису', () => {
		const bad: string[] = [];
		for (const file of усі) {
			if (file === ВЛАСНИК) continue;
			const matches = безКоментарів(readFileSync(file, 'utf8')).match(УСІ_МІТКИ());
			if (matches) bad.push(`${file}: ${matches.length} мітк(а/и)`);
		}
		expect(
			bad,
			'дубль мітки опису — краулер бере ПЕРШУ, тобто загальну з layout, а ця не\n' +
				'доходить нікуди. Свій опис сторінка віддає через `seoDescription` із\n' +
				'`load` — тоді він потрапляє і в `og:description`:\n  ' + bad.join('\n  ')
		).toEqual([]);
	});

	/*
	 * Друга половина правила: сторінка, яка ВЖЕ збирає опис у `load`, мусить
	 * віддавати його саме під цим ім'ям. Помилка в імені тиха — layout просто
	 * візьме SEO-карту, тобто опис розділу замість опису записа.
	 */
	it('кожен `seoDescription` у завантажувачі справді повертається', () => {
		const bad: string[] = [];
		for (const file of walkTs('src/routes')) {
			const text = readFileSync(file, 'utf8');
			if (!text.includes('seoDescription')) continue;
			const збирає = /const\s+seoDescription\s*=/.test(text);
			const віддає = /\bseoDescription\b(?!\s*=)/.test(
				text.slice(text.indexOf('return'))
			);
			if (збирає && !віддає) bad.push(`${file}: опис збирається, але не повертається з load`);
		}
		expect(bad, 'опис нікуди не йде:\n  ' + bad.join('\n  ')).toEqual([]);
	});
});

function walkTs(dir: string, out: string[] = []): string[] {
	for (const name of readdirSync(dir)) {
		const full = join(dir, name);
		if (statSync(full).isDirectory()) walkTs(full, out);
		else if (full.endsWith('.ts') && !full.endsWith('.test.ts')) out.push(full);
	}
	return out;
}
