import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import {
	THEATRES,
	getTheatreBySlug,
	theatrePath,
	theatreSize,
	theatresOfGraduate
} from './theatres';
import graduatesIndex from '$lib/data/graduates.index.json';
import type { GraduateIndexEntry } from '$lib/data/graduates';

/**
 * Цілісність реєстру театрів.
 *
 * ## Що тут насправді стережеться
 *
 * Первинне джерело — ПРОЗА самої людини в анкеті: «У 2019 році пішла працювати
 * в Одеський обласний академічний драматичний театр актрисою». Реєстр — другий
 * запис того самого факту, і роз'їхатися вони можуть тихо: абзац перепишуть, а
 * сторінка театру далі впевнено показуватиме людину, якої там уже немає.
 *
 * Тому в кожного запису є `mention` — фрагмент, яким людина назвала театр САМА,
 * — і головна перевірка вимагає, щоб він досі стояв у її анкеті ДОСЛІВНО. Це
 * сильніше, ніж звіряти офіційну назву: у прозі стоїть «театр ляльок
 * ім. Афанасьєва», а в реєстрі — «Харківський державний академічний театр
 * ляльок імені Віктора Афанасьєва», і за назвою вони не збіглися б ніколи.
 *
 * ## Чому саме дослівно, а не «по слову»
 *
 * Спокуса шукати одне слово («Афанасьєв») велика й хибна: тоді перевірка
 * зеленіла б і на реченні «мріяла працювати в театрі Афанасьєва». Дослівний
 * фрагмент прив'язує запис до конкретної фрази, а не до згадки взагалі.
 *
 * ## Зворотний експеримент (AI-AGENT-PITFALLS-v8 § 1.1)
 *
 * Проведено на трьох дефектах: `id` людини, якої немає в реєстрі випускників;
 * `mention`, змінений на фразу, якої в анкеті немає; `until` раніший за
 * `since`. Кожна перевірка впала й назвала саме той театр і ту людину.
 */
const graduates = graduatesIndex as GraduateIndexEntry[];
const byId = new Map(graduates.map((g) => [g.id, g]));
const PROFILES = join(process.cwd(), 'static/graduates/profiles');

/** Уся проза анкети одним рядком: `bio`, «під час навчання», «після випуску». */
function proseOf(graduate: GraduateIndexEntry): string | null {
	const file = join(PROFILES, `${graduate.code || graduate.slug}.json`);
	if (!existsSync(file)) return null;
	const profile = JSON.parse(readFileSync(file, 'utf8')) as {
		bio?: string[];
		duringStudies?: string | null;
		afterGraduation?: string | null;
	};
	return [...(profile.bio ?? []), profile.duringStudies ?? '', profile.afterGraduation ?? ''].join(
		' '
	);
}

describe('реєстр театрів', () => {
	it('перевірка жива: реєстр і реєстр випускників прочитано', () => {
		expect(THEATRES.length).toBeGreaterThan(0);
		expect(graduates.length).toBeGreaterThan(100);
	});

	it('адреса придатна для URL і не повторюється', () => {
		const seen = new Map<string, number>();
		for (const t of THEATRES) {
			expect(t.slug, `${t.name}: адреса не з латиниці`).toMatch(/^[a-z0-9-]+$/);
			seen.set(t.slug, (seen.get(t.slug) ?? 0) + 1);
		}
		const dupes = [...seen].filter(([, n]) => n > 1).map(([slug]) => slug);
		expect(dupes, `два театри на одній адресі:\n  ${dupes.join('\n  ')}`).toEqual([]);
	});

	/*
	 * Назви двох театрів імені Лесі Українки різняться містом («Львівський
	 * академічний драматичний театр…» і «Театр імені Лесі Українки»), і саме
	 * тому перевірка на повтор має сенс: звести їх в одну назву легко, а на
	 * сторінці це були б дві різні трупи з одним іменем.
	 */
	it('назва є, і вона не повторюється', () => {
		const seen = new Map<string, number>();
		for (const t of THEATRES) {
			expect(t.name.trim(), `${t.slug}: без назви`).not.toBe('');
			seen.set(t.name, (seen.get(t.name) ?? 0) + 1);
		}
		const dupes = [...seen].filter(([, n]) => n > 1).map(([name, n]) => `${name} × ${n}`);
		expect(dupes, `той самий театр двома записами:\n  ${dupes.join('\n  ')}`).toEqual([]);
	});

	it('код країни — дві великі латинські літери, і CountryFlag його знає', () => {
		const source = readFileSync('src/lib/components/icons/CountryFlag.svelte', 'utf8');
		const known = new Set([...source.matchAll(/upperCode === '([A-Z]{2})'/g)].map((m) => m[1]));
		expect(known.size, 'перевірка жива: коди з компонента прочитано').toBeGreaterThan(5);

		const bad: string[] = [];
		for (const t of THEATRES) {
			if (!t.countries.length) bad.push(`${t.slug}: без країни`);
			for (const code of t.countries) {
				if (!/^[A-Z]{2}$/.test(code)) bad.push(`${t.slug} → «${code}» не код`);
				else if (!known.has(code)) bad.push(`${t.slug} → «${code}» прапора немає`);
			}
		}
		expect(bad, `негодящий код країни:\n  ${bad.join('\n  ')}`).toEqual([]);
	});

	it('сайт театру — абсолютна https-адреса', () => {
		const bad = THEATRES.filter((t) => t.website && !/^https:\/\/[^\s]+$/.test(t.website)).map(
			(t) => `${t.slug} → ${t.website}`
		);
		expect(bad, `сайт записаний не як https-адреса:\n  ${bad.join('\n  ')}`).toEqual([]);
	});

	it('роки роботи в межах і не навиворіт', () => {
		const bad: string[] = [];
		let зРоком = 0;
		for (const t of THEATRES)
			for (const m of [...t.members, ...(t.unlistedMembers ?? [])]) {
				for (const [поле, year] of [
					['since', m.since],
					['until', m.until]
				] as const) {
					if (typeof year !== 'number') continue;
					зРоком += 1;
					if (year < 1990 || year > 2035) bad.push(`${t.slug} → ${поле} ${year} поза межами`);
				}
				if (m.since && m.until && m.until < m.since)
					bad.push(`${t.slug} → ${m.since}–${m.until}: кінець раніше за початок`);
			}
		expect(bad, `негодящий рік:\n  ${bad.join('\n  ')}`).toEqual([]);
		expect(зРоком, 'жодного року в усьому реєстрі — поле зникло').toBeGreaterThan(3);
	});

	it('кожен, хто працює в театрі, існує в реєстрі випускників', () => {
		const bad: string[] = [];
		for (const t of THEATRES)
			for (const m of t.members) if (!byId.has(m.id)) bad.push(`${t.slug} → ${m.id}`);
		expect(bad, `людина веде в нікуди:\n  ${bad.join('\n  ')}`).toEqual([]);
	});

	it('одна людина не стоїть у театрі двічі', () => {
		const bad: string[] = [];
		for (const t of THEATRES) {
			const seen = new Set<string>();
			for (const m of t.members) {
				if (seen.has(m.id)) bad.push(`${t.slug} → ${m.id}`);
				seen.add(m.id);
			}
		}
		expect(bad, `людина повторюється:\n  ${bad.join('\n  ')}`).toEqual([]);
	});

	/* ГОЛОВНА перевірка цього файлу — розбір у докблоці вище. */
	it('фраза, якою людина назвала театр, досі стоїть у її анкеті', () => {
		const bad: string[] = [];
		let перевірено = 0;
		for (const t of THEATRES)
			for (const m of t.members) {
				const graduate = byId.get(m.id);
				if (!graduate) continue; // назве попередня перевірка
				const проза = proseOf(graduate);
				if (проза === null) {
					bad.push(`${graduate.name}: анкети немає, а ${t.slug} на неї спирається`);
					continue;
				}
				перевірено += 1;
				const фраза = m.mention ?? t.name;
				if (!проза.includes(фраза))
					bad.push(`${graduate.name}: в анкеті немає «${фраза}» (${t.slug})`);
			}
		expect(bad, `реєстр театрів і анкета розійшлися:\n  ${bad.join('\n  ')}`).toEqual([]);
		expect(перевірено, 'жодної анкети не перевірено — реєстр порожній?').toBeGreaterThan(5);
	});

	/*
	 * Зворотний бік тієї самої пари: посилання з анкети мусить вести на сторінку
	 * ТОГО САМОГО театру. Саме заради цього посилання розділ і з'явився («замість
	 * посилання на сайт театру робимо на внутрішню сторінку»), і саме воно
	 * найлегше загубиться при наступному редагуванні абзацу.
	 */
	it('проза анкети посилається на сторінку свого театру', () => {
		const bad: string[] = [];
		for (const t of THEATRES)
			for (const m of t.members) {
				const graduate = byId.get(m.id);
				if (!graduate) continue;
				const проза = proseOf(graduate);
				if (проза === null) continue; // назве попередня перевірка
				if (!проза.includes(theatrePath(t.slug)))
					bad.push(`${graduate.name}: в анкеті немає посилання на ${theatrePath(t.slug)}`);
			}
		expect(bad, `анкета не веде на сторінку театру:\n  ${bad.join('\n  ')}`).toEqual([]);
	});

	it('стан верифікації — з відомого набору', () => {
		const known = new Set(['verified', 'possible_errors', 'definite_errors']);
		const bad = THEATRES.filter((t) => t.verificationStatus && !known.has(t.verificationStatus)).map(
			(t) => `${t.slug} → «${t.verificationStatus}»`
		);
		expect(bad, `невідомий стан верифікації:\n  ${bad.join('\n  ')}`).toEqual([]);
	});

	it('хелпери знаходять театр за адресою та за людиною', () => {
		const first = THEATRES[0];
		expect(getTheatreBySlug(first.slug)?.name).toBe(first.name);
		expect(getTheatreBySlug('такого-немає')).toBeUndefined();

		expect(theatreSize(first)).toBe(
			first.members.length + (first.unlistedMembers?.length ?? 0)
		);
		expect(theatrePath(first.slug)).toBe(`/projects/galaxy-graduates/theatres/${first.slug}`);

		const member = first.members[0];
		expect(theatresOfGraduate(member.id).map((x) => x.theatre.slug)).toContain(first.slug);
		expect(theatresOfGraduate('нікого-такого')).toEqual([]);
	});
});
