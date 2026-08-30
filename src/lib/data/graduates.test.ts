// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import graduatesIndex from './graduates.index.json';
import type { GraduateIndexEntry } from './graduates';

/**
 * Цілісність реєстру випускників.
 *
 * ## Навіщо, якщо реєстр і так генерується
 *
 * Він БІЛЬШЕ не генерується: `static/graduates/profiles/*.json` правлять руками,
 * а `npm run data:graduates` затирає ці правки. Тобто помилка сюди потрапляє не
 * через баг у скрипті, а через людину, яка виправила ім'я в одному місці й не
 * виправила в другому.
 *
 * ## `id` — ключ, `slug` — адреса
 *
 * Різниця не косметична. Адресу законно виправляють: за одну сесію п'ять
 * випускників привели до порядку «ім'я-прізвище». Доти на адресу посилався
 * склад груп, і кожне таке виправлення тихо розривало зв'язок — гейт груп
 * червонів уже постфактум, коли дані вже були зламані.
 *
 * Тепер зв'язки тримаються на `id`, і саме він тут стережеться: існує, єдиний,
 * і однаковий у профілі та в індексі.
 *
 * ## Зворотний експеримент (AI-AGENT-PITFALLS-v8 § 1.1)
 *
 * Проведено на двох дефектах: `id` прибрано в одного запису — впала перевірка
 * «кожен запис має `id`»; `id` у профілі змінено на чужий — впала перевірка
 * «профіль не розходиться з індексом». Обидві назвали саме той запис.
 */
const PROFILES = join(process.cwd(), 'static/graduates/profiles');
const index = graduatesIndex as GraduateIndexEntry[];

interface Profile {
	id?: string;
	slug?: string;
	code?: string;
	name?: string;
}

const profiles = readdirSync(PROFILES)
	.filter((f) => f.endsWith('.json'))
	.map((f) => ({ file: f, data: JSON.parse(readFileSync(join(PROFILES, f), 'utf8')) as Profile }));

describe('реєстр випускників', () => {
	it('перевірка жива: реєстр і профілі прочитано', () => {
		expect(index.length).toBeGreaterThan(100);
		expect(profiles.length).toBeGreaterThan(10);
	});

	it('кожен запис має `id`', () => {
		const bad = index.filter((g) => !g.id?.trim()).map((g) => g.slug);
		expect(bad, `без ключа:\n  ${bad.join('\n  ')}`).toEqual([]);
	});

	it('`id` унікальні — інакше зв\'язок веде до двох людей одразу', () => {
		const seen = new Map<string, number>();
		for (const g of index) seen.set(g.id, (seen.get(g.id) ?? 0) + 1);
		const dupes = [...seen].filter(([, n]) => n > 1).map(([id, n]) => `${id} × ${n}`);
		expect(dupes, `повтори:\n  ${dupes.join('\n  ')}`).toEqual([]);
	});

	it('`slug` унікальні — це адреса сторінки', () => {
		const seen = new Map<string, number>();
		for (const g of index) seen.set(g.slug, (seen.get(g.slug) ?? 0) + 1);
		const dupes = [...seen].filter(([, n]) => n > 1).map(([slug]) => slug);
		expect(dupes, `дві людини на одній адресі:\n  ${dupes.join('\n  ')}`).toEqual([]);
	});

	it('профіль не розходиться з індексом щодо `id`', () => {
		const byId = new Map(index.map((g) => [g.id, g]));
		const bad: string[] = [];
		for (const { file, data } of profiles) {
			if (!data.id) {
				bad.push(`${file}: у профілі немає \`id\``);
				continue;
			}
			if (!byId.has(data.id)) bad.push(`${file}: \`id\` «${data.id}» немає в індексі`);
		}
		expect(bad, `розходження:\n  ${bad.join('\n  ')}`).toEqual([]);
	});

	/*
	 * Назва групи рядком — це саме той різновид зв'язку, якого не бачить жодна
	 * перевірка: рядок завжди «валідний», навіть коли веде в нікуди. Заміряно
	 * перед прибиранням: із 83 таких згадок на наявну групу вели 54.
	 *
	 * Зв'язок живе в `memberIds` групи. У профілі лишається `unlinkedGroups` —
	 * і саме тому воно назване так, щоб не переплутати з робочим зв'язком.
	 */
	it('профіль не тримає групу рядком', () => {
		const bad: string[] = [];
		for (const { file, data } of profiles) {
			const raw = data as Record<string, unknown>;
			if ('group' in raw) bad.push(`${file}: поле \`group\``);
			if ('groups' in raw) bad.push(`${file}: поле \`groups\``);
		}
		expect(bad, `зв'язок знову рядком:\n  ${bad.join('\n  ')}`).toEqual([]);
	});

	it('індекс теж не тримає копії назви групи', () => {
		const bad = index
			.filter((g) => 'group' in (g as unknown as Record<string, unknown>))
			.map((g) => g.id);
		expect(bad, `копія назви в індексі:\n  ${bad.join('\n  ')}`).toEqual([]);
	});

	it('імена в профілі та в індексі збігаються', () => {
		const byId = new Map(index.map((g) => [g.id, g]));
		const bad: string[] = [];
		for (const { file, data } of profiles) {
			const entry = data.id ? byId.get(data.id) : undefined;
			if (!entry || !data.name) continue;
			// Поле `name` живе у двох місцях одночасно; розійшовшись, вони дають
			// картку й список, що звуть ту саму людину по-різному.
			if (entry.name !== data.name) bad.push(`${file}: «${data.name}» проти «${entry.name}»`);
		}
		expect(bad, `ім'я розійшлося:\n  ${bad.join('\n  ')}`).toEqual([]);
	});
});
