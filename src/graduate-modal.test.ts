// @vitest-environment node
// Перевірка читає джерела з диска — DOM їй не потрібен.
import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';

/**
 * Сторінка, що вміє ВІДКРИТИ картку випускника, мусить уміти її ПОКАЗАТИ.
 *
 * ## Що тут ламається і чому мовчки
 *
 * `openGraduateModal` не малює нічого: він кладе випускника в `page.state` і
 * переписує адресу. Саму картку малює сторінка рядком `<GraduateCard …>`.
 * Забути цей рядок легко — і наслідок тихий: натискання по обличчю МІНЯЄ
 * АДРЕСУ, а на екрані не відбувається нічого. Ні помилки в консолі, ні
 * червоного в збірці; сторінка просто перестає слухатися.
 *
 * Заміряно 17 вересня 2026 на щойно зробленій сторінці майстра: картка
 * відкривалася з поїздки, групи, закладу й театру, а звідси — ні, і знайшов це
 * автор, а не жоден гейт.
 *
 * ## Чому граф імпортів, а не один файл
 *
 * Чотири компоненти (`GraduateAvatarRow`, `PlayCastSection`, `DualRoleChooser`,
 * `MasterProductionCard`) відкривають картку, але не малюють її — і це
 * правильно: вони стоять усередині сторінки, яка її вже малює. Правило «хто
 * викликає, той і малює» червонило б на них марно.
 *
 * Тому питання ставиться до СТОРІНКИ: якщо з неї — самої чи через будь-який
 * вкладений компонент — можна відкрити картку, то десь у тому ж дереві мусить
 * бути й рядок, який її показує.
 *
 * ## Зворотний експеримент (`PIT-REVERSE-EXPERIMENT`)
 *
 * Прибрати `<GraduateCard>` зі сторінки майстра — перевірка падає й називає
 * саме її та саме той компонент, через який картка відкривається.
 */

const КОРІНЬ = 'src';

/** Коментарі знімаються: перевірка читає файл текстом і не відрізнила б їх від коду. */
const безКоментарів = (джерело: string) =>
	джерело
		.replace(/<!--[\s\S]*?-->/g, '')
		.replace(/\/\*[\s\S]*?\*\//g, '')
		.replace(/^\s*\/\/.*$/gm, '');

function обійти(тека: string, out: string[] = []): string[] {
	for (const запис of readdirSync(тека)) {
		const шлях = join(тека, запис);
		if (statSync(шлях).isDirectory()) обійти(шлях, out);
		else if (шлях.endsWith('.svelte') || шлях.endsWith('.svelte.ts')) out.push(шлях);
	}
	return out;
}

const ФАЙЛИ = обійти(КОРІНЬ);
const текст = new Map(ФАЙЛИ.map((f) => [resolve(f), безКоментарів(readFileSync(f, 'utf8'))]));

/** `$lib/...` і відносні шляхи — в абсолютні, щоб граф зійшовся сам із собою. */
function куди(звідки: string, адреса: string): string | null {
	if (!adresaSvelte(адреса)) return null;
	const шлях =
		адреса.startsWith('$lib/') ? join(КОРІНЬ, 'lib', адреса.slice('$lib/'.length))
		: адреса.startsWith('.') ? join(dirname(звідки), адреса)
		: null;
	return шлях ? resolve(шлях) : null;
}
const adresaSvelte = (а: string) => а.endsWith('.svelte') || а.endsWith('.svelte.ts');

const ІМПОРТ = /import\s+[^;]*?from\s+'([^']+)'/g;

/**
 * Саме `<GraduateCard …>`, а не просто входження рядка.
 *
 * Перша редакція шукала підрядок — і зеленіла на `<GraduateCardToolbar>` та
 * `<GraduateCardOnPage>`, які починаються так само. Зворотний експеримент її
 * на цьому й спіймав: я прибрав рядок зі сторінки майстра, а перевірка
 * лишилася зеленою.
 */
const МАЛЮЄ = /<GraduateCard[\s/>]/;

/** Усе, що сторінка тягне за собою, включно з вкладеним. */
function дерево(корінь: string): Set<string> {
	const бачені = new Set<string>();
	const черга = [resolve(корінь)];
	while (черга.length) {
		const f = черга.pop()!;
		if (бачені.has(f) || !текст.has(f)) continue;
		бачені.add(f);
		for (const m of текст.get(f)!.matchAll(ІМПОРТ)) {
			const ціль = куди(f, m[1]);
			if (ціль) черга.push(ціль);
		}
	}
	return бачені;
}

const СТОРІНКИ = ФАЙЛИ.filter((f) => f.endsWith('+page.svelte'));

describe('картка випускника: хто вміє відкрити — вміє й показати', () => {
	it('перевірка жива: сторінки й виклики знайдено', () => {
		expect(СТОРІНКИ.length, 'жодної сторінки не знайдено').toBeGreaterThan(20);
		const відкривають = [...текст.values()].filter((t) => t.includes('openGraduateModal(')).length;
		expect(відкривають, 'ніде не відкривають картку — перевіряти нема чого').toBeGreaterThan(4);
	});

	it('кожна сторінка, з якої картка відкривається, її і малює', () => {
		const біда: string[] = [];
		for (const сторінка of СТОРІНКИ) {
			const гілка = дерево(сторінка);
			const відкривачі = [...гілка].filter((f) => текст.get(f)!.includes('openGraduateModal('));
			if (відкривачі.length === 0) continue;
			if ([...гілка].some((f) => МАЛЮЄ.test(текст.get(f)!))) continue;
			біда.push(
				`${сторінка.replace(/\\/g, '/')}: картку відкриває ` +
					відкривачі.map((f) => f.split(/[\\/]/).pop()).join(', ') +
					' — а рядка `<GraduateCard …>` у дереві сторінки немає'
			);
		}
		expect(
			біда,
			'натискання по обличчю мінятиме адресу й не показуватиме нічого:\n  ' + біда.join('\n  ')
		).toEqual([]);
	});
});
