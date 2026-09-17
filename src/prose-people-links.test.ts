// @vitest-environment node
// Перевірка читає markdown і реєстри з диска — DOM їй не потрібен.
import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Посилання на ЛЮДИНУ в тексті сторінок веде на людину, яка в реєстрі є.
 *
 * ## Що це ловить і чому воно тихе
 *
 * У текстах посилання пишуться руками: `[Ім'я](/projects/galaxy-graduates/…)`.
 * `ProsePeopleLinks` бере з адреси людину й робить дві речі — ставить обличчя
 * перед іменем і відкриває картку поверх сторінки замість переходу в галактику.
 * Обидві мовчать, коли людини за адресою немає: посилання лишається звичайним,
 * обличчя не з'являється, картка не відкривається — і жодного сліду.
 *
 * Це не гіпотеза. Заміряно 16 вересня 2026, ще до появи облич: із 25 адрес у
 * новинах ДВІ були написані по `slug`, тоді як адреса в цих людей інша —
 * `nikol-onyshchenko` замість `nikolmett` і `liora-kazatsker` замість `liorka`.
 * Сторінка при цьому відкривалася: збірка робить зі стандартного `slug`
 * заглушку з перенаправленням, тому й `check-links` був зелений. А картка не
 * відкривалася — тобто рівно та біда, проти якої написано `ProsePeopleLinks`,
 * жила у 8 % посилань і не була видна нізвідки.
 *
 * ## Чому саме адреса, а не «аби відкривалося»
 *
 * Заглушка-перенаправлення робить зайвий крок і не дає картки. Компонент має
 * запасний хід (шукає ще й по `slug`), але запасний хід — це страховка, а не
 * дозвіл: у тексті має стояти та адреса, яку роздають.
 *
 * ## Зворотний експеримент (`PIT-REVERSE-EXPERIMENT`)
 *
 * Повернути `/projects/galaxy-graduates/nikol-onyshchenko` в новину про
 * вісімнадцять студентів — перевірка називає саме цей рядок і підказує
 * `nikolmett`. Вигадана адреса `/residents/adults/nemaie-takoho` — називає її
 * як невідому.
 */

const КОРІНЬ = join('src', 'lib', 'i18n', 'pages');

interface Запис {
	slug: string;
	code?: string;
}

const прочитати = <T>(файл: string): T =>
	JSON.parse(readFileSync(join('src', 'lib', 'data', файл), 'utf8')) as T;

const випускники = прочитати<Запис[]>('graduates.index.json');
const майстри = прочитати<Запис[]>('masters.index.json');
const фахівці = прочитати<Запис[]>('experts.data.json');

const адресаВипускника = new Set(випускники.map((g) => g.code ?? g.slug));
const слугВипускника = new Map(випускники.map((g) => [g.slug, g.code ?? g.slug]));
const слугМайстра = new Set(майстри.map((m) => m.slug));
const слугФахівця = new Set(фахівці.map((e) => e.slug));

/** Усі markdown-сторінки обох мов. */
function сторінки(): { файл: string; текст: string }[] {
	const out: { файл: string; текст: string }[] = [];
	for (const мова of readdirSync(КОРІНЬ)) {
		const тека = join(КОРІНЬ, мова);
		for (const файл of readdirSync(тека)) {
			if (!файл.endsWith('.md')) continue;
			out.push({ файл: `${мова}/${файл}`, текст: readFileSync(join(тека, файл), 'utf8') });
		}
	}
	return out;
}

/** Адреса з markdown-посилання, без мовного префікса й кінцевої скісної. */
const без = (адреса: string) => адреса.replace(/^\/en(?=\/|$)/, '').replace(/\/+$/, '');

interface Посилання {
	файл: string;
	адреса: string;
}

function посиланняНаЛюдей(): Посилання[] {
	const out: Посилання[] = [];
	for (const { файл, текст } of сторінки())
		for (const m of текст.matchAll(/\]\((\/[^)\s]*)\)/g)) {
			const адреса = без(m[1]);
			if (
				/^\/projects\/galaxy-graduates\/masters\/[^/]+$/.test(адреса) ||
				/^\/residents\/adults\/[^/]+$/.test(адреса) ||
				/^\/projects\/galaxy-graduates\/[^/]+$/.test(адреса)
			)
				out.push({ файл, адреса });
		}
	return out;
}

/**
 * Розділи галактики — адреси, що збігаються формою з адресою випускника, але
 * людиною не є: `/galaxy-graduates/festivals`, `/plays` і решта.
 *
 * Береться з ФАЙЛОВОЇ СИСТЕМИ, а не переліком у коді: розділи — це теки
 * маршрутів, і новий розділ інакше довелося б дописувати сюди руками, а
 * забувши — отримати червоне на цілком правильному посиланні.
 */
const РОЗДІЛИ = new Set(
	readdirSync(join('src', 'routes', 'projects', 'galaxy-graduates'), { withFileTypes: true })
		.filter((e) => e.isDirectory() && !e.name.startsWith('['))
		.map((e) => `/projects/galaxy-graduates/${e.name}`)
);

const посилання = посиланняНаЛюдей();

describe('посилання на людей у тексті сторінок', () => {
	it('перевірка жива: реєстри й посилання знайдено', () => {
		expect(випускники.length, 'реєстр випускників порожній').toBeGreaterThan(100);
		expect(майстри.length, 'реєстр майстрів порожній').toBeGreaterThan(50);
		expect(посилання.length, 'у текстах немає жодного посилання на людину').toBeGreaterThan(10);
	});

	it('кожне посилання веде на людину, яка в реєстрі є', () => {
		const біда: string[] = [];
		for (const { файл, адреса } of посилання) {
			if (РОЗДІЛИ.has(адреса)) continue;

			const фахівець = /^\/projects\/galaxy-graduates\/masters\/([^/]+)$/.exec(адреса);
			if (фахівець) {
				if (!слугФахівця.has(фахівець[1])) біда.push(`${файл}: ${адреса} — такого фахівця немає`);
				continue;
			}

			const майстер = /^\/residents\/adults\/([^/]+)$/.exec(адреса);
			if (майстер) {
				if (!слугМайстра.has(майстер[1])) біда.push(`${файл}: ${адреса} — такого викладача немає`);
				continue;
			}

			const ключ = /^\/projects\/galaxy-graduates\/([^/]+)$/.exec(адреса)![1];
			if (адресаВипускника.has(ключ)) continue;

			const справжня = слугВипускника.get(ключ);
			біда.push(
				справжня
					? `${файл}: ${адреса} — це slug, а адреса в людини «${справжня}»: сторінка відкриється ` +
						'через заглушку, але картка поверх новини — ні'
					: `${файл}: ${адреса} — такого випускника немає`
			);
		}
		expect(біда, `посилання на людину, якої немає:\n${біда.join('\n')}`).toEqual([]);
	});
});
