// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { PLAYS, getPlayById, playsByIds } from './plays';
import { GROUPS } from './groups';
import mastersIndex from './masters.index.json';
import type { MasterIndexEntry } from './masters';

/**
 * Цілісність реєстру вистав.
 *
 * ## Що саме тут стережеться
 *
 * Реєстр з'явився, щоб вистава перестала бути трьома незалежними записами. Але
 * сам собою він цього не гарантує: щойно два записи опишуть ту саму виставу
 * того самого року, дублювання повернеться — тільки тепер усередині реєстру,
 * де його ще важче помітити.
 *
 * Тому головна перевірка тут — не «поле заповнене», а «та сама подія не
 * трапляється двічі». Подія при цьому впізнається трійкою «назва + рік +
 * група», і це не педантизм: див. коментар біля самої перевірки.
 *
 * ## Зворотний експеримент (AI-AGENT-PITFALLS-v8 § 1.1)
 *
 * Проведено на двох дефектах: доданий другий запис із тією самою назвою, роком
 * і групою — впала перевірка на повтори; ключ у групі змінено на неіснуючий —
 * впала перевірка посилань. Обидві назвали саме той запис.
 *
 * Третій дефект знайшовся сам, і саме він і виправив правило: ключ без групи
 * склеїв два різні покази, і помітити це вдалося лише тому, що у Ткача стало
 * 78 вистав замість 80.
 */
const norm = (s: string) =>
	s
		.toLowerCase()
		.replace(/[«»"'’ʼ]/g, '')
		.replace(/ё/g, 'е')
		.replace(/[^\p{L}\p{N}]+/gu, ' ')
		.trim();

describe('реєстр вистав', () => {
	it('перевірка жива: реєстр не порожній', () => {
		expect(PLAYS.length).toBeGreaterThan(100);
	});

	it('ключі унікальні', () => {
		const seen = new Map<string, number>();
		for (const p of PLAYS) seen.set(p.id, (seen.get(p.id) ?? 0) + 1);
		const dupes = [...seen].filter(([, n]) => n > 1).map(([id, n]) => `${id} × ${n}`);
		expect(dupes, `повтори ключів:\n  ${dupes.join('\n  ')}`).toEqual([]);
	});

	it('ключ придатний для адреси', () => {
		const bad = PLAYS.filter((p) => !/^[a-z0-9-]+$/.test(p.id)).map((p) => p.id);
		expect(bad, `не годиться в адресу:\n  ${bad.join('\n  ')}`).toEqual([]);
	});

	/*
	 * Подія — це «назва + рік + ГРУПА», а не «назва + рік».
	 *
	 * Ключем без групи два різні покази склеюються в один, і половина даних
	 * зникає мовчки. Заміряно на живому прикладі: «Уривки з класики» 2015 йшли
	 * групою ГруФФиш у школі й групою 4-РТЗ в ОТХУ; «Показ етюдів» 2024 —
	 * двома «Інтенсивами» під номерами 57 і 58. Перший варіант цього гейта
	 * дозволив їх склеїти, і виявилося це лише тим, що у Ткача стало 78 вистав
	 * замість 80.
	 */
	it('назва разом із роком і групою не трапляється двічі', () => {
		const seen = new Map<string, string[]>();
		for (const p of PLAYS) {
			const key = `${norm(p.title)} · ${p.year} · ${p.theatreGroup ?? '—'}`;
			seen.set(key, [...(seen.get(key) ?? []), p.id]);
		}
		const dupes = [...seen].filter(([, ids]) => ids.length > 1).map(([k, ids]) => `${k} → ${ids.join(', ')}`);
		expect(dupes, `та сама подія двома записами:\n  ${dupes.join('\n  ')}`).toEqual([]);
	});

	it('рік правдоподібний, назва не порожня', () => {
		const bad = PLAYS.filter((p) => !p.title.trim() || p.year < 1990 || p.year > 2035).map(
			(p) => `${p.id}: «${p.title}» ${p.year}`
		);
		expect(bad, `непридатні записи:\n  ${bad.join('\n  ')}`).toEqual([]);
	});

	it('кожен майстер у виставі існує в реєстрі майстрів', () => {
		const known = new Set((mastersIndex as MasterIndexEntry[]).map((m) => m.id));
		const bad: string[] = [];
		for (const p of PLAYS)
			for (const id of p.masters ?? []) if (!known.has(id)) bad.push(`${p.id} → ${id}`);
		expect(bad, `майстра немає:\n  ${bad.join('\n  ')}`).toEqual([]);
	});

	it('кожен ключ вистави в групі веде на наявний запис', () => {
		const bad: string[] = [];
		for (const group of GROUPS)
			for (const id of group.playIds) if (!getPlayById(id)) bad.push(`${group.slug} → ${id}`);
		expect(bad, `репертуар посилається в нікуди:\n  ${bad.join('\n  ')}`).toEqual([]);
	});

	/*
	 * Анкети лежать у `static/`, тож читаються з диска — як і в
	 * `graduates.test.ts`. Це єдине місце, де розрив «анкета → вистава» видно
	 * до того, як його побачить читач: у самій анкеті поруч із ключем лишається
	 * текст, і сторінка не впаде, а просто мовчатиме про зв'язок.
	 */
	it('кожен ключ вистави в анкеті веде на наявний запис', () => {
		const dir = join(process.cwd(), 'static/graduates/profiles');
		const bad: string[] = [];
		for (const file of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
			const profile = JSON.parse(readFileSync(join(dir, file), 'utf8')) as {
				plays?: { playId?: string }[];
			};
			for (const play of profile.plays ?? [])
				if (play.playId && !getPlayById(play.playId)) bad.push(`${file} → ${play.playId}`);
		}
		expect(bad, `анкета посилається в нікуди:\n  ${bad.join('\n  ')}`).toEqual([]);
	});

	it('`playsByIds` віддає найновіші згори й мовчки минає невідомі ключі', () => {
		const known = PLAYS.slice(0, 3).map((p) => p.id);
		const out = playsByIds([...known, 'takoi-vystavy-nemaie-1999']);
		expect(out).toHaveLength(known.length);
		for (let i = 1; i < out.length; i++) expect(out[i - 1].year).toBeGreaterThanOrEqual(out[i].year);
	});
});
