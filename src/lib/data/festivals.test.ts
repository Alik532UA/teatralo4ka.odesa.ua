import { describe, it, expect } from 'vitest';
import { FESTIVALS, flagOf, getFestivalBySlug, getFestivalsByMember, festivalPath } from './festivals';
import graduatesIndex from '$lib/data/graduates.index.json';
import playsData from '$lib/data/plays.data.json';
import type { GraduateIndexEntry } from '$lib/data/graduates';

/**
 * Цілісність реєстру фестивалів.
 *
 * ## Чому зв'язки, а не рядки
 *
 * Фестивалі доти жили прозою: рядком в анкеті («🇧🇬 Славянский венок, 2010 у
 * Болгарії») і всередині рядків нагород на виставах. Рядок завжди «валідний»,
 * навіть коли веде в нікуди, — і саме тому жоден гейт не бачив, що зв'язку
 * немає взагалі.
 *
 * Тепер учасник — це `id` випускника, а показ — `id` вистави, і обидва тут
 * стережуться.
 *
 * ## Склад буде порожнім, і це не помилка
 *
 * Учасників вносять поступово: сьогодні на трьох фестивалях їх четверо, бо
 * стільки згадок знайшлося в анкетах. Тому «щонайменше один учасник» тут НЕ
 * вимагається — так само, як група має право існувати без репертуару. Не
 * вимагається й показ: на «Квітучу Чехію» вистава не записана.
 *
 * ## Зворотний експеримент (AI-AGENT-PITFALLS-v8 § 1.1)
 *
 * Проведено на трьох дефектах: учасник, якого немає в реєстрі випускників;
 * `playId`, якому не відповідає вистава; код країни «UKR» замість «UA». Кожна
 * перевірка впала й назвала саме той фестиваль.
 */
const graduates = graduatesIndex as GraduateIndexEntry[];
const plays = playsData as { id: string }[];

describe('реєстр фестивалів', () => {
	it('перевірка жива: реєстр прочитано', () => {
		expect(FESTIVALS.length).toBeGreaterThan(0);
		expect(graduates.length).toBeGreaterThan(100);
	});

	it('адреса придатна для URL і не повторюється', () => {
		const seen = new Map<string, number>();
		for (const f of FESTIVALS) {
			expect(f.slug, `${f.name}: адреса не з латиниці`).toMatch(/^[a-z0-9-]+$/);
			seen.set(f.slug, (seen.get(f.slug) ?? 0) + 1);
		}
		const dupes = [...seen].filter(([, n]) => n > 1).map(([slug]) => slug);
		expect(dupes, `два фестивалі на одній адресі:\n  ${dupes.join('\n  ')}`).toEqual([]);
	});

	it('у кожного фестивалю є назва й рік', () => {
		const bad: string[] = [];
		for (const f of FESTIVALS) {
			if (!f.name.trim()) bad.push(`${f.slug}: без назви`);
			if (!f.years.length) bad.push(`${f.slug}: без року`);
			for (const year of f.years)
				if (year < 1990 || year > 2035) bad.push(`${f.slug}: рік ${year} поза межами`);
		}
		expect(bad, `негодящий запис:\n  ${bad.join('\n  ')}`).toEqual([]);
	});

	/*
	 * Код країни перевіряється формою, а не переліком: країн у світі майже
	 * двісті, і тримати їх список тут означало б завести другий реєстр заради
	 * трьох записів. Форма ловить те, чого справді бояться, — «UKR» замість «UA»
	 * і «ua» замість «UA», бо `flagOf` на них мовчки віддає порожньо.
	 */
	it('код країни — дві великі латинські літери, і прапорець із нього виходить', () => {
		const bad: string[] = [];
		for (const f of FESTIVALS) {
			if (!f.countries.length) bad.push(`${f.slug}: без країни`);
			for (const code of f.countries) {
				if (!/^[A-Z]{2}$/.test(code)) bad.push(`${f.slug} → «${code}»`);
				else if (!flagOf(code)) bad.push(`${f.slug} → «${code}» без прапорця`);
			}
		}
		expect(bad, `негодящий код країни:\n  ${bad.join('\n  ')}`).toEqual([]);
	});

	it('кожен учасник існує в реєстрі випускників', () => {
		const known = new Set(graduates.map((g) => g.id));
		const bad: string[] = [];
		for (const f of FESTIVALS)
			for (const id of f.memberIds) if (!known.has(id)) bad.push(`${f.slug} → ${id}`);
		expect(bad, `учасник веде в нікуди:\n  ${bad.join('\n  ')}`).toEqual([]);
	});

	it('кожен показ знаходиться в реєстрі вистав', () => {
		const known = new Set(plays.map((p) => p.id));
		const bad: string[] = [];
		for (const f of FESTIVALS)
			for (const id of f.playIds) if (!known.has(id)) bad.push(`${f.slug} → ${id}`);
		expect(bad, `вистави немає:\n  ${bad.join('\n  ')}`).toEqual([]);
	});

	it('flagOf рахує прапорець із коду й мовчить на негодящому', () => {
		expect(flagOf('UA')).toBe('🇺🇦');
		expect(flagOf('BG')).toBe('🇧🇬');
		expect(flagOf('ua')).toBe('');
		expect(flagOf('UKR')).toBe('');
	});

	it('хелпери знаходять фестиваль за адресою та за учасником', () => {
		const first = FESTIVALS[0];
		expect(getFestivalBySlug(first.slug)?.name).toBe(first.name);
		expect(getFestivalBySlug('такого-немає')).toBeUndefined();

		const member = first.memberIds[0];
		expect(getFestivalsByMember(member).map((f) => f.slug)).toContain(first.slug);
		expect(getFestivalsByMember('нікого-такого')).toEqual([]);

		expect(festivalPath(first.slug)).toBe(
			`/projects/galaxy-graduates/festivals/${first.slug}`
		);
	});
});
